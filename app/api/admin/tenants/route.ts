import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { generateToken, hashToken, previewToken, slugify } from '../../../../lib/identity';

export async function POST(req: Request) {
  try {
    const adminKey = req.headers.get('x-admin-key') || '';
    const expected = process.env.ADMIN_API_KEY || '';
    if (!expected || adminKey !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    const requestedSlug = String(body?.slug || '').trim();
    const slug = slugify(requestedSlug || name);
    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const existing = await supabase.from('tenants').select('id').eq('slug', slug).maybeSingle();
    const existingId = (existing.data as { id?: string } | null)?.id;
    if (existingId) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    const insertTenant = await supabase
      .from('tenants')
      .insert({ name, slug, status: 'active' })
      .select('id, slug')
      .single();

    const tenantData = insertTenant.data as { id: string; slug: string } | null;
    if (insertTenant.error || !tenantData) {
      return NextResponse.json({ error: insertTenant.error?.message || 'Insert failed' }, { status: 500 });
    }

    const token = generateToken(slug);
    const tokenHash = hashToken(token);
    const tokenPreview = previewToken(token);

    const tokenInsert = await supabase.from('tenant_tokens').insert({
      tenant_id: tenantData.id,
      token_hash: tokenHash,
      token_preview: tokenPreview
    });

    if (tokenInsert.error) {
      return NextResponse.json({ error: tokenInsert.error.message }, { status: 500 });
    }

    return NextResponse.json({
      tenant_id: tenantData.id,
      slug: tenantData.slug,
      token,
      token_preview: tokenPreview
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
