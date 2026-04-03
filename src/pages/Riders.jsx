import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getCountryName } from '@/utils/country';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { MoreHorizontal, Eye, CheckCircle, Ban, Trash2, Package, Car, Wallet, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

export default function Riders() {
  const { currentLocation } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRider, setSelectedRider] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const queryClient = useQueryClient();

  const { data: riders = [], isLoading } = useQuery({
    queryKey: ['riders', currentLocation],
    queryFn: () => base44.entities.Rider.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Rider.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Rider updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Rider.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Rider deleted');
    },
  });

  const handleStatusChange = (rider, newStatus) => {
    updateMutation.mutate({ id: rider.id, data: { status: newStatus } });
  };

  const handleVerify = (rider) => {
    updateMutation.mutate({ id: rider.id, data: { is_verified: true, status: 'active' } });
  };

  const filteredRiders = riders.filter((r) => {
    const matchesSearch = 
      r.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
      r.phone?.includes(searchValue);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendNotification = async () => {
    if (!selectedRider || !notifTitle || !notifBody) return;
    setIsSendingNotif(true);
    try {
      await base44.entities.Notification.sendPrivate(selectedRider.id, {
        title: notifTitle,
        body: notifBody,
        data: { type: 'admin_private_message' }
      });
      toast.success('Notification sent successfully');
      setShowNotificationDialog(false);
      setNotifTitle('');
      setNotifBody('');
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const columns = [
    {
      header: 'First Name',
      cell: (row) => <span className="font-medium text-slate-900">{row.first_name}</span>,
    },
    {
      header: 'Last Name',
      cell: (row) => <span className="font-medium text-slate-900">{row.last_name}</span>,
    },
    {
      header: 'Country',
      cell: (row) => <span className="text-sm text-slate-600 uppercase font-semibold">{getCountryName(row.country || 'GH')}</span>,
    },
    {
      header: 'Contact',
      cell: (row) => (
        <div>
          <p className="text-sm text-slate-900">{row.phone}</p>
          <p className="text-sm text-slate-500 truncate max-w-[200px]">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Activity',
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-3 h-3 text-violet-500" />
            <span>{row.total_orders || 0} orders</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Car className="w-3 h-3" />
            <span>{row.total_rides || 0} rides</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Spending',
      cell: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">${(row.total_spent || 0).toFixed(2)}</p>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Wallet className="w-3 h-3" />
            ${(row.wallet_balance || 0).toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      header: 'Joined',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {format(new Date(row.created_date), 'MMM d, yyyy')}
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
            <DropdownMenuItem onClick={() => { setSelectedRider(row); setShowDetails(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedRider(row); setShowNotificationDialog(true); }}>
              <MessageSquare className="w-4 h-4 mr-2 text-blue-600" /> Send Message
            </DropdownMenuItem>
            {!row.is_verified && (
              <DropdownMenuItem onClick={() => handleVerify(row)}>
                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" /> Verify
              </DropdownMenuItem>
            )}
            {row.status === 'active' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, 'suspended')}>
                <Ban className="w-4 h-4 mr-2 text-amber-600" /> Suspend
              </DropdownMenuItem>
            )}
            {row.status === 'suspended' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, 'active')}>
                <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Reactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => deleteMutation.mutate(row.id)}
              className="text-rose-600"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filterOptions = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending_verification', label: 'Pending Verification' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Riders / Buyers</h2>
          <p className="text-slate-500">Manage all customer accounts</p>
        </div>
      </div>

      <Card className="p-6 bg-white border-0 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredRiders}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search riders..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={filterOptions}
          filterPlaceholder="Filter by status"
          emptyMessage="No riders found"
        />
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rider Details</DialogTitle>
          </DialogHeader>
          {selectedRider && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedRider.photo_url} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                    {selectedRider.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{selectedRider.full_name}</h3>
                    <StatusBadge status={selectedRider.status} />
                    {selectedRider.is_verified && (
                      <span className="flex items-center gap-1 text-sm text-blue-600">
                        <CheckCircle className="w-4 h-4" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500">{selectedRider.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{selectedRider.phone}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">City</p>
                  <p className="font-medium">{selectedRider.city || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl col-span-2">
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium">{selectedRider.address || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-violet-50 rounded-xl">
                  <p className="text-2xl font-bold text-violet-600">{selectedRider.total_orders || 0}</p>
                  <p className="text-sm text-slate-500">Orders</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <p className="text-2xl font-bold text-indigo-600">{selectedRider.total_rides || 0}</p>
                  <p className="text-sm text-slate-500">Rides</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">${(selectedRider.total_spent || 0).toFixed(2)}</p>
                  <p className="text-sm text-slate-500">Total Spent</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">${(selectedRider.wallet_balance || 0).toFixed(2)}</p>
                  <p className="text-sm text-slate-500">Wallet</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Private Message</DialogTitle>
            <DialogDescription>
              To: {selectedRider?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Message Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Exclusive Discount Just for You!" 
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message Body</Label>
              <Textarea 
                id="body" 
                placeholder="Type your message here..." 
                className="min-h-[100px]"
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSendNotification} 
              disabled={!notifTitle || !notifBody || isSendingNotif}
            >
              {isSendingNotif ? 'Sending...' : 'Send Notification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}