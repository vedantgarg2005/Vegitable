import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

function Analytics() {
  const [period, setPeriod] = useState('7d');

  // Mock data for when API is not available
  const mockRevenue = {
    data: [
      { _id: 'Mon', revenue: 12000 },
      { _id: 'Tue', revenue: 15000 },
      { _id: 'Wed', revenue: 18000 },
      { _id: 'Thu', revenue: 14000 },
      { _id: 'Fri', revenue: 22000 },
      { _id: 'Sat', revenue: 25000 },
      { _id: 'Sun', revenue: 19000 }
    ]
  };

  const mockPopularItems = {
    data: [
      { name: 'Tomatoes', totalOrdered: 245 },
      { name: 'Spinach', totalOrdered: 189 },
      { name: 'Bananas', totalOrdered: 156 },
      { name: 'Apples', totalOrdered: 98 }
    ]
  };

  const mockStats = {
    data: {
      totalRevenue: 125000,
      totalOrders: 1523,
      activeUsers: 2847,
      avgOrderValue: 450,
      deliveredOrders: 68,
      pendingOrders: 20,
      cancelledOrders: 12
    }
  };

  const { data: revenue, error: revenueError } = useQuery({
    queryKey: ['revenue', period],
    queryFn: () => dashboardAPI.getRevenue(period),
    retry: false,
  });

  const { data: popularItems, error: itemsError } = useQuery({
    queryKey: ['popular-items'],
    queryFn: dashboardAPI.getPopularItems,
    retry: false,
  });

  const { data: stats, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardAPI.getStats,
    retry: false,
  });

  // Use mock data if API fails
  const displayRevenue = revenueError ? mockRevenue : revenue;
  const displayItems = itemsError ? mockPopularItems : popularItems;
  const displayStats = statsError ? mockStats : stats;

  const orderStatusData = [
    { name: 'Delivered', value: displayStats?.data?.deliveredOrders || 0, color: '#10B981' },
    { name: 'Pending', value: displayStats?.data?.pendingOrders || 0, color: '#F59E0B' },
    { name: 'Cancelled', value: displayStats?.data?.cancelledOrders || 0, color: '#EF4444' },
  ];

  const userGrowthData = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 180 },
    { month: 'Mar', users: 250 },
    { month: 'Apr', users: 320 },
    { month: 'May', users: 410 },
    { month: 'Jun', users: 480 },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{displayStats?.data?.totalRevenue || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">₹</span>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">+12% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{displayStats?.data?.totalOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-2">+8% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-purple-600">{displayStats?.data?.activeUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">👥</span>
            </div>
          </div>
          <p className="text-sm text-purple-600 mt-2">+15% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-orange-600">₹{displayStats?.data?.avgOrderValue || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">💰</span>
            </div>
          </div>
          <p className="text-sm text-orange-600 mt-2">+5% from last month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Revenue Trend</h2>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border rounded px-3 py-1"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayRevenue?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Popular Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayItems?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalOrdered" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">User Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Analytics;