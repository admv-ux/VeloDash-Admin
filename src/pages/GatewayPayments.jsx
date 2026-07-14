import React, { useState, useEffect, useCallback } from 'react';
import { base44, getErrorMessage } from '../api/base44Client';
import {
  Search, RefreshCw, Calendar, User, ChevronLeft, ChevronRight,
  CreditCard, CheckCircle2, RotateCcw, ExternalLink
} from 'lucide-react';

const PROVIDER_BADGE = {
  paystack: 'text-teal-400 bg-teal-400/10 border-teal-500/30',
  stripe: 'text-indigo-400 bg-indigo-400/10 border-indigo-500/30',
};

const STATUS_BADGE = {
  success: 'text-green-500 bg-green-500/10',
  pending: 'text-amber-500 bg-amber-500/10',
  failed: 'text-red-500 bg-red-500/10',
  refunded: 'text-slate-400 bg-slate-500/10',
};

const GatewayPayments = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 25;

  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Finance.listGatewayPayments({
        page, limit, search: search || undefined, provider: provider || undefined,
        status: status || undefined, method: method || undefined,
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, provider, status, method]);

  useEffect(() => { fetchPayments(); }, [page, provider, status, method]);

  const formatCurrency = (amount, currency = 'GHS') =>
    new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(amount);

  const reverify = async (id) => {
    setBusyId(id);
    try { await base44.entities.Finance.reverifyPayment(id); await fetchPayments(); }
    catch (err) { alert(getErrorMessage(err)); }
    finally { setBusyId(null); }
  };

  const refund = async (id) => {
    if (!window.confirm('Refund this payment to the customer wallet?')) return;
    setBusyId(id);
    try { await base44.entities.Finance.refundPaymentToWallet(id); await fetchPayments(); }
    catch (err) { alert(getErrorMessage(err)); }
    finally { setBusyId(null); }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-8 bg-[#0f172a] min-height-screen text-slate-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-indigo-500" />
            Gateway Payments
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest">Paystack and Stripe transactions</p>
        </div>
        <button onClick={fetchPayments} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchPayments())}
            placeholder="Search reference, provider ref, user..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-500/50"
          />
        </div>
        <select value={provider} onChange={(e) => { setProvider(e.target.value); setPage(1); }} className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm outline-none">
          <option value="">All providers</option>
          <option value="paystack">Paystack</option>
          <option value="stripe">Stripe</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm outline-none">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm outline-none">
          <option value="">All methods</option>
          <option value="momo">Mobile Money</option>
          <option value="card">Card</option>
          <option value="wallet">Wallet</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50">
                {['Reference / Time', 'User', 'Provider', 'Method', 'Status', 'Amount', 'Links', ''].map((h) => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan="8" className="px-6 py-6 bg-slate-900/20"></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500 italic">No payments found</td></tr>
              ) : (
                items.map((p) => {
                  const ref = p.metadata?.reference || p.providerRef || '-';
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-xs font-mono font-bold text-slate-300 uppercase mb-1">{ref}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(p.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="text-xs text-slate-300">{p.user?.email || p.user?.phoneNumber || 'User'}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full border font-black uppercase ${PROVIDER_BADGE[p.provider] || 'text-slate-400 bg-slate-500/10 border-slate-700'}`}>
                          {p.provider || 'unknown'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 uppercase">{p.method}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase ${STATUS_BADGE[p.status] || 'text-slate-400 bg-slate-500/10'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-white">{formatCurrency(p.amount, p.currency)}</td>
                      <td className="px-5 py-4 text-[10px] text-slate-500">
                        {p.rideId && <div className="flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" /> ride {p.rideId.slice(0, 8)}</div>}
                        {p.orderId && <div className="flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" /> order {p.orderId.slice(0, 8)}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {p.status === 'pending' && (
                            <button onClick={() => reverify(p.id)} disabled={busyId === p.id}
                              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-40">
                              <CheckCircle2 className="w-3 h-3" /> Re-verify
                            </button>
                          )}
                          {p.status === 'success' && (
                            <button onClick={() => refund(p.id)} disabled={busyId === p.id}
                              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40">
                              <RotateCcw className="w-3 h-3" /> Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span> - {total} payments
          </div>
          <div className="flex items-center gap-2">
            <button disabled={page === 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-20">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}
              className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-20">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatewayPayments;
