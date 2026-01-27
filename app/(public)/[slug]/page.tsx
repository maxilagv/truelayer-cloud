import { headers } from 'next/headers';
import CatalogoClient from './CatalogoClient';

type CatalogoConfig = {
  nombre?: string;
  logo_url?: string;
  destacado_producto_id?: number | null;
  price_type?: 'final' | 'distribuidor' | 'mayorista';
  publicado?: boolean;
};

type Categoria = {
  id: number;
  name: string;
  image_url?: string | null;
  description?: string | null;
  active?: boolean;
};

type Producto = {
  id: number;
  category_id: number;
  category_name?: string | null;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price?: number | null;
  price_local?: number | null;
  price_distribuidor?: number | null;
  precio_final?: number | null;
  active?: boolean;
};

type CatalogoData = {
  config?: CatalogoConfig;
  destacado?: Producto | null;
  categorias?: Categoria[];
  productos?: Producto[];
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
      <div className="catalogo-shell">
        <div className="catalogo-fallback">
          <h1>Catalogo no disponible</h1>
          <p>Slug: {params.slug}</p>
        </div>
      </div>
    );
  }

  const data = (await res.json()) as CatalogoData;
  return <CatalogoClient slug={params.slug} data={data} />;
}
