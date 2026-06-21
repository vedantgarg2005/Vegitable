import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Package, Tag, TrendingUp, Pencil, Trash2, X, Star, AlertCircle } from 'lucide-react';

const CATEGORIES = ['vegetables', 'fruits', 'leafy', 'exotic', 'herbs', 'organic', 'other'];
const imgSrc = (img) => !img ? '' : img.startsWith('/') ? img : `/uploads/${img}`;
const UNITS = ['gm', 'Kg', 'piece', 'dozen', 'litre'];
const emptyForm = { name: '', category: '', isBestseller: false, variants: [] };
const emptyVariant = { labelQty: '', unit: 'gm', price: '', marketPrice: '', stock: 0 };

export default function Products() {
  const [filters, setFilters] = useState({ page: 1, limit: 1000, category: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const qc = useQueryClient();

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu-items', filters],
    queryFn: async () => (await menuAPI.getMenuItems(filters)).data,
  });

  const items = (menuData?.menuItems || []).slice().sort((a, b) => a.name.localeCompare(b.name));

  const createMutation = useMutation({
    mutationFn: menuAPI.createMenuItem,
    onSuccess: () => { qc.invalidateQueries(['menu-items']); toast.success('Product created'); closeModal(); },
    onError: () => toast.error('Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => menuAPI.updateMenuItem(id, data),
    onSuccess: () => { qc.invalidateQueries(['menu-items']); toast.success('Product updated'); closeModal(); },
    onError: () => toast.error('Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: menuAPI.deleteMenuItem,
    onSuccess: () => { qc.invalidateQueries(['menu-items']); toast.success('Product deleted'); },
    onError: () => toast.error('Failed to delete product'),
  });

  const toggleStockMutation = useMutation({
    mutationFn: ({ id, isAvailable }) => menuAPI.toggleStock(id, isAvailable),
    onSuccess: () => qc.invalidateQueries(['menu-items']),
    onError: () => toast.error('Failed to update stock'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview('');
  };

  const openAdd = () => { closeModal(); setShowModal(true); };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name, category: item.category,
      isActive: item.isActive, isBestseller: item.isBestseller || false,
      variants: (item.variants || []).map(v => {
        const match = v.label?.match(/^(.+?)\s+(gm|Kg|piece|dozen|litre)$/);
        const base = match ? { ...v, labelQty: match[1], unit: match[2] } : { ...v, labelQty: v.label, unit: 'gm' };
        return { marketPrice: '', ...base };
      }),
    });
    setImagePreview(imgSrc(item.image));
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = (id) => { if (confirm('Delete this product?')) deleteMutation.mutate(id); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (createMutation.isPending || updateMutation.isPending) return;
    const payload = {
      ...formData,
      variants: formData.variants.map(v => ({
        ...v,
        label: v.labelQty ? `${v.labelQty} ${v.unit || 'gm'}` : v.label,
      })),
    };
    if (imageFile) payload.image = imageFile;
    editingItem ? updateMutation.mutate({ id: editingItem._id, data: payload }) : createMutation.mutate(payload);
  };

  const updateVariant = (i, field, value) =>
    setFormData(f => ({ ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v) }));

  const total = items.length;
  const active = items.filter(i => i.isActive).length;
  const bestsellers = items.filter(i => i.isBestseller).length;
  const outOfStock = items.filter(i => i.availability?.isAvailable === false).length;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your catalogue</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active', value: active, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Bestsellers', value: bestsellers, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Out of Stock', value: outOfStock, icon: AlertCircle, color: 'bg-red-50 text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{isLoading ? '—' : value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setFilters(f => ({ ...f, category: cat, page: 1 }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  filters.category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading products...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No products found</p>
          <button onClick={openAdd} className="mt-3 text-sm text-blue-600 hover:underline">Add your first product</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Product', 'Category', 'Variants', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, index) => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-medium w-8">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.image
                        ? <img src={imgSrc(item.image)} alt={item.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                        : <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center"><Package className="w-4 h-4 text-gray-300" /></div>}
                      <div className="font-medium text-gray-800 flex items-center gap-1.5">
                        {item.name}
                        {item.isBestseller && <span className="text-yellow-500 text-xs">⭐</span>}
                        {item.availability?.isAvailable === false && <span className="text-xs bg-red-100 text-red-500 font-semibold px-1.5 py-0.5 rounded">Out of Stock</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600 text-xs"><span className="bg-gray-100 px-2 py-1 rounded-full">{item.category}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.variants?.map((v, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">
                          {v.label} &#8377;{v.price}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end items-center">
                      <button
                        onClick={() => toggleStockMutation.mutate({ id: item._id, isAvailable: item.availability?.isAvailable === false })}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          item.availability?.isAvailable === false
                            ? 'bg-red-100 text-red-500 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {item.availability?.isAvailable === false ? 'Out of Stock' : 'In Stock'}
                      </button>
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingItem ? 'Update product details below' : 'Fill in the details to create a new product'}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Image + Basic Info */}
              <div className="flex gap-5">
                {/* Image Upload */}
                <label className="cursor-pointer flex-shrink-0">
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center overflow-hidden relative group">
                    {imagePreview
                      ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                      : <><Package className="w-8 h-8 text-gray-300 mb-1" /><span className="text-[10px] text-gray-400 font-medium">Upload Image</span></>}
                    {imagePreview && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-white text-xs font-semibold">Change</span></div>}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                </label>

                {/* Name + Category */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Fresh Tomatoes"
                      value={formData.name}
                      onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                {[{ key: 'isBestseller', label: 'Bestseller', desc: 'Show bestseller badge' }].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, [key]: !f[key] }))}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                      formData[key] ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      formData[key] ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {formData[key] && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="text-left">
                      <div className={`text-sm font-semibold ${formData[key] ? 'text-blue-700' : 'text-gray-600'}`}>{label}</div>
                      <div className="text-xs text-gray-400">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Tag className="w-4 h-4 text-blue-500" /> Variants</h3>
                    <p className="text-xs text-gray-400">Add size/weight options with pricing</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, variants: [...f.variants, { ...emptyVariant }] }))}
                    className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variant
                  </button>
                </div>

                {formData.variants.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">No variants yet. Click "Add Variant" to start.</div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_80px_80px_80px_28px] gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
                      <span>Qty</span><span>Unit</span><span>Sale ₹</span><span>MRP ₹</span><span></span>
                    </div>
                    {formData.variants.map((v, i) => (
                      <div key={i} className="grid grid-cols-[1fr_80px_80px_80px_28px] gap-2 items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                        <input type="text" placeholder="e.g. 500" value={v.labelQty ?? v.label} onChange={(e) => updateVariant(i, 'labelQty', e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                        <select value={v.unit || 'gm'} onChange={(e) => updateVariant(i, 'unit', e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                        <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={v.marketPrice} onChange={(e) => updateVariant(i, 'marketPrice', e.target.value)} className="border border-orange-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        <button type="button" onClick={() => setFormData(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))} className="text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2 border-t">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                  {isSaving ? 'Saving...' : editingItem ? '✓ Update Product' : '+ Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
