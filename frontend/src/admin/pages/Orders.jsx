import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ShoppingBag, Clock, CheckCircle, XCircle, Truck, UtensilsCrossed } from 'lucide-react';

const STATUS_TABS = [
  { label: 'All',           value: '',                icon: ShoppingBag,    color: 'text-gray-600',   bg: 'bg-gray-100'   },
  { label: 'New',           value: 'placed',          icon: Clock,          color: 'text-blue-600',   bg: 'bg-blue-100'   },
  { label: 'Confirmed',     value: 'confirmed',       icon: CheckCircle,    color: 'text-green-600',  bg: 'bg-green-100'  },
  { label: 'Preparing',     value: 'processing',      icon: UtensilsCrossed,color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { label: 'Packed',        value: 'packed',          icon: UtensilsCrossed,color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Out for Delivery', value: 'out_for_delivery', icon: Truck,      color: 'text-orange-600', bg: 'bg-orange-100' },
  { label: 'Delivered',     value: 'delivered',       icon: CheckCircle,    color: 'text-emerald-600',bg: 'bg-emerald-100'},
  { label: 'Cancelled',     value: 'cancelled',       icon: XCircle,        color: 'text-red-600',    bg: 'bg-red-100'    },
];

const STATUS_BADGE = {
  placed:           'bg-blue-100 text-blue-700 border border-blue-200',
  confirmed:        'bg-green-100 text-green-700 border border-green-200',
  preparing:        'bg-yellow-100 text-yellow-700 border border-yellow-200',
  ready:            'bg-purple-100 text-purple-700 border border-purple-200',
  picked_up:        'bg-indigo-100 text-indigo-700 border border-indigo-200',
  out_for_delivery: 'bg-orange-100 text-orange-700 border border-orange-200',
  delivered:        'bg-emerald-100 text-emerald-700 border border-emerald-200',
  cancelled:        'bg-red-100 text-red-700 border border-red-200',
};

const ALL_STATUSES = ['placed', 'confirmed', 'processing', 'packed', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];

function Orders() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: '', orderType: '' });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersAPI.getOrders(filters),
    retry: false,
  });

  // fetch counts for each tab
  const { data: allOrdersData } = useQuery({
    queryKey: ['orders-all-count'],
    queryFn: () => ordersAPI.getOrders({ limit: 1000 }),
    retry: false,
  });

  const orders = ordersData?.data?.orders || [];
  const allOrders = allOrdersData?.data?.orders || [];

  const countFor = (status) => status
    ? allOrders.filter(o => o.status?.current === status).length
    : allOrders.length;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => ordersAPI.updateOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['orders-all-count']);
      toast.success('Order status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <div className="p-3 sm:p-6 bg-slate-100 min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Track and manage all customer orders</p>
      </div>

      {/* Stat Tabs */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = filters.status === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilters({ ...filters, status: tab.value, page: 1 })}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                active
                  ? 'border-orange-500 bg-white shadow-md'
                  : 'border-transparent bg-white hover:border-gray-200 shadow-sm'
              }`}
            >
              <div className={`p-2 rounded-lg ${tab.bg}`}>
                <Icon className={`w-4 h-4 ${tab.color}`} />
              </div>
              <span className="text-xs font-semibold text-gray-700">{tab.label}</span>
              <span className={`text-lg font-bold ${active ? 'text-orange-500' : 'text-gray-900'}`}>
                {countFor(tab.value)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select
          value={filters.orderType}
          onChange={(e) => setFilters({ ...filters, orderType: e.target.value, page: 1 })}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">All Types</option>
          <option value="delivery">Delivery</option>
          <option value="store_pickup">Store Pickup</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">
          {ordersData?.data?.total || 0} orders found
        </span>
      </div>

      {/* Orders Table / Cards */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading orders...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">Failed to load orders</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No orders found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-800 text-sm">{order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                            {order.customer?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{order.customer?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-400">{order.customer?.phone || order.customer?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm capitalize text-gray-600">{order.orderType?.replace('_', ' ') || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-gray-800">₹{(order.pricing?.subtotal || 0) + (order.pricing?.deliveryFee || 0) - (order.pricing?.discount || 0)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${STATUS_BADGE[order.status?.current] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status?.current?.replace(/_/g, ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={order.status?.current}
                          onChange={(e) => updateStatusMutation.mutate({ id: order._id, status: e.target.value })}
                          disabled={updateStatusMutation.isLoading || order.status?.current === 'delivered' || order.status?.current === 'cancelled'}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => navigate(`/orders/${order._id}`)} className="text-xs font-medium text-orange-500 hover:text-orange-700 hover:underline">
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {orders.map((order) => (
                <div key={order._id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-sm">{order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}</span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${STATUS_BADGE[order.status?.current] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status?.current?.replace(/_/g, ' ') || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                      {order.customer?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{order.customer?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-400 truncate">{order.customer?.phone || order.customer?.email || ''}</div>
                    </div>
                    <span className="ml-auto font-semibold text-gray-800 text-sm">₹{(order.pricing?.subtotal || 0) + (order.pricing?.deliveryFee || 0) - (order.pricing?.discount || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={order.status?.current}
                      onChange={(e) => updateStatusMutation.mutate({ id: order._id, status: e.target.value })}
                      disabled={updateStatusMutation.isLoading || order.status?.current === 'delivered' || order.status?.current === 'cancelled'}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
                    >
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <button onClick={() => navigate(`/orders/${order._id}`)} className="text-xs font-medium text-orange-500 hover:text-orange-700 whitespace-nowrap">
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {ordersData?.data?.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Page {ordersData.data.currentPage} of {ordersData.data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= ordersData.data.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
