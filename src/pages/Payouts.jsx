import React, { useState, useEffect } from 'react';
import { base44, getErrorMessage } from '../api/base44Client';
import { RefreshCw, ChevronLeft, ChevronRight, Banknote } from 'lucide-react';

// Automated (Option 2) on-demand payouts: visibility only, no approval. Shows each
// driver/merchant payout with the gross, Paystack fee, net sent, and live status.
const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const limit = 20;

  useEffect(() => { fetchPayouts(); /* eslint-disable-next-line */ }, [page, status]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Finance.listPayouts({ page, limit, ...(status ? { status } : {}) });
      setPayouts(data.payouts || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const money = (amount, currency = 'GHS') => {
    if (amount == null) return '-';
    try { return new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(amount); }
    catch { return `${currency} ${Number(amount).toFixed(2)}`; }
  };

  const statusColor = (s) => ({
    processing: 'text-amber-400 bg-amber-400/10',
    completed: 'text-emerald-400 bg-emerald-400/10',
    reversed: 'text-rose-400 bg-rose-400/10',
    failed: 'text-rose-400 bg-rose-400/10',
  }[s] || 'text-zinc-400 bg-zinc-400/10');

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6 text-zinc-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Banknote className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold">Payouts</h1>
            <p className="text-sm text-zinc-400">On-demand driver and merchant transfers ({total})</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="reversed">Reversed</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={fetchPayouts} className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>}

      <div className="overflow-x-auto border border-zinc-800 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-right px-4 py-3 font-medium">Requested</th>
              <th className="text-right px-4 py-3 font-medium">Fee</th>
              <th className="text-right px-4 py-3 font-medium">Net sent</th>
              <th className="text-left px-4 py-3 font-medium">Destination</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-500">Loading...</td></tr>
            ) : payouts.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-500">No payouts yet</td></tr>
            ) : payouts.map((p) => (
              <tr key={p.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                <td className="px-4 py-3 text-zinc-400">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{p.userPhone || p.userId}</td>
                <td className="px-4 py-3 capitalize">{p.role || '-'}</td>
                <td className="px-4 py-3 text-right">{money(p.gross, p.currency)}</td>
                <td className="px-4 py-3 text-right text-zinc-400">{p.fee != null ? money(p.fee, p.currency) : '-'}</td>
                <td className="px-4 py-3 text-right font-semibold">{p.net != null ? money(p.net, p.currency) : money(p.amount, p.currency)}</td>
                <td className="px-4 py-3 text-zinc-400">{p.payoutMethod} {p.accountNumber}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

export default Payouts;
