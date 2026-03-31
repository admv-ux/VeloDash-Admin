import React, { useState, useEffect } from 'react';
import { base44, getErrorMessage } from '../api/base44Client';
import { 
  Users, 
  Search, 
  Filter, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Plus, 
  Minus,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  User as UserIcon,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

const Wallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, driver, merchant, customer
  
  // Detail sidebar state
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  
  // Adjustment modal state
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjType, setAdjType] = useState('credit'); // credit, debit
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjSubmitting, setAdjSubmitting] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Finance.listWallets();
      setWallets(data.wallets || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (userId) => {
    setTxLoading(true);
    try {
      const data = await base44.entities.Finance.getTransactions(userId);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleSelectWallet = (wallet) => {
    setSelectedWallet(wallet);
    fetchTransactions(wallet.userId);
  };

  const handleAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    
    setAdjSubmitting(true);
    try {
      const amount = parseFloat(adjAmount);
      const payload = { amount, reason: adjReason };
      
      if (adjType === 'credit') {
        await base44.entities.Finance.creditWallet(selectedWallet.userId, payload);
      } else {
        await base44.entities.Finance.debitWallet(selectedWallet.userId, payload);
      }
      
      // Refresh
      await fetchWallets();
      await fetchTransactions(selectedWallet.userId);
      setShowAdjModal(false);
      setAdjAmount('');
      setAdjReason('');
      
      // Update selected wallet balance in local state
      const updatedWallets = await base44.entities.Finance.listWallets();
      const updatedWallet = updatedWallets.wallets.find(w => w.id === selectedWallet.id);
      if (updatedWallet) setSelectedWallet(updatedWallet);
      
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setAdjSubmitting(false);
    }
  };

  const filteredWallets = wallets.filter(w => {
    const name = w.user?.full_name?.toLowerCase() || '';
    const email = w.user?.email?.toLowerCase() || '';
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || w.user?.role === filterType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount, currency = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getRoleBadge = (role) => {
    const colors = {
      driver: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      merchant: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      customer: 'bg-green-500/10 text-green-500 border-green-500/20',
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${colors[role] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
        {role}
      </span>
    );
  };

  const handleExport = async () => {
    try {
      const csv = await base44.entities.Reports.exportOrders();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedWallet ? 'mr-[400px]' : ''}`}>
        <header className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                User Wallets
              </h1>
              <p className="text-slate-500 mt-1">Manage platform balances and transaction history</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 text-sm font-medium"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                Export CSV
              </button>
              <button 
                onClick={fetchWallets}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              >
                <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search users by name or email..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-green-500/50 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              {['all', 'driver', 'merchant', 'customer'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === type 
                      ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 pb-8">
          {loading && wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mb-4" />
              <p>Loading wallets...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500">
              {error}
            </div>
          ) : filteredWallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              <Wallet className="w-12 h-12 mb-4 opacity-20" />
              <p>No wallets found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredWallets.map((wallet) => (
                <div 
                  key={wallet.id}
                  onClick={() => handleSelectWallet(wallet)}
                  className={`group relative bg-slate-900/50 border rounded-2xl p-5 hover:bg-slate-900 transition-all cursor-pointer ${
                    selectedWallet?.id === wallet.id ? 'border-green-500 ring-4 ring-green-500/10' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                        {wallet.user?.avatar ? (
                          <img src={wallet.user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-green-500 transition-colors">
                          {wallet.user?.full_name || 'Unknown User'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleBadge(wallet.user?.role)}
                          <span className="text-xs text-slate-500">{wallet.user?.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(wallet.balance, wallet.currency)}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Available Balance</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Last updated: {new Date(wallet.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedWallet?.id === wallet.id ? 'translate-x-1 text-green-500' : 'text-slate-600'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Sidebar */}
      {selectedWallet && (
        <div className="fixed top-0 right-0 h-full w-[400px] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setSelectedWallet(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <h2 className="font-bold text-lg">Wallet Details</h2>
              <button className="text-slate-500 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
                {selectedWallet.user?.avatar ? (
                  <img src={selectedWallet.user.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <UserIcon className="w-10 h-10 text-slate-500" />
                )}
              </div>
              <h3 className="text-xl font-bold text-white">{selectedWallet.user?.full_name}</h3>
              <p className="text-slate-500 text-sm mt-1">{selectedWallet.user?.email}</p>
              <div className="mt-4 text-3xl font-black text-green-500 tracking-tight">
                {formatCurrency(selectedWallet.balance, selectedWallet.currency)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setAdjType('credit'); setShowAdjModal(true); }}
                className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-900/20"
              >
                <Plus className="w-4 h-4" /> Credit
              </button>
              <button 
                onClick={() => { setAdjType('debit'); setShowAdjModal(true); }}
                className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
              >
                <Minus className="w-4 h-4" /> Debit
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-900">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Transaction History</span>
              </div>
              {txLoading && <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />}
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-sm italic">
                  No transactions yet
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 group hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {tx.type === 'credit' ? (
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-white capitalize">{tx.type}</div>
                          <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{tx.reference}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-black ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, selectedWallet.currency)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{tx.description}</p>
                    <div className="mt-2 text-[10px] text-slate-600">
                      {new Date(tx.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`h-1.5 w-full ${adjType === 'credit' ? 'bg-green-500' : 'bg-red-500'}`} />
            <form onSubmit={handleAdjustment} className="p-6">
              <h3 className="text-xl font-bold text-white mb-2 capitalize">Manual {adjType}</h3>
              <p className="text-slate-500 text-sm mb-6">
                Adjusting balance for <span className="text-white font-medium">{selectedWallet.user?.full_name}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Amount ({selectedWallet.currency})</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      autoFocus
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors text-white font-mono text-xl"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason</label>
                  <textarea 
                    placeholder="e.g. Correcting double charge, promotional credit..."
                    required
                    rows="3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors text-white text-sm resize-none"
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="py-3 px-4 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={adjSubmitting}
                  className={`py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    adjType === 'credit' 
                      ? 'bg-green-600 hover:bg-green-500' 
                      : 'bg-red-600 hover:bg-red-500'
                  } ${adjSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {adjSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Confirm {adjType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallets;
