import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { resolveTenantFromToken } from '../../../../lib/tenantAuth';

type SnapshotPayload = {
  config?: any;
  categorias?: any[];
  productos?: any[];
};

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const resolved = await resolveTenantFromToken(token);
    if (!resolved?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = resolved.tenantId;

    const body = (await req.json().catch(() => ({}))) as SnapshotPayload;
    const config = body?.config || {};
    const categorias = Array.isArray(body?.categorias) ? body.categorias : [];
    const productos = Array.isArray(body?.productos) ? body.productos : [];

    const supabase = getSupabaseAdmin();

    await supabase.from('catalog_config').upsert(
      {
        tenant_id: tenantId,
        nombre: config?.nombre || '',
        logo_url: config?.logo_url || '',
        destacado_producto_id:
          config?.destacado_producto_id != null ? Number(config.destacado_producto_id) : null,
        publicado: config?.publicado != null ? Boolean(config.publicado) : true,
        price_type: config?.price_type || 'final',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'tenant_id' }
    );

    if (categorias.length) {
      const rows = categorias.map((c: any) => ({
        tenant_id: tenantId,
        external_id: c?.id != null ? Number(c.id) : null,
        name: c?.name || 'Sin nombre',
        image_url: c?.image_url || null,
        description: c?.description || null,
        active: c?.active != null ? Boolean(c.active) : true,
        updated_at: new Date().toISOString()
      }));
      await supabase.from('catalog_categories').upsert(rows, {
        onConflict: 'tenant_id,external_id'
      });
    }

    if (productos.length) {
      // Map categories by external_id for FK
      const catMap = new Map<number, number>();
      for (const row of categorias) {
        if (row?.id == null) continue;
        const externalId = Number(row.id);
        const existing = await supabase
          .from('catalog_categories')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('external_id', externalId)
          .maybeSingle();
        const internalId = (existing.data as { id?: number } | null)?.id;
        if (internalId) catMap.set(externalId, internalId);
      }

      const rows = [];
      for (const p of productos) {
        const externalId = p?.id != null ? Number(p.id) : null;
        if (externalId == null) continue;
        const catExternal = p?.category_id != null ? Number(p.category_id) : null;
        const catId = catExternal != null ? catMap.get(catExternal) : null;
        if (!catId) continue;
        rows.push({
          tenant_id: tenantId,
          external_id: externalId,
          category_id: catId,
          name: p?.name || 'Sin nombre',
          description: p?.description || null,
          price: p?.price != null ? Number(p.price) : null,
          price_local: p?.price_local != null ? Number(p.price_local) : null,
          price_distribuidor:
            p?.price_distribuidor != null ? Number(p.price_distribuidor) : null,
          precio_final: p?.precio_final != null ? Number(p.precio_final) : null,
          image_url: p?.image_url || null,
          active: p?.active != null ? Boolean(p.active) : true,
          updated_at: new Date().toISOString()
        });
      }
      if (rows.length) {
        await supabase.from('catalog_products').upsert(rows, {
          onConflict: 'tenant_id,external_id'
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

