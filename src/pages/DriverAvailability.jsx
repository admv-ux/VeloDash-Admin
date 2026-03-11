import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import AvailabilityManager from '@/components/drivers/AvailabilityManager';
import { Eye, Clock, CheckCircle, XCircle, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DriverAvailability() {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('-created_date', 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const handleUpdate = async (data) => {
    if (selectedDriver) {
      await updateMutation.mutateAsync({ id: selectedDriver.id, data });
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = 
      d.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
      d.phone?.includes(searchValue);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCurrentDaySchedule = (driver) => {
    if (!driver.working_schedule) return null;
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    return driver.working_schedule[dayName];
  };

  const columns = [
    {
      header: 'Driver',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-600">
              {row.full_name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.full_name}</p>
            <p className="text-sm text-slate-500">{row.vehicle_type}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: (row) => (
        <div>
          <p className="text-sm text-slate-900">{row.phone}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            row.status === 'online' ? 'bg-emerald-500 animate-pulse' :
            row.status === 'busy' ? 'bg-amber-500' :
            'bg-slate-400'
          }`} />
          <StatusBadge status={row.status} />
        </div>
      ),
    },
    {
      header: 'Accepting Orders',
      cell: (row) => (
        row.accepting_orders !== false ? (
          <div className="flex items-center gap-1 text-emerald-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Yes</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-rose-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">No</span>
          </div>
        )
      ),
    },
    {
      header: 'Today\'s Schedule',
      cell: (row) => {
        const schedule = getCurrentDaySchedule(row);
        if (!schedule || !schedule.enabled) {
          return <span className="text-sm text-slate-500">Off duty</span>;
        }
        return (
          <div className="flex items-center gap-1 text-sm text-slate-700">
            <Clock className="w-3 h-3" />
            {schedule.start} - {schedule.end}
          </div>
        );
      },
    },
    {
      header: 'Service',
      cell: (row) => (
        <span className="text-sm capitalize text-slate-600">
          {row.service_type?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: '',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedDriver(row);
            setShowDetails(true);
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          Manage
        </Button>
      ),
    },
  ];

  const statusOptions = [
    { value: 'online', label: 'Online' },
    { value: 'busy', label: 'Busy' },
    { value: 'offline', label: 'Offline' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const onlineCount = drivers.filter(d => d.status === 'online').length;
  const busyCount = drivers.filter(d => d.status === 'busy').length;
  const acceptingCount = drivers.filter(d => d.status === 'online' && d.accepting_orders !== false).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Driver Availability</h2>
        <p className="text-slate-500">Monitor and manage driver availability across the platform</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{onlineCount}</p>
              <p className="text-sm text-slate-500">Online</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Minus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{busyCount}</p>
              <p className="text-sm text-slate-500">Busy</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{acceptingCount}</p>
              <p className="text-sm text-slate-500">Accepting Orders</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <XCircle className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{drivers.length - onlineCount - busyCount}</p>
              <p className="text-sm text-slate-500">Offline</p>
            </div>
          </div>
        </Card>
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
          filterOptions={statusOptions}
          filterPlaceholder="Filter by status"
          emptyMessage="No drivers found"
        />
      </Card>

      {/* Driver Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Availability - {selectedDriver?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-lg font-medium text-slate-600">
                    {selectedDriver.full_name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{selectedDriver.full_name}</p>
                  <p className="text-sm text-slate-500">{selectedDriver.email}</p>
                </div>
                <StatusBadge status={selectedDriver.status} />
              </div>
              <AvailabilityManager driver={selectedDriver} onUpdate={handleUpdate} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}