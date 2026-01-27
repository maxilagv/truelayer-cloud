import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { resolveTenantFromToken } from '../../../lib/tenantAuth';
import { applyCatalogEvent } from '../../../lib/catalogApply';

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const resolved = await resolveTenantFromToken(token);
    if (!resolved?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = resolved.tenantId;

    const body = await req.json().catch(() => ({}));
    const deviceId = String(body?.device_id || '').trim();
    const events = Array.isArray(body?.events) ? body.events : [];
    if (!events.length) {
      return NextResponse.json({ accepted: [], rejected: [] });
    }

    const supabase = getSupabaseAdmin();

    if (deviceId) {
      await supabase.from('tenant_devices').upsert({
        tenant_id: tenantId,
        device_id: deviceId,
        last_seen_at: new Date().toISOString()
      }, { onConflict: 'tenant_id,device_id' });
    }

    const rows = events.map((ev: any) => ({
      tenant_id: tenantId,
      device_id: deviceId || null,
      local_event_id: Number(ev?.id) || null,
      entity: String(ev?.entity || ''),
      entity_id: ev?.entity_id != null ? Number(ev.entity_id) : null,
      action: String(ev?.action || ''),
      payload: ev?.payload ?? null,
      created_at: ev?.created_at ? new Date(ev.created_at).toISOString() : new Date().toISOString()
    }));

    const insert = await supabase
      .from('sync_events')
      .upsert(rows, { onConflict: 'tenant_id,device_id,local_event_id' });

    if (insert.error) {
      return NextResponse.json({ error: insert.error.message }, { status: 500 });
    }

    const accepted: number[] = [];
    for (const ev of events) {
      try {
        await applyCatalogEvent(tenantId, {
          entity: String(ev?.entity || ''),
          entity_id: ev?.entity_id != null ? Number(ev.entity_id) : null,
          action: String(ev?.action || ''),
          payload: ev?.payload || {}
        });
        if (ev?.id != null) accepted.push(Number(ev.id));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'apply_failed';
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    if (accepted.length) {
      await supabase
        .from('sync_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('device_id', deviceId || null)
        .in('local_event_id', accepted);
    }

    return NextResponse.json({ accepted, rejected: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
