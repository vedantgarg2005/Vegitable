import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Plus, Trash2, Star, X } from 'lucide-react';
import api from '../services/api';

const TYPE_EMOJI = { home: '🏠', work: '💼', other: '📍' };

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'home', address: '', landmark: '', city: '', pincode: '', isDefault: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/addresses')
      .then(({ data }) => setAddresses(data))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async e => {
    e.preventDefault();
    if (!form.address || !form.city || !form.pincode) return toast.error('Fill required fields');
    setSaving(true);
    try {
      const { data } = await api.post('/addresses', form);
      setAddresses(data);
      setShowForm(false);
      setForm({ type: 'home', address: '', landmark: '', city: '', pincode: '', isDefault: false });
      toast.success('Address added!');
    } catch {
      toast.error('Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    try {
      const { data } = await api.delete(`/addresses/${id}`);
      setAddresses(data);
      toast.success('Address removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const inputCls = "w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-green-400 bg-gray-50 placeholder-gray-300 transition-all";

  return (
    <div className="min-h-screen" style={{ background: '#F0F7F0' }}>
      {/* Header */}
      <div style={{ background: '#1B3A1F' }} className="px-4 pt-5 pb-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Saved</p>
            <p className="text-white font-black text-xl">Addresses</p>
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{ background: showForm ? 'rgba(255,255,255,0.15)' : 'white', color: showForm ? 'white' : '#1B3A1F' }}>
            {showForm ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add New</>}
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 pb-24 space-y-3">
        {/* Add Form */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <p className="font-black text-gray-800">New Address</p>
            <div className="flex gap-2">
              {['home', 'work', 'other'].map(t => (
                <button type="button" key={t} onClick={() => setForm({ ...form, type: t })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
                  style={{
                    borderColor: form.type === t ? '#2E7D32' : 'transparent',
                    background: form.type === t ? '#E8F5E9' : '#F9FAFB',
                    color: form.type === t ? '#1B5E20' : '#6B7280',
                  }}>
                  {TYPE_EMOJI[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Street / House No <span className="text-red-400">*</span></label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. 12B, MG Road" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Landmark</label>
              <input value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder="e.g. Near Metro" className={inputCls}/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">City <span className="text-red-400">*</span></label>
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" className={inputCls}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Pincode <span className="text-red-400">*</span></label>
                <input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} placeholder="000000" className={inputCls}/>
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer py-1">
              <div className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all ${form.isDefault ? 'border-green-500 bg-green-500' : 'border-gray-200'}`}
                onClick={() => setForm({ ...form, isDefault: !form.isDefault })}>
                {form.isDefault && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
              Set as default address
            </label>
            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl text-white font-black text-sm transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: '#2E7D32' }}>
              {saving ? 'Saving...' : 'Save Address'}
            </button>
          </form>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse"/>)}
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E8F5E9' }}>
              <MapPin size={32} style={{ color: '#A5D6A7' }}/>
            </div>
            <p className="font-black text-gray-700 mb-1">No saved addresses</p>
            <p className="text-gray-400 text-sm">Add one to speed up checkout</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr._id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-3 transition-all hover:shadow-md">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#E8F5E9' }}>
                  {TYPE_EMOJI[addr.type] || '📍'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-gray-800 capitalize text-sm">{addr.type}</span>
                    {addr.isDefault && (
                      <span className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                        <Star size={9} fill="currentColor"/> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{addr.address}{addr.landmark ? `, ${addr.landmark}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{addr.city} — {addr.pincode}</p>
                </div>
                <button onClick={() => handleDelete(addr._id)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-red-50 self-center flex-shrink-0"
                  style={{ color: '#EF5350' }}>
                  <Trash2 size={15}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
