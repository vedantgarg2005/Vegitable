import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, LayoutGrid, List, Package, Tag, TrendingUp, AlertTriangle, Pencil, Trash2, X, Star } from 'lucide-react';

const CATEGORIES = ['vegetables', 'fruits', 'leafy', 'exotic', 'herbs', 'organic', 'other'];
const emptyForm = { name: '', description: '', category: '', isActive: true, isBestseller: false, variants: [] };

export default function Products() {
  const [filters, setFilters] = useState({ page: 1, limit: 50, category: '', search: '' });
  const [viewMode, setViewMode] = useState('grid');
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

  const items = menuData?.menuItems || [];

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

  const stockMutation = useMutation({
    mutationFn: menuAPI.toggleStock,
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
    setFormData({ name: item.name, description: item.description, category: item.category, isActive: item.isActive, isBestseller: item.isBestseller || false, variants: item.variants || [] });
    setImagePreview(item.image || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = (id) => { if (confirm('Delete this product?')) deleteMutation.mutate(id); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (createMutation.isPending || updateMutation.isPending) return;
    const payload = { ...formData };
    if (imageFile) payload.image = imageFile;
    editingItem ? updateMutation.mutate({ id: editingItem._id, data: payload }) : createMutation.mutate(payload);
  };

  const updateVariant = (i, field, value) =>
    setFormData(f => ({ ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v) }));

  // Stats
  const total = items.length;
  const active = items.filter(i => i.isActive).length;
  const outOfStock = items.filter(i => i.availability?.isAvailable === false).length;
  const bestsellers = items.filter(i => i.isBestseller).length;

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
          { label: 'Out of Stock', value: outOfStock, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
          { label: 'Bestsellers', value: bestsellers, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
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

      {/* Filters & View Toggle */}
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
                  filters.category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat || 'All'}
              </button>
            ))}
          </div>

          <div className="flex gap-1 ml-auto border border-gray-200 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
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
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
              <div className="relative">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
                  : <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><Package className="w-10 h-10 text-gray-300" /></div>}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-white rounded-lg text-blue-600 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item._id)} className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
                {item.isBestseller && <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">⭐ Best</span>}
                <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h3>
                  <span className="text-xs text-gray-400 capitalize flex-shrink-0">{item.category}</span>
                </div>
                {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                {item.variants?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.variants.slice(0, 3).map((v, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{v.label} ₹{v.price}</span>
                    ))}
                    {item.variants.length > 3 && <span className="text-xs text-gray-400">+{item.variants.length - 3}</span>}
                  </div>
                )}
                <button
                  onClick={() => stockMutation.mutate(item._id)}
                  disabled={stockMutation.isPending}
                  className={`mt-3 w-full text-xs py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    item.availability?.isAvailable !== false
                      ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700'
                      : 'bg-red-50 text-red-700 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  {item.availability?.isAvailable !== false ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'Category', 'Variants', 'Status', 'Stock', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(item => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                        : <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center"><Package className="w-4 h-4 text-gray-300" /></div>}
                      <div>
                        <div className="font-medium text-gray-800 flex items-center gap-1">
                          {item.name}
                          {item.isBestseller && <span className="text-yellow-500 text-xs">⭐</span>}
                        </div>
                        <div className="text-xs text-gray-400 max-w-xs truncate">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600 text-xs"><span className="bg-gray-100 px-2 py-1 rounded-full">{item.category}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.variants?.map((v, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">{v.label} ₹{v.price}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => stockMutation.mutate(item._id)}
                      disabled={stockMutation.isPending}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
                        item.availability?.isAvailable !== false
                          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                          : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      {item.availability?.isAvailable !== false ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
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
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Image preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
                <div className="flex items-center gap-3">
                  {imagePreview
                    ? <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded-xl border" />
                    : <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300"><Package className="w-6 h-6" /></div>}
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} className="text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <input type="text" placeholder="Product Name *" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                </div>
                <div className="col-span-2">
                  <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" rows={2} />
                </div>
                <select value={formData.category} onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))} className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" required>
                  <option value="">Select Category *</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Variants</label>
                  <button type="button" onClick={() => setFormData(f => ({ ...f, variants: [...f.variants, { label: '', price: '', stock: 0 }] }))} className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">+ Add</button>
                </div>
                {formData.variants.length > 0 && (
                  <div className="space-y-2 bg-gray-50 rounded-xl p-3">
                    <div className="grid grid-cols-[1fr_1fr_70px_28px] gap-2 text-xs text-gray-400 px-1">
                      <span>Label</span><span>Price (₹)</span><span>Stock</span><span></span>
                    </div>
                    {formData.variants.map((v, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_70px_28px] gap-2 items-center">
                        <input type="text" placeholder="e.g. 500g" value={v.label} onChange={(e) => updateVariant(i, 'label', e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" required />
                        <input type="number" placeholder="0" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield]" required min="0" />
                        <input type="number" placeholder="0" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield]" min="0" />
                        <button type="button" onClick={() => setFormData(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))} className="text-gray-300 hover:text-red-500 text-base flex items-center justify-center"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                {[
                  { key: 'isActive', label: 'Active' },
                  { key: 'isBestseller', label: '⭐ Bestseller' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <div className={`relative w-9 h-5 rounded-full transition-colors ${formData[key] ? 'bg-blue-600' : 'bg-gray-200'}`} onClick={() => setFormData(f => ({ ...f, [key]: !f[key] }))}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData[key] ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                  {isSaving ? 'Saving...' : editingItem ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" onClick={closeModal} className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
