import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productRequestsAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:  { bg: '#FFF8E1', color: '#F57F17', label: 'Pending' },
  reviewed: { bg: '#E3F2FD', color: '#1565C0', label: 'Reviewed' },
  added:    { bg: '#E8F5E9', color: '#2E7D32', label: 'Added ✓' },
};

export default function ProductRequests() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['product-requests', filter],
    queryFn: () => productRequestsAPI.getAll(filter ? { status: filter } : {}).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => productRequestsAPI.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries(['product-requests']); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update'),
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Product Requests</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>Requests from customers for new products</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'pending', 'reviewed', 'added'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: filter === s ? '2px solid #16a34a' : '1.5px solid #e5e7eb',
                background: filter === s ? '#f0fdf4' : 'white',
                color: filter === s ? '#16a34a' : '#555',
              }}
            >
              {s === '' ? 'All' : STATUS_STYLES[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {['pending', 'reviewed', 'added'].map(s => {
          const count = requests.filter(r => r.status === s).length;
          const st = STATUS_STYLES[s];
          return (
            <div key={s} style={{ background: st.bg, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: st.color }}>{count}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: st.color }}>{st.label}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
            <p style={{ fontWeight: 700, color: '#555' }}>No requests yet</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Product Name', 'Description', 'Customer', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((req, i) => {
                const st = STATUS_STYLES[req.status];
                return (
                  <tr key={req._id} style={{ borderBottom: i < requests.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14 }}>{req.productName}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#666', maxWidth: 240 }}>
                      {req.description || <span style={{ color: '#ccc' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{req.user?.name || 'Unknown'}</p>
                      <p style={{ margin: 0, color: '#aaa', fontSize: 12 }}>{req.user?.phone}</p>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                      {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={req.status}
                        onChange={e => statusMutation.mutate({ id: req._id, status: e.target.value })}
                        style={{ padding: '5px 8px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'white' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="added">Added</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
