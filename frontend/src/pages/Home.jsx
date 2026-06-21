import { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingCart, User, ArrowRight, Bike } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth, useLoginModal } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'all',        label: 'All',        emoji: '🛒' },
  { id: 'vegetables', label: 'Vegetables', emoji: '🥦' },
  { id: 'fruits',     label: 'Fruits',     emoji: '🍎' },
  { id: 'leafy',      label: 'Leafy',      emoji: '🥬' },
  { id: 'exotic',     label: 'Exotic',     emoji: '🌶️' },
  { id: 'herbs',      label: 'Herbs',      emoji: '🌿' },
  { id: 'organic',    label: 'Organic',    emoji: '✅' },
];

const PERKS = [
  { emoji: '🌾', title: '100% Fresh',  sub: 'Farm to doorstep' },
  { emoji: '⚡', title: '60 min',      sub: 'Express delivery' },
  { emoji: '✓',  title: 'Handpicked', sub: 'Quality checked' },
];

function SkeletonCard() {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #f0f0f0', overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '1/1' }} />
      <div style={{ padding: 10 }}>
        <div className="skeleton" style={{ height: 11, width: '75%', marginBottom: 6, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 10, borderRadius: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 14, width: '30%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 30, width: 30, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { cart } = useCart();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

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
    <div style={{ background: '#f6faf7', minHeight: '100vh' }}>

      {/* ── TOP NAV ── */}
      <header style={{ background: 'white', borderBottom: '1px solid #efefef', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 58, display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#16a34a,#15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌿</div>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#0a0a0a', letterSpacing: -0.3 }}>FreshBasket</span>
          </Link>

          {/* Search */}
          <div style={{ flex: 1, position: 'relative', maxWidth: 420 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search vegetables, fruits…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: '#f5f5f5', border: '1.5px solid transparent', borderRadius: 10, padding: '9px 32px 9px 34px', fontSize: 13, fontWeight: 500, outline: 'none', fontFamily: 'inherit', color: '#0a0a0a', transition: 'all 0.15s' }}
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.background = 'white'; }}
              onBlur={e =>  { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f5f5f5'; }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0, lineHeight: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: 6, background: totalItems > 0 ? '#16a34a' : 'white', border: '1.5px solid', borderColor: totalItems > 0 ? '#16a34a' : '#e5e5e5', borderRadius: 10, padding: '7px 13px', textDecoration: 'none', transition: 'all 0.15s' }}>
              <ShoppingCart size={14} color={totalItems > 0 ? 'white' : '#555'} />
              <span style={{ color: totalItems > 0 ? 'white' : '#555', fontSize: 12, fontWeight: 700 }}>
                {totalItems > 0 ? `${totalItems} item${totalItems > 1 ? 's' : ''}` : 'Cart'}
              </span>
            </Link>
            {user ? (
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f5f5f5', borderRadius: 10, padding: '7px 13px', textDecoration: 'none', border: '1.5px solid #e5e5e5' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'white' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ color: '#0a0a0a', fontSize: 12, fontWeight: 700 }}>{user.name?.split(' ')[0]}</span>
              </Link>
            ) : (
              <button onClick={openLogin} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', color: 'white', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
                <User size={12} /> Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg,#064e3b 0%,#16a34a 55%,#4ade80 100%)', padding: '52px 20px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 100, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
            <Bike size={11} /> Free delivery above ₹199
          </span>
          <h1 style={{ color: 'white', fontSize: 'clamp(30px,5vw,58px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: -1 }}>
            Farm-fresh,<br />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>at your door.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: '0 0 28px', lineHeight: 1.7, maxWidth: 380 }}>
            Handpicked daily from local farms. Delivered in under 60 minutes.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => shopRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'white', color: '#16a34a', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
              Shop Now <ArrowRight size={14} />
            </button>
            {!user && (
              <button onClick={openLogin} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '12px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── PERKS ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {PERKS.map(({ emoji, title, sub }, i) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRight: i < 2 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{emoji}</div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>{title}</p>
                <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* Categories */}
        <div ref={shopRef} style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2, marginBottom: 24 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '8px 16px', borderRadius: 22, border: '1.5px solid', borderColor: category === cat.id ? '#16a34a' : '#e5e5e5', background: category === cat.id ? '#16a34a' : 'white', color: category === cat.id ? 'white' : '#555', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Bestsellers */}
        {category === 'all' && !search && bestsellers.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🏆</span>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>Bestsellers</p>
              </div>
              <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600 }}>{bestsellers.length} items</span>
            </div>
            <div className="product-grid">
              {bestsellers.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

        {/* All Products */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>
              {search ? `Results for "${search}"` : category === 'all' ? 'All Products' : CATEGORIES.find(c => c.id === category)?.label}
            </p>
            {!loading && <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600 }}>{filtered.length} items</span>}
          </div>

          {loading ? (
            <div className="product-grid">{Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontWeight: 800, fontSize: 16, margin: '0 0 6px' }}>Nothing found</p>
              <p style={{ fontSize: 13, color: '#999', margin: '0 0 20px' }}>Try a different category or search term</p>
              {search && <button onClick={() => setSearch('')} style={{ background: 'white', border: '1.5px solid #e5e5e5', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Clear Search</button>}
            </div>
          ) : (
            <div className="product-grid">{filtered.map(p => <ProductCard key={p._id} product={p} />)}</div>
          )}
        </div>
      </div>

      {/* ── FLOATING CART BAR ── */}
      {totalItems > 0 && (
        <Link to="/cart"
          style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: 'white', borderRadius: 50, padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13, boxShadow: '0 6px 24px rgba(22,163,74,0.45)', zIndex: 90, whiteSpace: 'nowrap', animation: 'popIn 0.18s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingCart size={15} />
            <span>{totalItems} item{totalItems > 1 ? 's' : ''}</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontWeight: 900 }}>₹{totalPrice}</span>
          <ArrowRight size={14} />
        </Link>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: '#064e3b', borderTop: '1px solid #065f46' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 28, marginBottom: 28 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌿</div>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>FreshBasket</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>Farm-fresh vegetables & fruits delivered in 60 min.</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Quick Links</p>
              {[['/', 'Home'], ['/orders', 'Orders'], ['/cart', 'Cart'], ['/profile', 'Profile'], ['/search', 'Search'], ['/about', 'About Us']].map(([to, l]) => (
                <Link key={to} to={to} style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginBottom: 7 }}>{l}</Link>
              ))}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Categories</p>
              {['Vegetables', 'Fruits', 'Leafy', 'Herbs', 'Organic'].map(c => (
                <button key={c} onClick={() => { setCategory(c.toLowerCase()); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 7, fontFamily: 'inherit' }}>{c}</button>
              ))}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Contact</p>
              {['hello@freshbasket.in', '+91 98765 43210', 'Mumbai, Maharashtra', '6 AM – 10 PM Daily'].map(t => (
                <p key={t} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '0 0 7px' }}>{t}</p>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} FreshBasket</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: 0 }}>Made for fresh living 🌿</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
