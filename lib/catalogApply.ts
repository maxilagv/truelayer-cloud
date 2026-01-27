import { getSupabaseAdmin } from './supabaseAdmin';

type CatalogConfigPayload = {
  nombre?: string;
  logo_url?: string;
  destacado_producto_id?: number | null;
  publicado?: boolean;
  price_type?: string;
};

type CategoryPayload = {
  id?: number;
  name?: string;
  image_url?: string | null;
  description?: string | null;
};

type ProductPayload = {
  id?: number;
  category_id?: number;
  category_name?: string | null;
  name?: string;
  description?: string | null;
  price?: number | null;
  price_local?: number | null;
  price_distribuidor?: number | null;
  precio_final?: number | null;
  image_url?: string | null;
};

type SyncEvent = {
  entity: string;
  entity_id?: number | null;
  action: string;
  payload?: any;
};

function nowIso() {
  return new Date().toISOString();
}

async function resolveCategoryId(
  tenantId: string,
  externalId: number | null,
  payload: ProductPayload
) {
  const supabase = getSupabaseAdmin();
  if (externalId == null) {
    return null;
  }

  const existing = await supabase
    .from('catalog_categories')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('external_id', externalId)
    .maybeSingle();

  const existingId = (existing.data as { id?: number } | null)?.id;
  if (existingId) return existingId;

  const insert = await supabase
    .from('catalog_categories')
    .insert({
      tenant_id: tenantId,
      external_id: externalId,
      name: payload.category_name || 'Sin categoria',
      image_url: null,
      description: null,
      active: true,
      updated_at: nowIso()
    })
    .select('id')
    .single();

  const createdId = (insert.data as { id?: number } | null)?.id;
  return createdId || null;
}

async function applyConfig(tenantId: string, payload: CatalogConfigPayload) {
  const supabase = getSupabaseAdmin();
  await supabase.from('catalog_config').upsert(
    {
      tenant_id: tenantId,
      nombre: payload.nombre || '',
      logo_url: payload.logo_url || '',
      destacado_producto_id:
        payload.destacado_producto_id != null ? Number(payload.destacado_producto_id) : null,
      publicado: payload.publicado != null ? Boolean(payload.publicado) : true,
      price_type: payload.price_type || 'final',
      updated_at: nowIso()
    },
    { onConflict: 'tenant_id' }
  );
}

async function applyCategory(tenantId: string, action: string, payload: CategoryPayload) {
  const supabase = getSupabaseAdmin();
  const externalId = payload.id != null ? Number(payload.id) : null;
  if (externalId == null) return;

  if (action === 'delete') {
    await supabase
      .from('catalog_categories')
      .update({ active: false, updated_at: nowIso() })
      .eq('tenant_id', tenantId)
      .eq('external_id', externalId);
    return;
  }

  await supabase.from('catalog_categories').upsert(
    {
      tenant_id: tenantId,
      external_id: externalId,
      name: payload.name || 'Sin nombre',
      image_url: payload.image_url || null,
      description: payload.description || null,
      active: true,
      updated_at: nowIso()
    },
    { onConflict: 'tenant_id,external_id' }
  );
}

async function applyProduct(tenantId: string, action: string, payload: ProductPayload) {
  const supabase = getSupabaseAdmin();
  const externalId = payload.id != null ? Number(payload.id) : null;
  if (externalId == null) return;

  if (action === 'delete') {
    await supabase
      .from('catalog_products')
      .update({ active: false, updated_at: nowIso() })
      .eq('tenant_id', tenantId)
      .eq('external_id', externalId);
    return;
  }

  const categoryExternalId =
    payload.category_id != null ? Number(payload.category_id) : null;
  const categoryId = await resolveCategoryId(tenantId, categoryExternalId, payload);
  if (!categoryId) return;

  await supabase.from('catalog_products').upsert(
    {
      tenant_id: tenantId,
      external_id: externalId,
      category_id: categoryId,
      name: payload.name || 'Sin nombre',
      description: payload.description || null,
      price: payload.price != null ? Number(payload.price) : null,
      price_local: payload.price_local != null ? Number(payload.price_local) : null,
      price_distribuidor:
        payload.price_distribuidor != null ? Number(payload.price_distribuidor) : null,
      precio_final: payload.precio_final != null ? Number(payload.precio_final) : null,
      image_url: payload.image_url || null,
      active: true,
      updated_at: nowIso()
    },
    { onConflict: 'tenant_id,external_id' }
  );
}

export async function applyCatalogEvent(tenantId: string, event: SyncEvent) {
  const action = String(event.action || '').toLowerCase();
  if (event.entity === 'catalogo_config') {
    await applyConfig(tenantId, event.payload || {});
    return;
  }
  if (event.entity === 'catalogo_categoria') {
    await applyCategory(tenantId, action, event.payload || {});
    return;
  }
  if (event.entity === 'catalogo_producto') {
    await applyProduct(tenantId, action, event.payload || {});
    return;
  }
}

