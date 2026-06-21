import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock } from 'lucide-react';
import api from '../services/api';

const STATUS = {
  placed:           { bg: '#FFF8E1', color: '#F57F17', label: 'Placed' },
  confirmed:        { bg: '#E3F2FD', color: '#1565C0', label: 'Confirmed' },
  processing:       { bg: '#F3E5F5', color: '#6A1B9A', label: 'Processing' },
  packed:           { bg: '#EDE7F6', color: '#4527A0', label: 'Packed' },
  out_for_delivery: { bg: '#FFF3E0', color: '#E65100', label: 'Out for Delivery' },
  delivered:        { bg: '#E8F5E9', color: '#2E7D32', label: 'Delivered ✓' },
  cancelled:        { bg: '#FFEBEE', color: '#C62828', label: 'Cancelled' },
};

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(({ data }) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page pb-nav animate-fade-up">
      <div className="container" style={{ paddingTop: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Package size={32} color="var(--green)" />
            </div>
            <p style={{ fontWeight: 800, fontSize: 17, margin: '0 0 6px' }}>No orders yet</p>
            <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 20px' }}>Your order history will appear here</p>
            <Link to="/" className="btn btn-primary" style={{ borderRadius: 'var(--radius)', padding: '11px 24px', textDecoration: 'none' }}>Start Shopping →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map(order => {
              const st = STATUS[order.status?.current] || { bg: '#F5F5F5', color: '#888', label: order.status?.current };
              return (
                <Link key={order._id} to={`/orders/${order._id}`}
                  style={{ textDecoration: 'none' }}
                  className="card animate-fade-up">
                  <div style={{ padding: '14px 16px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 14, margin: '0 0 3px', color: 'var(--text)' }}>#{order.orderNumber}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        <ChevronRight size={14} color="var(--text-3)" />
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '8px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.items?.map(i => i.product?.name || 'Item').join(' · ')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', marginTop: 10, background: '#FAFFF9', borderTop: '1px solid var(--border)', borderRadius: '0 0 var(--radius) var(--radius)' }}>
                    <span style={{ background: 'var(--green-light)', color: 'var(--green)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                      {order.payment?.method?.toUpperCase() || 'PAID'}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 15, color: 'var(--text)' }}>₹{order.pricing?.total}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
