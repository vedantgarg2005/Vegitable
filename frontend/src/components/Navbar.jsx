import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Package, User, Bell, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user } = useAuth();
  const { cart } = useCart();
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const navItem = (to, Icon, label, badge) => (
    <NavLink to={to} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
      {({ isActive }) => (
        <>
          <div style={{ position: 'relative' }}>
            <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
            {badge > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -7, background: '#0a0a0a', color: 'white', borderRadius: '50%', width: 15, height: 15, fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>
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
      <nav className="hidden sm:flex items-center justify-between px-6 py-3 sticky top-0 z-50"
        style={{ background: 'white', borderBottom: '1px solid #e5e5e5' }}>
        <Link to="/" className="flex items-center gap-2 flex-shrink-0" style={{ textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🌿</div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', letterSpacing: -0.2 }}>FreshBasket</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
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
                style={{ border: totalItems > 0 ? '1px solid #0a0a0a' : '1px solid #e5e5e5', background: totalItems > 0 ? '#0a0a0a' : 'white' }}>
                <ShoppingBag size={15} color={totalItems > 0 ? 'white' : '#555'} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center px-0.5"
                    style={{ background: '#555', border: '1.5px solid white', fontSize: 8 }}>
                    {totalItems}
                  </span>
                )}
              </NavLink>
              <NavLink to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all hover:bg-gray-50 ml-1"
                style={{ border: '1px solid #e5e5e5', color: '#0a0a0a' }}>
                <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: '#0a0a0a' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="hidden md:block" style={{ fontSize: 12 }}>{user.name?.split(' ')[0]}</span>
              </NavLink>
            </>
          ) : (
            <Link to="/login"
              className="px-4 py-1.5 rounded-md text-sm font-bold transition-all hover:bg-gray-50"
              style={{ border: '1px solid #e5e5e5', color: '#0a0a0a', textDecoration: 'none', fontSize: 12 }}>
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
