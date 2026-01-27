import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = String(params.slug || '').toLowerCase();
    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const tenantRes = await supabase
      .from('tenants')
      .select('id, status')
      .eq('slug', slug)
      .maybeSingle();

    const tenantData = tenantRes.data as { id: string; status: string } | null;
    if (tenantRes.error || !tenantData || tenantData.status !== 'active') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const tenantId = tenantData.id;

    const [configRes, categoriesRes, productsRes] = await Promise.all([
      supabase.from('catalog_config').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('catalog_categories').select('*').eq('tenant_id', tenantId).eq('active', true).order('id'),
      supabase.from('catalog_products').select('*').eq('tenant_id', tenantId).eq('active', true).order('id')
    ]);

    const config = configRes.data || { publicado: true };
    if (config.publicado === false) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const response = {
      config,
      destacado: null,
      categorias: categoriesRes.data || [],
      productos: productsRes.data || []
    };

    return NextResponse.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
