import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const adminKey = req.headers.get('x-admin-key') || '';
    const expected = process.env.ADMIN_API_KEY || '';
    if (!expected || adminKey !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const [tenantsRes, eventsRes] = await Promise.all([
      supabase.from('tenants').select('id', { count: 'exact', head: true }),
      supabase.from('sync_events').select('id, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(1)
    ]);

    return NextResponse.json({
      tenants: tenantsRes.count || 0,
      sync_events: eventsRes.count || 0,
      last_event_at: eventsRes.data?.[0]?.created_at || null
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
