import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Tag, ChevronRight, Bike, MapPin, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth, useLoginModal } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const FREE_DELIVERY = 199;
const DELIVERY_FEE  = 20;
const MIN_ORDER     = 99;
const TYPE_EMOJI    = { home: '🏠', work: '💼', other: '📍' };

export default function CartDrawer() {
  const { cart, updateQty, subtotal, clearCart, cartOpen, setCartOpen } = useCart();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();
  const navigate = useNavigate();

  const [coupon, setCoupon]               = useState('');
  const [discount, setDiscount]           = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponErr, setCouponErr]         = useState('');
  const [coupons, setCoupons]             = useState([]);
  const [couponDrawer, setCouponDrawer] = useState(false);
  const [showCoupons, setShowCoupons]     = useState(false);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr]     = useState(null);
  const [showAllAddrs, setShowAllAddrs]     = useState(false);
  const [showNewForm, setShowNewForm]       = useState(false);
  const [newAddr, setNewAddr]               = useState({ street: '', landmark: '', city: '', pincode: '' });
  const [instructions, setInstructions]     = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet]         = useState(false);
  const [placing, setPlacing]               = useState(false);

  const deliveryFee = subtotal >= FREE_DELIVERY ? 0 : DELIVERY_FEE;
  const grandTotal  = subtotal + deliveryFee - discount;
  const progress    = Math.min((subtotal / FREE_DELIVERY) * 100, 100);
  const walletApplied  = useWallet ? Math.min(walletBalance, grandTotal) : 0;
  const finalTotal     = grandTotal - walletApplied;

  useEffect(() => {
    api.get('/promo/active').then(({ data }) => setCoupons(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/wallet').then(({ data }) => setWalletBalance(data?.balance || 0)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api.get('/addresses').then(({ data }) => {
      setSavedAddresses(data);
      const def = data.find(a => a.isDefault) || data[0];
      if (def) setSelectedAddr(def);
    }).catch(() => {});
  }, [user]);

  // close on ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setCartOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCartOpen]);

  // lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen]);

  const applyCoupon = async (code) => {
    const c = (code || coupon).trim();
    if (!c) return;
    try {
      const { data } = await api.post('/promo/validate', { code: c, orderAmount: subtotal });
      setDiscount(data.discount || 0);
      setCouponApplied(true);
      setCouponErr('');
      setCoupon(c);
      setShowCoupons(false);
      setCouponDrawer(false);
      toast.success(`Saved ₹${data.discount}!`);
    } catch (e) {
      setCouponErr(e.response?.data?.message || 'Invalid coupon');
    }
  };

  const removeCoupon = () => { setCoupon(''); setDiscount(0); setCouponApplied(false); setCouponErr(''); };

  const handlePlaceOrder = async () => {
    if (!user) { setCartOpen(false); openLogin(); return; }
    const addr = showNewForm ? newAddr : selectedAddr ? { street: selectedAddr.address, landmark: selectedAddr.landmark, city: selectedAddr.city, pincode: selectedAddr.pincode } : null;
    if (!addr?.street || !addr?.city || !addr?.pincode) return toast.error('Select or enter a delivery address');
    setPlacing(true);
    try {
      const { data: order } = await api.post('/orders', {
        orderType: 'delivery',
        items: cart.map(i => ({ product: i._id, name: i.name, image: i.image, quantity: i.qty, price: i.price })),
        pricing: { subtotal, tax: 0, deliveryFee, discount, total: grandTotal },
        payment: { method: useWallet && walletApplied >= grandTotal ? 'wallet' : useWallet ? 'wallet+cash' : 'cash', walletAmount: walletApplied },
        delivery: { address: addr, instructions },
      });
      clearCart();
      setCartOpen(false);
      toast.success('Order placed! 🎉');
      navigate(`/orders/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setCartOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 200,
          opacity: cartOpen ? 1 : 0, pointerEvents: cartOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 440,
        background: 'var(--bg)', zIndex: 201, display: 'flex', flexDirection: 'column',
        transform: cartOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'white' }}>
          <ShoppingBag size={18} color="var(--green)" />
          <p style={{ fontWeight: 900, fontSize: 16, margin: 0, flex: 1 }}>
            Cart {cart.length > 0 && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>· {cart.length} item{cart.length !== 1 ? 's' : ''}</span>}
          </p>
          <button onClick={() => setCartOpen(false)}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        {/* Empty state */}
        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <ShoppingBag size={32} color="var(--green)" />
            </div>
            <p style={{ fontWeight: 800, fontSize: 17, margin: '0 0 6px' }}>Your cart is empty</p>
            <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 24px' }}>Add some fresh items to get started</p>
            <button onClick={() => setCartOpen(false)} className="btn btn-primary" style={{ borderRadius: 'var(--radius)', padding: '10px 28px' }}>Browse Products</button>
          </div>
        ) : (
          /* Scrollable body */
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>

            {/* Free delivery bar */}
            <div className="card" style={{ padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bike size={14} color="var(--green)" />
                  </div>
                  <div>
                    {deliveryFee === 0
                      ? <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)', margin: 0 }}>🎉 Free delivery unlocked!</p>
                      : <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Add <span style={{ color: 'var(--green)', fontWeight: 900 }}>₹{FREE_DELIVERY - subtotal}</span> for free delivery</p>
                    }
                    <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '1px 0 0' }}>Free on orders above ₹{FREE_DELIVERY}</p>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: deliveryFee === 0 ? 'var(--green)' : 'var(--text-3)' }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 8, background: 'var(--green-light)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,var(--green),var(--green-dark))', width: `${progress}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Items */}
            <div className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-3)', padding: '12px 14px 8px', textTransform: 'uppercase' }}>Items</p>
              {cart.map((item, idx) => (
                <div key={item._id}>
                  {idx > 0 && <div className="divider" style={{ marginLeft: 14 }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                    <img
                      src={item.image || `https://placehold.co/48x48/E8F5E9/2E7D32?text=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      style={{ width: 46, height: 46, borderRadius: 9, objectFit: 'cover', flexShrink: 0, background: 'var(--green-light)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)', margin: 0 }}>₹{item.price}<span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-3)' }}>/{item.unit || 'kg'}</span></p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', borderRadius: 9, overflow: 'hidden', border: '1.5px solid var(--green)', flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.cartKey || item._id, item.qty - 1)}
                        style={{ width: 30, height: 30, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
                        {item.qty === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                      </button>
                      <span style={{ width: 24, textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--green)' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.cartKey || item._id, item.qty + 1)}
                        style={{ width: 30, height: 30, background: 'var(--green)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Plus size={11} />
                      </button>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 44, textAlign: 'right' }}>₹{item.price * item.qty}</span>
                  </div>
                </div>
              ))}
              <div className="divider" />
              <button onClick={() => setCartOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', fontSize: 12, fontWeight: 800, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Plus size={13} /> Add more items
              </button>
            </div>

            {/* Coupon */}
            <div className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
              {couponApplied ? (
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Tag size={14} color="var(--green)" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{coupon}</p>
                    <p style={{ fontSize: 11, color: 'var(--green)', margin: '2px 0 0' }}>Saving ₹{discount}</p>
                  </div>
                  <button onClick={removeCoupon} style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
              ) : (
                <button onClick={() => setCouponDrawer(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Tag size={14} color="var(--green)" />
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>Apply Coupon</span>
                  <ChevronRight size={14} color="var(--text-3)" />
                </button>
              )}
            </div>

            {/* Delivery Address */}
            <div className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px', borderBottom: '1px solid var(--border)' }}>
                <MapPin size={14} color="var(--green)" />
                <p style={{ fontWeight: 800, fontSize: 14, margin: 0, flex: 1 }}>Deliver To</p>
                <Link to="/addresses" onClick={() => setCartOpen(false)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>+ Add New</Link>
              </div>

              {savedAddresses.length === 0 && (
                <Link to="/addresses" onClick={() => setCartOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--green)', textDecoration: 'none' }}>
                  <Plus size={13} /> Add a delivery address
                </Link>
              )}

              {savedAddresses.length > 0 && (
                <>
                  {selectedAddr && !showNewForm && (
                    <div style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {TYPE_EMOJI[selectedAddr.type] || '📍'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 800, fontSize: 13, margin: '0 0 2px', textTransform: 'capitalize' }}>{selectedAddr.type}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 1px' }}>{selectedAddr.address}{selectedAddr.landmark ? `, ${selectedAddr.landmark}` : ''}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{selectedAddr.city} — {selectedAddr.pincode}</p>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={11} color="white" strokeWidth={3} />
                      </div>
                    </div>
                  )}

                  {!showNewForm && savedAddresses.length > 1 && (
                    <button onClick={() => setShowAllAddrs(v => !v)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'var(--bg)', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>
                      <span>{showAllAddrs ? 'Hide addresses' : 'Change address'}</span>
                      <ChevronRight size={13} style={{ transform: showAllAddrs ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                    </button>
                  )}

                  {showAllAddrs && !showNewForm && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {savedAddresses.filter(a => a._id !== selectedAddr?._id).map(addr => (
                        <button key={addr._id} onClick={() => { setSelectedAddr(addr); setShowAllAddrs(false); }}
                          style={{ width: '100%', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                            {TYPE_EMOJI[addr.type] || '📍'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: 12, margin: '0 0 2px', textTransform: 'capitalize' }}>{addr.type}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{addr.address}, {addr.city}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button onClick={() => { setShowNewForm(v => !v); setShowAllAddrs(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: showNewForm ? 'var(--red)' : 'var(--green)' }}>
                    <Plus size={13} />
                    {showNewForm ? 'Cancel' : 'Enter a different address'}
                  </button>

                  {showNewForm && (
                    <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[['street','Street / House No','e.g. 12B, MG Road',true],['landmark','Landmark','e.g. Near Metro',false],['city','City','e.g. Mumbai',true],['pincode','Pincode','e.g. 400001',true]].map(([name, label, ph, req]) => (
                        <div key={name}>
                          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                            {label}{req && <span style={{ color: 'var(--red)' }}> *</span>}
                          </label>
                          <input className="input" placeholder={ph} value={newAddr[name]} onChange={e => setNewAddr(f => ({ ...f, [name]: e.target.value }))} style={{ fontSize: 13 }} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Delivery Instructions</label>
                <input className="input" placeholder="e.g. Leave at door, call on arrival" value={instructions} onChange={e => setInstructions(e.target.value)} style={{ fontSize: 13 }} />
              </div>
            </div>

            {/* Payment */}
            <div className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-3)', padding: '12px 14px 10px', textTransform: 'uppercase' }}>Payment</p>

              {/* Wallet option — only if logged in and has balance */}
              {user && walletBalance > 0 && (
                <button onClick={() => setUseWallet(v => !v)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: useWallet ? 'var(--green)' : 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                    <span style={{ fontSize: 16 }}>👛</span>
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Use Wallet Balance</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
                      ₹{walletBalance} available
                      {useWallet && <span style={{ color: 'var(--green)', fontWeight: 700 }}> · ₹{walletApplied} will be used</span>}
                    </p>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: useWallet ? 'var(--green)' : 'var(--border)', background: useWallet ? 'var(--green)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {useWallet && <Check size={11} color="white" strokeWidth={3} />}
                  </div>
                </button>
              )}

              {/* COD — always shown, label changes if wallet covers full amount */}
              {(!useWallet || walletApplied < grandTotal) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff8e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>💵</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Pay on Delivery</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
                      {useWallet && walletApplied > 0 ? `Pay ₹${finalTotal} at door` : 'Pay when your order arrives'}
                    </p>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="white" strokeWidth={3} />
                  </div>
                </div>
              )}

              {/* Wallet covers full amount */}
              {useWallet && walletApplied >= grandTotal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4' }}>
                  <Check size={13} color="var(--green)" />
                  <p style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, margin: 0 }}>Full amount covered by wallet — no cash needed!</p>
                </div>
              )}
            </div>

            {/* Bill */}
            <div className="card" style={{ padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 10 }}>Bill Details</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-2)' }}>Item Total</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-2)' }}>Delivery Fee</span>
                <span style={{ fontWeight: 700 }}>
                  {deliveryFee === 0 ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ textDecoration: 'line-through', color: '#bbb', fontWeight: 500 }}>₹{DELIVERY_FEE}</span>
                      <span style={{ color: 'var(--green)', fontWeight: 800 }}>Free</span>
                    </span>
                  ) : `₹${deliveryFee}`}
                </span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-2)' }}>Coupon Discount</span>
                  <span style={{ fontWeight: 700, color: 'var(--green)' }}>−₹{discount}</span>
                </div>
              )}
              {walletApplied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-2)' }}>Wallet</span>
                  <span style={{ fontWeight: 700, color: 'var(--green)' }}>−₹{walletApplied}</span>
                </div>
              )}
              <div className="divider" style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: -0.3, fontWeight: 700 }}>To Pay</span>
                <span style={{ color: '#0a0a0a', fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: -0.3, fontWeight: 700 }}>₹{finalTotal}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sticky footer */}
        {cart.length > 0 && (
          <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)', background: 'white', flexShrink: 0 }}>
            {subtotal < MIN_ORDER && (
              <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#e53935', margin: '0 0 8px' }}>
                Minimum order value is ₹{MIN_ORDER}
              </p>
            )}
            <button
              className="btn btn-primary btn-full"
              onClick={user ? handlePlaceOrder : () => { setCartOpen(false); openLogin(); }}
              disabled={placing || (user && subtotal < MIN_ORDER)}
              style={{ background: (placing || (user && subtotal < MIN_ORDER)) ? '#aaa' : 'linear-gradient(90deg,var(--green),var(--green-dark))', borderRadius: 'var(--radius)', justifyContent: 'space-between', cursor: (user && subtotal < MIN_ORDER) ? 'not-allowed' : 'pointer' }}
            >
              <span style={{ fontSize: 14, fontWeight: 800 }}>{placing ? 'Placing Order…' : user ? 'Place Order' : 'Login to Checkout'}</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '4px 12px', fontSize: 14, fontWeight: 800 }}>₹{finalTotal} →</span>
            </button>
          </div>
        )}
      </div>
      {/* Coupon Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 440,
        background: 'white', zIndex: 202, display: 'flex', flexDirection: 'column',
        transform: couponDrawer ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={() => setCouponDrawer(false)}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={15} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0, flex: 1 }}>Apply Coupon</p>
          <button onClick={() => setCouponDrawer(false)}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={coupon}
              onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponErr(''); }}
              placeholder="Enter coupon code"
              style={{ flex: 1, letterSpacing: 1, fontSize: 13 }}
              autoFocus
            />
            <button className="btn btn-primary" onClick={() => applyCoupon()}
              style={{ flexShrink: 0, background: 'var(--green)', borderRadius: 'var(--radius-sm)', padding: '0 16px', fontSize: 13 }}>
              Apply
            </button>
          </div>
          {couponErr && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}>⚠️ {couponErr}</p>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>Available Offers</p>
          {coupons.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', marginTop: 40 }}>No offers available right now</p>
          ) : coupons.map(c => (
            <div key={c._id} className="card" style={{ padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={{ background: 'var(--green-light)', border: '1.5px dashed var(--green)', color: 'var(--green)', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, display: 'inline-block', marginBottom: 5 }}>{c.code}</span>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>
                  {c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
                  {c.minOrderAmount > 0 ? `Min order ₹${c.minOrderAmount}` : 'No minimum order'}
                </p>
              </div>
              <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 12, flexShrink: 0 }} onClick={() => applyCoupon(c.code)}>Apply</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
