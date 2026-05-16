import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Users, Trophy, Search } from 'lucide-react';
import api from '../services/api';

const fetchReferrals = (page, search) =>
  api.get('/admin/referrals', { params: { page, limit: 10, search } }).then((r) => r.data);

export default function Referrals() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['referrals', page, search],
    queryFn: () => fetchReferrals(page, search),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Referral Scheme</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Gift className="h-6 w-6 text-orange-500" />} label="Total Referrals" value={data?.totalReferrals ?? '—'} />
        <StatCard icon={<Users className="h-6 w-6 text-blue-500" />} label="Reward per Referral" value="₹75 × 2" />
        <StatCard icon={<Trophy className="h-6 w-6 text-yellow-500" />} label="Top Referrer" value={data?.topReferrers?.[0]?.name ?? '—'} />
      </div>

      {/* Top Referrers */}
      {data?.topReferrers?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-700 mb-3">Top Referrers</h2>
          <div className="space-y-2">
            {data.topReferrers.map((u, i) => (
              <div key={u._id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">{i + 1}</span>
                  <span className="font-medium text-slate-700">{u.name}</span>
                  <span className="text-slate-400 font-mono text-xs">{u.myReferralCode}</span>
                </div>
                <span className="font-semibold text-slate-600">{u.referralCount} referrals</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Search by name or referral code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">Search</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                {['User', 'Phone', 'Referral Code', 'Referred By', 'Wallet Balance', 'Joined'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : data?.users?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">No referrals found</td></tr>
              ) : (
                data?.users?.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.phone}</td>
                    <td className="px-4 py-3 font-mono text-orange-600 font-semibold">{u.myReferralCode}</td>
                    <td className="px-4 py-3 text-slate-500">{u.referredBy?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">₹{u.wallet?.balance ?? 0}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
            <span className="text-slate-500">Page {page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
