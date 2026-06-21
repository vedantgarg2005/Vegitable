import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, CheckCircle2, Circle, XCircle, Star } from 'lucide-react';
import api from '../services/api';
import { useLoginModal } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'packed', 'out_for_delivery', 'delivered'];
const STATUS_LABEL = {
  placed: 'Order Placed', confirmed: 'Confirmed', processing: 'Processing',
  packed: 'Packed', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};
const STATUS_EMOJI = {
  placed: '📋', confirmed: '✅', processing: '⚙️', packed: '📦', out_for_delivery: '🚚', delivered: '🎉',
};
const STATUS_STYLE = {
  placed:           { bg: '#FFF8E1', color: '#F57F17' },
  confirmed:        { bg: '#E3F2FD', color: '#1565C0' },
  processing:       { bg: '#F3E5F5', color: '#6A1B9A' },
  packed:           { bg: '#EDE7F6', color: '#4527A0' },
  out_for_delivery: { bg: '#FFF3E0', color: '#E65100' },
  delivered:        { bg: '#E8F5E9', color: '#2E7D32' },
  cancelled:        { bg: '#FFEBEE', color: '#C62828' },
};

const CANCELLABLE = ['placed', 'confirmed'];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reviewItem, setReviewItem] = useState(null); // item being reviewed
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedItems, setReviewedItems] = useState(new Set());

  const navigate = useNavigate();
  const { openLogin } = useLoginModal();

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .catch((error) => {
        if (error.response?.status === 401) {
          openLogin();
        } else {
          setOrder(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="min-h-screen" style={{ background: '#F0F7F0' }}>
      <div style={{ background: '#1B3A1F' }} className="h-20"/>
      <div className="max-w-xl mx-auto px-4 pt-4 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse"/>)}
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F0F7F0' }}>
      <p className="text-gray-400 mb-3">Order not found</p>
      <Link to="/orders" className="text-white font-bold px-5 py-2 rounded-full text-sm" style={{ background: '#2E7D32' }}>
        ← Back to Orders
      </Link>
    </div>
  );

  const currentStatus = order.status?.current;
  const isCancelled = currentStatus === 'cancelled';
  const currentStep = STATUS_STEPS.indexOf(currentStatus);
  const st = STATUS_STYLE[currentStatus] || { bg: '#F5F5F5', color: '#666' };

  return (
    <div className="min-h-screen" style={{ background: '#F0F7F0' }}>
      {/* Header */}
      <div style={{ background: '#1B3A1F' }} className="px-4 pt-5 pb-5">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link to="/orders" className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition hover:bg-white/20" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ArrowLeft size={16} color="white"/>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-base">Order #{order.orderNumber}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0" style={{ background: st.bg, color: st.color }}>
            {STATUS_LABEL[currentStatus] || currentStatus}
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 pb-24 space-y-3">

        {/* Cancel Button */}
        {CANCELLABLE.includes(currentStatus) && (
          <button
            onClick={async () => {
              if (!window.confirm('Cancel this order?')) return;
              setCancelling(true);
              try {
                const { data } = await api.patch(`/orders/${id}/status`, { status: 'cancelled', note: 'Cancelled by customer' });
                setOrder(data);
                toast.success('Order cancelled');
              } catch {
                toast.error('Failed to cancel order');
              } finally {
                setCancelling(false);
              }
            }}
            disabled={cancelling}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 16, border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#c62828', fontWeight: 800, fontSize: 14, cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: cancelling ? 0.6 : 1 }}
          >
            <XCircle size={16} />
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="font-black text-gray-800 mb-4 text-sm">Order Tracking</p>
            <div className="relative">
              {STATUS_STEPS.map((step, i) => {
                const done   = i <= currentStep;
                const active = i === currentStep;
                const last   = i === STATUS_STEPS.length - 1;
                return (
                  <div key={step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 transition-all ${
                        active ? 'ring-4 ring-green-100' : ''
                      }`} style={{ background: done ? '#2E7D32' : '#F3F4F6' }}>
                        {done ? (active ? <span className="text-sm">{STATUS_EMOJI[step]}</span> : <CheckCircle2 size={14} color="white"/>) : <Circle size={14} color="#D1D5DB"/>}
                      </div>
                      {!last && <div className="w-0.5 flex-1 my-1" style={{ background: done && !active ? '#2E7D32' : '#E5E7EB', minHeight: 20 }}/>}
                    </div>
                    <div className={`pb-4 flex-1 ${last ? 'pb-0' : ''}`}>
                      <p className={`text-sm font-bold ${active ? 'text-green-700' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                        {STATUS_LABEL[step]}
                      </p>
                      {active && <p className="text-xs text-green-500 font-semibold mt-0.5">● In Progress</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3" style={{ borderLeft: '4px solid #C62828' }}>
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-black text-red-700">Order Cancelled</p>
              <p className="text-xs text-gray-400 mt-0.5">This order has been cancelled</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="font-black text-gray-800 mb-3 text-sm">Items Ordered</p>
          <div className="space-y-3">
            {order.items?.map((item, i) => {
              const name = item.name || item.menuItem?.name || 'Item';
              const rawImage = item.image || item.menuItem?.image;
              const image = rawImage
                ? rawImage.startsWith('http') ? rawImage : `http://localhost:5000${rawImage}`
                : `https://placehold.co/48x48/E8F5E9/2E7D32?text=${encodeURIComponent(name)}`;
              return (
                <div key={i} className="flex items-center gap-3">
                  <img
                    src={image}
                    alt={name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    onError={e => { e.target.src = `https://placehold.co/48x48/E8F5E9/2E7D32?text=${encodeURIComponent(name)}`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <span className="font-black text-gray-900 text-sm">₹{item.price * item.quantity}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address */}
        {order.delivery?.address?.street && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9' }}>
                <MapPin size={15} style={{ color: '#2E7D32' }}/>
              </div>
              <p className="font-black text-gray-800 text-sm">Delivery Address</p>
            </div>
            <p className="text-sm text-gray-700">{order.delivery.address.street}{order.delivery.address.landmark ? `, ${order.delivery.address.landmark}` : ''}</p>
            <p className="text-xs text-gray-400 mt-0.5">{order.delivery.address.city} — {order.delivery.address.pincode}</p>
          </div>
        )}

        {/* Review UI — only for delivered orders */}
        {currentStatus === 'delivered' && order.items?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="font-black text-gray-800 mb-3 text-sm">Rate Your Order</p>
            {order.items.map((item, i) => {
              const name = item.name || 'Item';
              const itemId = item.product?._id || item.product || String(i);
              if (reviewedItems.has(itemId)) {
                return (
                  <div key={i} className="flex items-center gap-2 py-2 text-sm" style={{ color: '#2E7D32' }}>
                    <CheckCircle2 size={14} /> <span className="font-bold">{name}</span> — reviewed!
                  </div>
                );
              }
              if (reviewItem?.idx === i) {
                return (
                  <div key={i} style={{ background: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                    <p className="text-sm font-bold text-gray-700 mb-2">{name}</p>
                    <div className="flex gap-1 mb-3">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <Star size={24} fill={s <= rating ? '#f59e0b' : 'none'} color={s <= rating ? '#f59e0b' : '#d1d5db'} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Share your experience (optional)"
                      rows={2}
                      style={{ width: '100%', borderRadius: 8, border: '1.5px solid #e5e5e5', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={async () => {
                          setSubmittingReview(true);
                          try {
                            await api.post('/reviews', { orderId: id, menuItemId: itemId, rating, comment });
                            setReviewedItems(prev => new Set(prev).add(itemId));
                            setReviewItem(null); setComment(''); setRating(5);
                            toast.success('Review submitted!');
                          } catch (e) {
                            toast.error(e.response?.data?.message || 'Failed to submit review');
                          } finally { setSubmittingReview(false); }
                        }}
                        disabled={submittingReview}
                        style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#16a34a', color: 'white', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {submittingReview ? 'Submitting…' : 'Submit Review'}
                      </button>
                      <button onClick={() => setReviewItem(null)}
                        style={{ padding: '9px 14px', borderRadius: 8, background: 'white', border: '1.5px solid #e5e5e5', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <span className="text-sm font-semibold text-gray-700">{name}</span>
                  <button
                    onClick={() => { setReviewItem({ idx: i }); setRating(5); setComment(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #f59e0b', background: '#fffbeb', color: '#b45309', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Star size={12} fill="#f59e0b" color="#f59e0b" /> Rate
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Bill */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9' }}>
              <CreditCard size={15} style={{ color: '#2E7D32' }}/>
            </div>
            <p className="font-black text-gray-800 text-sm">Bill Summary</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.pricing?.subtotal}</span></div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery</span>
              <span className={order.pricing?.deliveryFee === 0 ? 'font-bold' : ''} style={order.pricing?.deliveryFee === 0 ? { color: '#2E7D32' } : {}}>
                {order.pricing?.deliveryFee === 0 ? 'Free 🎉' : `₹${order.pricing?.deliveryFee}`}
              </span>
            </div>
            {order.pricing?.discount > 0 && (
              <div className="flex justify-between" style={{ color: '#2E7D32' }}><span>Discount</span><span className="font-bold">-₹{order.pricing.discount}</span></div>
            )}
            <div className="flex justify-between font-black text-gray-900 pt-2" style={{ borderTop: '1px solid #E8F5E9' }}>
              <span>Total Paid</span><span style={{ color: '#2E7D32' }}>₹{order.pricing?.total}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
            {order.payment?.method?.toUpperCase()} · {order.payment?.status}
          </p>
        </div>
      </div>
    </div>
  );
}
