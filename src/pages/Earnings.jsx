import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { DollarSign, TrendingUp, Wallet, ArrowDownToLine, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

export default function Earnings() {
  const { currentLocation } = useAuth();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    withdrawal_method: 'bank_transfer',
    bank_name: '',
    account_number: '',
    account_name: '',
    branch: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', currentLocation],
    queryFn: () => base44.entities.Order.list('-created_date', 1000),
  });

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['withdrawals', currentLocation],
    queryFn: () => base44.entities.PlatformWithdrawal.list('-created_date', 100),
  });

  const withdrawMutation = useMutation({
    mutationFn: (data) => base44.entities.PlatformWithdrawal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      toast.success('Withdrawal request created');
      setShowWithdrawDialog(false);
      setWithdrawalData({
        amount: '',
        withdrawal_method: 'bank_transfer',
        bank_name: '',
        account_number: '',
        account_name: '',
        branch: '',
        notes: '',
      });
    },
  });

  const updateWithdrawalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlatformWithdrawal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      toast.success('Withdrawal updated');
    },
  });

  // Calculate earnings
  const totalCommissions = orders
    .filter(o => ['completed', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.commission_amount) || 0), 0);

  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const pendingWithdrawals = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const availableBalance = totalCommissions - totalWithdrawn - pendingWithdrawals;

  // Monthly earnings
  const thisMonth = orders
    .filter(o => {
      const orderDate = new Date(o.created_date);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear() &&
             ['completed', 'delivered'].includes(o.status);
    })
    .reduce((sum, o) => sum + (Number(o.commission_amount) || 0), 0);

  const lastMonth = orders
    .filter(o => {
      const orderDate = new Date(o.created_date);
      const lastMonthDate = subMonths(new Date(), 1);
      return orderDate.getMonth() === lastMonthDate.getMonth() && 
             orderDate.getFullYear() === lastMonthDate.getFullYear() &&
             ['completed', 'delivered'].includes(o.status);
    })
    .reduce((sum, o) => sum + (Number(o.commission_amount) || 0), 0);

  const handleWithdrawAll = () => {
    setWithdrawalData({
      ...withdrawalData,
      amount: availableBalance.toFixed(2),
    });
    setShowWithdrawDialog(true);
  };

  const handleSubmitWithdrawal = () => {
    if (!withdrawalData.amount || Number(withdrawalData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (Number(withdrawalData.amount) > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }
    if (withdrawalData.withdrawal_method === 'bank_transfer') {
      if (!withdrawalData.bank_name || !withdrawalData.account_number || !withdrawalData.account_name) {
        toast.error('Please fill in all bank account details');
        return;
      }
    }

    const account_details = withdrawalData.withdrawal_method === 'bank_transfer' 
      ? `${withdrawalData.bank_name} | ${withdrawalData.account_number} | ${withdrawalData.account_name}${withdrawalData.branch ? ' | ' + withdrawalData.branch : ''}`
      : withdrawalData.account_number || '';

    withdrawMutation.mutate({
      amount: Number(withdrawalData.amount),
      withdrawal_method: withdrawalData.withdrawal_method,
      account_details,
      notes: withdrawalData.notes,
      period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
  };

  const columns = [
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {format(new Date(row.created_date), 'MMM d, yyyy h:mm a')}
        </span>
      ),
    },
    {
      header: 'Amount',
      cell: (row) => (
        <p className="font-semibold text-lg text-slate-900">
          ₵{Number(row.amount).toFixed(2)}
        </p>
      ),
    },
    {
      header: 'Method',
      cell: (row) => (
        <span className="text-sm capitalize text-slate-600">
          {row.withdrawal_method?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Account Details',
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.account_details || '-'}
        </span>
      ),
    },
    {
      header: 'Period',
      cell: (row) => (
        row.period_start && row.period_end ? (
          <div className="text-xs text-slate-500">
            <div>{format(new Date(row.period_start), 'MMM d')} -</div>
            <div>{format(new Date(row.period_end), 'MMM d, yyyy')}</div>
          </div>
        ) : '-'
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: '',
      cell: (row) => (
        row.status === 'pending' && (
          <Button
            size="sm"
            onClick={() => updateWithdrawalMutation.mutate({ 
              id: row.id, 
              data: { status: 'completed' } 
            })}
          >
            Mark Completed
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Earnings</h2>
          <p className="text-slate-500">Manage commissions and withdrawals</p>
        </div>
        <Button
          onClick={handleWithdrawAll}
          disabled={availableBalance <= 0}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <ArrowDownToLine className="w-4 h-4 mr-2" />
          Withdraw Earnings
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Wallet className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">₵{availableBalance.toFixed(2)}</p>
          <p className="text-emerald-100 text-sm">Available Balance</p>
        </Card>

        <Card className="p-6 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <DollarSign className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">₵{totalCommissions.toFixed(2)}</p>
          <p className="text-slate-500 text-sm">Total Commissions</p>
        </Card>

        <Card className="p-6 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">₵{thisMonth.toFixed(2)}</p>
          <p className="text-slate-500 text-sm">This Month</p>
        </Card>

        <Card className="p-6 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">₵{lastMonth.toFixed(2)}</p>
          <p className="text-slate-500 text-sm">Last Month</p>
        </Card>
      </div>

      {/* Breakdown */}
      <Card className="p-6 bg-white border-0 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Earnings Breakdown</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Total Commissions Earned</span>
            <span className="font-semibold text-slate-900">₵{totalCommissions.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Total Withdrawn</span>
            <span className="font-semibold text-rose-600">-₵{totalWithdrawn.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Pending Withdrawals</span>
            <span className="font-semibold text-amber-600">-₵{pendingWithdrawals.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
            <span className="font-semibold text-emerald-900">Available to Withdraw</span>
            <span className="font-bold text-2xl text-emerald-600">₵{availableBalance.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Withdrawal History */}
      <Card className="p-6 bg-white border-0 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Withdrawal History</h3>
        <DataTable
          columns={columns}
          data={withdrawals}
          isLoading={isLoading}
          emptyMessage="No withdrawals yet"
        />
      </Card>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Earnings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Amount (₵)</Label>
              <Input
                type="number"
                step="0.01"
                value={withdrawalData.amount}
                onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">
                Available: ₵{availableBalance.toFixed(2)}
              </p>
            </div>

            <div>
              <Label>Withdrawal Method</Label>
              <Select
                value={withdrawalData.withdrawal_method}
                onValueChange={(value) => setWithdrawalData({ ...withdrawalData, withdrawal_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {withdrawalData.withdrawal_method === 'bank_transfer' ? (
              <>
                <div>
                  <Label>Bank Name *</Label>
                  <Input
                    value={withdrawalData.bank_name}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, bank_name: e.target.value })}
                    placeholder="e.g., Ghana Commercial Bank"
                  />
                </div>

                <div>
                  <Label>Account Number *</Label>
                  <Input
                    value={withdrawalData.account_number}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, account_number: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>

                <div>
                  <Label>Account Name *</Label>
                  <Input
                    value={withdrawalData.account_name}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, account_name: e.target.value })}
                    placeholder="Account holder name"
                  />
                </div>

                <div>
                  <Label>Branch (optional)</Label>
                  <Input
                    value={withdrawalData.branch}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, branch: e.target.value })}
                    placeholder="Bank branch"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label>Account Details *</Label>
                <Input
                  value={withdrawalData.account_number}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, account_number: e.target.value })}
                  placeholder="Mobile number, email, or account ID"
                />
              </div>
            )}

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={withdrawalData.notes}
                onChange={(e) => setWithdrawalData({ ...withdrawalData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitWithdrawal} disabled={withdrawMutation.isPending}>
              Submit Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}