import React, { useState, useEffect } from 'react';
import { base44, getErrorMessage } from '../api/base44Client';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Calendar,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  
  // Stats
  const [stats, setStats] = useState({
    totalIn: 0,
    totalOut: 0,
    count: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Finance.listAllTransactions({ page, limit });
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      
      // Calculate local stats for this page
      const tin = (data.transactions || []).filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
      const tout = (data.transactions || []).filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
      setStats({
        totalIn: tin,
        totalOut: tout,
        count: data.total
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'driver': return 'text-blue-400 bg-blue-400/10';
      case 'merchant': return 'text-purple-400 bg-purple-400/10';
      case 'customer': return 'text-green-400 bg-green-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 bg-[#0f172a] min-height-screen text-slate-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-500" />
            Transaction Ledger
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest">Global Audit Trail • Real-time Wallet Movements</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={fetchTransactions}
            className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all shadow-lg shadow-green-900/20"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-green-500" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Credits</p>
          <h3 className="text-3xl font-black text-green-500">{formatCurrency(stats.totalIn)}</h3>
          <p className="text-[10px] text-slate-600 mt-4 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Current page volume
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Debits</p>
          <h3 className="text-3xl font-black text-red-500">{formatCurrency(stats.totalOut)}</h3>
          <p className="text-[10px] text-slate-600 mt-4 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Current page volume
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Ledger Entries</p>
          <h3 className="text-3xl font-black text-white">{total.toLocaleString()}</h3>
          <p className="text-[10px] text-slate-600 mt-4">Lifetime transactions recorded</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Filter by reference, reason or user..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-green-500/50 transition-colors"
              />
            </div>
            <button className="p-2 border border-slate-800 rounded-xl text-slate-400 hover:bg-slate-800">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Showing {transactions.length} of {total} results
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Ref / Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-6 bg-slate-900/20"></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 italic">No transactions found</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="text-xs font-mono font-bold text-slate-300 uppercase leading-none mb-1">{tx.reference}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white leading-none mb-1">{tx.wallet?.user?.full_name || 'System'}</div>
                          <div className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block font-black uppercase tracking-tighter ${getRoleColor(tx.wallet?.user?.role)}`}>
                            {tx.wallet?.user?.role || 'SYSTEM'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`flex items-center gap-1.5 text-xs font-black uppercase ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.type}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-400 max-w-xs line-clamp-1 hover:line-clamp-none cursor-help transition-all duration-300">
                        {tx.description}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className={`text-sm font-black ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, tx.wallet?.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="text-sm font-bold text-slate-300">
                        {formatCurrency(tx.balanceAfter, tx.wallet?.currency)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={page === totalPages || loading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
