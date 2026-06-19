import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Tag, ChevronRight, Bike } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const FREE_DELIVERY = 199;
const DELIVERY_FEE  = 20;
const MIN_ORDER    = 99;

export default function Cart() {
  const { cart, updateQty, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupon, setCoupon]             = useState('');
  const [discount, setDiscount]         = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponErr, setCouponErr]       = useState('');
  const [coupons, setCoupons]           = useState([]);
  const [showCoupons, setShowCoupons]   = useState(false);

  const deliveryFee = subtotal >= FREE_DELIVERY ? 0 : DELIVERY_FEE;
  const grandTotal  = subtotal + deliveryFee - discount;
  const progress    = Math.min((subtotal / FREE_DELIVERY) * 100, 100);

  useEffect(() => {
    api.get('/promo/active').then(({ data }) => setCoupons(data)).catch(() => {});
  }, []);

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
      toast.success(`Saved ₹${data.discount}!`);
    } catch (e) {
      setCouponErr(e.response?.data?.message || 'Invalid coupon');
    }
  };

  const removeCoupon = () => { setCoupon(''); setDiscount(0); setCouponApplied(false); setCouponErr(''); };

  if (cart.length === 0) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <ShoppingBag size={36} color="var(--green)" />
      </div>
      <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', margin: '0 0 6px' }}>Your cart is empty</p>
      <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 24px' }}>Add some fresh items to get started</p>
      <Link to="/" className="btn btn-primary btn-full" style={{ maxWidth: 200, borderRadius: 'var(--radius)' }}>Browse Products</Link>
    </div>
  );

  return (
    <div className="page pb-nav">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <p className="page-header-sub">Your Order</p>
            <h1 className="page-header-title">Cart · {cart.length} items</h1>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 16, paddingBottom: 100 }}>

        {/* Free delivery progress */}
        {deliveryFee > 0 && (
          <div className="card animate-fade-up" style={{ padding: 14, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bike size={15} color="var(--green)" />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>
                Add <strong style={{ color: 'var(--green)' }}>₹{FREE_DELIVERY - subtotal}</strong> more for FREE delivery
              </p>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--green-light)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'var(--green)', width: `${progress}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="card animate-fade-up" style={{ marginBottom: 12, overflow: 'hidden' }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-3)', padding: '14px 16px 10px', textTransform: 'uppercase' }}>Items</p>
          {cart.map((item, idx) => (
            <div key={item._id}>
              {idx > 0 && <div className="divider" style={{ marginLeft: 16 }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <img
                  src={item.image || `https://placehold.co/56x56/E8F5E9/2E7D32?text=${encodeURIComponent(item.name)}`}
                  alt={item.name}
                  style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: 'var(--green-light)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)', margin: 0 }}>₹{item.price}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)' }}>/{item.unit || 'kg'}</span></p>
                </div>
                {/* Qty stepper */}
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--green)', flexShrink: 0 }}>
                  <button onClick={() => updateQty(item._id, item.qty - 1)}
                    style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
                    {item.qty === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                  </button>
                  <span style={{ width: 26, textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item._id, item.qty + 1)}
                    style={{ width: 32, height: 32, background: 'var(--green)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Plus size={12} />
                  </button>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, minWidth: 48, textAlign: 'right' }}>₹{item.price * item.qty}</span>
              </div>
            </div>
          ))}
          <div className="divider" />
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', fontSize: 13, fontWeight: 800, color: 'var(--green)', textDecoration: 'none' }}>
            <Plus size={14} /> Add more items
          </Link>
        </div>

        {/* Coupon */}
        <div className="card animate-fade-up" style={{ padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>Apply Coupon</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={coupon}
              onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponErr(''); }}
              disabled={couponApplied}
              placeholder="Enter coupon code"
              style={{ flex: 1, letterSpacing: 1 }}
            />
            <button className="btn btn-primary" onClick={couponApplied ? removeCoupon : () => applyCoupon()}
              style={{ flexShrink: 0, background: couponApplied ? '#888' : 'var(--green)', borderRadius: 'var(--radius-sm)', padding: '0 16px', fontSize: 13 }}>
              {couponApplied ? 'Remove' : 'Apply'}
            </button>
          </div>
          {couponApplied && <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 8, fontWeight: 600 }}>✅ Saved ₹{discount}</p>}
          {couponErr    && <p style={{ fontSize: 12, color: 'var(--red)',   marginTop: 8, fontWeight: 600 }}>⚠️ {couponErr}</p>}
          {!couponApplied && (
            <button onClick={() => setShowCoupons(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
              <Tag size={13} /> View all offers <ChevronRight size={13} style={{ marginLeft: 'auto' }} />
            </button>
          )}
          {showCoupons && coupons.map(c => (
            <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, marginTop: 8, borderTop: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <span style={{ background: 'var(--green-light)', border: '1.5px dashed var(--green)', color: 'var(--green)', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>{c.code}</span>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                  {c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                  {c.minOrderAmount > 0 ? ` · Min ₹${c.minOrderAmount}` : ''}
                </p>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => applyCoupon(c.code)}>Apply</button>
            </div>
          ))}
        </div>

        {/* Bill */}
        <div className="card animate-fade-up" style={{ padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>Bill Details</p>
          {[
            { label: 'Item Total', value: `₹${subtotal}`, color: 'var(--text)' },
            { label: 'Delivery Fee', value: deliveryFee === 0 ? 'FREE 🎉' : `₹${deliveryFee}`, color: deliveryFee === 0 ? 'var(--green)' : 'var(--text)' },
            ...(discount > 0 ? [{ label: 'Coupon Discount', value: `−₹${discount}`, color: 'var(--green)' }] : []),
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: 'var(--text-2)' }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: r.color }}>{r.value}</span>
            </div>
          ))}
          <div className="divider" style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900 }}>
            <span>Total</span>
            <span style={{ color: 'var(--green)' }}>₹{grandTotal}</span>
          </div>
        </div>
      </div>

      {/* Sticky checkout */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="container" style={{ padding: 0 }}>
          {subtotal < MIN_ORDER && (
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#e53935', margin: '0 0 8px' }}>
              Minimum order value is ₹{MIN_ORDER}
            </p>
          )}
          <button
            className="btn btn-primary btn-full"
            onClick={() => { if (subtotal < MIN_ORDER) return; if (!user) return navigate('/login'); navigate('/checkout'); }}
            style={{ background: subtotal < MIN_ORDER ? '#aaa' : 'linear-gradient(90deg, var(--green), var(--green-dark))', borderRadius: 'var(--radius)', justifyContent: 'space-between', cursor: subtotal < MIN_ORDER ? 'not-allowed' : 'pointer', pointerEvents: 'all' }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 700, letterSpacing: 0.5 }}>{cart.length} ITEMS</div>
              <div style={{ fontSize: 15, fontWeight: 900 }}>₹{grandTotal}</div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800 }}>Place Order →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
