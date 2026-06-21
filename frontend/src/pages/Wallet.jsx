import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownLeft, ArrowUpRight, Plus, TrendingUp } from 'lucide-react';
import api from '../services/api';

const QUICK_AMOUNTS = [50, 100, 200, 500];

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get('/wallet')
      .then(({ data }) => setWallet(data))
      .catch(() => setWallet(null))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async e => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val < 1) return toast.error('Enter a valid amount');
    setAdding(true);
    try {
      const { data } = await api.post('/wallet/add', { amount: val, description: 'Added via app' });
      setWallet(data);
      setAmount('');
      toast.success(`₹${val} added to wallet!`);
    } catch {
      toast.error('Failed to add money');
    } finally {
      setAdding(false);
    }
  };

  const credits = wallet?.transactions?.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0) || 0;
  const debits  = wallet?.transactions?.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0) || 0;

  return (
    <div className="page pb-nav" style={{ background: 'var(--bg)' }}>
      <div className="container" style={{ paddingTop: 16, paddingBottom: 24 }}>

        {/* Balance card */}
        <div className="card" style={{ padding: 20, marginBottom: 12, background: 'linear-gradient(135deg,#14532d,#16a34a)', border: 'none' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>Available Balance</p>
          {loading
            ? <div style={{ height: 44, width: 140, borderRadius: 10, background: 'rgba(255,255,255,0.15)' }} />
            : <p style={{ fontSize: 40, fontWeight: 900, color: 'white', margin: '0 0 12px', lineHeight: 1 }}>₹{wallet?.balance ?? 0}</p>
          }
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowDownLeft size={13} color="#86efac" />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>In ₹{credits}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowUpRight size={13} color="#fca5a5" />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Out ₹{debits}</span>
            </div>
          </div>
        </div>
        {/* Add Money */}
        <div className="card" style={{ padding: 20, marginBottom: 12 }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9' }}>
              <Plus size={15} style={{ color: '#2E7D32' }}/>
            </div>
            <p className="font-black text-gray-800">Add Money</p>
          </div>
          <div className="flex gap-2 mb-3">
            {QUICK_AMOUNTS.map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-95"
                style={{
                  borderColor: amount === String(a) ? '#2E7D32' : 'transparent',
                  background: amount === String(a) ? '#E8F5E9' : '#F9FAFB',
                  color: amount === String(a) ? '#1B5E20' : '#6B7280',
                }}>
                ₹{a}
              </button>
            ))}
          </div>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Enter custom amount"
              className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-green-400 bg-gray-50 transition-all"/>
            <button type="submit" disabled={adding}
              className="text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
              style={{ background: '#2E7D32' }}>
              {adding ? '...' : <><Plus size={15}/> Add</>}
            </button>
          </form>
        </div>

        {/* Transactions */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #E8F5E9' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9' }}>
              <TrendingUp size={15} style={{ color: '#2E7D32' }}/>
            </div>
            <p className="font-black text-gray-800">Transactions</p>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}
            </div>
          ) : !wallet?.transactions?.length ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">💸</p>
              <p className="text-gray-400 text-sm font-medium">No transactions yet</p>
            </div>
          ) : (
            <div>
              {[...wallet.transactions].reverse().map((tx, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: i < wallet.transactions.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}
                    style={{ background: tx.type === 'credit' ? '#E8F5E9' : '#FFEBEE' }}>
                    {tx.type === 'credit'
                      ? <ArrowDownLeft size={16} style={{ color: '#2E7D32' }}/>
                      : <ArrowUpRight size={16} style={{ color: '#C62828' }}/>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{tx.description || 'Transaction'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="font-black text-sm" style={{ color: tx.type === 'credit' ? '#2E7D32' : '#C62828' }}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
