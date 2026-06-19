import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Package, MapPin, Wallet, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { to: '/orders',        Icon: Package, label: 'My Orders',      sub: 'Track your orders',      color: '#1565C0', bg: '#E3F2FD' },
  { to: '/wallet',        Icon: Wallet,  label: 'My Wallet',       sub: 'Balance & transactions', color: '#2E7D32', bg: '#E8F5E9' },
  { to: '/addresses',     Icon: MapPin,  label: 'Saved Addresses', sub: 'Manage delivery spots',  color: '#E65100', bg: '#FFF3E0' },
  { to: '/notifications', Icon: Bell,    label: 'Notifications',   sub: 'Updates & offers',       color: '#6A1B9A', bg: '#F3E5F5' },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return (
    <div className="page pb-nav animate-fade-up">
      <div style={{ background: 'var(--green-dark)', padding: '40px 20px 60px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>👤</div>
        <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, margin: '0 0 6px' }}>Welcome!</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Sign in to access your profile</p>
      </div>
      <div className="container" style={{ marginTop: -24 }}>
        <Link to="/login" className="btn btn-primary btn-full"
          style={{ background: 'linear-gradient(90deg,var(--green),var(--green-dark))', borderRadius: 'var(--radius)', textDecoration: 'none', boxShadow: 'var(--shadow-lg)' }}>
          Sign In to Continue →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="page pb-nav animate-fade-up">

      {/* Header */}
      <div style={{ background: 'var(--green-dark)', padding: '32px 20px 56px', borderRadius: '0 0 28px 28px' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg,#4CAF50,var(--green-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: 'white', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, margin: '0 0 3px' }}>{user.name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 6px' }}>{user.email || user.phone}</p>
            <span style={{ background: 'rgba(76,175,80,0.25)', color: '#A5D6A7', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>✓ Verified Member</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: -28 }}>

        {/* Menu */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
          {MENU.map(({ to, Icon, label, sub, color, bg }, i) => (
            <Link key={to} to={to}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textDecoration: 'none', borderBottom: i < MENU.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{sub}</p>
              </div>
              <ChevronRight size={16} color="var(--text-3)" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 'var(--radius)', border: '2px solid #FFCDD2', background: '#FFEBEE', color: '#C62828', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          <LogOut size={16} /> Sign Out
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 16 }}>FreshBasket v1.0 · Made with 🌿</p>
      </div>
    </div>
  );
}
