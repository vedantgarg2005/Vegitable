import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, CheckCircle2, Circle } from 'lucide-react';
import api from '../services/api';

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

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .catch((error) => {
        if (error.response?.status === 401) {
          navigate('/login');
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
