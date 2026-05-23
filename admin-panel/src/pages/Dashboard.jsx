import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { Users, ShoppingBag, Clock, DollarSign, TrendingUp, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? `₹${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ title, value, icon: Icon, gradient, trend, trendValue }) {
  const isUp = trend === 'up';
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`bg-gradient-to-br ${gradient} rounded-xl p-3 shadow-md group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Dashboard() {
  const [revenueData, setRevenueData] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [hourlyOrders, setHourlyOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [orderStatus, setOrderStatus] = useState([]);

  useEffect(() => {
    dashboardAPI.getStats().then(res => {
      const s = res.data;
      setStats(s);
      setOrderStatus([
        { name: 'Delivered', value: s.deliveredOrders || 0, fill: '#10B981' },
        { name: 'Pending', value: s.pendingOrders || 0, fill: '#F59E0B' },
        { name: 'Cancelled', value: s.cancelledOrders || 0, fill: '#EF4444' },
      ]);
    }).catch(console.error);

    dashboardAPI.getRevenue('7d').then(res => {
      setRevenueData(res.data.map(d => ({ day: d._id, revenue: d.revenue })));
    }).catch(console.error);

    dashboardAPI.getPopularItems().then(res => {
      setPopularItems(res.data.slice(0, 6).map(d => ({ name: d.name, orders: d.totalOrdered })));
    }).catch(console.error);

    dashboardAPI.getHourlyOrders().then(res => {
      setHourlyOrders(res.data.filter(d => d.orders > 0));
    }).catch(console.error);
  }, []);

  const statsCards = stats ? [
    { title: 'Total Users', value: stats.totalUsers?.toLocaleString(), icon: Users, gradient: 'from-violet-500 to-purple-600', trend: 'up', trendValue: '+12%' },
    { title: 'Total Orders', value: stats.totalOrders?.toLocaleString(), icon: ShoppingBag, gradient: 'from-orange-500 to-red-500', trend: 'up', trendValue: '+8%' },
    { title: "Today's Orders", value: stats.todayOrders, icon: Clock, gradient: 'from-amber-400 to-orange-500', trend: 'up', trendValue: '+5%' },
    { title: 'Monthly Revenue', value: `₹${stats.monthlyRevenue?.toLocaleString()}`, icon: DollarSign, gradient: 'from-emerald-500 to-teal-500', trend: 'up', trendValue: '+18%' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: TrendingUp, gradient: 'from-rose-500 to-pink-500', trend: 'down', trendValue: '-3%' },
    { title: 'Active Products', value: stats.activeProducts, icon: Package, gradient: 'from-sky-500 to-blue-600', trend: 'up', trendValue: '+2%' },
  ] : [];

  const totalOrders = orderStatus.reduce((s, i) => s + i.value, 0);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's your SportZone store overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statsCards.map((card, i) => <StatCard key={i} {...card} />)}
      </div>

      {/* Row 1: Revenue Area Chart + Order Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2">
          <SectionCard title="Revenue Trend" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4500" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF4500" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#FF4500" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#FF4500', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#FF4500' }} />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        <SectionCard title="Order Status" subtitle="All time breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={orderStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                {orderStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} orders`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {orderStatus.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{item.value}</span>
                  <span className="text-gray-400 text-xs">
                    {totalOrders ? `${Math.round((item.value / totalOrders) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Row 2: Popular Items + Hourly Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Top Products" subtitle="Most ordered products">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={popularItems} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00C896" />
                  <stop offset="100%" stopColor="#00A878" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Orders" fill="url(#barGrad)" radius={[0, 6, 6, 0]} barSize={18} />            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Orders by Hour" subtitle="Today's order distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourlyOrders} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Orders" fill="url(#hourlyGrad)" radius={[6, 6, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </div>
  );
}

export default Dashboard;
