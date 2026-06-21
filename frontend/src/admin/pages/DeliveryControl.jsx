import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryControlAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Truck, Power, UserCheck, UserX, RefreshCw,
  MapPin, Phone, AlertTriangle, CheckCircle, XCircle, Clock,
} from 'lucide-react';

const AGENT_STATUS_STYLE = {
  available: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  busy:      'bg-orange-100 text-orange-700 border border-orange-200',
  offline:   'bg-gray-100 text-gray-500 border border-gray-200',
};

const ORDER_STATUS_STYLE = {
  confirmed:        'bg-blue-100 text-blue-700',
  picked_up:        'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
};

export default function DeliveryControl() {
  const queryClient = useQueryClient();
  const [reassignModal, setReassignModal] = useState(null);
  const [cancelModal, setCancelModal]     = useState(null);
  const [cancelReason, setCancelReason]   = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery-control'],
    queryFn: () => deliveryControlAPI.getStatus().then(r => r.data),
    refetchInterval: 15000,
  });

  const invalidate = () => queryClient.invalidateQueries(['delivery-control']);

  const toggleMutation = useMutation({
    mutationFn: () => deliveryControlAPI.toggle(),
    onSuccess: (res) => {
      invalidate();
      toast.success(`Delivery ${res.data.deliveryEnabled ? 'enabled' : 'disabled'}`);
    },
    onError: () => toast.error('Failed to toggle delivery'),
  });

  const agentStatusMutation = useMutation({
    mutationFn: ({ fleetId, status }) => deliveryControlAPI.setAgentStatus(fleetId, status),
    onSuccess: () => { invalidate(); toast.success('Agent status updated'); },
    onError: () => toast.error('Failed to update agent status'),
  });

  const reassignMutation = useMutation({
    mutationFn: ({ orderId, newAgentId }) => deliveryControlAPI.reassign(orderId, newAgentId),
    onSuccess: () => {
      invalidate();
      toast.success('Order reassigned successfully');
      setReassignModal(null);
      setSelectedAgent('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reassign'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }) => deliveryControlAPI.cancelDelivery(orderId, reason),
    onSuccess: () => {
      invalidate();
      toast.success('Delivery cancelled');
      setCancelModal(null);
      setCancelReason('');
    },
    onError: () => toast.error('Failed to cancel delivery'),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-gray-400 text-lg">Loading delivery control...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-red-400 text-lg">Failed to load delivery control data</div>
      </div>
    );
  }

  const { deliveryEnabled, agents = [], activeDeliveries = [] } = data || {};
  const availableAgents = agents.filter(a => a.status === 'available');
  const busyAgents      = agents.filter(a => a.status === 'busy');
  const offlineAgents   = agents.filter(a => a.status === 'offline');

  return (
    <div className="p-6 bg-slate-100 min-h-screen">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={invalidate}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Global Delivery Toggle */}
      <div className={`rounded-2xl p-6 mb-6 shadow-sm border-2 transition-all ${
        deliveryEnabled
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${deliveryEnabled ? 'bg-emerald-500' : 'bg-red-500'}`}>
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Delivery is currently{' '}
                <span className={deliveryEnabled ? 'text-emerald-600' : 'text-red-600'}>
                  {deliveryEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {deliveryEnabled
                  ? 'Customers can place delivery orders normally.'
                  : 'All new delivery orders are blocked. Takeaway & dine-in still work.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg transition-all disabled:opacity-60 ${
              deliveryEnabled
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            <Power className="w-5 h-5" />
            {deliveryEnabled ? 'Stop Delivery' : 'Enable Delivery'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Agents',     value: agents.length,           color: 'text-gray-800',    bg: 'bg-white' },
          { label: 'Available',        value: availableAgents.length,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'On Delivery',      value: busyAgents.length,       color: 'text-orange-600',  bg: 'bg-orange-50' },
          { label: 'Active Deliveries',value: activeDeliveries.length, color: 'text-blue-600',    bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 shadow-sm border border-white`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Delivery Agents */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Delivery Agents</h2>
            <span className="ml-auto text-sm text-gray-400">{agents.length} total</span>
          </div>

          {agents.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <UserX className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No delivery agents registered</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {agents.map(agent => (
                <div key={agent._id} className="px-6 py-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    agent.status === 'available' ? 'bg-emerald-100 text-emerald-700'
                    : agent.status === 'busy'    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {agent.driver?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {agent.driver?.name || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{agent.driver?.phone || '—'}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{agent.vehicleType}</span>
                    </div>
                    {agent.status === 'busy' && agent.currentOrder && (
                      <p className="text-xs text-orange-500 mt-0.5 font-medium">
                        On order #{String(agent.currentOrder._id || agent.currentOrder).slice(-6).toUpperCase()}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${AGENT_STATUS_STYLE[agent.status]}`}>
                    {agent.status}
                  </span>

                  {/* Status control */}
                  <select
                    value={agent.status}
                    onChange={e => agentStatusMutation.mutate({ fleetId: agent._id, status: e.target.value })}
                    disabled={agentStatusMutation.isLoading}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 flex-shrink-0"
                  >
                    <option value="available">Set Available</option>
                    <option value="busy">Set Busy</option>
                    <option value="offline">Set Offline</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Deliveries */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Active Deliveries</h2>
            <span className="ml-auto text-sm text-gray-400">{activeDeliveries.length} in progress</span>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No active deliveries right now</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeDeliveries.map(order => (
                <div key={order._id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800 text-sm">
                          #{order.orderNumber || String(order._id).slice(-6).toUpperCase()}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ORDER_STATUS_STYLE[order.status?.current] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status?.current?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.customer?.name} · {order.customer?.phone}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.delivery?.address?.street}, {order.delivery?.address?.city}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-800 text-sm">₹{order.pricing?.total}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Assigned agent */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                        {order.delivery?.partner?.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {order.delivery?.partner?.name || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReassignModal({ orderId: order._id, currentAgentName: order.delivery?.partner?.name });
                          setSelectedAgent('');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Reassign
                      </button>
                      <button
                        onClick={() => setCancelModal({ orderId: order._id, orderNumber: order.orderNumber || String(order._id).slice(-6).toUpperCase() })}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reassign Modal */}
      {reassignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reassign Delivery</h3>
                <p className="text-sm text-gray-500">
                  Currently: <span className="font-semibold">{reassignModal.currentAgentName || 'Unassigned'}</span>
                </p>
              </div>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">Select New Agent</label>
            <select
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
            >
              <option value="">— Choose an available agent —</option>
              {availableAgents.map(a => (
                <option key={a._id} value={a.driver?._id}>
                  {a.driver?.name} · {a.vehicleType} · {a.driver?.phone}
                </option>
              ))}
            </select>

            {availableAgents.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                No available agents right now. Set an agent to "available" first.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setReassignModal(null); setSelectedAgent(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => reassignMutation.mutate({ orderId: reassignModal.orderId, newAgentId: selectedAgent })}
                disabled={!selectedAgent || reassignMutation.isLoading}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {reassignMutation.isLoading ? 'Reassigning...' : 'Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Delivery Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancel Delivery</h3>
                <p className="text-sm text-gray-500">Order #{cancelModal.orderNumber}</p>
              </div>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for cancellation</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. No agents available, customer request..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setCancelModal(null); setCancelReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={() => cancelMutation.mutate({ orderId: cancelModal.orderId, reason: cancelReason || 'Cancelled by admin' })}
                disabled={cancelMutation.isLoading}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {cancelMutation.isLoading ? 'Cancelling...' : 'Cancel Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
