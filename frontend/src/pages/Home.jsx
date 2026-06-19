import { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingCart, Star, ChevronRight, Zap, Clock, Leaf, Truck, ShieldCheck, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'all',        label: 'All',        emoji: '🛒', color: '#1B3A1F' },
  { id: 'vegetables', label: 'Vegetables', emoji: '🥦', color: '#2E7D32' },
  { id: 'fruits',     label: 'Fruits',     emoji: '🍎', color: '#C62828' },
  { id: 'leafy',      label: 'Leafy',      emoji: '🥗', color: '#388E3C' },
  { id: 'exotic',     label: 'Exotic',     emoji: '🥭', color: '#E65100' },
  { id: 'herbs',      label: 'Herbs',      emoji: '🌿', color: '#00695C' },
  { id: 'organic',    label: 'Organic',    emoji: '🌱', color: '#558B2F' },
];

const BANNERS = [
  { id: 1, tag: 'LIMITED OFFER', title: '20% OFF',      sub: 'On all Fresh Vegetables',   code: 'FRESH20', emoji: '🥦', bg: 'linear-gradient(135deg,#1B5E20,#43A047)' },
  { id: 2, tag: 'TODAY ONLY',    title: 'Buy 1 Get 1',  sub: 'On all Seasonal Fruits',    code: 'BOGO',    emoji: '🍎', bg: 'linear-gradient(135deg,#BF360C,#FF7043)' },
  { id: 3, tag: 'FREE DELIVERY', title: 'Orders ₹199+', sub: 'No minimum on first order', code: null,      emoji: '🛵', bg: 'linear-gradient(135deg,#0D47A1,#1976D2)' },
];

const PERKS = [
  { Icon: Leaf,        label: '100% Fresh',      sub: 'Farm to doorstep',   color: '#2E7D32', bg: '#E8F5E9' },
  { Icon: Truck,       label: '60 min Delivery', sub: 'Express to your door',color: '#1565C0', bg: '#E3F2FD' },
  { Icon: ShieldCheck, label: 'Quality Check',   sub: 'Handpicked daily',   color: '#E65100', bg: '#FFF3E0' },
];

function SkeletonCard() {
  return (
    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 130 }} />
      <div style={{ padding: 12 }}>
        <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 10, width: '45%', marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: 14, width: '30%' }} />
          <div className="skeleton" style={{ height: 28, width: 56, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { cart } = useCart();
  const { user } = useAuth();
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const [products, setProducts]   = useState([]);
  const [category, setCategory]   = useState('all');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerRef = useRef(null);
  const shopRef   = useRef(null);

  useEffect(() => {
    api.get('/admin/products')
      .then(({ data }) => setProducts(Array.isArray(data) ? data : data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bannerRef.current?.children[bannerIdx]
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [bannerIdx]);

  const filtered = products.filter(p =>
    (category === 'all' || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    p.isActive !== false
  );
  const bestsellers = products.filter(p => p.isBestseller && p.isActive !== false).slice(0, 6);
  const activeCat   = CATEGORIES.find(c => c.id === category);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* ── NAVBAR ── */}
      <header style={{ background: 'var(--green-dark)', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 58, display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌿</div>
            <span style={{ fontWeight: 900, fontSize: 16, color: 'white', letterSpacing: -0.3 }} className="hidden sm:block">FreshBasket</span>
          </Link>

          {/* Search bar */}
          <div style={{ flex: 1, position: 'relative', maxWidth: 460 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search vegetables, fruits, herbs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 9, padding: '8px 32px 8px 32px', color: 'white', fontSize: 13, fontWeight: 500, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.4)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0, lineHeight: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right: Cart + Login/Profile */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 9, padding: '7px 12px', textDecoration: 'none', position: 'relative', border: '1.5px solid rgba(255,255,255,0.1)' }}>
              <ShoppingCart size={15} color="white" />
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }} className="hidden sm:block">
                {totalItems > 0 ? `${totalItems} item${totalItems > 1 ? 's' : ''}` : 'Cart'}
              </span>
              {totalItems > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: '#4CAF50', color: 'white', borderRadius: '50%', width: 17, height: 17, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalItems}</span>
              )}
            </Link>

            {user ? (
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.1)', borderRadius: 9, padding: '7px 12px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#4CAF50,#1B5E20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: 'white', flexShrink: 0 }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }} className="hidden sm:block">{user.name?.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', color: 'var(--green-dark)', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                <User size={13} /> Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── FLOATING CART (mobile) ── */}
      {totalItems > 0 && (
        <Link to="/cart"
          className="sm:hidden"
          style={{
            position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg,#1B5E20,#2E7D32)',
            color: 'white', borderRadius: 50, padding: '11px 22px',
            display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none', fontWeight: 800, fontSize: 13,
            boxShadow: '0 6px 24px rgba(46,125,50,0.45)',
            zIndex: 90, whiteSpace: 'nowrap',
            animation: 'popIn 0.25s ease',
          }}>
          <ShoppingCart size={15} />
          <span>{totalItems} item{totalItems > 1 ? 's' : ''} in cart</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 900 }}>₹{cart.reduce((s, i) => s + i.price * i.qty, 0)}</span>
        </Link>
      )}
      <div style={{ background: 'linear-gradient(135deg,#1B3A1F 0%,#2E5E34 55%,#388E3C 100%)', padding: '40px 16px 52px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -70, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, position: 'relative' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', marginBottom: 16, backdropFilter: 'blur(8px)' }}>
              <Zap size={12} color="#4CAF50" fill="#4CAF50" />
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 700 }}>Express delivery in 60 min</span>
            </div>
            <h1 style={{ color: 'white', fontSize: 'clamp(28px,5vw,50px)', fontWeight: 900, lineHeight: 1.15, margin: '0 0 12px', letterSpacing: -0.5 }}>
              Fresh Veggies &amp;<br />
              <span style={{ color: '#81C784' }}>Farm Fruits</span> 🌿
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6, maxWidth: 380 }}>
              Handpicked daily from local farms. Delivered straight to your door.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => shopRef.current?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: 11, padding: '12px 22px', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(76,175,80,0.4)' }}>
                Shop Now <ChevronRight size={15} />
              </button>
              {!user && (
                <Link to="/login" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 11, padding: '12px 22px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
          {/* Bouncing veggie emojis — hidden on mobile */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }} className="hidden md:flex">
            {[['🥦','0s'],['🍅','0.2s'],['🥕','0.4s'],['🥬','0.1s'],['🍋','0.3s'],['🌽','0.5s']].map(([e, d]) => (
              <span key={e} style={{ fontSize: 44, display: 'block', animation: `heroBounce 2s ease-in-out ${d} infinite`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PERKS BAR ── */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {PERKS.map(({ Icon, label, sub, color, bg }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }} className="hidden sm:block">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 120px' }} className="animate-fade-up">

        {/* ── BANNERS ── */}
        <div style={{ marginBottom: 24 }}>
          <div ref={bannerRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', scrollSnapType: 'x mandatory', paddingBottom: 2 }}>
            {BANNERS.map((b, i) => (
              <div key={b.id} onClick={() => setBannerIdx(i)}
                style={{ flexShrink: 0, width: 'min(300px,80vw)', borderRadius: 18, background: b.bg, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', scrollSnapAlign: 'start', cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,0.14)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <div>
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: '2px 8px', borderRadius: 5, display: 'inline-block', marginBottom: 6 }}>{b.tag}</span>
                  <p style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 3px', lineHeight: 1.15 }}>{b.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '0 0 10px' }}>{b.sub}</p>
                  {b.code && <span style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px dashed rgba(255,255,255,0.45)', color: 'white', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, letterSpacing: 1 }}>{b.code}</span>}
                </div>
                <span style={{ fontSize: 48, flexShrink: 0, marginLeft: 10, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }}>{b.emoji}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
            {BANNERS.map((_, i) => (
              <button key={i} onClick={() => setBannerIdx(i)}
                style={{ height: 5, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s', width: i === bannerIdx ? 20 : 5, background: i === bannerIdx ? 'var(--green)' : '#C8E6C9' }} />
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {[{ e: '🌾', v: '500+', l: 'Products' }, { e: '⭐', v: '4.8', l: 'Rating' }, { e: '🚀', v: '60 min', l: 'Delivery' }].map(s => (
            <div key={s.l} className="card" style={{ padding: '14px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.e}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--green-dark)' }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── CATEGORIES ── */}
        <div ref={shopRef} style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--green-dark)', margin: '0 0 12px' }}>Shop by Category</h2>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 50, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s',
                  background: category === cat.id ? cat.color : 'white',
                  color: category === cat.id ? 'white' : '#444',
                  boxShadow: category === cat.id ? `0 4px 12px ${cat.color}45` : 'var(--shadow-sm)',
                  transform: category === cat.id ? 'scale(1.05)' : 'scale(1)',
                }}>
                <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── BESTSELLERS ── */}
        {category === 'all' && !search && bestsellers.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--green-dark)', margin: 0 }}>Bestsellers</h2>
            </div>
            <div className="product-grid">
              {bestsellers.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

        {/* ── ALL PRODUCTS ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--green-dark)', margin: 0 }}>
              {activeCat?.emoji} {category === 'all' ? 'All Products' : activeCat?.label}
            </h2>
            {!loading && (
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, background: 'white', padding: '4px 10px', borderRadius: 20, boxShadow: 'var(--shadow-sm)' }}>
                {filtered.length} items
              </span>
            )}
          </div>

          {loading ? (
            <div className="product-grid">{Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🥦</div>
              <p style={{ fontWeight: 900, fontSize: 18, margin: '0 0 6px' }}>Nothing found</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 20px' }}>Try a different category or search</p>
              {search && <button onClick={() => setSearch('')} className="btn btn-primary" style={{ borderRadius: 20 }}>Clear Search</button>}
            </div>
          ) : (
            <div className="product-grid">{filtered.map(p => <ProductCard key={p._id} product={p} />)}</div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--green-dark)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 28, marginBottom: 28 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🌿</span>
                <span style={{ color: 'white', fontWeight: 900, fontSize: 15 }}>FreshBasket</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>Farm-fresh vegetables &amp; fruits delivered within 60 minutes.</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 10px' }}>Quick Links</p>
              {[['/', 'Home'], ['/orders', 'My Orders'], ['/cart', 'Cart'], ['/profile', 'Profile']].map(([to, l]) => (
                <Link key={to} to={to} style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginBottom: 7 }}>{l}</Link>
              ))}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 10px' }}>Categories</p>
              {['Vegetables', 'Fruits', 'Leafy', 'Herbs', 'Organic'].map(c => (
                <button key={c} onClick={() => { setCategory(c.toLowerCase()); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 7, fontFamily: 'inherit' }}>{c}</button>
              ))}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 10px' }}>Contact</p>
              {['📧 hello@freshbasket.in', '📞 +91 98765 43210', '📍 Mumbai, Maharashtra', '🕐 6 AM – 10 PM Daily'].map(t => (
                <p key={t} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 7px' }}>{t}</p>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} FreshBasket. All rights reserved.</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: 0 }}>Made with 🌱 for fresh living</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes heroBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        header input::placeholder { color: rgba(255,255,255,0.35) !important; }
      `}</style>
    </div>
  );
}
