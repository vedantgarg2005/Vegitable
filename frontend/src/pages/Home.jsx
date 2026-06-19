import { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingCart, Star, ChevronRight, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'all',        label: 'All' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits',     label: 'Fruits' },
  { id: 'leafy',      label: 'Leafy' },
  { id: 'exotic',     label: 'Exotic' },
  { id: 'herbs',      label: 'Herbs' },
  { id: 'organic',    label: 'Organic' },
];

function SkeletonCard() {
  return (
    <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 130 }} />
      <div style={{ padding: 12 }}>
        <div className="skeleton" style={{ height: 11, width: '70%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 10, width: '45%', marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: 14, width: '30%' }} />
          <div className="skeleton" style={{ height: 26, width: 52, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { cart } = useCart();
  const { user } = useAuth();
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const shopRef = useRef(null);

  useEffect(() => {
    api.get('/admin/products')
      .then(({ data }) => setProducts(Array.isArray(data) ? data : data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    (category === 'all' || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    p.isActive !== false
  );
  const bestsellers = products.filter(p => p.isBestseller && p.isActive !== false).slice(0, 6);

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🌿</div>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#0a0a0a', letterSpacing: -0.3 }} className="hidden sm:block">FreshBasket</span>
          </Link>

          {/* Search */}
          <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search vegetables, fruits…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: '#f5f5f5', border: '1.5px solid transparent', borderRadius: 8, padding: '8px 30px 8px 32px', color: '#0a0a0a', fontSize: 13, fontWeight: 500, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s' }}
              onFocus={e => { e.target.style.borderColor = '#0a0a0a'; e.target.style.background = 'white'; }}
              onBlur={e  => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f5f5f5'; }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, lineHeight: 0 }}>
                <X size={12} />
              </button>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: 6, background: totalItems > 0 ? '#0a0a0a' : 'transparent', border: '1.5px solid', borderColor: totalItems > 0 ? '#0a0a0a' : '#e5e5e5', borderRadius: 8, padding: '7px 12px', textDecoration: 'none', transition: 'all 0.15s' }}>
              <ShoppingCart size={14} color={totalItems > 0 ? 'white' : '#0a0a0a'} />
              <span style={{ color: totalItems > 0 ? 'white' : '#0a0a0a', fontSize: 12, fontWeight: 700 }} className="hidden sm:block">
                {totalItems > 0 ? `${totalItems} item${totalItems > 1 ? 's' : ''}` : 'Cart'}
              </span>
            </Link>

            {user ? (
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f5f5f5', borderRadius: 8, padding: '7px 12px', textDecoration: 'none', border: '1.5px solid #e5e5e5' }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'white', flexShrink: 0 }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ color: '#0a0a0a', fontSize: 12, fontWeight: 700 }} className="hidden sm:block">{user.name?.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0a0a0a', color: 'white', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                <User size={12} /> Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── FLOATING CART (mobile) ── */}
      {totalItems > 0 && (
        <Link to="/cart" className="sm:hidden"
          style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', background: '#0a0a0a', color: 'white', borderRadius: 50, padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', zIndex: 90, whiteSpace: 'nowrap', animation: 'popIn 0.18s ease' }}>
          <ShoppingCart size={14} />
          <span>{totalItems} item{totalItems > 1 ? 's' : ''}</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>₹{cart.reduce((s, i) => s + i.price * i.qty, 0)}</span>
        </Link>
      )}

      {/* ── HERO ── */}
      <div style={{ background: '#0a0a0a', padding: '56px 20px 60px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>
            Express delivery · 60 min
          </p>
          <h1 style={{ color: 'white', fontSize: 'clamp(32px,5vw,60px)', fontWeight: 900, lineHeight: 1.08, margin: '0 0 20px', letterSpacing: -1 }}>
            Farm-fresh<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>to your door.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, margin: '0 0 32px', lineHeight: 1.65, maxWidth: 400 }}>
            Handpicked daily from local farms. Delivered straight to your door in under an hour.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => shopRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'white', color: '#0a0a0a', border: 'none', borderRadius: 8, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}>
              Shop Now <ArrowRight size={14} />
            </button>
            {!user && (
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── PERKS BAR ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[['🌾', '100% Fresh', 'Farm to doorstep'], ['⚡', '60 min', 'Express delivery'], ['✓', 'Handpicked', 'Quality checked daily']].map(([e, label, sub], i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRight: i < 2 ? '1px solid #e5e5e5' : 'none' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{e}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: '#999', margin: 0 }} className="hidden sm:block">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 120px' }} className="animate-fade-up">

        {/* ── CATEGORIES ── */}
        <div ref={shopRef} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 6, border: '1.5px solid', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', transition: 'all 0.15s',
                  background: category === cat.id ? '#0a0a0a' : 'white',
                  borderColor: category === cat.id ? '#0a0a0a' : '#e5e5e5',
                  color: category === cat.id ? 'white' : '#555',
                }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── BESTSELLERS ── */}
        {category === 'all' && !search && bestsellers.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Bestsellers</p>
            </div>
            <div className="product-grid">
              {bestsellers.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

        {/* ── ALL PRODUCTS ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              {category === 'all' ? 'All Products' : category}
            </p>
            {!loading && (
              <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600 }}>{filtered.length} items</span>
            )}
          </div>

          {loading ? (
            <div className="product-grid">{Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ fontWeight: 800, fontSize: 16, margin: '0 0 6px' }}>Nothing found</p>
              <p style={{ fontSize: 13, color: '#999', margin: '0 0 20px' }}>Try a different category or search</p>
              {search && <button onClick={() => setSearch('')} className="btn btn-outline" style={{ borderRadius: 6 }}>Clear Search</button>}
            </div>
          ) : (
            <div className="product-grid">{filtered.map(p => <ProductCard key={p._id} product={p} />)}</div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1c1c1c' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 28, marginBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: 5, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🌿</div>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>FreshBasket</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>Farm-fresh vegetables & fruits delivered within 60 minutes.</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Quick Links</p>
              {[['/', 'Home'], ['/orders', 'My Orders'], ['/cart', 'Cart'], ['/profile', 'Profile']].map(([to, l]) => (
                <Link key={to} to={to} style={{ display: 'block', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginBottom: 8 }}>{l}</Link>
              ))}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Categories</p>
              {['Vegetables', 'Fruits', 'Leafy', 'Herbs', 'Organic'].map(c => (
                <button key={c} onClick={() => { setCategory(c.toLowerCase()); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ display: 'block', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8, fontFamily: 'inherit' }}>{c}</button>
              ))}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Contact</p>
              {['hello@freshbasket.in', '+91 98765 43210', 'Mumbai, Maharashtra', '6 AM – 10 PM Daily'].map(t => (
                <p key={t} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '0 0 8px' }}>{t}</p>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }}>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} FreshBasket</p>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, margin: 0 }}>Made for fresh living</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
