import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, getErrorMessage } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import DataTable from '@/components/shared/DataTable';
import DriverForm from '@/components/drivers/DriverForm';
import AvailabilityManager from '@/components/drivers/AvailabilityManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MoreHorizontal, Eye, CheckCircle, XCircle, Ban, Trash2, Plus,
  Star, Car, Bike, Truck, FileText, ShieldCheck, ShieldX, Image,
  AlertTriangle, Clock, MapPin, Mail, Phone, CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

const vehicleIcons = {
  motorcycle: Bike,
  car: Car,
  van: Truck,
  bicycle: Bike,
};

function VerificationBadge({ status }) {
  const map = {
    pending:  { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Clock },
    approved: { label: 'Verified',       cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: ShieldCheck },
    rejected: { label: 'Rejected',       cls: 'bg-rose-100 text-rose-700 border-rose-200', Icon: ShieldX },
  };
  const { label, cls, Icon } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function DocumentViewer({ url, label }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <Image className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-400">No {label} uploaded</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block group">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 hover:border-emerald-400 transition-colors">
          <img
            src={url}
            alt={label}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div className="hidden flex-col items-center justify-center h-48 bg-slate-50">
            <FileText className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm text-emerald-600 hover:underline">View Document</p>
          </div>
        </div>
      </a>
    </div>
  );
}

export default function Drivers() {
  const { currentLocation } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyAction, setVerifyAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers', currentLocation],
    queryFn: () => base44.entities.Driver.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); toast.success('Driver updated'); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, action, rejectionReason }) =>
      base44.entities.Driver.verify(id, action, rejectionReason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(vars.action === 'approve' ? 'Driver approved!' : 'Driver rejected.');
      setShowVerifyDialog(false);
      setShowDetails(false);
      setRejectionReason('');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Driver.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); toast.success('Driver deleted'); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const openVerifyDialog = (driver, action) => {
    setSelectedDriver(driver);
    setVerifyAction(action);
    setRejectionReason('');
    setShowVerifyDialog(true);
  };

  const confirmVerification = () => {
    if (!selectedDriver || !verifyAction) return;
    if (verifyAction === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    verifyMutation.mutate({ id: selectedDriver.id, action: verifyAction, rejectionReason: rejectionReason.trim() || undefined });
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
      d.vehicle_number?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = drivers.filter((d) => d.status === 'pending').length;

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
            <p className="text-sm text-slate-500">{row.email || row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Vehicle',
      cell: (row) => {
        const VIcon = vehicleIcons[row.vehicle_type?.toLowerCase()] || Car;
        return (
          <div className="flex items-center gap-2">
            <VIcon className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm text-slate-900 capitalize">{row.vehicle_type || '-'}</p>
              <p className="text-xs text-slate-500">{row.vehicle_number}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Region',
      cell: (row) => <span className="text-sm text-slate-700">{row.region || '-'}</span>,
    },
    {
      header: 'Verification',
      cell: (row) => <VerificationBadge status={row.status} />,
    },
    {
      header: 'Documents',
      cell: (row) => {
        const hasId = Boolean(row.id_front_url);
        const hasLicense = Boolean(row.license_number);
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] ${hasId ? 'border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-400'}`}>
              {hasId ? '✓' : '✗'} ID
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${hasLicense ? 'border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-400'}`}>
              {hasLicense ? '✓' : '✗'} License
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'Joined',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {row.created_date ? format(new Date(row.created_date), 'MMM d, yyyy') : '-'}
        </span>
      ),
    },
    {
      header: '',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedDriver(row); setShowDetails(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View & Verify
            </DropdownMenuItem>
            {row.status === 'pending' && (
              <>
                <DropdownMenuItem onClick={() => openVerifyDialog(row, 'approve')}>
                  <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" /> Quick Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openVerifyDialog(row, 'reject')}>
                  <ShieldX className="w-4 h-4 mr-2 text-rose-600" /> Reject
                </DropdownMenuItem>
              </>
            )}
            {row.status === 'approved' && (
              <DropdownMenuItem onClick={() => openVerifyDialog(row, 'reject')}>
                <Ban className="w-4 h-4 mr-2 text-amber-600" /> Revoke
              </DropdownMenuItem>
            )}
            {row.status === 'rejected' && (
              <DropdownMenuItem onClick={() => openVerifyDialog(row, 'approve')}>
                <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Re-approve
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => deleteMutation.mutate(row.id)} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filterOptions = [
    { value: 'pending', label: `Pending${pendingCount ? ` (${pendingCount})` : ''}` },
    { value: 'approved', label: 'Verified' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {pendingCount} driver{pendingCount > 1 ? 's' : ''} awaiting verification
            </p>
            <p className="text-xs text-amber-600">Review documents and approve or reject applications.</p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setStatusFilter('pending')}>
            Review Now
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end mb-4 gap-2">
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

      {/* Add/Edit Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selectedDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle></DialogHeader>
          <DriverForm driver={selectedDriver} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Details & Verification Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Driver Details
              {selectedDriver && <VerificationBadge status={selectedDriver.status} />}
            </DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="info">Profile</TabsTrigger>
                <TabsTrigger value="documents">
                  Documents
                  {selectedDriver.status === 'pending' && <span className="ml-1.5 w-2 h-2 bg-amber-500 rounded-full inline-block" />}
                </TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>

              {/* Profile */}
              <TabsContent value="info" className="space-y-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedDriver.photo_url} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xl">{selectedDriver.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedDriver.full_name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selectedDriver.email || '-'}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selectedDriver.phone || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Vehicle Type', selectedDriver.vehicle_type, true],
                    ['Plate Number', selectedDriver.vehicle_number],
                    ['Model / Color', [selectedDriver.vehicle_model, selectedDriver.vehicle_color].filter(Boolean).join(' • ')],
                    ['Region', selectedDriver.region],
                    ['License Number', selectedDriver.license_number],
                    ['Joined', selectedDriver.created_date ? format(new Date(selectedDriver.created_date), 'MMM d, yyyy') : '-'],
                  ].map(([label, value, cap]) => (
                    <div key={label} className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 mb-1">{label}</p>
                      <p className={`font-medium ${cap ? 'capitalize' : ''}`}>{value || '-'}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Documents */}
              <TabsContent value="documents" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-900">Identification Document</h4>
                    {selectedDriver.id_status && <Badge variant="outline" className="text-xs capitalize">{selectedDriver.id_status}</Badge>}
                  </div>
                  {selectedDriver.id_number && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg text-sm flex gap-4">
                      <span><strong>Type:</strong> {selectedDriver.id_type || '-'}</span>
                      <span><strong>Number:</strong> {selectedDriver.id_number}</span>
                      {selectedDriver.id_expiry && <span><strong>Expiry:</strong> {format(new Date(selectedDriver.id_expiry), 'MMM d, yyyy')}</span>}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <DocumentViewer url={selectedDriver.id_front_url} label="ID Front" />
                    <DocumentViewer url={selectedDriver.id_back_url} label="ID Back" />
                  </div>
                </div>

                {selectedDriver.license_photo_url && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">License Photo</h4>
                    <DocumentViewer url={selectedDriver.license_photo_url} label="License" />
                  </div>
                )}

                {!selectedDriver.id_front_url && !selectedDriver.id_back_url && !selectedDriver.license_photo_url && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
                    <h4 className="text-lg font-medium text-slate-700">No Documents Submitted</h4>
                    <p className="text-sm text-slate-500 mt-1">This driver has not uploaded any identification documents yet.</p>
                  </div>
                )}

                {/* Action buttons */}
                {selectedDriver.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => openVerifyDialog(selectedDriver, 'approve')}>
                      <ShieldCheck className="w-4 h-4 mr-2" /> Approve Driver
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => openVerifyDialog(selectedDriver, 'reject')}>
                      <ShieldX className="w-4 h-4 mr-2" /> Reject Driver
                    </Button>
                  </div>
                )}
                {selectedDriver.status === 'approved' && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="flex-1 flex items-center gap-2 text-emerald-600"><ShieldCheck className="w-5 h-5" /><span className="text-sm font-medium">This driver is verified</span></div>
                    <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => openVerifyDialog(selectedDriver, 'reject')}>Revoke</Button>
                  </div>
                )}
                {selectedDriver.status === 'rejected' && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="flex-1 flex items-center gap-2 text-rose-600"><ShieldX className="w-5 h-5" /><span className="text-sm font-medium">This driver was rejected</span></div>
                    <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => openVerifyDialog(selectedDriver, 'approve')}>Re-approve</Button>
                  </div>
                )}
              </TabsContent>

              {/* Availability */}
              <TabsContent value="availability" className="space-y-4">
                <AvailabilityManager driver={selectedDriver} onUpdate={(data) => updateMutation.mutate({ id: selectedDriver.id, data })} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {verifyAction === 'approve'
                ? <><ShieldCheck className="w-5 h-5 text-emerald-600" /> Approve Driver</>
                : <><ShieldX className="w-5 h-5 text-rose-600" /> Reject Driver</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedDriver && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 font-medium">{selectedDriver.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedDriver.full_name}</p>
                  <p className="text-sm text-slate-500">{selectedDriver.phone}</p>
                </div>
              </div>
            )}
            {verifyAction === 'approve' ? (
              <p className="text-sm text-slate-600">This will mark the driver as verified and allow them to accept rides and deliveries. Make sure you have reviewed all submitted documents.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Please provide a reason for rejecting this driver.</p>
                <Textarea placeholder="e.g., ID document is blurry, license doesn't match..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>Cancel</Button>
            <Button
              onClick={confirmVerification}
              disabled={verifyMutation.isPending}
              className={verifyAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
            >
              {verifyMutation.isPending ? 'Processing...' : verifyAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
