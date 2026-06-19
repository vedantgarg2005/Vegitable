import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ShieldCheck, ShieldOff, Trash2, MessageSquare, X } from 'lucide-react';
import { reviewsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Reviews() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, isVerified: '', minReport: '' });
  const [respondModal, setRespondModal] = useState(null); // review object
  const [responseText, setResponseText] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', filters],
    queryFn: () => reviewsAPI.getReviews(filters).then((r) => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }) => reviewsAPI.verifyReview(id, isVerified),
    onSuccess: () => { queryClient.invalidateQueries(['reviews']); toast.success('Review updated'); },
    onError: () => toast.error('Failed to update review'),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, message }) => reviewsAPI.respondToReview(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews']);
      toast.success('Response saved');
      setRespondModal(null);
      setResponseText('');
    },
    onError: () => toast.error('Failed to save response'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => reviewsAPI.deleteReview(id),
    onSuccess: () => { queryClient.invalidateQueries(['reviews']); toast.success('Review deleted'); },
    onError: () => toast.error('Failed to delete review'),
  });

  const stars = (n) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`h-3.5 w-3.5 ${i < n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
  ));

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reviews Moderation</h1>
        <p className="text-gray-500 text-sm">Verify, respond to, or remove customer reviews</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <select
          value={filters.isVerified}
          onChange={(e) => setFilters({ ...filters, isVerified: e.target.value, page: 1 })}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Reviews</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
        <select
          value={filters.minReport}
          onChange={(e) => setFilters({ ...filters, minReport: e.target.value, page: 1 })}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Reports</option>
          <option value="1">Reported (≥1)</option>
          <option value="3">High Reports (≥3)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                {['Customer', 'Item', 'Rating', 'Comment', 'Reports', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
              ) : data?.reviews?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No reviews found</td></tr>
              ) : data?.reviews?.map((review) => (
                <tr key={review._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{review.customer?.name}</div>
                    <div className="text-xs text-slate-400">{review.customer?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{review.menuItem?.name ?? '—'}</td>
                  <td className="px-4 py-3"><div className="flex gap-0.5">{stars(review.rating)}</div></td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-slate-600">{review.comment}</p>
                    {review.adminResponse?.message && (
                      <p className="text-xs text-blue-500 mt-0.5 truncate">↳ {review.adminResponse.message}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {review.reportCount > 0
                      ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{review.reportCount}</span>
                      : <span className="text-slate-400">0</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${review.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {review.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button title={review.isVerified ? 'Unverify' : 'Verify'} onClick={() => verifyMutation.mutate({ id: review._id, isVerified: !review.isVerified })} className="p-1.5 rounded hover:bg-slate-100">
                        {review.isVerified ? <ShieldOff className="h-4 w-4 text-yellow-500" /> : <ShieldCheck className="h-4 w-4 text-green-500" />}
                      </button>
                      <button title="Respond" onClick={() => { setRespondModal(review); setResponseText(review.adminResponse?.message || ''); }} className="p-1.5 rounded hover:bg-slate-100">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                      </button>
                      <button title="Delete" onClick={() => { if (confirm('Delete this review?')) deleteMutation.mutate(review._id); }} className="p-1.5 rounded hover:bg-slate-100">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400">Loading...</div>
          ) : data?.reviews?.length === 0 ? (
            <div className="text-center py-10 text-slate-400">No reviews found</div>
          ) : data?.reviews?.map((review) => (
            <div key={review._id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-700">{review.customer?.name}</div>
                  <div className="text-xs text-slate-400">{review.menuItem?.name ?? '—'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${review.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {review.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div className="flex gap-0.5">{stars(review.rating)}</div>
              <p className="text-sm text-slate-600 line-clamp-2">{review.comment}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => verifyMutation.mutate({ id: review._id, isVerified: !review.isVerified })} className="p-1.5 rounded hover:bg-slate-100">
                  {review.isVerified ? <ShieldOff className="h-4 w-4 text-yellow-500" /> : <ShieldCheck className="h-4 w-4 text-green-500" />}
                </button>
                <button onClick={() => { setRespondModal(review); setResponseText(review.adminResponse?.message || ''); }} className="p-1.5 rounded hover:bg-slate-100">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </button>
                <button onClick={() => { if (confirm('Delete this review?')) deleteMutation.mutate(review._id); }} className="p-1.5 rounded hover:bg-slate-100">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
            <span className="text-slate-500">Page {filters.page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={filters.page === 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Prev</button>
              <button disabled={filters.page >= data.totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Respond Modal */}
      {respondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-800">Admin Response</h2>
              <button onClick={() => setRespondModal(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="mb-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
              <div className="flex gap-0.5 mb-1">{stars(respondModal.rating)}</div>
              <p>{respondModal.comment}</p>
              <p className="text-xs text-slate-400 mt-1">— {respondModal.customer?.name}</p>
            </div>
            <textarea
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Write your response..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRespondModal(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button
                disabled={!responseText.trim() || respondMutation.isLoading}
                onClick={() => respondMutation.mutate({ id: respondModal._id, message: responseText })}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                Save Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
