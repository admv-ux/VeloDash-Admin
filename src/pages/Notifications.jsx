import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, Send, Bell, Users, Store, Car, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const targetIcons = {
  all: Users,
  merchants: Store,
  drivers: Car,
  riders: Users,
};

export default function Notifications() {
  const [searchValue, setSearchValue] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_group: 'all',
  });

  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create({ ...data, status: 'sent', sent_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification sent successfully');
      setShowForm(false);
      setFormData({ title: '', message: '', target_group: 'all' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredNotifications = notifications.filter((n) =>
    n.title?.toLowerCase().includes(searchValue.toLowerCase()) ||
    n.message?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    {
      header: 'Notification',
      cell: (row) => {
        const Icon = targetIcons[row.target_group] || Bell;
        return (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Icon className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{row.title}</p>
              <p className="text-sm text-slate-500 line-clamp-2 max-w-md">{row.message}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Target',
      cell: (row) => (
        <span className="text-sm text-slate-700 capitalize">{row.target_group}</span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Sent',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {row.sent_at ? format(new Date(row.sent_at), 'MMM d, h:mm a') : '-'}
        </span>
      ),
    },
    {
      header: '',
      cell: (row) => (
        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(row.id)}>
          <Trash2 className="w-4 h-4 text-rose-600" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
          <p className="text-slate-500">Send broadcast notifications to user groups</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" /> New Notification
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-violet-50 border-0">
          <p className="text-2xl font-bold text-violet-600">{notifications.filter(n => n.target_group === 'all').length}</p>
          <p className="text-sm text-slate-600">To All Users</p>
        </Card>
        <Card className="p-4 bg-indigo-50 border-0">
          <p className="text-2xl font-bold text-indigo-600">{notifications.filter(n => n.target_group === 'merchants').length}</p>
          <p className="text-sm text-slate-600">To Merchants</p>
        </Card>
        <Card className="p-4 bg-emerald-50 border-0">
          <p className="text-2xl font-bold text-emerald-600">{notifications.filter(n => n.target_group === 'drivers').length}</p>
          <p className="text-sm text-slate-600">To Drivers</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-0">
          <p className="text-2xl font-bold text-blue-600">{notifications.filter(n => n.target_group === 'riders').length}</p>
          <p className="text-sm text-slate-600">To Riders</p>
        </Card>
      </div>

      <Card className="p-6 bg-white border-0 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredNotifications}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search notifications..."
          emptyMessage="No notifications sent yet"
        />
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Target Group *</Label>
              <Select
                value={formData.target_group}
                onValueChange={(v) => setFormData({ ...formData, target_group: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="merchants">Merchants Only</SelectItem>
                  <SelectItem value="drivers">Drivers Only</SelectItem>
                  <SelectItem value="riders">Riders Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter your message..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-violet-600 hover:bg-violet-700">
                <Send className="w-4 h-4 mr-2" /> Send Now
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}