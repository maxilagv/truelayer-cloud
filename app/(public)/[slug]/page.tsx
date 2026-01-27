import { headers } from 'next/headers';

type CatalogResponse = {
  config?: { nombre?: string; logo_url?: string };
  categorias?: Array<{ id: number; name: string }>;
  productos?: Array<{ id: number; name: string; category_id: number; price?: number | null }>;
};

function resolveBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const h = headers();
  const host = h.get('host');
  if (!host) return 'http://localhost:3000';
  const proto = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  return `${proto}://${host}`;
}

export default async function PublicCatalogPage({ params }: { params: { slug: string } }) {
  const baseUrl = resolveBaseUrl();
  const res = await fetch(`${baseUrl}/api/public/${params.slug}/catalog`, { cache: 'no-store' });
  if (!res.ok) {
    return (
      <div className="card">
        <h1>Catalog not available</h1>
        <p className="muted">Slug: {params.slug}</p>
      </div>
    );
  }

  const data = (await res.json()) as CatalogResponse;
  return (
    <div className="card">
      <h1>{data.config?.nombre || 'Catalog'}</h1>
      <p className="muted">Slug: {params.slug}</p>
      <div style={{ marginTop: 12 }}>
        <strong>Categories:</strong>
        <ul>
          {(data.categorias || []).map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
