import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  DollarSign, TrendingUp, ArrowDownToLine, Car, ShoppingBag,
  Loader2, Wallet, Users, Clock, Banknote, TrendingDown,
  BarChart3, PiggyBank, CircleDollarSign, CheckCircle2,
  AlertCircle, ExternalLink, RefreshCw
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

/* ─── Currency Helper ──────────────────────────────────────────── */

const fmtMoney = (amount, currency = 'GHS') => {
  const num = Number(amount) || 0;
  const symbols = { GHS: '₵', NGN: '₦', USD: '$', CAD: 'C$', GBP: '£', EUR: '€', INR: '₹' };
  const sym = symbols[currency] || currency + ' ';
  return `${sym}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* ─── Stat Card ────────────────────────────────────────────────── */

const StatCard = ({ icon: Icon, label, value, sub, className = '', iconColor = 'text-slate-500' }) => (
  <Card className={`bg-white border-0 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-slate-100`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

/* ─── Mini Revenue Chart ────────────────────────────────────────── */

const MiniChart = ({ data, height = 120 }) => {
  if (!data || data.length === 0) return <p className="text-sm text-slate-400 text-center py-8">No data for this period</p>;

  const maxVal = Math.max(...data.map(d => d.platformTake), 1);

  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max((d.platformTake / maxVal) * height * 0.85, 2);
        const isToday = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-t transition-all ${isToday ? 'bg-violet-500' : 'bg-violet-200 group-hover:bg-violet-400'}`}
              style={{ height: h }}
            />
            <div className="hidden group-hover:block absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap z-10 shadow-lg">
              <p className="font-bold">{format(new Date(d.date), 'MMM d')}</p>
              <p>Orders: {d.orders} | Rides: {d.rides}</p>
              <p>Platform: {fmtMoney(d.platformTake)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Breakdown Row ──────────────────────────────────────────── */

const BreakdownRow = ({ label, amount, currency, color = 'text-slate-900', sub, bold }) => (
  <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${bold ? 'bg-slate-50 border border-slate-200' : ''}`}>
    <div>
      <span className={`text-sm ${bold ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{label}</span>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
    <span className={`text-sm font-semibold ${color}`}>{fmtMoney(amount, currency)}</span>
  </div>
);

/* ─── Payout Request Row ─────────────────────────────────────── */

const PayoutRow = ({ payout, onApprove, onReject, isApproving }) => (
  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-amber-100 rounded-lg">
        <Banknote className="w-4 h-4 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{fmtMoney(payout.amount, payout.currency)}</p>
        <p className="text-[10px] text-slate-400">{payout.userName} • {payout.method} • {format(new Date(payout.createdAt), 'MMM d, h:mm a')}</p>
      </div>
    </div>
    <div className="flex gap-2">
      <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 h-8 text-xs" onClick={() => onReject(payout.id)}>
        Reject
      </Button>
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={() => onApprove(payout.id)} disabled={isApproving}>
        {isApproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
        Approve
      </Button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
/* ─── Main Page ─────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════ */

export default function Earnings() {
  const queryClient = useQueryClient();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [dateRange, setDateRange] = useState('90d');
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    withdrawal_method: 'mobile_money',
    bank_name: '',
    account_number: '',
    account_name: '',
    branch: '',
    notes: '',
  });

  const getDateParams = () => {
    const to = new Date().toISOString();
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': 3650 };
    const from = subDays(new Date(), days[dateRange] || 90).toISOString();
    return { from, to };
  };

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['financial-overview', dateRange],
    queryFn: () => base44.entities.Dashboard.getFinancialOverview(getDateParams()),
    refetchInterval: 60000,
  });

  const withdrawMutation = useMutation({
    mutationFn: (data) => base44.entities.PlatformWithdrawal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
      toast.success('Withdrawal recorded');
      setShowWithdrawDialog(false);
      resetWithdrawalForm();
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const updateWithdrawalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlatformWithdrawal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
      toast.success('Withdrawal updated');
    },
  });

  const approvePayoutMutation = useMutation({
    mutationFn: (id) => base44.entities.Finance.approvePayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
      toast.success('Payout approved');
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const rejectPayoutMutation = useMutation({
    mutationFn: (id) => base44.entities.Finance.rejectPayout(id, 'Rejected by admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
      toast.success('Payout rejected and refunded');
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const resetWithdrawalForm = () => setWithdrawalData({
    amount: '', withdrawal_method: 'mobile_money', bank_name: '',
    account_number: '', account_name: '', branch: '', notes: '',
  });

  const handleSubmitWithdrawal = () => {
    if (!withdrawalData.amount || Number(withdrawalData.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const account_details = withdrawalData.withdrawal_method === 'bank_transfer'
      ? `${withdrawalData.bank_name} | ${withdrawalData.account_number} | ${withdrawalData.account_name}${withdrawalData.branch ? ' | ' + withdrawalData.branch : ''}`
      : withdrawalData.account_number || '';

    withdrawMutation.mutate({
      amount: Number(withdrawalData.amount),
      withdrawal_method: withdrawalData.withdrawal_method,
      account_details,
      notes: withdrawalData.notes,
      period_start: format(new Date(), 'yyyy-MM-dd'),
      period_end: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-slate-500 font-medium">Loading financial data...</p>
      </div>
    );
  }

  const p = overview?.platform || {};
  const o = overview?.orders || {};
  const r = overview?.rides || {};
  const td = overview?.today || {};
  const tm = overview?.thisMonth || {};

  const withdrawalColumns = [
    {
      header: 'Date',
      cell: (row) => <span className="text-sm text-slate-600">{format(new Date(row.createdAt), 'MMM d, yyyy h:mm a')}</span>,
    },
    {
      header: 'Amount',
      cell: (row) => <p className="font-semibold text-slate-900">{fmtMoney(row.amount)}</p>,
    },
    {
      header: 'Method',
      cell: (row) => <span className="text-sm capitalize text-slate-600">{row.method?.replace(/_/g, ' ')}</span>,
    },
    {
      header: 'Account',
      cell: (row) => <span className="text-sm text-slate-500 max-w-[200px] truncate block">{row.accountDetails || '-'}</span>,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: '',
      cell: (row) => row.status === 'pending' && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7"
          onClick={() => updateWithdrawalMutation.mutate({ id: row.id, data: { status: 'completed' } })}
        >
          Mark Done
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Revenue</h2>
          <p className="text-sm text-slate-500">Track earnings from orders, rides, and manage Paystack withdrawals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            {['7d', '30d', '90d', '1y', 'all'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${dateRange === range ? 'bg-white shadow-sm text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {range === 'all' ? 'All' : range.toUpperCase()}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={() => {
              setWithdrawalData({ ...withdrawalData, amount: String(p.availableToWithdraw || 0) });
              setShowWithdrawDialog(true);
            }}
            disabled={(p.availableToWithdraw || 0) <= 0}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-9"
          >
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Record Withdrawal
          </Button>
        </div>
      </div>

      {/* ── Top Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-0 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <CircleDollarSign className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-0.5">{fmtMoney(p.totalPlatformTake)}</p>
          <p className="text-violet-200 text-xs font-medium">Total Platform Revenue</p>
          <p className="text-violet-300 text-[10px] mt-1">Orders: {fmtMoney(p.orderPlatformTake)} • Rides: {fmtMoney(p.ridePlatformTake)}</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-0.5">{fmtMoney(p.availableToWithdraw)}</p>
          <p className="text-emerald-100 text-xs font-medium">Available to Withdraw</p>
          <p className="text-emerald-200 text-[10px] mt-1">from Paystack / Stripe</p>
        </Card>

        <StatCard icon={TrendingUp} label="Today's Platform Take" value={fmtMoney(td.totalPlatformTake)} iconColor="text-blue-600"
          sub={`${td.orderCount || 0} orders + ${td.rideCount || 0} rides`} />

        <StatCard icon={BarChart3} label="This Month's Platform Take" value={fmtMoney(tm.totalPlatformTake)} iconColor="text-purple-600"
          sub={`${tm.orderCount || 0} orders + ${tm.rideCount || 0} rides`} />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl w-full md:w-auto h-auto grid grid-cols-2 md:grid-cols-5 gap-1">
          <TabsTrigger value="overview" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShoppingBag className="w-3.5 h-3.5" /> Orders
          </TabsTrigger>
          <TabsTrigger value="rides" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Car className="w-3.5 h-3.5" /> Rides
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-3.5 h-3.5" /> Payouts
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ArrowDownToLine className="w-3.5 h-3.5" /> Withdrawals
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                Daily Platform Revenue (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniChart data={overview?.dailyBreakdown || []} height={140} />
              <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-violet-200" /> Past days</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-violet-500" /> Today</div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-emerald-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Platform Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <BreakdownRow label="Order Commissions" amount={o.commission} sub={`From ${o.count || 0} orders`} color="text-emerald-600" />
                <BreakdownRow label="Customer Service Fees" amount={o.serviceFees} color="text-emerald-600" />
                <BreakdownRow label="Small Order Fees" amount={o.smallOrderFees} color="text-emerald-600" />
                <BreakdownRow label="Ride Commissions" amount={r.commission} sub={`From ${r.count || 0} rides`} color="text-emerald-600" />
                <BreakdownRow label="Rider Service Fees" amount={r.riderServiceFees} color="text-emerald-600" />
                <div className="border-t border-slate-200 my-2" />
                <BreakdownRow label="Total Platform Revenue" amount={p.totalPlatformTake} color="text-emerald-700" bold />
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-rose-700 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> Payouts Owed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <BreakdownRow label="Merchant Earnings" amount={overview?.payoutsOwed?.toMerchants} sub="Order subtotals after commission" color="text-rose-600" />
                <BreakdownRow label="Driver Payouts" amount={overview?.payoutsOwed?.toDrivers} sub="Ride fare after commission" color="text-rose-600" />
                <div className="border-t border-slate-200 my-2" />
                <BreakdownRow
                  label="Total Owed to Partners"
                  amount={(overview?.payoutsOwed?.toMerchants || 0) + (overview?.payoutsOwed?.toDrivers || 0)}
                  color="text-rose-700" bold
                />
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-3">
                  <div className="flex gap-2 items-start text-blue-700 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>Partners receive payouts via their in-app wallet. Cash orders debit driver wallets. Online orders credit wallets on completion.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-violet-500" /> Paystack / Stripe Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <BreakdownRow label="Total Platform Revenue" amount={p.totalPlatformTake} color="text-emerald-600" />
              <BreakdownRow label="Already Withdrawn" amount={p.totalWithdrawn} color="text-rose-600" />
              <BreakdownRow label="Pending Withdrawals" amount={p.pendingWithdrawals} color="text-amber-600" />
              <div className="border-t border-slate-200 my-2" />
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                <span className="font-semibold text-emerald-900">Available to Withdraw</span>
                <span className="font-bold text-2xl text-emerald-600">{fmtMoney(p.availableToWithdraw)}</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mt-3">
                <div className="flex gap-2 items-start text-amber-700 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>Go to <strong>Paystack Dashboard → Transfers</strong> to initiate the actual bank transfer. Then record it here to track your withdrawals.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {overview?.byCurrency && Object.keys(overview.byCurrency).length > 1 && (
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-violet-500" /> Revenue by Currency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(overview.byCurrency).map(([currency, data]) => (
                    <Card key={currency} className="bg-slate-50 border border-slate-200 shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="text-xs font-bold">{currency}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Orders ({data.orders.count})</span>
                            <span className="font-semibold">{fmtMoney(data.orders.platformTake, currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Rides ({data.rides.count})</span>
                            <span className="font-semibold">{fmtMoney(data.rides.platformTake, currency)}</span>
                          </div>
                          <div className="border-t pt-1 flex justify-between">
                            <span className="font-medium text-slate-700">Total Take</span>
                            <span className="font-bold text-violet-600">{fmtMoney(data.orders.platformTake + data.rides.platformTake, currency)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Orders Tab ── */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={ShoppingBag} label="Total Orders" value={o.count || 0} iconColor="text-blue-600" sub={`GMV: ${fmtMoney(o.gmv)}`} />
            <StatCard icon={DollarSign} label="Commission Earned" value={fmtMoney(o.commission)} iconColor="text-emerald-600" />
            <StatCard icon={DollarSign} label="Service Fees" value={fmtMoney(o.serviceFees)} iconColor="text-teal-600" sub={`+ Small Order: ${fmtMoney(o.smallOrderFees)}`} />
            <StatCard icon={Banknote} label="Merchant Payouts" value={fmtMoney(o.merchantEarnings)} iconColor="text-rose-600" sub={`Delivery: ${fmtMoney(o.deliveryFees)}`} />
          </div>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Order Revenue Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <BreakdownRow label="Gross Merchandise Value (GMV)" amount={o.gmv} bold />
              <BreakdownRow label="  ↳ Subtotal (product sales)" amount={o.subtotal} color="text-slate-600" />
              <BreakdownRow label="  ↳ Delivery Fees" amount={o.deliveryFees} color="text-slate-600" />
              <BreakdownRow label="  ↳ Customer Service Fees" amount={o.serviceFees} color="text-slate-600" />
              <BreakdownRow label="  ↳ Small Order Fees" amount={o.smallOrderFees} color="text-slate-600" />
              <BreakdownRow label="  ↳ Discounts" amount={-(o.discounts || 0)} color="text-rose-500" />
              <div className="border-t border-dashed border-slate-200 my-2" />
              <BreakdownRow label="Merchant Earnings" amount={o.merchantEarnings} color="text-rose-600" sub="Subtotal after commission" />
              <BreakdownRow label="Platform Take" amount={o.platformTake} color="text-emerald-600" bold sub="Commission + Service Fee + Small Order Fee" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Rides Tab ── */}
        <TabsContent value="rides" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Car} label="Total Rides" value={r.count || 0} iconColor="text-blue-600" sub={`Total Fares: ${fmtMoney(r.totalFares)}`} />
            <StatCard icon={DollarSign} label="Ride Commission" value={fmtMoney(r.commission)} iconColor="text-emerald-600" />
            <StatCard icon={DollarSign} label="Rider Service Fees" value={fmtMoney(r.riderServiceFees)} iconColor="text-teal-600" sub="100% platform" />
            <StatCard icon={Banknote} label="Driver Payouts" value={fmtMoney(r.driverPayouts)} iconColor="text-rose-600" sub={`Surge: ${fmtMoney(r.surgeRevenue)}`} />
          </div>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ride Revenue Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <BreakdownRow label="Total Fare Revenue" amount={r.totalFares} bold />
              <BreakdownRow label="  ↳ Surge Revenue" amount={r.surgeRevenue} color="text-amber-600" />
              <div className="border-t border-dashed border-slate-200 my-2" />
              <BreakdownRow label="Platform Commission" amount={r.commission} color="text-emerald-600" sub="% of fare (excl. service fee)" />
              <BreakdownRow label="Rider Service Fee" amount={r.riderServiceFees} color="text-emerald-600" sub="Flat fee - 100% platform" />
              <BreakdownRow label="Driver Payout" amount={r.driverPayouts} color="text-rose-600" sub="Fare minus commission" />
              <div className="border-t border-slate-200 my-2" />
              <BreakdownRow label="Platform Take (Rides)" amount={r.platformTake} color="text-emerald-700" bold sub="Commission + Service Fee" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payouts Tab ── */}
        <TabsContent value="payouts" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={Users} label="Owed to Merchants" value={fmtMoney(overview?.payoutsOwed?.toMerchants)} iconColor="text-purple-600" sub="From completed orders" />
            <StatCard icon={Car} label="Owed to Drivers" value={fmtMoney(overview?.payoutsOwed?.toDrivers)} iconColor="text-blue-600" sub="From completed rides" />
            <StatCard icon={Clock} label="Pending Payout Requests" value={overview?.pendingPayoutRequests?.length || 0} iconColor="text-amber-600" sub="Waiting for admin approval" />
          </div>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Pending Payout Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(overview?.pendingPayoutRequests || []).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No pending payout requests</p>
                  <p className="text-xs mt-1">All driver and merchant payouts are settled</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(overview?.pendingPayoutRequests || []).map(payout => (
                    <PayoutRow
                      key={payout.id}
                      payout={payout}
                      onApprove={(id) => approvePayoutMutation.mutate(id)}
                      onReject={(id) => rejectPayoutMutation.mutate(id)}
                      isApproving={approvePayoutMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex gap-3 items-start text-blue-700 text-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold mb-1">How Payouts Work</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-blue-600">
                  <li><strong>Online orders:</strong> Payment goes to Paystack → merchant earnings credited to wallet on completion</li>
                  <li><strong>Cash orders:</strong> Driver collects cash → driver wallet debited for platform fees → merchant wallet credited</li>
                  <li><strong>Rides:</strong> Payment goes to Paystack → driver payout credited to wallet minus commission</li>
                  <li><strong>Partner withdrawals:</strong> Partners request payout from wallet → admin approves → manual bank transfer</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Withdrawals Tab ── */}
        <TabsContent value="withdrawals" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={DollarSign} label="Total Platform Revenue" value={fmtMoney(p.totalPlatformTake)} iconColor="text-emerald-600" />
            <StatCard icon={ArrowDownToLine} label="Already Withdrawn" value={fmtMoney(p.totalWithdrawn)} iconColor="text-violet-600" />
            <Card className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-3">
                  <PiggyBank className="w-5 h-5 opacity-80" />
                </div>
                <p className="text-2xl font-bold mb-0.5">{fmtMoney(p.availableToWithdraw)}</p>
                <p className="text-emerald-100 text-xs font-medium">Available to Withdraw</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Withdrawal History</CardTitle>
              <div className="flex gap-2">
                <a
                  href="https://dashboard.paystack.com/#/transfer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Paystack Dashboard
                </a>
                <Button
                  size="sm"
                  onClick={() => {
                    setWithdrawalData({ ...withdrawalData, amount: String(p.availableToWithdraw || 0) });
                    setShowWithdrawDialog(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                >
                  <ArrowDownToLine className="w-3 h-3 mr-1" /> Record Withdrawal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={withdrawalColumns}
                data={overview?.withdrawalHistory || []}
                emptyMessage="No withdrawals recorded yet"
              />
            </CardContent>
          </Card>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <div className="flex gap-3 items-start text-amber-700 text-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold mb-1">How to Withdraw</p>
                <ol className="list-decimal list-inside text-xs space-y-1 text-amber-600">
                  <li>Go to <strong>Paystack Dashboard → Transfers → Send Money</strong></li>
                  <li>Enter your bank account details and amount</li>
                  <li>Confirm the transfer</li>
                  <li>Come back here and click <strong>"Record Withdrawal"</strong> to track it</li>
                </ol>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Withdrawal Dialog ── */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Withdrawal</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-500 -mt-2">
            Record a withdrawal you've made from Paystack to your bank account.
          </p>
          <div className="space-y-4 py-2">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={withdrawalData.amount}
                onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">Available: {fmtMoney(p.availableToWithdraw)}</p>
            </div>

            <div>
              <Label>Withdrawal Method</Label>
              <Select
                value={withdrawalData.withdrawal_method}
                onValueChange={(value) => setWithdrawalData({ ...withdrawalData, withdrawal_method: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paystack_transfer">Paystack Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {withdrawalData.withdrawal_method === 'bank_transfer' ? (
              <>
                <div>
                  <Label>Bank Name *</Label>
                  <Input value={withdrawalData.bank_name} onChange={(e) => setWithdrawalData({ ...withdrawalData, bank_name: e.target.value })} placeholder="e.g., Ghana Commercial Bank" />
                </div>
                <div>
                  <Label>Account Number *</Label>
                  <Input value={withdrawalData.account_number} onChange={(e) => setWithdrawalData({ ...withdrawalData, account_number: e.target.value })} placeholder="Enter account number" />
                </div>
                <div>
                  <Label>Account Name *</Label>
                  <Input value={withdrawalData.account_name} onChange={(e) => setWithdrawalData({ ...withdrawalData, account_name: e.target.value })} placeholder="Account holder name" />
                </div>
              </>
            ) : (
              <div>
                <Label>Account / Phone Number</Label>
                <Input value={withdrawalData.account_number} onChange={(e) => setWithdrawalData({ ...withdrawalData, account_number: e.target.value })} placeholder="Mobile number or reference" />
              </div>
            )}

            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={withdrawalData.notes} onChange={(e) => setWithdrawalData({ ...withdrawalData, notes: e.target.value })} placeholder="e.g., Paystack transfer #12345" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitWithdrawal} disabled={withdrawMutation.isPending}>
              {withdrawMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Record Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
