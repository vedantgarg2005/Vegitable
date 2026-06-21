import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Package, MapPin, Wallet, Bell } from 'lucide-react';
import { useAuth, useLoginModal } from '../context/AuthContext';

const MENU = [
  { to: '/orders',        Icon: Package, label: 'My Orders',       sub: 'Track & view past orders',   color: '#1565C0', bg: '#E3F2FD' },
  { to: '/wallet',        Icon: Wallet,  label: 'My Wallet',        sub: 'Balance & transactions',     color: '#2E7D32', bg: '#E8F5E9' },
  { to: '/addresses',     Icon: MapPin,  label: 'Saved Addresses',  sub: 'Manage delivery locations',  color: '#E65100', bg: '#FFF3E0' },
  { to: '/notifications', Icon: Bell,    label: 'Notifications',    sub: 'Updates & offers',           color: '#6A1B9A', bg: '#F3E5F5' },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { openLogin } = useLoginModal();
  const navigate = useNavigate();

  /* ── NOT LOGGED IN ── */
  if (!user) return (
    <div className="page pb-nav" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', gap: 0 }}>
      <div style={{ width: 88, height: 88, borderRadius: 28, background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 20 }}>👤</div>
      <p style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', margin: '0 0 8px' }}>You're not signed in</p>
      <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 28px', textAlign: 'center', lineHeight: 1.6 }}>Sign in to view your orders,<br/>wallet, and saved addresses.</p>
      <button onClick={openLogin}
        style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(22,163,74,0.3)' }}>
        Sign In / Sign Up
      </button>
    </div>
  );

  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="page pb-nav" style={{ background: 'var(--bg)' }}>
      <div className="container" style={{ paddingTop: 20, position: 'relative', zIndex: 10 }}>

        {/* User info card */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#4ade80,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: 'white', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 900, fontSize: 16, margin: '0 0 3px', color: 'var(--text)' }}>{user.name}</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>+91 {user.phone}</p>
          </div>
        </div>

        {/* ── MENU ── */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 16px 10px', margin: 0, borderBottom: '1px solid var(--border)' }}>Account</p>
          {MENU.map(({ to, Icon, label, sub, color, bg }, i) => (
            <Link key={to} to={to} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textDecoration: 'none', borderBottom: i < MENU.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={19} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{sub}</p>
              </div>
              <ChevronRight size={16} color="#ccc" />
            </Link>
          ))}
        </div>

        {/* ── APP INFO ── */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 16px 10px', margin: 0, borderBottom: '1px solid var(--border)' }}>App</p>
          {[
            { label: 'Terms of Service', value: null },
            { label: 'Privacy Policy', value: null },
          ].map(({ label, value }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{label}</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, fontWeight: 500 }}>{value || <ChevronRight size={15} color="#ccc" />}</p>
            </div>
          ))}
        </div>

        {/* ── SIGN OUT ── */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, border: '1.5px solid #fecaca', background: '#fff5f5', color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}>
          <LogOut size={16} /> Sign Out
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', margin: '16px 0 0' }}>FreshBasket · Made with 🌿</p>
      </div>
    </div>
  );
}
