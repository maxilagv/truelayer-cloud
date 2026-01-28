'use client';

import { useMemo, useState, useEffect, useRef, MouseEvent } from 'react';
import './catalogo.css';

// Types
type CatalogoConfig = {
  nombre?: string;
  logo_url?: string;
  destacado_producto_id?: number | null;
  price_type?: 'final' | 'distribuidor' | 'mayorista';
  publicado?: boolean;
  whatsapp?: string | null;
  whatsapp_url?: string | null;
  whatsapp_number?: string | null;
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

// --- Helpers ---

function resolvePrice(product: Producto, mode: 'final' | 'distribuidor' | 'mayorista') {
  if (mode === 'distribuidor') return product.price_local ?? product.price ?? product.precio_final ?? 0;
  if (mode === 'mayorista') return product.price_distribuidor ?? product.price ?? product.precio_final ?? 0;
  return product.precio_final ?? product.price ?? 0;
}

function buildWhatsappLink(config: CatalogoConfig, product: Producto) {
  const raw = String(config.whatsapp_url || config.whatsapp || '').trim();
  const number = String(config.whatsapp_number || '').trim();
  const message = `Hola, quiero el producto ${product.name}`;
  if (raw) {
    const glue = raw.includes('?') ? '&' : '?';
    return `${raw}${glue}text=${encodeURIComponent(message)}`;
  }
  if (number) {
    const digits = number.replace(/[^0-9]/g, '');
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }
  return null;
}

// --- Components ---

const CountUp = ({ end, label }: { end: number; label: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    if (end === 0) return;

    const duration = 2000;
    const incrementTime = (duration / end) * 1000;
    // Cap frame rate for large numbers
    const step = end > 100 ? Math.ceil(end / 100) : 1;

    // Simple interval based approach for robustness
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [end]);

  return (
    <div>
      <strong>{count}</strong>
      <span>{label}</span>
    </div>
  );
};

export default function CatalogoClient({ slug, data }: { slug: string; data: CatalogoData }) {
  const config = data.config || {};
  const categories = (data.categorias || []).filter((c) => c.active !== false);
  const products = (data.productos || []).filter((p) => p.active !== false);

  const initialPrice = config.price_type || 'final';
  const [priceType, setPriceType] = useState<'final' | 'distribuidor' | 'mayorista'>(initialPrice);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Hero Logic
  const heroProduct = data.destacado || products[0] || null;
  const heroRef = useRef<HTMLDivElement>(null);

  const handleHeroMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max tilt angles
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    heroRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    heroRef.current.style.animation = 'none'; // Pause float while interacting
  };

  const handleHeroLeave = () => {
    if (!heroRef.current) return;
    heroRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    heroRef.current.style.animation = 'floatHero 6s ease-in-out infinite'; // Resume float
  };

  // Product Spotlight Logic
  const handleProductMove = (e: MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty('--mouse-x', `${x}px`);
    target.style.setProperty('--mouse-y', `${y}px`);
  };

  const productsByCategory = useMemo(() => {
    const map = new Map<number, Producto[]>();
    for (const p of products) {
      const list = map.get(p.category_id) || [];
      list.push(p);
      map.set(p.category_id, list);
    }
    return map;
  }, [products]);

  const filteredCategories = useMemo(() => {
    if (!activeCategoryId) return categories;
    return categories.filter((c) => c.id === activeCategoryId);
  }, [categories, activeCategoryId]);

  return (
    <div className="catalogo-shell">
      <div className="catalogo-grid" />

      <header className="catalogo-header">
        <div className="brand-float">
          {config.logo_url ? (
            <img src={config.logo_url} alt={config.nombre || 'Catalogo'} />
          ) : (
            <div className="brand-badge">TL</div>
          )}
          <div className="brand-text">
            <h1>{config.nombre || 'Catalogo del Futuro'}</h1>
            <p>Vidriera digital premium conectada a tu ERP</p>
          </div>
        </div>

        <div className="catalogo-actions">
          <button className="ghost">Solicitar lista</button>
          <button className="primary">Cotizar ahora</button>
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Abrir menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <section className="catalogo-hero">
        <div className="hero-copy">
          <p className="eyebrow">Dark Glass Experience</p>
          <h2>
            Tu producto estrella
            <br />
            <span>merece una vidriera de lujo.</span>
          </h2>
          <p className="lead">
            Todo se siente premium: tarjetas flotantes, brillo suave y un recorrido pensado para
            vender rapido.
          </p>
          <div className="hero-cta">
            <button className="primary">Explorar catalogo</button>
            <button className="ghost" onClick={() => setActiveCategoryId(0)}>Ver todas</button>
          </div>
          <div className="hero-stats">
            <CountUp end={products.length} label="Productos activos" />
            <CountUp end={categories.length} label="Categorias" />
            <div>
              <strong>24/7</strong>
              <span>Sync live</span>
            </div>
          </div>
        </div>

        <div
          className="hero-card"
          ref={heroRef}
          onMouseMove={handleHeroMove}
          onMouseLeave={handleHeroLeave}
        >
          {heroProduct ? (
            <>
              <div className="tag">Producto estrella</div>
              <div className="hero-image">
                {heroProduct.image_url ? (
                  <img src={heroProduct.image_url} alt={heroProduct.name} />
                ) : (
                  <div className="placeholder" style={{ color: '#000' }}>Imagen</div>
                )}
              </div>
              <div className="hero-info">
                <h3>{heroProduct.name}</h3>
                <p>{heroProduct.description || 'Listo para cotizar en segundos.'}</p>
                <div className="hero-footer">
                  <div className="price">${resolvePrice(heroProduct, priceType).toFixed(2)}</div>
                  <a
                    className="cta"
                    href={buildWhatsappLink(config, heroProduct) || '#'}
                    target="_blank"
                    rel="noreferrer"
                    data-disabled={!buildWhatsappLink(config, heroProduct)}
                  >
                    PEDIR
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="placeholder">Sin destacado</div>
          )}
        </div>
      </section>

      <section className="catalogo-controls">
        <div className="chips">
          <button className={priceType === 'final' ? 'active' : ''} onClick={() => setPriceType('final')}>
            Precio final
          </button>
          <button className={priceType === 'distribuidor' ? 'active' : ''} onClick={() => setPriceType('distribuidor')}>
            Distribuidor
          </button>
          <button className={priceType === 'mayorista' ? 'active' : ''} onClick={() => setPriceType('mayorista')}>
            Mayorista
          </button>
        </div>

        <div className="chips categories">
          <button className={!activeCategoryId ? 'active' : ''} onClick={() => setActiveCategoryId(0)}>
            Todo
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={activeCategoryId === cat.id ? 'active' : ''}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <main className="catalogo-content">
        {filteredCategories.map((cat) => {
          const list = productsByCategory.get(cat.id) || [];
          if (!list.length) return null;
          return (
            <section key={cat.id} className="category-block">
              <div className="category-header">
                <h2>{cat.name}</h2>
                <span>{list.length} productos</span>
              </div>
              <div className="product-grid">
                {list.map((p, index) => {
                  const whatsappLink = buildWhatsappLink(config, p);
                  return (
                    <article
                      key={p.id}
                      className="product-card"
                      style={{ animationDelay: `${index * 0.05}s` } as any}
                      onMouseMove={handleProductMove}
                    >
                      <div className="product-image">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} loading="lazy" />
                        ) : (
                          <div className="placeholder" style={{ color: '#000' }}>Sin imagen</div>
                        )}
                      </div>
                      <div className="product-body">
                        <div className="product-name">{p.name}</div>
                        {p.description && <div className="product-desc">{p.description}</div>}
                        <div className="product-footer">
                          <div className="price">${resolvePrice(p, priceType).toFixed(2)}</div>
                          <a
                            className="cta"
                            href={whatsappLink || '#'}
                            target="_blank"
                            rel="noreferrer"
                            data-disabled={!whatsappLink}
                          >
                            PEDIR
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {menuOpen && (
        <aside className="catalogo-menu">
          <div className="menu-header">
            <h3>Categorias</h3>
            <button className="ghost" onClick={() => setMenuOpen(false)}>Cerrar</button>
          </div>
          <div className="menu-list">
            <button className={!activeCategoryId ? 'active' : ''} onClick={() => { setActiveCategoryId(0); setMenuOpen(false); }}>
              Todo
            </button>
            {categories.map((cat) => (
              <button key={cat.id} className={activeCategoryId === cat.id ? 'active' : ''} onClick={() => { setActiveCategoryId(cat.id); setMenuOpen(false); }}>
                {cat.name}
              </button>
            ))}
          </div>
        </aside>
      )}

      <footer className="catalogo-footer">
        <p>Truelayer Cloud · Slug: {slug}</p>
        <p>Catalogo vivo conectado al ERP</p>
      </footer>
    </div>
  );
}
