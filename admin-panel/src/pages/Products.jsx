import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuAPI } from '../services/api';
import toast from 'react-hot-toast';

const Products = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 10, category: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '', preparationTime: 30, isActive: true });
  const queryClient = useQueryClient();

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu-items', filters],
    queryFn: async () => {
      const res = await menuAPI.getMenuItems(filters);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: menuAPI.createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success('Product created successfully');
      setShowModal(false);
      setFormData({ name: '', description: '', price: '', category: '', preparationTime: 30, isActive: true });
    },
    onError: () => toast.error('Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => menuAPI.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success('Product updated successfully');
      setShowModal(false);
      setEditingItem(null);
    },
    onError: () => toast.error('Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: menuAPI.deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success('Product deleted successfully');
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime,
      isActive: item.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600">Manage restaurant products and menu items</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="border rounded-lg px-3 py-2"
              />
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">All Categories</option>
                <option value="sweets">Sweets</option>
                <option value="snacks">Snacks</option>
                <option value="main_course">Main Course</option>
                <option value="desserts">Desserts</option>
                <option value="beverages">Beverages</option>
                <option value="combos">Combos</option>
              </select>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({ name: '', description: '', price: '', category: '', isAvailable: true });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Product
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
              ) : menuData?.menuItems?.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No products found</td></tr>
              ) : (
                menuData?.menuItems?.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{item.category}</td>
                    <td className="px-6 py-4">₹{item.price}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows="3"
              />
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select Category</option>
                <option value="sweets">Sweets</option>
                <option value="snacks">Snacks</option>
                <option value="main_course">Main Course</option>
                <option value="desserts">Desserts</option>
                <option value="beverages">Beverages</option>
                <option value="combos">Combos</option>
              </select>
              <input
                type="number"
                placeholder="Preparation Time (minutes)"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                Active
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;