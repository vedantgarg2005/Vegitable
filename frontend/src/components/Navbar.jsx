import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Bell, Wallet, ArrowLeft, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth, useLoginModal } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const INNER_PAGES = {
  '/cart':          { back: '/',        sub: 'Your Order',  title: (cart) => `Cart · ${cart.length} item${cart.length !== 1 ? 's' : ''}` },
  '/orders':        { back: '/',        sub: 'History',     title: () => 'My Orders' },
  '/addresses':     { back: '/',        sub: 'Saved',       title: () => 'Addresses' },
  '/wallet':        { back: '/',        sub: 'My',          title: () => 'Wallet' },
  '/about':         { back: '/',        sub: 'Info',        title: () => 'About Us' },
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

  return (
    <nav className="flex items-center justify-between px-4 sticky top-0 z-50"
      style={{ background: 'black', borderBottom: '1px solid #222', boxShadow: '0 1px 8px rgba(0,0,0,0.2)', height: 56 }}>

      {isInner ? (
        <>
          <button onClick={() => navigate(isOrderDetail ? '/orders' : innerPage.back)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            {!isOrderDetail && <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{innerPage.sub}</p>}
            <p style={{ fontSize: 16, fontWeight: 900, color: '#0a0a0a', margin: 0 }}>
              {isOrderDetail ? 'Order Detail' : innerPage.title(cart, user)}
            </p>
          </div>
          {pathname === '/notifications' ? (
            <div style={{ width: 34 }} />
          ) : (
            <button onClick={openCart}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, border: totalItems > 0 ? '1.5px solid #16a34a' : '1.5px solid #e5e5e5', background: totalItems > 0 ? '#16a34a' : 'white', flexShrink: 0, cursor: 'pointer' }}>
              <ShoppingBag size={15} color={totalItems > 0 ? 'white' : '#555'} />
              {totalItems > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: '50%', background: '#15803d', border: '1.5px solid white', color: 'white', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
                  {totalItems}
                </span>
              )}
            </button>
          )}
        </>
      ) : (
        <>
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" style={{ textDecoration: 'none' }}>
            <img src="/Logo.png" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover' }} />
          </Link>
          <div className="flex items-center gap-2" style={{ flex: 1, justifyContent: 'flex-end' }}>
            {user ? (
              <>
                <form onSubmit={e => { e.preventDefault(); navigate(searchVal.trim() ? `/search?q=${encodeURIComponent(searchVal.trim())}` : '/search'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f5f5', borderRadius: 10, padding: '7px 12px', border: '1.5px solid transparent', transition: 'all 0.15s', maxWidth: 220 }}
                  onFocus={e => e.currentTarget.style.borderColor = '#16a34a'}
                  onBlur={e => e.currentTarget.style.borderColor = 'transparent'}>
                  <Search size={13} color="#aaa" style={{ flexShrink: 0 }} />
                  <input
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    placeholder="Search…"
                    style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: '#0a0a0a', fontFamily: 'inherit', width: 140 }}
                  />
                </form>
                <NavLink to="/notifications" title="Notifications"
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:bg-gray-100"
                  style={{ border: '1px solid #e5e5e5' }}>
                  <Bell size={15} color="#555" />
                </NavLink>
                <NavLink to="/wallet" title="Wallet"
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:bg-gray-100"
                  style={{ border: '1px solid #e5e5e5' }}>
                  <Wallet size={15} color="#555" />
                </NavLink>
                <button onClick={openCart} title="Cart"
                  className="relative w-8 h-8 rounded-md flex items-center justify-center transition-all hover:bg-gray-100"
                  style={{ border: totalItems > 0 ? '1px solid #16a34a' : '1px solid #e5e5e5', background: totalItems > 0 ? '#16a34a' : 'white', cursor: 'pointer' }}>
                  <ShoppingBag size={15} color={totalItems > 0 ? 'white' : '#555'} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center px-0.5"
                      style={{ background: '#15803d', border: '1.5px solid white', fontSize: 8 }}>
                      {totalItems}
                    </span>
                  )}
                </button>
                <button onClick={openProfile}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all hover:bg-gray-50 ml-1"
                  style={{ border: '1px solid #e5e5e5', color: '#0a0a0a', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: '#16a34a' }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden md:block" style={{ fontSize: 12 }}>{user.name?.split(' ')[0]}</span>
                </button>
              </>
            ) : (
              <button onClick={openLogin}
                className="px-4 py-1.5 rounded-md text-sm font-bold transition-all hover:bg-gray-50"
                style={{ border: '1px solid #e5e5e5', color: '#0a0a0a', fontSize: 12 }}>
                Login
              </button>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
