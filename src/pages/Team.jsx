import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/shared/DataTable';
import { Plus, UserPlus, Shield, Globe, Mail, Phone, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'country_manager', label: 'Country Manager' },
  { value: 'city_operator', label: 'City Operator' },
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'finance_viewer', label: 'Finance Viewer' },
];

export default function Team() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'support_agent',
    allowedCountries: '',
    allowedCities: '',
  });

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await base44.entities.Rider.list(); // Using user list endpoint
      return response.filter(u => u.roles && u.roles.length > 0);
    },
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Waitlist.getCountries(),
  });

  const inviteMutation = useMutation({
    mutationFn: (data) => {
      // Logic to invite or update admin user
      // This would typically be a specific endpoint for staff management
      return base44.entities.Rider.update(data.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Team member updated');
      setShowAddDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedUser(null);
    setFormData({
      email: '',
      role: 'support_agent',
      allowedCountries: '',
      allowedCities: '',
    });
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    const role = user.roles?.[0]?.name || 'support_agent';
    setFormData({
      email: user.email,
      role: role,
      allowedCountries: user.roles?.[0]?.allowedCountries?.join(', ') || '',
      allowedCities: user.roles?.[0]?.allowedCities?.join(', ') || '',
    });
    setShowAddDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      allowedCountries: formData.allowedCountries.split(',').map(c => c.trim()).filter(Boolean),
      allowedCities: formData.allowedCities.split(',').map(c => c.trim()).filter(Boolean),
    };
    if (selectedUser) {
      inviteMutation.mutate({ id: selectedUser.id, ...payload });
    } else {
      // Logic for new user invitation
      toast.info('Invitation logic would go here');
    }
  };

  const columns = [
    {
      header: 'Member',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
            {row.full_name?.charAt(0) || row.email?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.full_name || 'Admin'}</p>
            <p className="text-sm text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles?.map(r => (
            <Badge key={r.name} variant="secondary" className="bg-violet-50 text-violet-700 hover:bg-violet-100 border-none capitalize">
              <Shield className="w-3 h-3 mr-1" />
              {r.name.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Permissions',
      cell: (row) => {
        const role = row.roles?.[0];
        if (!role) return '-';
        if (role.name === 'super_admin') return <span className="text-xs text-slate-500 italic text-violet-600 font-medium">Global Access</span>;
        
        return (
          <div className="space-y-1">
            {role.allowedCountries?.length > 0 && (
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {role.allowedCountries.join(', ')}
              </p>
            )}
            {role.allowedCities?.length > 0 && (
              <p className="text-xs text-slate-500 flex items-center gap-1 pl-4">
                 {role.allowedCities.join(', ')}
              </p>
            )}
            {!role.allowedCountries?.length && !role.allowedCities?.length && (
              <span className="text-xs text-slate-400 italic">No restrictions</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Last Active',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {row.last_active ? new Date(row.last_active).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Edit2 className="w-4 h-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Team Management</h2>
          <p className="text-slate-500">Manage administrative access and permissions</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-violet-600 hover:bg-violet-700">
          <UserPlus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white border-none shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Members</p>
          <p className="text-3xl font-bold text-slate-900">{users.length}</p>
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Super Admins</p>
          <p className="text-3xl font-bold text-violet-600">
            {users.filter(u => u.roles?.some(r => r.name === 'super_admin')).length}
          </p>
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Regional Leads</p>
          <p className="text-3xl font-bold text-emerald-600">
            {users.filter(u => u.roles?.some(r => r.name === 'country_manager')).length}
          </p>
        </Card>
      </div>

      <Card className="p-0 border-none shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          searchPlaceholder="Search team members..."
          emptyMessage="No team members found"
        />
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit Member' : 'Add Team Member'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!selectedUser}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.role !== 'super_admin' && (
              <>
                <div className="space-y-2">
                  <Label>Allowed Countries</Label>
                  <Input
                    value={formData.allowedCountries}
                    onChange={(e) => setFormData({ ...formData, allowedCountries: e.target.value })}
                    placeholder="Ghana, Nigeria (comma separated)"
                  />
                  <p className="text-[10px] text-slate-500 italic">Leave empty for all countries</p>
                </div>
                <div className="space-y-2">
                  <Label>Allowed Cities</Label>
                  <Input
                    value={formData.allowedCities}
                    onChange={(e) => setFormData({ ...formData, allowedCities: e.target.value })}
                    placeholder="Accra, Kumasi (comma separated)"
                  />
                  <p className="text-[10px] text-slate-500 italic">Leave empty for all cities</p>
                </div>
              </>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                {selectedUser ? 'Update Permissions' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
