import { Link, useNavigate } from 'react-router-dom';
import { X, ChevronRight, LogOut, Package, MapPin, Wallet, Bell, Star, Trash2, ArrowLeft, Plus, Clock, ArrowDownLeft, ArrowUpRight, HelpCircle, PackagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth, useLoginModal } from '../context/AuthContext';
import api from '../services/api';

const TYPE_EMOJI = { home: '🏠', work: '💼', other: '📍' };

const ORDER_STATUS = {
  placed:           { bg: '#FFF8E1', color: '#F57F17', label: 'Placed' },
  confirmed:        { bg: '#E3F2FD', color: '#1565C0', label: 'Confirmed' },
  processing:       { bg: '#F3E5F5', color: '#6A1B9A', label: 'Processing' },
  packed:           { bg: '#EDE7F6', color: '#4527A0', label: 'Packed' },
  out_for_delivery: { bg: '#FFF3E0', color: '#E65100', label: 'Out for Delivery' },
  delivered:        { bg: '#E8F5E9', color: '#2E7D32', label: 'Delivered ✓' },
  cancelled:        { bg: '#FFEBEE', color: '#C62828', label: 'Cancelled' },
};

const MENU = [
  { to: '/notifications', Icon: Bell, label: 'Notifications', sub: 'Updates & offers', color: '#6A1B9A', bg: '#F3E5F5' },
];

export default function ProfileDrawer() {
  const { user, logout } = useAuth();
  const { openLogin, profileOpen, setProfileOpen } = useLoginModal();
  const navigate = useNavigate();
  const [view, setView] = useState('main'); // 'main' | 'addresses' | 'orders'
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const close = () => { setProfileOpen(false); setView('main'); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = profileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [profileOpen]);

  // reset view when drawer closes
  useEffect(() => { if (!profileOpen) setView('main'); }, [profileOpen]);

  const openWallet = async () => {
    setView('wallet');
    if (!wallet) {
      setWalletLoading(true);
      try { const { data } = await api.get('/wallet'); setWallet(data); } catch {}
      finally { setWalletLoading(false); }
    }
  };

  const openOrders = async () => {
    setView('orders');
    if (orders.length === 0) {
      setOrdersLoading(true);
      try { const { data } = await api.get('/orders/my-orders'); setOrders(data); } catch {}
      finally { setOrdersLoading(false); }
    }
  };

  const openAddresses = async () => {
    setView('addresses');
    if (addresses.length === 0) {
      setAddrLoading(true);
      try { const { data } = await api.get('/addresses'); setAddresses(data); } catch {}
      finally { setAddrLoading(false); }
    }
  };

  const deleteAddress = async (id) => {
    try {
      const { data } = await api.delete(`/addresses/${id}`);
      setAddresses(data);
    } catch {}
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <>
      {/* Overlay */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 200,
          opacity: profileOpen ? 1 : 0, pointerEvents: profileOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer shell */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 380,
        zIndex: 201, overflow: 'hidden',
        transform: profileOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
      }}>

        {/* ── MAIN VIEW ── */}
        <div style={{
          position: 'absolute', inset: 0, background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
          transform: view === 'main' ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'white' }}>
            <p style={{ fontWeight: 900, fontSize: 16, margin: 0, flex: 1 }}>Account</p>
            <button onClick={close} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {!user ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 16 }}>👤</div>
                <p style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', margin: '0 0 8px' }}>You're not signed in</p>
                <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>Sign in to view your orders,<br />wallet, and saved addresses.</p>
                <button onClick={() => { close(); openLogin(); }} style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(22,163,74,0.3)' }}>
                  Sign In / Sign Up
                </button>
              </div>
            ) : (
              <>
                {/* User card */}
                <div className="card" style={{ padding: '16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#4ade80,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: 'white', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 900, fontSize: 16, margin: '0 0 3px', color: 'var(--text)' }}>{user.name}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>+91 {user.phone}</p>
                  </div>
                </div>

                {/* Menu */}
                <div className="card" style={{ overflow: 'hidden', marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px 8px', margin: 0, borderBottom: '1px solid var(--border)' }}>Account</p>

                  {MENU.map(({ to, Icon, label, sub, color, bg }) => (
                    <Link key={to} to={to} onClick={close}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', textDecoration: 'none', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 42, height: 42, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: '0 0 2px' }}>{label}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{sub}</p>
                      </div>
                      <ChevronRight size={15} color="#ccc" />
                    </Link>
                  ))}

                  {/* My Wallet → opens sub-page */}
                  <div onClick={openWallet}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', cursor: 'pointer', transition: 'background 0.12s', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Wallet size={18} color="#2E7D32" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: '0 0 2px' }}>My Wallet</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Balance & transactions</p>
                    </div>
                    <ChevronRight size={15} color="#ccc" />
                  </div>

                  {/* My Orders → opens sub-page */}
                  <div onClick={openOrders}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', cursor: 'pointer', transition: 'background 0.12s', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={18} color="#1565C0" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: '0 0 2px' }}>My Orders</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Track & view past orders</p>
                    </div>
                    <ChevronRight size={15} color="#ccc" />
                  </div>

                  {/* Saved Addresses → opens sub-page */}
                  <div onClick={openAddresses}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={18} color="#E65100" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: '0 0 2px' }}>Saved Addresses</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Manage delivery locations</p>
                    </div>
                    <ChevronRight size={15} color="#ccc" />
                  </div>
                </div>

                {/* App links */}
                <div className="card" style={{ overflow: 'hidden', marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px 8px', margin: 0, borderBottom: '1px solid var(--border)' }}>App</p>
                  {[
                    { label: 'Help Center', to: '/help', color: '#0284c7', bg: '#f0f9ff', Icon: HelpCircle },
                    { label: 'Request a Product', to: '/request-product', color: '#16a34a', bg: '#f0fdf4', Icon: PackagePlus },
                  ].map(({ label, to, color, bg, Icon }) => (
                    <Link key={to} to={to} onClick={close}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', textDecoration: 'none', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 42, height: 42, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={color} />
                      </div>
                      <p style={{ flex: 1, fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0 }}>{label}</p>
                      <ChevronRight size={15} color="#ccc" />
                    </Link>
                  ))}
                  {['Terms of Service', 'Privacy Policy'].map((label, i) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: i < 1 ? '1px solid var(--border)' : 'none' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{label}</p>
                      <ChevronRight size={14} color="#ccc" />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { logout(); close(); navigate('/'); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, border: '1.5px solid #fecaca', background: '#fff5f5', color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}>
                  <LogOut size={15} /> Sign Out
                </button>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', margin: '14px 0 4px' }}>FreshBasket · Made with 🌿</p>
              </>
            )}
          </div>
        </div>

        {/* ── WALLET SUB-PAGE ── */}
        <div style={{
          position: 'absolute', inset: 0, background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
          transform: view === 'wallet' ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'white' }}>
            <button onClick={() => setView('main')} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={15} />
            </button>
            <p style={{ fontWeight: 900, fontSize: 16, margin: 0, flex: 1 }}>My Wallet</p>
            <Link to="/wallet" onClick={close} style={{ fontSize: 12, fontWeight: 700, color: '#2E7D32', textDecoration: 'none' }}>Open Wallet</Link>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {walletLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 14, background: '#f3f4f6', animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : (
              <>
                {/* Balance card */}
                <div className="card" style={{ padding: 20, marginBottom: 12, background: 'linear-gradient(135deg,#14532d,#16a34a)', border: 'none' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>Available Balance</p>
                  <p style={{ fontSize: 36, fontWeight: 900, color: 'white', margin: '0 0 12px', lineHeight: 1 }}>₹{wallet?.balance ?? 0}</p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowDownLeft size={13} color="#86efac" />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                        In ₹{wallet?.transactions?.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0) || 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowUpRight size={13} color="#fca5a5" />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                        Out ₹{wallet?.transactions?.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0) || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transactions */}
                <div className="card" style={{ overflow: 'hidden' }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px 8px', margin: 0, borderBottom: '1px solid var(--border)' }}>Recent Transactions</p>
                  {!wallet?.transactions?.length ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <p style={{ fontSize: 32, margin: '0 0 8px' }}>💸</p>
                      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>No transactions yet</p>
                    </div>
                  ) : (
                    [...wallet.transactions].reverse().slice(0, 10).map((tx, i, arr) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: tx.type === 'credit' ? '#E8F5E9' : '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {tx.type === 'credit'
                            ? <ArrowDownLeft size={15} color="#2E7D32" />
                            : <ArrowUpRight size={15} color="#C62828" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || 'Transaction'}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <span style={{ fontWeight: 900, fontSize: 13, color: tx.type === 'credit' ? '#2E7D32' : '#C62828', flexShrink: 0 }}>
                          {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── ORDERS SUB-PAGE ── */}
        <div style={{
          position: 'absolute', inset: 0, background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
          transform: view === 'orders' ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'white' }}>
            <button onClick={() => setView('main')} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={15} />
            </button>
            <p style={{ fontWeight: 900, fontSize: 16, margin: 0, flex: 1 }}>My Orders</p>
            <Link to="/orders" onClick={close} style={{ fontSize: 12, fontWeight: 700, color: '#1565C0', textDecoration: 'none' }}>View All</Link>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {ordersLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 80, borderRadius: 14, background: '#f3f4f6', animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <p style={{ fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>No orders yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 20px' }}>Your order history will appear here</p>
                <Link to="/" onClick={close}
                  style={{ display: 'inline-block', background: '#1565C0', color: 'white', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.slice(0, 10).map(order => {
                  const st = ORDER_STATUS[order.status?.current] || { bg: '#F5F5F5', color: '#888', label: order.status?.current };
                  return (
                    <Link key={order._id} to={`/orders/${order._id}`} onClick={close}
                      className="card"
                      style={{ padding: '14px', textDecoration: 'none', display: 'block' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: 13, margin: '0 0 3px', color: 'var(--text)' }}>#{order.orderNumber}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.items?.map(i => i.product?.name || 'Item').join(' · ')}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', background: '#E3F2FD', padding: '2px 8px', borderRadius: 6 }}>
                          {order.payment?.method?.toUpperCase() || 'PAID'}
                        </span>
                        <span style={{ fontWeight: 900, fontSize: 14, color: 'var(--text)' }}>₹{order.pricing?.total}</span>
                      </div>
                    </Link>
                  );
                })}
                {orders.length > 10 && (
                  <Link to="/orders" onClick={close}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 12, border: '1.5px dashed #1565C0', color: '#1565C0', fontWeight: 700, fontSize: 13, textDecoration: 'none', background: '#E3F2FD' }}>
                    View All Orders
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── ADDRESSES SUB-PAGE ── */}
        <div style={{
          position: 'absolute', inset: 0, background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
          transform: view === 'addresses' ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'white' }}>
            <button onClick={() => setView('main')} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={15} />
            </button>
            <p style={{ fontWeight: 900, fontSize: 16, margin: 0, flex: 1 }}>Saved Addresses</p>
            <Link to="/addresses" onClick={close} style={{ width: 32, height: 32, borderRadius: 8, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E65100', textDecoration: 'none' }} title="Manage all">
              <Plus size={15} />
            </Link>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {addrLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 14, background: '#f3f4f6', animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
                <p style={{ fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>No saved addresses</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 20px' }}>Add one to speed up checkout</p>
                <Link to="/addresses" onClick={close}
                  style={{ display: 'inline-block', background: '#E65100', color: 'white', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  + Add Address
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {addresses.map(addr => (
                  <div key={addr._id} className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                      {TYPE_EMOJI[addr.type] || '📍'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', textTransform: 'capitalize' }}>{addr.type}</span>
                        {addr.isDefault && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#2E7D32', background: '#E8F5E9', borderRadius: 99, padding: '1px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={8} fill="currentColor" /> Default
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{addr.address}{addr.landmark ? `, ${addr.landmark}` : ''}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>{addr.city} — {addr.pincode}</p>
                    </div>
                    <button onClick={() => deleteAddress(addr._id)}
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#fff5f5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef5350', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <Link to="/addresses" onClick={close}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 12, border: '1.5px dashed #E65100', color: '#E65100', fontWeight: 700, fontSize: 13, textDecoration: 'none', background: '#FFF3E0' }}>
                  <Plus size={14} /> Add New Address
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
