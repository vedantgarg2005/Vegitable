import { useState, useEffect } from 'react';
import { Bell, Package, Tag, Info, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  order_update: { icon: Package, color: '#1565C0', bg: '#E3F2FD' },
  promo:        { icon: Tag,     color: '#6A1B9A', bg: '#F3E5F5' },
  general:      { icon: Info,    color: '#2E7D32', bg: '#E8F5E9' },
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    api.get(`/notifications/${user.id}`)
      .then(({ data }) => setNotifications(data))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [user]);

  const markRead = async id => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => api.patch(`/notifications/${n._id}/read`).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen" style={{ background: '#F0F7F0' }}>
      {/* Header */}
      <div style={{ background: '#1B3A1F' }} className="px-4 pt-5 pb-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Updates</p>
            <div className="flex items-center gap-2">
              <p className="text-white font-black text-xl">Notifications</p>
              {unreadCount > 0 && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: '#4CAF50', color: 'white' }}>{unreadCount}</span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition hover:bg-white/20"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
              <CheckCheck size={13}/> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 pb-24 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse"/>)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E8F5E9' }}>
              <Bell size={32} style={{ color: '#A5D6A7' }}/>
            </div>
            <p className="font-black text-gray-700 mb-1">All caught up!</p>
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
            const Icon = cfg.icon;
            return (
              <div key={n._id} onClick={() => !n.isRead && markRead(n._id)}
                className="bg-white rounded-2xl shadow-sm flex gap-3 p-4 cursor-pointer transition-all active:scale-[0.99]"
                style={{ borderLeft: n.isRead ? 'none' : `3px solid ${cfg.color}`, opacity: n.isRead ? 0.75 : 1 }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                  <Icon size={16} style={{ color: cfg.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.isRead ? 'font-medium text-gray-600' : 'font-bold text-gray-900'}`}>{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-gray-300 mt-1.5">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: cfg.color }}/>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
