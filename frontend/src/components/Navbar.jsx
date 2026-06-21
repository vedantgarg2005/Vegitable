import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Bell, Wallet, ArrowLeft, Search } from 'lucide-react';
import { useAuth, useLoginModal } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const INNER_PAGES = {
  '/cart':          { back: '/',        sub: 'Your Order',  title: (cart) => `Cart · ${cart.length} item${cart.length !== 1 ? 's' : ''}` },
  '/orders':        { back: '/profile', sub: 'History',     title: () => 'My Orders' },
  '/profile':       { back: '/',        sub: 'Account',     title: (_, user) => user?.name?.split(' ')[0] || 'Profile' },
  '/addresses':     { back: '/profile', sub: 'Saved',       title: () => 'Addresses' },
  '/wallet':        { back: '/profile', sub: 'My',          title: () => 'Wallet' },
  '/search':        { back: '/',        sub: 'Find',          title: () => 'Search' },
  '/about':         { back: '/',        sub: 'Info',          title: () => 'About Us' },
};

export default function Navbar() {
  const { user } = useAuth();
  const { openLogin } = useLoginModal();
  const { cart } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  // match /orders/:id
  const isOrderDetail = /^\/orders\/.+/.test(pathname);
  const innerPage = INNER_PAGES[pathname];
  const isInner = !!innerPage || isOrderDetail;

  return (
    <nav className="flex items-center justify-between px-4 sticky top-0 z-50"
      style={{ background: 'white', borderBottom: '1px solid #efefef', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', height: 56 }}>

      {isInner ? (
        /* ── INNER PAGE HEADER ── */
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
          {/* right side action */}
          {pathname === '/cart' ? (
            <div style={{ width: 34 }} />
          ) : pathname === '/notifications' ? (
            <div style={{ width: 34 }} />
          ) : (
            <NavLink to="/cart"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, border: totalItems > 0 ? '1.5px solid #16a34a' : '1.5px solid #e5e5e5', background: totalItems > 0 ? '#16a34a' : 'white', flexShrink: 0 }}>
              <ShoppingBag size={15} color={totalItems > 0 ? 'white' : '#555'} />
              {totalItems > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: '50%', background: '#15803d', border: '1.5px solid white', color: 'white', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
                  {totalItems}
                </span>
              )}
            </NavLink>
          )}
        </>
      ) : (
        /* ── HOME / DEFAULT HEADER ── */
        <>
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" style={{ textDecoration: 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🌿</div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', letterSpacing: -0.2 }}>FreshBasket</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <NavLink to="/search" title="Search"
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:bg-gray-100"
                  style={{ border: '1px solid #e5e5e5' }}>
                  <Search size={15} color="#555" />
                </NavLink>
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
                <NavLink to="/cart" title="Cart"
                  className="relative w-8 h-8 rounded-md flex items-center justify-center transition-all hover:bg-gray-100"
                  style={{ border: totalItems > 0 ? '1px solid #16a34a' : '1px solid #e5e5e5', background: totalItems > 0 ? '#16a34a' : 'white' }}>
                  <ShoppingBag size={15} color={totalItems > 0 ? 'white' : '#555'} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center px-0.5"
                      style={{ background: '#15803d', border: '1.5px solid white', fontSize: 8 }}>
                      {totalItems}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all hover:bg-gray-50 ml-1"
                  style={{ border: '1px solid #e5e5e5', color: '#0a0a0a' }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: '#16a34a' }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden md:block" style={{ fontSize: 12 }}>{user.name?.split(' ')[0]}</span>
                </NavLink>
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
