import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import LiveTrackingMap from '@/components/orders/LiveTrackingMap';
import AutoDispatchButton from '@/components/orders/AutoDispatchButton';
import { NotificationService } from '@/components/notifications/NotificationService';
import { MoreHorizontal, Eye, XCircle, MapPin, Package, Car, Clock, DollarSign, Search, Phone, Navigation, Ban, LogOut, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

export default function Orders() {
  const { currentLocation } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showManualDispatch, setShowManualDispatch] = useState(false);
  const [lookupOrderNumber, setLookupOrderNumber] = useState('');
  const [foundDriver, setFoundDriver] = useState(null);

  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', currentLocation],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers', currentLocation],
    queryFn: () => base44.entities.Driver.list('-created_date', 500),
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants', currentLocation],
    queryFn: () => base44.entities.Merchant.list('-created_date', 500),
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['riders', currentLocation],
    queryFn: () => base44.entities.Rider.list('-created_date', 500),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones', currentLocation],
    queryFn: () => base44.entities.Zone.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated');
      
      // Send notifications for status changes
      if (variables.data.status) {
        const order = orders.find(o => o.id === variables.id);
        if (order) {
          const driver = drivers.find(d => d.id === order.driver_id);
          const rider = riders.find(r => r.id === (order.rider_id || order.customer_id));
          await NotificationService.notifyOrderStatusChange(
            { ...order, ...variables.data },
            variables.data.status,
            driver,
            rider
          );
        }
      }
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: ({ orderId, driverId }) => base44.entities.Order.assignDriver(orderId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Driver assigned successfully');
      setShowManualDispatch(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const refundMutation = useMutation({
    mutationFn: ({ userId, amount, reason }) => base44.entities.User.creditWallet(userId, amount, reason),
    onSuccess: () => {
      toast.success('Refund issued successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver updated');
    },
  });

  const handleCancel = (order) => {
    updateMutation.mutate({ id: order.id, data: { status: 'cancelled' } });
  };

  const handleDriverLookup = () => {
    if (!lookupOrderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }
    const order = orders.find(o => 
      o.order_number?.toLowerCase() === lookupOrderNumber.toLowerCase() ||
      o.id === lookupOrderNumber
    );
    if (!order) {
      toast.error('Order not found');
      setFoundDriver(null);
      return;
    }
    if (!order.driver_id) {
      toast.error('No driver assigned to this order');
      setFoundDriver(null);
      return;
    }
    const driver = drivers.find(d => d.id === order.driver_id);
    if (!driver) {
      toast.error('Driver not found');
      setFoundDriver(null);
      return;
    }
    setFoundDriver({ ...driver, order });
    toast.success('Driver found');
  };

  const handleBanDriver = () => {
    if (!foundDriver) return;
    updateDriverMutation.mutate({ 
      id: foundDriver.id, 
      data: { status: 'suspended' } 
    });
    toast.success('Driver banned');
  };

  const handleLogoutDriver = () => {
    if (!foundDriver) return;
    updateDriverMutation.mutate({ 
      id: foundDriver.id, 
      data: { status: 'offline' } 
    });
    toast.success('Driver logged out - contact customer support message sent');
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.order_number?.toLowerCase().includes(searchValue.toLowerCase()) ||
      o.rider_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      o.driver_name?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesType = typeFilter === 'all' || o.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const columns = [
    {
      header: 'Order',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${row.type === 'ride' ? 'bg-indigo-100' : 'bg-violet-100'}`}>
            {row.type === 'ride' ? (
              <Car className={`w-4 h-4 ${row.type === 'ride' ? 'text-indigo-600' : 'text-violet-600'}`} />
            ) : (
              <Package className="w-4 h-4 text-violet-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.order_number || `#${row.id?.slice(-8)}`}</p>
            <p className="text-sm text-slate-500 capitalize">{row.type}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.rider_name || '-'}</p>
        </div>
      ),
    },
    {
      header: 'Driver/Merchant',
      cell: (row) => (
        <div>
          <p className="text-sm text-slate-900">{row.driver_name || '-'}</p>
          {row.type === 'delivery' && (
            <p className="text-sm text-slate-500">{row.merchant_name || '-'}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Route',
      cell: (row) => (
        <div className="max-w-[200px]">
          <div className="flex items-start gap-1">
            <MapPin className="w-3 h-3 text-emerald-500 mt-1 flex-shrink-0" />
            <p className="text-xs text-slate-600 truncate">{row.pickup_address || '-'}</p>
          </div>
          <div className="flex items-start gap-1 mt-1">
            <MapPin className="w-3 h-3 text-rose-500 mt-1 flex-shrink-0" />
            <p className="text-xs text-slate-600 truncate">{row.dropoff_address || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Amount',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">₵{Number(row.total_amount || 0).toFixed(2)}</p>
          {row.surge_multiplier > 1 && (
            <p className="text-xs text-amber-600">{row.surge_multiplier}x surge</p>
          )}
        </div>
      ),
    },
    {
      header: 'Payment',
      cell: (row) => (
        <div>
          <StatusBadge status={row.payment_status} />
          <p className="text-xs text-slate-500 mt-1 capitalize">{row.payment_method}</p>
        </div>
      ),
    },
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {format(new Date(row.created_date), 'MMM d, h:mm a')}
        </span>
      ),
    },
    {
      header: '',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedOrder(row); setShowDetails(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            {row.status === 'pending' && !row.driver_id && (
              <>
                <DropdownMenuItem onClick={() => { setSelectedOrder(row); setShowDetails(true); }}>
                  <Zap className="w-4 h-4 mr-2" /> Auto-Assign Driver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedOrder(row); setShowManualDispatch(true); }}>
                  <Navigation className="w-4 h-4 mr-2" /> Manual Dispatch
                </DropdownMenuItem>
              </>
            )}
            {row.payment_status === 'paid' && (
              <DropdownMenuItem 
                onClick={() => {
                  const reason = window.prompt('Reason for refund:');
                  if (reason) refundMutation.mutate({ userId: row.rider_id || row.customer_id, amount: row.total_amount, reason });
                }}
                className="text-amber-600"
              >
                <DollarSign className="w-4 h-4 mr-2" /> Issue Refund
              </DropdownMenuItem>
            )}
            {!['completed', 'delivered', 'cancelled'].includes(row.status) && (
              <DropdownMenuItem onClick={() => handleCancel(row)} className="text-rose-600">
                <XCircle className="w-4 h-4 mr-2" /> Cancel Order
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orders & Rides</h2>
          <p className="text-slate-500">Monitor all deliveries and ride-hailing activities</p>
        </div>
        <Button onClick={() => setShowDriverLookup(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Search className="w-4 h-4 mr-2" /> Locate Driver
        </Button>
      </div>

      <Card className="p-6 bg-white border-0 shadow-sm">
        <div className="mb-6">
          <Tabs value={typeFilter} onValueChange={setTypeFilter}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="delivery">Deliveries</TabsTrigger>
              <TabsTrigger value="ride">Rides</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <DataTable
          columns={columns}
          data={filteredOrders}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search orders..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={statusOptions}
          filterPlaceholder="Filter by status"
          emptyMessage="No orders found"
        />
      </Card>

      {/* Driver Lookup Dialog */}
      <Dialog open={showDriverLookup} onOpenChange={setShowDriverLookup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Locate Driver by Order Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex gap-3">
              <Input
                placeholder="Enter order number..."
                value={lookupOrderNumber}
                onChange={(e) => setLookupOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDriverLookup()}
              />
              <Button onClick={handleDriverLookup} className="bg-indigo-600 hover:bg-indigo-700">
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
            </div>

            {foundDriver && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Car className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{foundDriver.full_name}</h3>
                        <p className="text-sm text-slate-500">{foundDriver.vehicle_type} - {foundDriver.vehicle_number}</p>
                      </div>
                    </div>
                    <StatusBadge status={foundDriver.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium">{foundDriver.phone}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-medium text-sm truncate">{foundDriver.email}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-slate-500">Order Number</p>
                      <p className="font-medium">{foundDriver.order.order_number || foundDriver.order.id}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-slate-500">Service Type</p>
                      <p className="font-medium capitalize">{foundDriver.service_type}</p>
                    </div>
                  </div>

                  {foundDriver.order && (
                    <div className="p-3 bg-white rounded-lg mb-4">
                      <p className="text-xs text-slate-500 mb-2">Route</p>
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-emerald-500 mt-0.5" />
                        <p className="text-sm">{foundDriver.order.pickup_address || 'N/A'}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-500 mt-0.5" />
                        <p className="text-sm">{foundDriver.order.dropoff_address || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => window.open(`tel:${foundDriver.phone}`, '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      <Phone className="w-4 h-4 mr-2" /> Contact
                    </Button>
                    <Button 
                      onClick={() => {
                        if (foundDriver.order.pickup_latitude && foundDriver.order.dropoff_latitude) {
                          window.open(`https://www.google.com/maps/dir/${foundDriver.order.pickup_latitude},${foundDriver.order.pickup_longitude}/${foundDriver.order.dropoff_latitude},${foundDriver.order.dropoff_longitude}`, '_blank');
                        } else {
                          toast.error('Route coordinates not available');
                        }
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Navigation className="w-4 h-4 mr-2" /> View Route
                    </Button>
                    <Button 
                      onClick={handleBanDriver}
                      variant="outline"
                      className="w-full text-rose-600 hover:text-rose-700"
                    >
                      <Ban className="w-4 h-4 mr-2" /> Ban Driver
                    </Button>
                    <Button 
                      onClick={handleLogoutDriver}
                      variant="outline"
                      className="w-full text-amber-600 hover:text-amber-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Logging out will send message: "Contact customer support immediately"
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order Details</span>
              {selectedOrder && (
                <AutoDispatchButton 
                  order={selectedOrder} 
                  onSuccess={() => setShowDetails(false)}
                />
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${selectedOrder.type === 'ride' ? 'bg-indigo-100' : 'bg-violet-100'}`}>
                    {selectedOrder.type === 'ride' ? (
                      <Car className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <Package className="w-6 h-6 text-violet-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedOrder.order_number || `#${selectedOrder.id?.slice(-8)}`}</h3>
                    <p className="text-slate-500 capitalize">{selectedOrder.type}</p>
                  </div>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="font-medium">{selectedOrder.rider_name || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Driver</p>
                  <p className="font-medium">{selectedOrder.driver_name || '-'}</p>
                </div>
                {selectedOrder.type === 'delivery' && (
                  <div className="p-4 bg-slate-50 rounded-xl col-span-2">
                    <p className="text-sm text-slate-500">Merchant</p>
                    <p className="font-medium">{selectedOrder.merchant_name || '-'}</p>
                  </div>
                )}
              </div>

              {/* Live Tracking Map */}
              {['picked_up', 'in_transit'].includes(selectedOrder.status) && selectedOrder.driver_id && (
                <LiveTrackingMap 
                  order={selectedOrder} 
                  driver={drivers.find(d => d.id === selectedOrder.driver_id)}
                />
              )}

              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Route</h4>
                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Pickup</p>
                    <p className="font-medium">{selectedOrder.pickup_address || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-rose-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Dropoff</p>
                    <p className="font-medium">{selectedOrder.dropoff_address || '-'}</p>
                  </div>
                </div>
              </div>

              {selectedOrder.items?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Items</h4>
                  <div className="border rounded-xl divide-y">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">₵{Number(item.price || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-lg font-bold text-slate-900">₵{Number(selectedOrder.subtotal || 0).toFixed(2)}</p>
                  <p className="text-sm text-slate-500">Subtotal</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-lg font-bold text-slate-900">₵{Number(selectedOrder.delivery_fee || 0).toFixed(2)}</p>
                  <p className="text-sm text-slate-500">Delivery Fee</p>
                </div>
                <div className="text-center p-4 bg-violet-50 rounded-xl">
                  <p className="text-lg font-bold text-violet-600">₵{Number(selectedOrder.total_amount || 0).toFixed(2)}</p>
                  <p className="text-sm text-slate-500">Total</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-lg font-bold text-emerald-600">₵{Number(selectedOrder.commission_amount || 0).toFixed(2)}</p>
                  <p className="text-sm text-slate-500">Commission</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Payment Method</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_method}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Payment Status</p>
                  <StatusBadge status={selectedOrder.payment_status} />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium">{format(new Date(selectedOrder.created_date), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="font-medium">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Manual Dispatch Dialog */}
      <Dialog open={showManualDispatch} onOpenChange={setShowManualDispatch}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manual Driver Assignment - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search drivers by name, phone or vehicle..." className="pl-10" />
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto border rounded-xl divide-y">
              {drivers?.filter(d => d.status === 'online').length === 0 ? (
                <p className="p-8 text-center text-slate-500 text-sm">No online drivers available at the moment.</p>
              ) : (
                drivers?.filter(d => d.status === 'online').map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={driver.photo_url} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-600 font-medium">
                          {driver.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{driver.full_name}</p>
                        <p className="text-xs text-slate-500">{driver.vehicle_type} • {driver.vehicle_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm justify-end">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span>{driver.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <p className="text-xs text-slate-400">{driver.total_trips || 0} trips</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => assignDriverMutation.mutate({ orderId: selectedOrder.id, driverId: driver.id })}
                        disabled={assignDriverMutation.isPending}
                        className="bg-violet-600 hover:bg-violet-700 h-8"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}