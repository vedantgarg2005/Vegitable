import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useCart } from '../context/CartContext';

const FIELDS = [
  { name: 'street',       label: 'Street / House No',     placeholder: 'e.g. 12B, MG Road',        required: true  },
  { name: 'landmark',     label: 'Landmark',              placeholder: 'e.g. Near Metro Station',   required: false },
  { name: 'city',         label: 'City',                  placeholder: 'e.g. Mumbai',               required: true  },
  { name: 'pincode',      label: 'Pincode',               placeholder: 'e.g. 400001',               required: true  },
  { name: 'instructions', label: 'Delivery Instructions', placeholder: 'e.g. Leave at door',        required: false },
];

const PAYMENT = [
  { value: 'cash', label: 'Cash on Delivery', emoji: '💵' },
  { value: 'upi',  label: 'UPI',              emoji: '📱' },
  { value: 'card', label: 'Card',             emoji: '💳' },
];

export default function Checkout() {
  const { cart, subtotal, clearCart } = useCart();
  const navigate    = useNavigate();
  const deliveryFee = subtotal >= 199 ? 0 : 30;
  const total       = subtotal + deliveryFee;

  const [form, setForm]       = useState({ street: '', landmark: '', city: '', pincode: '', instructions: '', paymentMethod: 'cash' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.street || !form.city || !form.pincode) return toast.error('Fill in the delivery address');
    setLoading(true);
    try {
      await api.post('/orders', {
        orderType: 'delivery',
        items: cart.map(i => ({ product: i._id, name: i.name, image: i.image, quantity: i.qty, price: i.price })),
        pricing: { subtotal, tax: 0, deliveryFee, discount: 0, total },
        payment: { method: form.paymentMethod },
        delivery: {
          address: { street: form.street, landmark: form.landmark, city: form.city, pincode: form.pincode },
          instructions: form.instructions,
        },
      });
      clearCart();
      toast.success('Order placed! 🎉');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page pb-nav animate-fade-up">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <Link to="/cart" className="back-btn"><ArrowLeft size={16} /></Link>
          <div>
            <p className="page-header-sub">Review & Place</p>
            <h1 className="page-header-title">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 16, paddingBottom: 100 }}>

        {/* Delivery Address */}
        <div className="card" style={{ padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={16} color="var(--green)" />
            </div>
            <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>Delivery Address</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FIELDS.map(({ name, label, placeholder, required }) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 }}>
                  {label}{required && <span style={{ color: 'var(--red)' }}> *</span>}
                </label>
                <input name={name} placeholder={placeholder} value={form[name]} onChange={handleChange} className="input" />
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="card" style={{ padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} color="var(--green)" />
            </div>
            <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>Payment Method</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {PAYMENT.map(({ value, label, emoji }) => (
              <label key={value} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${form.paymentMethod === value ? 'var(--green)' : 'var(--border)'}`,
                background: form.paymentMethod === value ? 'var(--green-light)' : 'white',
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="paymentMethod" value={value} checked={form.paymentMethod === value} onChange={handleChange} style={{ display: 'none' }} />
                <span style={{ fontSize: 24 }}>{emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: form.paymentMethod === value ? 'var(--green)' : 'var(--text-2)', textAlign: 'center' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div className="card" style={{ padding: 18 }}>
          <p style={{ fontWeight: 800, fontSize: 15, margin: '0 0 14px' }}>Bill Summary</p>
          {[
            { label: 'Subtotal',     value: `₹${subtotal}` },
            { label: 'Delivery Fee', value: deliveryFee === 0 ? 'Free 🎉' : `₹${deliveryFee}`, green: deliveryFee === 0 },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: 'var(--text-2)' }}>{r.label}</span>
              <span style={{ fontWeight: 600, color: r.green ? 'var(--green)' : 'var(--text)' }}>{r.value}</span>
            </div>
          ))}
          <div className="divider" style={{ margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 900 }}>
            <span>Total</span>
            <span style={{ color: 'var(--green)' }}>₹{total}</span>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="container" style={{ padding: 0 }}>
          <button
            className="btn btn-primary btn-full"
            onClick={handleSubmit}
            disabled={loading}
            style={{ background: loading ? '#ccc' : 'linear-gradient(90deg,var(--green),var(--green-dark))', borderRadius: 'var(--radius)', justifyContent: 'space-between' }}
          >
            <span>{loading ? 'Placing Order…' : 'Place Order'}</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '4px 12px', fontSize: 14, fontWeight: 800 }}>₹{total} →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
