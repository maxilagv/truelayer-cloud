import { getSupabaseAdmin } from './supabaseAdmin';
import { hashToken } from './identity';

export async function resolveTenantFromToken(token: string) {
  if (!token) return null;
  const supabase = getSupabaseAdmin();
  const tokenHash = hashToken(token);
  const res = await supabase
    .from('tenant_tokens')
    .select('tenant_id, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  const data = (res.data as { tenant_id?: string; revoked_at?: string | null } | null) || null;
  if (res.error || !data) return null;
  if (data.revoked_at) return null;

  await supabase
    .from('tenant_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);

  return { tenantId: data.tenant_id || null, tokenHash };
}
