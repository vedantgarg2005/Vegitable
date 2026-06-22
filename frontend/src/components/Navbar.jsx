import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Bell, Wallet, ArrowLeft, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth, useLoginModal } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const INNER_PAGES = {
  '/cart':      { back: '/', sub: 'Your Order',  title: (cart) => `Cart · ${cart.length} item${cart.length !== 1 ? 's' : ''}` },
  '/orders':    { back: '/', sub: 'History',     title: () => 'My Orders' },
  '/addresses': { back: '/', sub: 'Saved',       title: () => 'Addresses' },
  '/wallet':    { back: '/', sub: 'My',          title: () => 'Wallet' },
  '/about':     { back: '/', sub: 'Info',        title: () => 'About Us' },
};

export default function Navbar() {
  const { user } = useAuth();
  const { openLogin, openProfile } = useLoginModal();
  const { cart, openCart } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const isOrderDetail = /^\/orders\/.+/.test(pathname);
  const innerPage = INNER_PAGES[pathname];
  const isInner = !!innerPage || isOrderDetail;

  const iconBtn = {
    width: 38, height: 38, borderRadius: 12, border: '1.5px solid var(--border)',
    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)',
  };

  return (
    <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, height: 68 }}
      className="flex items-center justify-between px-4">

      {isInner ? (
        <>
          <button onClick={() => navigate(isOrderDetail ? '/orders' : innerPage.back)} style={iconBtn}>
            <ArrowLeft size={16} color="var(--text)" />
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            {!isOrderDetail && <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{innerPage.sub}</p>}
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              {isOrderDetail ? 'Order Detail' : innerPage.title(cart, user)}
            </p>
          </div>
          <button onClick={openCart} style={{ ...iconBtn, borderColor: totalItems > 0 ? 'var(--green)' : 'var(--border)', background: totalItems > 0 ? 'var(--green)' : 'white', position: 'relative' }}>
            <ShoppingBag size={16} color={totalItems > 0 ? 'white' : 'var(--text-2)'} />
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: '50%', background: 'var(--green-dark)', border: '2px solid white', color: 'white', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalItems}
              </span>
            )}
          </button>
        </>
      ) : (
        <>
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <img src="/Logo.png" alt="Logo" style={{ width: 130, height: 52, objectFit: 'contain' }} />
          </Link>

          <div className="flex items-center gap-2" style={{ flex: 1, justifyContent: 'flex-end' }}>
            {user ? (
              <>
                <form onSubmit={e => { e.preventDefault(); navigate(searchVal.trim() ? `/search?q=${encodeURIComponent(searchVal.trim())}` : '/search'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4f4f5', borderRadius: 12, padding: '8px 14px', border: '1.5px solid transparent', transition: 'all 0.15s', maxWidth: 220 }}
                  onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--green)'}
                  onBlurCapture={e => e.currentTarget.style.borderColor = 'transparent'}>
                  <Search size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
                  <input
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    placeholder="Search…"
                    style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'inherit', width: 130 }}
                  />
                </form>
                <NavLink to="/notifications" title="Notifications" style={iconBtn}>
                  <Bell size={16} color="var(--text-2)" />
                </NavLink>
                <NavLink to="/wallet" title="Wallet" style={iconBtn}>
                  <Wallet size={16} color="var(--text-2)" />
                </NavLink>
                <button onClick={openCart} title="Cart" style={{ ...iconBtn, borderColor: totalItems > 0 ? 'var(--green)' : 'var(--border)', background: totalItems > 0 ? 'var(--green)' : 'white', position: 'relative' }}>
                  <ShoppingBag size={16} color={totalItems > 0 ? 'white' : 'var(--text-2)'} />
                  {totalItems > 0 && (
                    <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: '50%', background: 'var(--green-dark)', border: '2px solid white', color: 'white', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {totalItems}
                    </span>
                  )}
                </button>
                <button onClick={openProfile}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: 'white', flexShrink: 0 }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'none' }} className="md:block">{user.name?.split(' ')[0]}</span>
                </button>
              </>
            ) : (
              <button onClick={openLogin}
                style={{ padding: '9px 20px', borderRadius: 12, background: 'var(--green)', color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-green)', transition: 'all 0.15s' }}>
                Login
              </button>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
