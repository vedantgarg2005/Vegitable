import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { campaignsAPI } from '../services/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', type: 'discount', description: '',
  discount: { type: 'percentage', value: '', maxAmount: '', minOrderValue: '' },
  targetAudience: { userType: 'all' },
  validity: { startDate: '', endDate: '', usageLimit: '' },
  isActive: true,
};

const typeColors = {
  discount: 'bg-blue-100 text-blue-700',
  bogo: 'bg-purple-100 text-purple-700',
  free_delivery: 'bg-green-100 text-green-700',
  cashback: 'bg-orange-100 text-orange-700',
};

export default function Campaigns() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsAPI.getCampaigns().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => campaignsAPI.createCampaign(data),
    onSuccess: () => { queryClient.invalidateQueries(['campaigns']); toast.success('Campaign created'); setShowForm(false); setForm(EMPTY_FORM); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create campaign'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => campaignsAPI.updateCampaign(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['campaigns']); toast.success('Campaign updated'); },
    onError: () => toast.error('Failed to update campaign'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => campaignsAPI.deleteCampaign(id),
    onSuccess: () => { queryClient.invalidateQueries(['campaigns']); toast.success('Campaign deleted'); },
    onError: () => toast.error('Failed to delete campaign'),
  });

  const setNested = (path, value) => {
    const keys = path.split('.');
    setForm((prev) => {
      const next = { ...prev };
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campaigns</h1>
          <p className="text-gray-500 text-sm">Manage promotional campaigns</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {/* Campaign Cards */}
      {isLoading ? (
        <p className="text-slate-400 text-center py-10">Loading...</p>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">No campaigns yet. Create one!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const expired = new Date(c.validity.endDate) < new Date();
            return (
              <div key={c._id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{c.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[c.type]}`}>
                    {c.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  {c.discount?.value && (
                    <p>Discount: <span className="font-medium text-slate-700">
                      {c.discount.type === 'percentage' ? `${c.discount.value}%` : `₹${c.discount.value}`}
                      {c.discount.maxAmount ? ` (max ₹${c.discount.maxAmount})` : ''}
                    </span></p>
                  )}
                  {c.discount?.minOrderValue && <p>Min order: <span className="font-medium text-slate-700">₹{c.discount.minOrderValue}</span></p>}
                  <p>Audience: <span className="font-medium text-slate-700">{c.targetAudience?.userType}</span></p>
                  <p>
                    {new Date(c.validity.startDate).toLocaleDateString()} → {new Date(c.validity.endDate).toLocaleDateString()}
                    {expired && <span className="ml-1 text-red-500">(Expired)</span>}
                  </p>
                  {c.validity.usageLimit && (
                    <p>Usage: <span className="font-medium text-slate-700">{c.validity.usageCount}/{c.validity.usageLimit}</span></p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => updateMutation.mutate({ id: c._id, data: { isActive: !c.isActive } })}
                    className="flex items-center gap-1.5 text-xs font-medium"
                  >
                    {c.isActive
                      ? <><ToggleRight className="h-5 w-5 text-green-500" /><span className="text-green-600">Active</span></>
                      : <><ToggleLeft className="h-5 w-5 text-slate-400" /><span className="text-slate-400">Inactive</span></>}
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this campaign?')) deleteMutation.mutate(c._id); }}
                    className="p-1.5 rounded hover:bg-slate-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-semibold text-slate-800">New Campaign</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600">Campaign Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Type *</label>
                  <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <option value="discount">Discount</option>
                    <option value="bogo">BOGO</option>
                    <option value="free_delivery">Free Delivery</option>
                    <option value="cashback">Cashback</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Target Audience</label>
                  <select value={form.targetAudience.userType} onChange={(e) => setNested('targetAudience.userType', e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <option value="all">All Users</option>
                    <option value="new">New Users</option>
                    <option value="returning">Returning</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Discount Type</label>
                  <select value={form.discount.type} onChange={(e) => setNested('discount.type', e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Discount Value</label>
                  <input type="number" value={form.discount.value} onChange={(e) => setNested('discount.value', e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Max Discount (₹)</label>
                  <input type="number" value={form.discount.maxAmount} onChange={(e) => setNested('discount.maxAmount', e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Min Order Value (₹)</label>
                  <input type="number" value={form.discount.minOrderValue} onChange={(e) => setNested('discount.minOrderValue', e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Start Date *</label>
                  <input required type="date" value={form.validity.startDate} onChange={(e) => setNested('validity.startDate', e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">End Date *</label>
                  <input required type="date" value={form.validity.endDate} onChange={(e) => setNested('validity.endDate', e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Usage Limit</label>
                  <input type="number" value={form.validity.usageLimit} onChange={(e) => setNested('validity.usageLimit', e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600">Description</label>
                  <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={createMutation.isLoading}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                  {createMutation.isLoading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
