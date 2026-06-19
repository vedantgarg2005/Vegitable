import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Package, User, Bell, Wallet, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const navItem = (to, Icon, label, badge) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `bottom-nav-item${isActive ? ' active' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <div style={{ position: 'relative' }}>
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            {badge > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -8,
                background: '#4CAF50', color: 'white', borderRadius: '50%',
                width: 16, height: 16, fontSize: 9, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(76,175,80,0.5)',
              }}>{badge}</span>
            )}
          </div>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <>
      {/* ── DESKTOP TOP NAV ── */}
      <nav
        className="hidden sm:flex items-center justify-between px-6 py-3 sticky top-0 z-50"
        style={{ background: '#1B3A1F', boxShadow: '0 2px 24px rgba(0,0,0,0.22)' }}
      >
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">🌿</span>
          <span className="text-lg font-black text-white tracking-tight">FreshBasket</span>
        </Link>

        <button
          onClick={() => navigate('/')}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl text-sm transition-all hover:bg-white/10 mx-6 flex-1 max-w-xs"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
        >
          <Search size={14} />
          <span>Search vegetables, fruits…</span>
        </button>

        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <NavLink to="/notifications" title="Notifications"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Bell size={17} color="white" />
              </NavLink>
              <NavLink to="/wallet" title="Wallet"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Wallet size={17} color="white" />
              </NavLink>
              <NavLink to="/cart" title="Cart"
                className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <ShoppingBag size={17} color="white" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-black flex items-center justify-center px-0.5 shadow-md"
                    style={{ background: '#4CAF50' }}>
                    {totalItems}
                  </span>
                )}
              </NavLink>
              <NavLink to="/profile"
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-sm font-bold transition-all hover:bg-white/20 ml-1"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#4CAF50,#2E7D32)' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="hidden md:block">{user.name?.split(' ')[0]}</span>
              </NavLink>
            </>
          ) : (
            <Link to="/login"
              className="px-5 py-1.5 rounded-full text-sm font-bold transition-all hover:bg-gray-100 hover:shadow-sm"
              style={{ background: 'white', color: '#1B3A1F' }}>
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="sm:hidden bottom-nav">
        {navItem('/', Home, 'Home')}
        {navItem('/orders', Package, 'Orders')}
        {navItem('/cart', ShoppingBag, 'Cart', totalItems)}
        {navItem('/profile', User, 'Profile')}
      </nav>
    </>
  );
}
