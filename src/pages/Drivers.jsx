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
import DriverForm from '@/components/drivers/DriverForm';
import { MoreHorizontal, Eye, CheckCircle, XCircle, Ban, Trash2, Plus, Star, Car, Bike, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

const vehicleIcons = {
  motorcycle: Bike,
  car: Car,
  van: Truck,
  bicycle: Bike,
};

export default function Drivers() {
  const { currentLocation } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers', currentLocation],
    queryFn: () => base44.entities.Driver.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver updated successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Driver.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleStatusChange = (driver, newStatus) => {
    updateMutation.mutate({ id: driver.id, data: { status: newStatus } });
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = 
      d.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
      d.vehicle_number?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Driver',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.photo_url} />
            <AvatarFallback className="bg-emerald-100 text-emerald-600 font-medium">
              {row.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-slate-900">{row.full_name}</p>
            <p className="text-sm text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Vehicle',
      cell: (row) => {
        const VehicleIcon = vehicleIcons[row.vehicle_type] || Car;
        return (
          <div className="flex items-center gap-2">
            <VehicleIcon className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm text-slate-900 capitalize">{row.vehicle_type || '-'}</p>
              <p className="text-xs text-slate-500">{row.vehicle_number}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Service',
      cell: (row) => (
        <span className="text-sm text-slate-700 capitalize">
          {row.service_type?.replace(/_/g, ' ') || 'Both'}
        </span>
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
            <span>{row.rating?.toFixed(1) || '0.0'}</span>
          </div>
          <p className="text-xs text-slate-500">{row.total_trips || 0} trips</p>
        </div>
      ),
    },
    {
      header: 'Earnings',
      cell: (row) => (
        <span className="font-medium text-slate-900">
          ₵{(row.total_earnings || 0).toFixed(2)}
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
            <DropdownMenuItem onClick={() => { setSelectedDriver(row); setShowDetails(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            {row.status === 'pending' && (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange(row, 'verified')}>
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(row, 'suspended')}>
                  <XCircle className="w-4 h-4 mr-2 text-rose-600" /> Reject
                </DropdownMenuItem>
              </>
            )}
            {['verified', 'online', 'offline'].includes(row.status) && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, 'suspended')}>
                <Ban className="w-4 h-4 mr-2 text-amber-600" /> Suspend
              </DropdownMenuItem>
            )}
            {row.status === 'suspended' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, 'verified')}>
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
    { value: 'verified', label: 'Verified' },
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'busy', label: 'Busy' },
    { value: 'suspended', label: 'Suspended' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Drivers</h2>
          <p className="text-slate-500">Manage all driver accounts and documents</p>
        </div>
        <Button onClick={() => { setSelectedDriver(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Add Driver
        </Button>
      </div>

      <Card className="p-6 bg-white border-0 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredDrivers}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search drivers..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={filterOptions}
          filterPlaceholder="Filter by status"
          emptyMessage="No drivers found"
        />
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
          </DialogHeader>
          <DriverForm
            driver={selectedDriver}
            onClose={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedDriver.photo_url} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xl">
                    {selectedDriver.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{selectedDriver.full_name}</h3>
                    <StatusBadge status={selectedDriver.status} />
                  </div>
                  <p className="text-slate-500 capitalize">{selectedDriver.service_type?.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{selectedDriver.email}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{selectedDriver.phone}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Vehicle Type</p>
                  <p className="font-medium capitalize">{selectedDriver.vehicle_type}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Vehicle Number</p>
                  <p className="font-medium">{selectedDriver.vehicle_number}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">License Number</p>
                  <p className="font-medium">{selectedDriver.license_number || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Wallet Balance</p>
                  <p className="font-medium">₵{(selectedDriver.wallet_balance || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{selectedDriver.total_trips || 0}</p>
                  <p className="text-sm text-slate-500">Total Trips</p>
                </div>
                <div className="text-center p-4 bg-violet-50 rounded-xl">
                  <p className="text-2xl font-bold text-violet-600">₵{(selectedDriver.total_earnings || 0).toFixed(2)}</p>
                  <p className="text-sm text-slate-500">Earnings</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{selectedDriver.rating?.toFixed(1) || '0.0'}</p>
                  <p className="text-sm text-slate-500">Rating</p>
                </div>
              </div>

              {selectedDriver.documents_url && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Documents</p>
                  <a 
                    href={selectedDriver.documents_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline"
                  >
                    View Documents
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}