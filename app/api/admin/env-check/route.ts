import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const adminKey = req.headers.get('x-admin-key') || '';
  const expected = process.env.ADMIN_API_KEY || '';
  if (!expected || adminKey !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ADMIN_API_KEY: Boolean(process.env.ADMIN_API_KEY),
    NEXT_PUBLIC_SITE_URL: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  });
}
