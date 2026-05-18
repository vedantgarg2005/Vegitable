import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

function Users() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, role: '', search: '' });
  const queryClient = useQueryClient();

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersAPI.getUsers(filters),
    retry: false,
  });

  const displayData = usersData;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => usersAPI.updateUserStatus(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to update user status'),
  });

  const roleColors = {
    customer: 'bg-blue-100 text-blue-800',
    admin: 'bg-red-100 text-red-800',
    delivery_partner: 'bg-green-100 text-green-800',
    restaurant_staff: 'bg-purple-100 text-purple-800',
  };

  const handleStatusToggle = (userId, currentStatus) => {
    updateStatusMutation.mutate({ id: userId, isActive: !currentStatus });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <p className="text-gray-600">Manage all platform users</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="border rounded-lg px-3 py-2 flex-1"
            />
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="delivery_partner">Delivery Partner</option>
              <option value="restaurant_staff">Restaurant Staff</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {error ? (
                <tr><td colSpan="7" className="text-center py-8 text-red-500">Failed to load users: {error.message}</td></tr>
              ) : isLoading ? (
                <tr><td colSpan="7" className="text-center py-8">Loading...</td></tr>
              ) : null}
              {displayData?.data?.users?.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${roleColors[user.role]}`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ₹{user.wallet?.balance || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusToggle(user._id, user.isActive)}
                      disabled={updateStatusMutation.isLoading}
                      className={`px-3 py-1 text-xs rounded ${
                        user.isActive 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      } disabled:opacity-50`}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayData?.data?.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <span className="text-sm text-gray-700">
              Page {displayData.data.currentPage} of {displayData.data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= displayData.data.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;