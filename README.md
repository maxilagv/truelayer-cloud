# Cloud app (Next.js)

This app hosts:
- Secret admin panel (tenant creation)
- Public catalog by slug
- Serverless API routes for sync

## Supabase setup
1) Create the tables listed in `docs/cloud/SCHEMA.md` (in this repo).
2) Enable RLS and tenant isolation by `tenant_id`.

## Env
Create `cloud/.env.local` from `.env.example` and fill:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Local dev
- npm install
- npm run dev

## Vercel deploy (GitHub)
Recommended: push only the `cloud/` folder to its own GitHub repo.
- Vercel > New Project > import repo
- Framework preset: Next.js
- Root directory: `/` (since repo is only cloud)
- Env vars: set the values from `.env.local`

If you keep a monorepo in GitHub, set Vercel Root Directory to `cloud`.

