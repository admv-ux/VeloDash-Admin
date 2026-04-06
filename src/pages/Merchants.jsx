import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, getErrorMessage } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import MerchantForm from '@/components/merchants/MerchantForm';
import CategoryManager from '@/components/merchants/CategoryManager';
import { MoreHorizontal, Eye, CheckCircle, XCircle, Ban, Trash2, Plus, Star, MapPin, Phone, FolderTree, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

export default function Merchants() {
  const { currentLocation } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const queryClient = useQueryClient();

  const { data: merchants = [], isLoading } = useQuery({
    queryKey: ['merchants', currentLocation],
    queryFn: () => base44.entities.Merchant.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Merchant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      toast.success('Merchant updated successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Merchant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      toast.success('Merchant deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const syncMutation = useMutation({
    mutationFn: () => base44.entities.Merchant.syncAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      toast.success(`Sync complete! Fixed ${data.fixedRoles} roles, ${data.fixedStats} stats, and ${data.fixedVisibility} visibility issues.`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleStatusChange = (merchant, newStatus) => {
    updateMutation.mutate({ id: merchant.id, data: { status: newStatus } });
  };

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch = 
      m.business_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Merchant',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.logo_url} />
            <AvatarFallback className="bg-violet-100 text-violet-600 font-medium">
              {row.business_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-slate-900">{row.business_name}</p>
            <p className="text-sm text-slate-500">{row.owner_name}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: (row) => (
        <div>
          <p className="text-sm text-slate-900">{row.email}</p>
          <p className="text-sm text-slate-500">{row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => (
        <span className="text-sm text-slate-700 capitalize">{row.category || '-'}</span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Stats',
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-3 h-3 text-amber-500" />
            <span>{Number(row.rating || 0).toFixed(1)}</span>
          </div>
          <p className="text-xs text-slate-500">{row.total_orders || 0} orders</p>
        </div>
      ),
    },
    {
      header: 'Revenue',
      cell: (row) => (
        <span className="font-medium text-slate-900">
          ₵{Number(row.total_revenue || 0).toFixed(2)}
        </span>
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
            <DropdownMenuItem onClick={() => { setSelectedMerchant(row); setShowDetails(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedMerchant(row); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Edit Profile
            </DropdownMenuItem>
            {row.status === 'pending' && (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange(row, 'approved')}>
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(row, 'rejected')}>
                  <XCircle className="w-4 h-4 mr-2 text-rose-600" /> Reject
                </DropdownMenuItem>
              </>
            )}
            {row.status === 'approved' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, 'suspended')}>
                <Ban className="w-4 h-4 mr-2 text-amber-600" /> Suspend
              </DropdownMenuItem>
            )}
            {row.status === 'suspended' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, 'approved')}>
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
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end mb-4 gap-2">
          <Button 
            variant="outline" 
            onClick={() => syncMutation.mutate()} 
            disabled={syncMutation.isPending}
            className="border-slate-200 hover:bg-slate-50"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Merchants
          </Button>
          <Button variant="outline" onClick={() => setShowCategories(true)} className="border-slate-200 hover:bg-slate-50">
            <FolderTree className="w-4 h-4 mr-2" /> Categories
          </Button>
          <Button onClick={() => { setSelectedMerchant(null); setShowForm(true); }} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" /> Add Merchant
          </Button>
        </div>
 
      <Card className="p-6 bg-white border-0 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredMerchants}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search merchants..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={filterOptions}
          filterPlaceholder="Filter by status"
          emptyMessage="No merchants found"
        />
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMerchant ? 'Edit Merchant' : 'Add New Merchant'}</DialogTitle>
            <DialogDescription>
              {selectedMerchant ? 'Update the merchant profile details below.' : 'Enter the details for the new merchant account.'}
            </DialogDescription>
          </DialogHeader>
          <MerchantForm
            merchant={selectedMerchant}
            onClose={() => setShowForm(false)}
            onManageCategories={() => { setShowForm(false); setShowCategories(true); }}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merchant Details</DialogTitle>
            <DialogDescription>
              Viewing full profile and activity for {selectedMerchant?.business_name}.
            </DialogDescription>
          </DialogHeader>
          {selectedMerchant && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMerchant.logo_url} />
                  <AvatarFallback className="bg-violet-100 text-violet-600 text-xl">
                    {selectedMerchant.business_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{selectedMerchant.business_name}</h3>
                    <StatusBadge status={selectedMerchant.status} />
                  </div>
                  <p className="text-slate-500">{selectedMerchant.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Owner</p>
                  <p className="font-medium">{selectedMerchant.owner_name || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{selectedMerchant.email}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{selectedMerchant.phone}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Commission Rate</p>
                  <p className="font-medium">{selectedMerchant.commission_rate || 15}%</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="font-medium">{selectedMerchant.address || '-'}</p>
                    <p className="text-slate-500">{selectedMerchant.city}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-violet-50 rounded-xl">
                  <p className="text-2xl font-bold text-violet-600">{selectedMerchant.total_orders || 0}</p>
                  <p className="text-sm text-slate-500">Total Orders</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">₵{Number(selectedMerchant.total_revenue || 0).toFixed(2)}</p>
                  <p className="text-sm text-slate-500">Revenue</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{Number(selectedMerchant.rating || 0).toFixed(1)}</p>
                  <p className="text-sm text-slate-500">Rating</p>
                </div>
              </div>

              {selectedMerchant.documents_url && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Documents</p>
                  <a 
                    href={selectedMerchant.documents_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:underline"
                  >
                    View Documents
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CategoryManager 
        open={showCategories} 
        onOpenChange={setShowCategories} 
      />
    </div>
  );
}