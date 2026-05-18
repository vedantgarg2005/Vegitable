import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Wallet as WalletIcon, Plus, Minus } from 'lucide-react';

function Wallet() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'credit' | 'debit'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['wallet-users', search],
    queryFn: () => walletAPI.getUsersWithWallet({ search, limit: 50 }),
    retry: false,
  });

  const users = data?.data?.users || [];

  const mutation = useMutation({
    mutationFn: ({ userId, type, payload }) =>
      type === 'credit'
        ? walletAPI.creditWallet(userId, payload)
        : walletAPI.debitWallet(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['wallet-users']);
      toast.success(`Wallet ${modalType === 'credit' ? 'credited' : 'debited'} successfully`);
      closeModal();
    },
    onError: () => toast.error('Failed to update wallet'),
  });

  const openModal = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
    setAmount('');
    setDescription('');
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
    setAmount('');
    setDescription('');
  };

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return toast.error('Enter a valid amount');
    mutation.mutate({
      userId: selectedUser._id,
      type: modalType,
      payload: { amount: parsed, description },
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Wallet Management</h1>
        <p className="text-gray-600">View and manage user wallet balances</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {error ? (
                <tr><td colSpan="5" className="text-center py-8 text-red-500">Failed to load users</td></tr>
              ) : isLoading ? (
                <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{user.phone || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-green-600">₹{user.wallet?.balance?.toFixed(2) || '0.00'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.wallet?.transactions?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openModal(user, 'credit')}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        <Plus className="h-3 w-3" /> Credit
                      </button>
                      <button
                        onClick={() => openModal(user, 'debit')}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        <Minus className="h-3 w-3" /> Debit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <WalletIcon className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-bold capitalize">{modalType} Wallet</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              User: <span className="font-medium text-gray-800">{selectedUser.name}</span> — Balance: <span className="font-semibold text-green-600">₹{selectedUser.wallet?.balance?.toFixed(2) || '0.00'}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Optional reason"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={closeModal} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={mutation.isLoading}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 ${
                  modalType === 'credit' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {mutation.isLoading ? 'Processing...' : `Confirm ${modalType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wallet;
