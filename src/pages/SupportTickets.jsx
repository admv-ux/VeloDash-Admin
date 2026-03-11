import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { MoreHorizontal, Eye, CheckCircle, Clock, XCircle, MessageSquare, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SupportTickets() {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket updated');
      setShowDetails(false);
    },
  });

  const handleStatusChange = (ticket, newStatus) => {
    updateMutation.mutate({ id: ticket.id, data: { status: newStatus } });
  };

  const handleResolve = () => {
    const data = {
      status: 'resolved',
      resolution,
    };
    if (refundAmount) {
      data.refund_amount = parseFloat(refundAmount);
    }
    updateMutation.mutate({ id: selectedTicket.id, data });
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      t.ticket_number?.toLowerCase().includes(searchValue.toLowerCase()) ||
      t.subject?.toLowerCase().includes(searchValue.toLowerCase()) ||
      t.user_name?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Ticket',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.ticket_number || `#${row.id?.slice(-6)}`}</p>
          <p className="text-sm text-slate-500 truncate max-w-[200px]">{row.subject}</p>
        </div>
      ),
    },
    {
      header: 'User',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.user_name || '-'}</p>
          <p className="text-sm text-slate-500 capitalize">{row.user_type}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => (
        <span className="text-sm text-slate-700 capitalize">{row.category?.replace(/_/g, ' ')}</span>
      ),
    },
    {
      header: 'Priority',
      cell: (row) => <StatusBadge status={row.priority} />,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Refund',
      cell: (row) => (
        row.refund_amount ? (
          <span className="font-medium text-emerald-600">₵{row.refund_amount.toFixed(2)}</span>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
    {
      header: 'Created',
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
            <DropdownMenuItem onClick={() => { 
              setSelectedTicket(row); 
              setResolution(row.resolution || '');
              setRefundAmount(row.refund_amount?.toString() || '');
              setShowDetails(true); 
            }}>
              <Eye className="w-4 h-4 mr-2" /> View & Resolve
            </DropdownMenuItem>
            {row.status === 'open' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, 'in_progress')}>
                <Clock className="w-4 h-4 mr-2 text-blue-600" /> Mark In Progress
              </DropdownMenuItem>
            )}
            {row.status !== 'closed' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, 'closed')}>
                <XCircle className="w-4 h-4 mr-2 text-slate-600" /> Close
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Support Tickets</h2>
          <p className="text-slate-500">Handle disputes, refunds, and support requests</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-amber-50 border-0">
          <p className="text-2xl font-bold text-amber-600">{tickets.filter(t => t.status === 'open').length}</p>
          <p className="text-sm text-slate-600">Open</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-0">
          <p className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'in_progress').length}</p>
          <p className="text-sm text-slate-600">In Progress</p>
        </Card>
        <Card className="p-4 bg-rose-50 border-0">
          <p className="text-2xl font-bold text-rose-600">{tickets.filter(t => t.priority === 'urgent').length}</p>
          <p className="text-sm text-slate-600">Urgent</p>
        </Card>
        <Card className="p-4 bg-emerald-50 border-0">
          <p className="text-2xl font-bold text-emerald-600">{tickets.filter(t => t.status === 'resolved').length}</p>
          <p className="text-sm text-slate-600">Resolved</p>
        </Card>
      </div>

      <Card className="p-6 bg-white border-0 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredTickets}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search tickets..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={statusOptions}
          filterPlaceholder="Filter by status"
          emptyMessage="No tickets found"
        />
      </Card>

      {/* Details & Resolve Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedTicket.ticket_number || `#${selectedTicket.id?.slice(-6)}`}</h3>
                  <p className="text-slate-500">{selectedTicket.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedTicket.priority} />
                  <StatusBadge status={selectedTicket.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-medium">{selectedTicket.user_name}</p>
                  <p className="text-sm text-slate-500">{selectedTicket.user_email}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">User Type</p>
                  <p className="font-medium capitalize">{selectedTicket.user_type}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="font-medium capitalize">{selectedTicket.category?.replace(/_/g, ' ')}</p>
                </div>
                {selectedTicket.order_id && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Related Order</p>
                    <p className="font-medium">{selectedTicket.order_id}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-2">Description</p>
                <p className="text-slate-700">{selectedTicket.description}</p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Resolution</h4>
                <div className="space-y-2">
                  <Label>Resolution Notes</Label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Enter resolution details..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Refund Amount (optional)</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-40"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleResolve}
                  disabled={!resolution}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Resolve Ticket
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}