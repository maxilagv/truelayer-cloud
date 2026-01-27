import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient<any>> | null = null;

export function getSupabaseAdmin() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  client = createClient<any>(url, key, {
    auth: { persistSession: false }
  });
  return client;
}
