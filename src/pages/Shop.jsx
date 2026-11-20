import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, getErrorMessage } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Package, ShoppingBag, Store, DollarSign, Clock, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

const FULFILMENT = [
  'not_started', 'pushed_to_store', 'fulfilling', 'shipped', 'delivered', 'failed',
];

function Stat({ icon: Icon, label, value, tone = 'text-violet-500' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${tone}`} />
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function Orders() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['shop-order-summary'],
    queryFn: () => base44.entities.Shop.orderSummary(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['shop-orders', status, search],
    queryFn: () => base44.entities.Shop.orders({
      ...(status !== 'all' ? { status } : {}),
      ...(search ? { search } : {}),
      limit: 100,
    }),
  });

  const update = useMutation({
    mutationFn: ({ id, body }) => base44.entities.Shop.updateOrder(id, body),
    onSuccess: () => {
      toast.success('Order updated');
      qc.invalidateQueries({ queryKey: ['shop-orders'] });
      qc.invalidateQueries({ queryKey: ['shop-order-summary'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      header: 'Order',
      cell: (row) => (
        <div>
          <p className="font-mono font-bold text-slate-900">{row.orderNumber}</p>
          <p className="text-xs text-slate-500">{row.email || 'no email'}</p>
        </div>
      ),
    },
    {
      header: 'Items',
      cell: (row) => (
        <div className="max-w-xs">
          <p className="text-sm">{(row.items || []).length} line{(row.items || []).length === 1 ? '' : 's'}</p>
          <p className="truncate text-xs text-slate-500">
            {(row.items || []).map((i) => `${i.quantity} x ${i.name}`).join(', ')}
          </p>
        </div>
      ),
    },
    { header: 'Total', cell: (row) => <span className="font-semibold">{money(row.total)}</span> },
    { header: 'Payment', cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Fulfilment',
      cell: (row) => (
        <Select
          value={row.fulfillmentStatus}
          onValueChange={(v) => update.mutate({ id: row.id, body: { fulfillmentStatus: v } })}
        >
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FULFILMENT.map((f) => (
              <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      header: 'Ship to',
      cell: (row) => {
        const a = row.shippingAddress?.address || row.shippingAddress;
        if (!a) return <span className="text-xs text-slate-400">not collected</span>;
        return (
          <p className="text-xs text-slate-600">
            {[a.city, a.state, a.country].filter(Boolean).join(', ')}
          </p>
        );
      },
    },
    {
      header: 'Placed',
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {row.createdAt ? format(new Date(row.createdAt), 'dd MMM HH:mm') : ''}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat icon={ShoppingBag} label="Orders" value={summary?.orders ?? 0} />
        <Stat icon={DollarSign} label="Paid revenue" value={money(summary?.paidRevenue)} tone="text-emerald-500" />
        <Stat icon={Package} label="Paid orders" value={summary?.paidOrders ?? 0} tone="text-emerald-500" />
        <Stat icon={Clock} label="Awaiting payment" value={summary?.awaitingPayment ?? 0} tone="text-amber-500" />
        <Stat icon={Truck} label="To fulfil" value={summary?.awaitingFulfilment ?? 0} tone="text-blue-500" />
      </div>

      <DataTable
        columns={columns}
        data={data?.orders || []}
        isLoading={isLoading}
        searchPlaceholder="Search by order number..."
        searchValue={search}
        onSearchChange={setSearch}
        filterValue={status}
        onFilterChange={setStatus}
        filterOptions={[
          { value: 'all', label: 'All payments' },
          { value: 'paid', label: 'Paid' },
          { value: 'awaiting_payment', label: 'Awaiting payment' },
          { value: 'payment_failed', label: 'Failed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
      />
    </div>
  );
}

function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['shop-products-admin', search],
    queryFn: () => base44.entities.Shop.products({ ...(search ? { search } : {}), limit: 100 }),
  });
  const { data: status } = useQuery({
    queryKey: ['shop-status'],
    queryFn: () => base44.entities.Shop.status(),
  });

  const reprice = useMutation({
    mutationFn: () => base44.entities.Shop.reprice(),
    onSuccess: (r) => {
      toast.success(`Repriced ${r?.updated ?? 0} products`);
      qc.invalidateQueries({ queryKey: ['shop-products-admin'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      header: 'Product',
      cell: (row) => (
        <div className="flex items-center gap-3 max-w-md">
          {row.image && <img src={row.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.name}</p>
            <p className="text-xs text-slate-500">{row.categoryName}</p>
          </div>
        </div>
      ),
    },
    { header: 'Cost', cell: (row) => <span className="text-sm text-slate-600">{money(row.landedCost)}</span> },
    { header: 'Multiplier', cell: (row) => <span className="text-sm">{Number(row.multiplier).toFixed(1)}x</span> },
    { header: 'Retail', cell: (row) => <span className="font-semibold">{money(row.retailPrice)}</span> },
    {
      header: 'Margin',
      cell: (row) => {
        const m = Number(row.retailPrice) - Number(row.landedCost);
        return <span className={m > 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>{money(m)}</span>;
      },
    },
    { header: 'Stock', cell: (row) => <StatusBadge status={row.inStock ? 'active' : 'offline'} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Stat icon={Package} label="In catalogue" value={status?.active ?? 0} />
        <Button variant="outline" onClick={() => reprice.mutate()} disabled={reprice.isPending}>
          {reprice.isPending ? 'Repricing' : 'Reprice everything'}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={data?.products || []}
        isLoading={isLoading}
        searchPlaceholder="Search products..."
        searchValue={search}
        onSearchChange={setSearch}
      />
    </div>
  );
}

function Applications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['shop-applications'],
    queryFn: () => base44.entities.Shop.applications({ limit: 100 }),
  });
  const update = useMutation({
    mutationFn: ({ id, body }) => base44.entities.Shop.updateApplication(id, body),
    onSuccess: () => {
      toast.success('Application updated');
      qc.invalidateQueries({ queryKey: ['shop-applications'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      header: 'Business',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.businessName}</p>
          <p className="text-xs text-slate-500">{row.contactName}</p>
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: (row) => (
        <div className="text-xs text-slate-600">
          <p>{row.email}</p>
          {row.phone && <p>{row.phone}</p>}
        </div>
      ),
    },
    { header: 'Country', cell: (row) => <span className="text-sm">{row.country || '-'}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Decision',
      cell: (row) => (
        <Select
          value={row.status}
          onValueChange={(v) => update.mutate({ id: row.id, body: { status: v } })}
        >
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['new', 'reviewing', 'approved', 'rejected'].map((sv) => (
              <SelectItem key={sv} value={sv}>{sv}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      header: 'Received',
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {row.createdAt ? format(new Date(row.createdAt), 'dd MMM HH:mm') : ''}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.applications || []}
      isLoading={isLoading}
    />
  );
}

export default function Shop() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shop</h1>
        <p className="text-sm text-slate-500">
          Orders, catalogue and merchant applications from shopvelodash.com.
        </p>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders"><ShoppingBag className="w-4 h-4 mr-2" />Orders</TabsTrigger>
          <TabsTrigger value="products"><Package className="w-4 h-4 mr-2" />Catalogue</TabsTrigger>
          <TabsTrigger value="applications"><Store className="w-4 h-4 mr-2" />Merchant applications</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4"><Orders /></TabsContent>
        <TabsContent value="products" className="mt-4"><Products /></TabsContent>
        <TabsContent value="applications" className="mt-4"><Applications /></TabsContent>
      </Tabs>
    </div>
  );
}
