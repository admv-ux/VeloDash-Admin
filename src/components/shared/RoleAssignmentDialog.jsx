import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const AVAILABLE_ROLES = [
  { id: 'admin', label: 'Admin', description: 'Full system access' },
  { id: 'super_admin', label: 'Super Admin', description: 'Highest level of administrative control' },
  { id: 'merchant', label: 'Merchant', description: 'Business owner/operator access' },
  { id: 'driver', label: 'Driver', description: 'Access to delivery/ride-hailing features' },
  { id: 'buyer', label: 'Rider/Buyer', description: 'Standard user/customer access' },
  { id: 'country_manager', label: 'Country Manager', description: 'Administrative access for a specific country' },
  { id: 'city_operator', label: 'City Operator', description: 'Administrative access for a specific city' },
  { id: 'support_agent', label: 'Support Agent', description: 'Access to customer support tickets' },
  { id: 'finance_viewer', label: 'Finance Viewer', description: 'Read-only access to financial reports' },
];

export default function RoleAssignmentDialog({ user, open, onOpenChange }) {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && user.roles) {
      // Ensure we only have names, not objects if the API returns them
      const roleNames = user.roles.map(r => typeof r === 'string' ? r : r.name);
      setSelectedRoles(roleNames);
    } else {
      setSelectedRoles([]);
    }
  }, [user, open]);

  const updateRolesMutation = useMutation({
    mutationFn: (roles) => base44.entities.Users.updateRoles(user.id, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Roles updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update roles');
    },
  });

  const toggleRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = () => {
    if (!user?.id) return;
    updateRolesMutation.mutate(selectedRoles);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogDescription>
            Manage permissions for {user?.full_name || user?.email || user?.phone}.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6 pt-2 pb-4">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role.id} className="flex items-start space-x-3">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={selectedRoles.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none cursor-pointer" onClick={() => toggleRole(role.id)}>
                  <Label
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-semibold leading-none cursor-pointer"
                  >
                    {role.label}
                  </Label>
                  <p className="text-xs text-slate-500 leading-normal">
                    {role.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateRolesMutation.isPending || !user}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {updateRolesMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
