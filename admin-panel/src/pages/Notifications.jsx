import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Bell } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = { title: '', message: '', type: 'general', targetRole: 'all' };

export default function Notifications() {
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['notif-history'],
    queryFn: () => notificationsAPI.getHistory({ limit: 20 }).then((r) => r.data),
  });

  const broadcastMutation = useMutation({
    mutationFn: (data) => notificationsAPI.broadcast(data),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries(['notif-history']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Broadcast failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    broadcastMutation.mutate(form);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Push Notifications</h1>
        <p className="text-gray-500 text-sm">Broadcast notifications to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" /> Compose Broadcast
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Notification title"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Message *</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Notification message..."
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="general">General</option>
                  <option value="promotion">Promotion</option>
                  <option value="order_update">Order Update</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Target Audience</label>
                <select
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="customer">Customers</option>
                  <option value="delivery_partner">Delivery Partners</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={broadcastMutation.isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {broadcastMutation.isLoading ? 'Sending...' : 'Send Broadcast'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Broadcast History</h2>
          {isLoading ? (
            <p className="text-slate-400 text-sm text-center py-6">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No broadcasts sent yet</p>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {history.map((item, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 text-sm truncate">{item._id.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item._id.message}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full whitespace-nowrap">
                      {item._id.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{new Date(item.sentAt).toLocaleString()}</span>
                    <span>·</span>
                    <span>{item.recipientCount} recipients</span>
                    <span>·</span>
                    <span className="text-green-600">{item.readCount} read</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
