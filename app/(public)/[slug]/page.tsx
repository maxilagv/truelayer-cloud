import { headers } from 'next/headers';

// Definimos los tipos de datos que esperamos
type CatalogResponse = {
  config?: { nombre?: string; logo_url?: string };
  categorias?: Array<{ id: number; name: string }>;
  productos?: Array<{ id: number; name: string; category_id: number; price?: number | null }>;
};

// Función segura para obtener la URL base
function resolveBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  
  // En el build a veces headers() falla, usamos un fallback
  try {
    const h = headers();
    const host = h.get('host');
    if (!host) return 'http://localhost:3000';
    const proto = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    return `${proto}://${host}`;
  } catch (e) {
    return 'http://localhost:3000';
  }
}

export default async function PublicCatalogPage({ params }: { params: { slug: string } }) {
  const baseUrl = resolveBaseUrl();
  
  // INTENTO DE CONEXIÓN CON PROTECCIÓN (TRY/CATCH)
  // ESTO ES LO QUE TE FALTA PARA QUE NO EXPLOTE EL BUILD
  try {
    const res = await fetch(`${baseUrl}/api/public/${params.slug}/catalog`, { 
      cache: 'no-store',
      // Importante: Si tarda mucho, que corte para no colgar el build
      signal: AbortSignal.timeout(5000) 
    });

    if (!res.ok) {
      return (
        <div className="card">
          <h1>Catálogo no disponible</h1>
          <p className="muted">No se pudo cargar la tienda: {params.slug}</p>
        </div>
      );
    }

    const data = (await res.json()) as CatalogResponse;
    return (
      <div className="card">
        {data.config?.logo_url && (
            <img src={data.config.logo_url} alt="Logo" style={{maxHeight: 60, marginBottom: 10}} />
        )}
        <h1>{data.config?.nombre || 'Catálogo Online'}</h1>
        
        <div style={{ marginTop: 20 }}>
          {(data.productos || []).length === 0 ? (
              <p className="muted">No hay productos cargados aún.</p>
          ) : (
              <ul style={{listStyle: 'none', padding: 0}}>
                {data.productos?.map((p) => (
                    <li key={p.id} style={{
                        padding: '10px', 
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>{p.name}</span>
                        <strong>${p.price || 0}</strong>
                    </li>
                ))}
              </ul>
          )}
        </div>
      </div>
    );

  } catch (error) {
    // ESTE ES EL AIRBAG:
    // Si falla (como en el build), muestra esto y sigue adelante en vez de error rojo.
    console.error("Error cargando catálogo:", error);
    return (
      <div className="card">
        <h1>Cargando tienda...</h1>
        <p className="muted">Si ves esto, el sistema se está iniciando.</p>
      </div>
    );
  }
}