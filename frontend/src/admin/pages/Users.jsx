import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

function Users() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, role: '', search: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id) => usersAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete user'),
  });

  const roleColors = {
    customer: 'bg-blue-100 text-blue-800',
    admin: 'bg-red-100 text-red-800',
    delivery_partner: 'bg-green-100 text-green-800',
    store_staff: 'bg-purple-100 text-purple-800',
  };

  const handleStatusToggle = (userId, currentStatus) => {
    updateStatusMutation.mutate({ id: userId, isActive: !currentStatus });
  };

  return (
    <div className="p-3 sm:p-6">

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">Delete User?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              <span className="font-medium text-gray-700">{deleteTarget.name}</span> will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="border rounded-lg px-3 py-2 flex-1 min-w-0"
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
              <option value="store_staff">Store Staff</option>
            </select>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
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
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm">{user.phone}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${roleColors[user.role]}`}>{user.role?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{user.wallet?.balance || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusToggle(user._id, user.isActive)}
                        disabled={updateStatusMutation.isLoading}
                        className={`px-3 py-1 text-xs rounded ${
                          user.isActive ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {error ? (
            <div className="text-center py-8 text-red-500 text-sm">Failed to load users</div>
          ) : isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : displayData?.data?.users?.map((user) => (
            <div key={user._id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 truncate">{user.name}</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ${roleColors[user.role]}`}>{user.role?.replace('_', ' ')}</span>
                </div>
                <div className="text-xs text-gray-500 truncate">{user.phone}</div>
                <div className="text-xs text-gray-400">{user.phone} · ₹{user.wallet?.balance || 0}</div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => handleStatusToggle(user._id, user.isActive)}
                  disabled={updateStatusMutation.isLoading}
                  className={`text-xs px-2.5 py-1 rounded ${
                    user.isActive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
                {user.role !== 'admin' && (
                  <button
                    onClick={() => setDeleteTarget(user)}
                    className="text-xs px-2.5 py-1 rounded bg-red-600 text-white"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
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