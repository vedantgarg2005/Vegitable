import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryPartnersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, ToggleLeft, ToggleRight, Search, Bike } from 'lucide-react';

const EMPTY_FORM = {
  name: '', email: '', phone: '', password: '',
  vehicleType: 'bike', vehicleNumber: '', licenseNumber: '',
};

const STATUS_STYLE = {
  available: 'bg-emerald-100 text-emerald-700',
  busy:      'bg-orange-100 text-orange-700',
  offline:   'bg-gray-100 text-gray-500',
};

export default function DeliveryPartners() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['delivery-partners', search],
    queryFn: () => deliveryPartnersAPI.getPartners(search ? { search } : {}).then(r => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries(['delivery-partners']);

  const addMutation = useMutation({
    mutationFn: (data) => deliveryPartnersAPI.addPartner(data),
    onSuccess: () => { invalidate(); toast.success('Partner added'); setShowModal(false); setForm(EMPTY_FORM); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add partner'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => deliveryPartnersAPI.updateStatus(id, isActive),
    onSuccess: () => { invalidate(); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deliveryPartnersAPI.deletePartner(id),
    onSuccess: () => { invalidate(); toast.success('Partner removed'); },
    onError: () => toast.error('Failed to remove partner'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addMutation.mutate(form);
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or email..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-gray-400">Loading...</div>
        ) : partners.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Bike className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No delivery partners found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                {['Partner', 'Phone', 'Vehicle', 'Fleet Status', 'Account', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {partners.map(p => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.email || '—'}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{p.phone}</td>
                  <td className="px-5 py-3">
                    <div className="capitalize text-gray-700">{p.fleet?.vehicleType || '—'}</div>
                    <div className="text-xs text-gray-400">{p.fleet?.vehicleNumber || ''}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[p.fleet?.status] || 'bg-gray-100 text-gray-500'}`}>
                      {p.fleet?.status || 'no fleet'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {p.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => statusMutation.mutate({ id: p._id, isActive: !(p.isActive !== false) })}
                        title={p.isActive !== false ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {p.isActive !== false ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Remove ${p.name}?`)) deleteMutation.mutate(p._id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Partner Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Delivery Partner</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'name', label: 'Full Name', type: 'text', required: true },
                { key: 'phone', label: 'Phone', type: 'tel', required: true },
                { key: 'email', label: 'Email (optional)', type: 'email', required: false },
                { key: 'password', label: 'Password', type: 'password', required: true },
                { key: 'vehicleNumber', label: 'Vehicle Number', type: 'text', required: true },
                { key: 'licenseNumber', label: 'License Number', type: 'text', required: true },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    required={required}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Type</label>
                <select
                  value={form.vehicleType}
                  onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {['bike', 'scooter', 'car', 'bicycle'].map(v => (
                    <option key={v} value={v} className="capitalize">{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isLoading}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50"
                >
                  {addMutation.isLoading ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
