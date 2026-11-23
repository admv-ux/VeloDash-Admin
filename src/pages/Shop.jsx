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
import {
  Package, ShoppingBag, Store, DollarSign, Clock, Truck, AlertTriangle, RefreshCw, Send, Search,
} from 'lucide-react';
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

/**
 * The supplier chain, in the order it has to happen.
 *
 * Zendrop has no create-order call, so a paid order only reaches the supplier
 * by being written into the connected Shopify store, which Zendrop then reads.
 * Showing the hops separately is what makes a stuck order diagnosable: the
 * question is never "did it fail" but "which hop did it fail at".
 */
function SupplierChain({ row }) {
  return (
    <div className="text-xs leading-5">
      <p className={row.shopifyOrderName ? 'text-slate-700' : 'text-slate-400'}>
        Shopify: {row.shopifyOrderName || 'not pushed'}
      </p>
      <p className={row.zendropOrderId ? 'text-slate-700' : 'text-slate-400'}>
        Zendrop: {row.zendropOrderId ? `#${row.zendropOrderId}${row.zendropStatus ? ` (${row.zendropStatus})` : ''}` : 'not picked up'}
      </p>
      {(row.tracking || []).length > 0 && (
        <p className="font-mono text-slate-700">
          {(row.tracking || []).map((t) => t.number).join(', ')}
        </p>
      )}
      {row.fulfillmentCost != null && (
        <p className="text-slate-500">cost {money(row.fulfillmentCost)}</p>
      )}
      {row.fulfillmentError && (
        <p className="text-red-600 max-w-[16rem] truncate" title={row.fulfillmentError}>
          {row.fulfillmentError}
        </p>
      )}
    </div>
  );
}

/** Whether the chain is wired at all, and what fulfilling draws on. */
function Wiring() {
  const { data } = useQuery({
    queryKey: ['shop-fulfilment-status'],
    queryFn: () => base44.entities.Shop.fulfillmentStatus(),
    refetchInterval: 60000,
  });
  if (!data) return null;
  const missing = [];
  if (!data.zendropConfigured) missing.push('Zendrop API token');
  if (!data.shopifyConfigured) missing.push('Shopify Admin API token');
  const credit = data.zendropCredit?.balance;

  return (
    <Card className={`p-4 ${missing.length ? 'border-amber-300 bg-amber-50' : ''}`}>
      <div className="flex items-start gap-3">
        {missing.length ? <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" /> : <Truck className="w-5 h-5 text-emerald-500 mt-0.5" />}
        <div className="text-sm">
          {missing.length ? (
            <>
              <p className="font-semibold text-amber-900">Orders cannot reach the supplier yet</p>
              <p className="text-amber-800">
                Missing: {missing.join(' and ')}. Payments are still taken and recorded; nothing ships
                until this is set.
              </p>
            </>
          ) : (
            <p className="font-semibold text-slate-900">
              Supplier chain is wired to {data.shopifyDomain}
            </p>
          )}
          <p className="text-xs text-slate-600 mt-1">
            {data.paidOrders} paid {data.paidOrders === 1 ? 'order' : 'orders'}
            {credit != null ? ` · Zendrop credit ${money(credit)}` : ''}
            {data.zendropCreditError ? ` · credit unreadable: ${data.zendropCreditError}` : ''}
          </p>
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

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['shop-orders'] });
    qc.invalidateQueries({ queryKey: ['shop-order-summary'] });
    qc.invalidateQueries({ queryKey: ['shop-fulfilment-status'] });
  };

  const push = useMutation({
    mutationFn: (id) => base44.entities.Shop.pushOrder(id),
    onSuccess: (r) => { toast.success(`Pushed to Shopify as ${r.order?.shopifyOrderName || 'an order'}`); refreshAll(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const link = useMutation({
    mutationFn: (id) => base44.entities.Shop.linkOrder(id),
    onSuccess: (r) => {
      if (r.linked) toast.success(`Zendrop order #${r.order.zendropOrderId}`);
      else toast.info('Zendrop has not picked the order up yet. Try again shortly.');
      refreshAll();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const refresh = useMutation({
    mutationFn: (id) => base44.entities.Shop.refreshOrder(id),
    onSuccess: () => { toast.success('Refreshed from Zendrop'); refreshAll(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  /**
   * Fulfilling spends real money, so the cost is fetched and shown before
   * anything is charged. Zendrop's own API works the same way: a free preview,
   * then a confirmation valid for five minutes.
   */
  const fulfil = useMutation({
    mutationFn: async (row) => {
      const preview = await base44.entities.Shop.fulfillOrder(row.id, { confirm: false });
      const cost = money(preview?.preview?.total);
      // eslint-disable-next-line no-alert
      const ok = window.confirm(
        `Fulfil ${row.orderNumber} through Zendrop?\n\nThis charges your Zendrop account ${cost} now and cannot be undone here.`,
      );
      if (!ok) return { cancelled: true };
      return base44.entities.Shop.fulfillOrder(row.id, { confirm: true });
    },
    onSuccess: (r) => {
      if (r?.cancelled) return;
      toast.success(`Dispatched. Charged ${money(r?.preview?.total)}`);
      refreshAll();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const busy = push.isPending || link.isPending || fulfil.isPending || refresh.isPending;

  /** The one action that moves this order forward, so there is nothing to choose wrongly. */
  const NextStep = ({ row }) => {
    if (row.status !== 'paid') return <span className="text-xs text-slate-400">unpaid</span>;
    if (!row.shopifyOrderId) {
      return (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => push.mutate(row.id)}>
          <Send className="w-3.5 h-3.5 mr-1" />Push to Shopify
        </Button>
      );
    }
    if (!row.zendropOrderId) {
      return (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => link.mutate(row.id)}>
          <Search className="w-3.5 h-3.5 mr-1" />Find in Zendrop
        </Button>
      );
    }
    if (!row.fulfilledAt) {
      return (
        <Button size="sm" disabled={busy} onClick={() => fulfil.mutate(row)}>
          <Truck className="w-3.5 h-3.5 mr-1" />Fulfil
        </Button>
      );
    }
    return (
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => refresh.mutate(row.id)}>
        <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
      </Button>
    );
  };

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
    { header: 'Supplier', cell: (row) => <SupplierChain row={row} /> },
    { header: 'Next step', cell: (row) => <NextStep row={row} /> },
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
      <Wiring />
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

  const syncStore = useMutation({
    mutationFn: () => base44.entities.Shop.syncStore(),
    onSuccess: (r) => {
      toast.success(
        `${r?.synced ?? 0} of ${r?.listed ?? 0} products are sellable` +
          (r?.skipped ? `, ${r.skipped} skipped` : '') +
          (r?.delisted ? `, ${r.delisted} delisted` : ''),
      );
      qc.invalidateQueries({ queryKey: ['shop-products-admin'] });
      qc.invalidateQueries({ queryKey: ['shop-status'] });
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
    {
      header: 'Options',
      cell: (row) => <span className="text-sm text-slate-600">{row.variants?.length || 0}</span>,
    },
    {
      // The only column that says whether a product can actually be shipped.
      // A product missing from the Shopify store cannot be fulfilled at all,
      // which is why it is shown next to the price rather than buried.
      header: 'Sellable',
      cell: (row) =>
        row.isFulfillable ? (
          <StatusBadge status="active" />
        ) : (
          <span className="text-xs font-medium text-amber-600">Not in store</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Stat icon={Package} label="In catalogue" value={status?.products?.total ?? status?.active ?? 0} />
        <Stat icon={Package} label="Sellable on the shop" value={status?.products?.sellable ?? 0} />
        {(status?.products?.unsellable ?? 0) > 0 && (
          <Stat icon={Package} label="Cannot be shipped" value={status.products.unsellable} />
        )}
        <Button variant="outline" onClick={() => syncStore.mutate()} disabled={syncStore.isPending}>
          {syncStore.isPending ? 'Syncing the store (several minutes)' : 'Sync from Shopify store'}
        </Button>
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
