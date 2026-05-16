import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, ShoppingBag, Clock, DollarSign, TrendingUp, Package } from 'lucide-react';

function Dashboard() {
  const [revenueData, setRevenueData] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [orderStatus, setOrderStatus] = useState([]);

  useEffect(() => {
    dashboardAPI.getStats().then(res => {
      const s = res.data;
      setStats(s);
      setOrderStatus([
        { name: 'Delivered', value: s.deliveredOrders || 0, color: '#10B981' },
        { name: 'Pending', value: s.pendingOrders || 0, color: '#F59E0B' },
        { name: 'Cancelled', value: s.cancelledOrders || 0, color: '#EF4444' },
      ]);
    }).catch(console.error);

    dashboardAPI.getRevenue('7d').then(res => {
      setRevenueData(res.data.map(d => ({ day: d._id, revenue: d.revenue })));
    }).catch(console.error);

    dashboardAPI.getPopularItems().then(res => {
      setPopularItems(res.data.map(d => ({ name: d.name, orders: d.totalOrdered })));
    }).catch(console.error);
  }, []);

  const statsCards = stats ? [
    { title: 'Total Users', value: stats.totalUsers?.toLocaleString(), icon: Users, color: 'from-violet-500 to-violet-600' },
    { title: 'Total Orders', value: stats.totalOrders?.toLocaleString(), icon: ShoppingBag, color: 'from-orange-500 to-red-500' },
    { title: 'Today Orders', value: stats.todayOrders, icon: Clock, color: 'from-amber-400 to-orange-500' },
    { title: 'Monthly Revenue', value: `₹${stats.monthlyRevenue?.toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: TrendingUp, color: 'from-rose-500 to-pink-500' },
    { title: 'Active Items', value: stats.activeMenuItems, icon: Package, color: 'from-sky-500 to-blue-600' },
  ] : [];

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your food delivery business.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>

                </div>
            <div className={`bg-gradient-to-br ${card.color} rounded-xl p-3 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#FF4500" 
                strokeWidth={3}
                dot={{ fill: '#FF4500', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#FF4500', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-6 mt-4">
            {orderStatus.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Items</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={popularItems}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }} 
            />
            <Bar 
              dataKey="orders" 
              fill="#00C896" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;