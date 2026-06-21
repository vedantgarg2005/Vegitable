import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, ArrowRight, Bike, Mail, Phone, MapPin, Clock, ChevronRight, Shield, Truck, Leaf, Star, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

const CATEGORY_IMAGES = [
  { id: 'vegetables',      label: 'Vegetables',       img: '/Vegetables.webp' },
  { id: 'fruits',          label: 'Fruits',            img: '/Fruits.webp' },
  { id: 'exotic',          label: 'Exotic Veggie',    img: '/ExocticVegetable.webp' },
  { id: 'exoticfruits',    label: 'Exotic Fruits',    img: '/ExocticFruits.webp' },
  { id: 'bakery',          label: 'Bakery',            img: '/Bakery.webp' },
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
  const { cart, setCartOpen, openCart } = useCart();
  const { user } = useAuth();
  const { openLogin, openProfile } = useLoginModal();
  const navigate = useNavigate();
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading]   = useState(true);
  const shopRef = useRef(null);

  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounce = useRef();
  const searchRef = useRef();

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    if (!searchVal.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/admin/products?q=${encodeURIComponent(searchVal.trim())}`);
        let list = Array.isArray(data) ? data : data.products || [];
        setSearchResults(list.filter(p => p.isActive !== false).slice(0, 8));
      } catch { setSearchResults([]); }
      setSearchLoading(false);
    }, 300);
  }, [searchVal]);

  useEffect(() => {
    api.get('/admin/products')
      .then(({ data }) => setProducts(Array.isArray(data) ? data : data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);


  return (
    <div style={{ background: '#f6faf7', minHeight: '100vh' }}>

      {/* ── TOP NAV — desktop only (mobile uses Navbar in App.jsx layout) ── */}
      <header className="hidden sm:block" style={{ background: 'white', borderBottom: '1px solid #efefef', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 58, display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <img src="/Logo.png" alt="Fresh Tokri" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#0a0a0a', letterSpacing: -0.3 }}>Fresh Tokri</span>
          </Link>

          {/* Search */}
          <div style={{ flex: 1, position: 'relative', maxWidth: 420 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              placeholder="Search vegetables, fruits…"
              value={searchVal}
              onChange={e => { setSearchVal(e.target.value); setSearchOpen(true); }}
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.background = 'white'; setSearchOpen(true); }}
              onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f5f5f5'; setTimeout(() => setSearchOpen(false), 150); }}
              style={{ width: '100%', background: '#f5f5f5', border: '1.5px solid transparent', borderRadius: 10, padding: '9px 32px 9px 34px', fontSize: 13, fontWeight: 500, outline: 'none', fontFamily: 'inherit', color: '#0a0a0a', transition: 'all 0.15s' }}
            />
            {searchOpen && searchVal.trim() && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1.5px solid #f0f0f0', zIndex: 200, overflow: 'hidden' }}>
                {searchLoading && <p style={{ padding: '12px 14px', fontSize: 12, color: '#aaa', margin: 0 }}>Searching…</p>}
                {!searchLoading && searchResults.length === 0 && <p style={{ padding: '12px 14px', fontSize: 12, color: '#aaa', margin: 0 }}>No results for "{searchVal}"</p>}
                {!searchLoading && searchResults.map(p => (
                  <Link key={p._id} to={`/product/${p._id}`} onMouseDown={e => e.preventDefault()}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f6faf7'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    {p.image && <img src={p.image.startsWith('http') ? p.image : `http://localhost:5000/uploads/${p.image}`} alt={p.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>₹{p.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={openCart} style={{ display: 'flex', alignItems: 'center', gap: 6, background: totalItems > 0 ? '#16a34a' : 'white', border: '1.5px solid', borderColor: totalItems > 0 ? '#16a34a' : '#e5e5e5', borderRadius: 10, padding: '7px 13px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              <ShoppingCart size={14} color={totalItems > 0 ? 'white' : '#555'} />
              <span style={{ color: totalItems > 0 ? 'white' : '#555', fontSize: 12, fontWeight: 700 }}>
                {totalItems > 0 ? `${totalItems} item${totalItems > 1 ? 's' : ''}` : 'Cart'}
              </span>
            </button>
            {user ? (
              <button onClick={openProfile} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f5f5f5', borderRadius: 10, padding: '7px 13px', border: '1.5px solid #e5e5e5', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'white' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ color: '#0a0a0a', fontSize: 12, fontWeight: 700 }}>{user.name?.split(' ')[0]}</span>
              </button>
            ) : (
              <button onClick={openLogin} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', color: 'white', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
                <User size={12} /> Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MOBILE NAV ── */}
      <header className="flex sm:hidden" style={{ background: 'white', borderBottom: '1px solid #efefef', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', height: 56, alignItems: 'center', padding: '0 16px', gap: 10 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/Logo.png" alt="Fresh Tokri" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0a0a0a' }}>Fresh Tokri</span>
        </Link>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search…"
            value={searchVal}
            onChange={e => { setSearchVal(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            style={{ width: '100%', background: '#f5f5f5', border: '1.5px solid transparent', borderRadius: 8, padding: '8px 28px 8px 30px', fontSize: 13, fontWeight: 500, outline: 'none', fontFamily: 'inherit', color: '#0a0a0a', cursor: 'text' }}
          />
          {searchOpen && searchVal.trim() && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1.5px solid #f0f0f0', zIndex: 200, overflow: 'hidden' }}>
              {searchLoading && <p style={{ padding: '12px 14px', fontSize: 12, color: '#aaa', margin: 0 }}>Searching…</p>}
              {!searchLoading && searchResults.length === 0 && <p style={{ padding: '12px 14px', fontSize: 12, color: '#aaa', margin: 0 }}>No results for "{searchVal}"</p>}
              {!searchLoading && searchResults.map(p => (
                <Link key={p._id} to={`/product/${p._id}`} onMouseDown={e => e.preventDefault()}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f6faf7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  {p.image && <img src={p.image.startsWith('http') ? p.image : `http://localhost:5000/uploads/${p.image}`} alt={p.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>₹{p.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <button onClick={openCart} style={{ position: 'relative', width: 36, height: 36, borderRadius: 9, border: totalItems > 0 ? '1.5px solid #16a34a' : '1.5px solid #e5e5e5', background: totalItems > 0 ? '#16a34a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ShoppingCart size={15} color={totalItems > 0 ? 'white' : '#555'} />
          {totalItems > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: '50%', background: '#15803d', border: '1.5px solid white', color: 'white', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalItems}</span>
          )}
        </button>
        {user ? (
          <button onClick={openProfile} style={{ width: 32, height: 32, borderRadius: 8, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'white', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            {user.name?.[0]?.toUpperCase()}
          </button>
        ) : (
          <button onClick={openLogin} style={{ background: '#16a34a', color: 'white', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Login</button>
        )}
      </header>

      {/* ── BANNER IMAGE ── */}
      <img src="/1.jpeg" alt="Banner" style={{ display: 'block', width: 'calc(100% - 120px)', margin: '20px auto 0', borderRadius: 12 }} />

      {/* ── CATEGORY IMAGE STRIP ── */}
      <div style={{ maxWidth: 1100, margin: '16px auto 0', padding: '0 12px' }}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {CATEGORY_IMAGES.map(cat => (
            <button key={cat.id} onClick={() => { setCategory(cat.id); shopRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ flexShrink: 0, border: 'none', background: 'none', cursor: 'pointer', padding: 0, textAlign: 'center' }}>
              <div style={{ width: 90, height: 90, borderRadius: 16, overflow: 'hidden', border: category === cat.id ? '2.5px solid #16a34a' : '2px solid #e5e5e5', transition: 'border 0.15s' }}>
                <img src={cat.img} alt={cat.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 700, color: category === cat.id ? '#16a34a' : '#555', whiteSpace: 'nowrap' }}>{cat.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 12px 100px' }}>

        {/* Categories */}
        <div ref={shopRef} style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2, marginBottom: 24 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '8px 16px', borderRadius: 22, border: '1.5px solid', borderColor: category === cat.id ? '#16a34a' : '#e5e5e5', background: category === cat.id ? '#16a34a' : 'white', color: category === cat.id ? 'white' : '#555', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div className="product-grid">{Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : category !== 'all' ? (
          // Single category view
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>
                {CATEGORIES.find(c => c.id === category)?.label}
              </p>
              <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600 }}>
                {products.filter(p => p.category === category && p.isActive !== false).length} items
              </span>
            </div>
            <div className="product-grid">
              {products.filter(p => p.category === category && p.isActive !== false).map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        ) : (
          // Grouped by category
          CATEGORIES.filter(cat => cat.id !== 'all').map(cat => {
            const catProducts = products.filter(p => p.category === cat.id && p.isActive !== false);
            if (!catProducts.length) return null;
            return (
              <div key={cat.id} style={{ marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>{cat.label}</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600 }}>{catProducts.length} items</span>
                </div>
                <div className="product-grid">
                  {catProducts.map(p => <ProductCard key={p._id} product={p} />)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── FLOATING CART BAR ── */}
      {totalItems > 0 && (
        <button onClick={openCart}
          style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: 'white', borderRadius: 50, padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, boxShadow: '0 6px 24px rgba(22,163,74,0.45)', zIndex: 90, whiteSpace: 'nowrap', animation: 'popIn 0.18s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingCart size={15} />
            <span>{totalItems} item{totalItems > 1 ? 's' : ''}</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontWeight: 900 }}>₹{totalPrice}</span>
          <ArrowRight size={14} />
        </button>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: '#052e16' }}>
        {/* Trust badges */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 32 }}>
            {[{ icon: <Shield size={14}/>, label: '100% Secure Payments' }, { icon: <Truck size={14}/>, label: 'Free delivery above ₹199' }, { icon: <Leaf size={14}/>, label: 'Always Fresh & Organic' }, { icon: <Star size={14}/>, label: '4.8★ Rated by 10k+ Users' }].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: '#4ade80' }}>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 36 }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <img src="/Logo.png" alt="Fresh Tokri" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
              <span style={{ color: 'white', fontWeight: 900, fontSize: 15, letterSpacing: -0.3 }}>Fresh Tokri</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.8, margin: '0 0 20px' }}>Fresh Tokri brings you farm-fresh vegetables & fruits sourced directly from local farmers, delivered to your door in under 60 minutes.</p>
            {/* Socials */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ label: 'Instagram', icon: '📷' }, { label: 'Facebook', icon: '📘' }, { label: 'Twitter', icon: '𝕏' }, { label: 'YouTube', icon: '▶' }].map(({ icon, label }) => (
                <button key={label} title={label} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#16a34a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>Quick Links</p>
            {[['/', 'Home'], ['/orders', 'My Orders'], ['/cart', 'Cart'], ['/profile', 'Profile'], ['/search', 'Search'], ['/about', 'About Us']].map(([to, l]) => (
              <Link key={to} to={to} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500, textDecoration: 'none', marginBottom: 9, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                <ChevronRight size={11} style={{ opacity: 0.4 }}/>{l}
              </Link>
            ))}
          </div>

          {/* Categories */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>Shop By Category</p>
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <button key={cat.id}
                onClick={() => { setCategory(cat.id); shopRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 9px', fontFamily: 'inherit', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                <span>{cat.emoji}</span>{cat.label}
              </button>
            ))}
          </div>

          {/* Contact */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>Contact Us</p>
            {[{ icon: <Mail size={12}/>, text: 'hello@freshtokri.in' }, { icon: <Phone size={12}/>, text: '+91 98765 43210' }, { icon: <MapPin size={12}/>, text: 'Mumbai, Maharashtra' }, { icon: <Clock size={12}/>, text: '6 AM – 10 PM, All Days' }].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                <span style={{ color: '#4ade80', flexShrink: 0 }}>{icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{text}</span>
              </div>
            ))}
            {/* App badges */}
            <p style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '16px 0 10px' }}>Download App</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['App Store', 'Google Play'].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 14 }}>{s === 'App Store' ? '🍎' : '▶'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Fresh Tokri. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(t => (
                <span key={t} style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
