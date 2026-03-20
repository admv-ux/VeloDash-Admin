import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, getErrorMessage } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, Edit2, Trash2, MapPin, DollarSign, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

export default function Zones() {
  const { currentLocation } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    status: 'active',
    base_delivery_fee: 15,
    base_ride_fare: 10,
    per_km_rate: 3,
    surge_multiplier: 1,
    min_order_value: 25,
    delivery_enabled: true,
    rides_enabled: true,
    radius_km: 10,
  });

  const queryClient = useQueryClient();

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['zones', currentLocation],
    queryFn: () => base44.entities.Zone.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Zone.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone created');
      setShowForm(false);
      resetForm();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Zone.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone updated');
      setShowForm(false);
      resetForm();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Zone.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const resetForm = () => {
    setSelectedZone(null);
    setFormData({
      name: '',
      city: '',
      status: 'active',
      base_delivery_fee: 5,
      base_ride_fare: 3,
      per_km_rate: 1.5,
      surge_multiplier: 1,
      min_order_value: 10,
      delivery_enabled: true,
      rides_enabled: true,
      radius_km: 10,
    });
  };

  const handleEdit = (zone) => {
    setSelectedZone(zone);
    setFormData({
      name: zone.name || '',
      city: zone.city || '',
      status: zone.status || 'active',
      base_delivery_fee: zone.base_delivery_fee || 15,
      base_ride_fare: zone.base_ride_fare || 10,
      per_km_rate: zone.per_km_rate || 3,
      surge_multiplier: zone.surge_multiplier || 1,
      min_order_value: zone.min_order_value || 25,
      delivery_enabled: zone.delivery_enabled !== false,
      rides_enabled: zone.rides_enabled !== false,
      radius_km: zone.radius_km || 10,
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedZone) {
      updateMutation.mutate({ id: selectedZone.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredZones = zones.filter((z) => 
    z.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    z.city?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    {
      header: 'Zone',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100">
            <MapPin className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-sm text-slate-500">{row.city}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Services',
      cell: (row) => (
        <div className="flex gap-2">
          {row.delivery_enabled !== false && (
            <span className="px-2 py-1 text-xs bg-violet-100 text-violet-700 rounded-full">Delivery</span>
          )}
          {row.rides_enabled !== false && (
            <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">Rides</span>
          )}
        </div>
      ),
    },
    {
      header: 'Pricing',
      cell: (row) => (
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-500">Base Delivery:</span> ₵{row.base_delivery_fee || 15}</p>
          <p><span className="text-slate-500">Base Ride:</span> ₵{row.base_ride_fare || 10}</p>
          <p><span className="text-slate-500">Per KM:</span> ₵{row.per_km_rate || 3}</p>
        </div>
      ),
    },
    {
      header: 'Surge',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${row.surge_multiplier > 1 ? 'text-amber-500' : 'text-slate-300'}`} />
          <span className={`font-medium ${row.surge_multiplier > 1 ? 'text-amber-600' : 'text-slate-600'}`}>
            {row.surge_multiplier || 1}x
          </span>
        </div>
      ),
    },
    {
      header: 'Coverage',
      cell: (row) => (
        <span className="text-sm text-slate-700">{row.radius_km || 10} km radius</span>
      ),
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Edit2 className="w-4 h-4 text-slate-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(row.id)}>
            <Trash2 className="w-4 h-4 text-rose-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Zones & Pricing</h2>
          <p className="text-slate-500">Manage service areas and pricing rules</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" /> Add Zone
        </Button>
      </div>

      <Card className="p-6 bg-white border-0 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredZones}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search zones..."
          emptyMessage="No zones found"
        />
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedZone ? 'Edit Zone' : 'Add New Zone'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zone Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Radius (km)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.radius_km}
                  onChange={(e) => setFormData({ ...formData, radius_km: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Order Value ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_order_value}
                  onChange={(e) => setFormData({ ...formData, min_order_value: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Pricing
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Base Delivery Fee (₵)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_delivery_fee}
                    onChange={(e) => setFormData({ ...formData, base_delivery_fee: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base Ride Fare (₵)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_ride_fare}
                    onChange={(e) => setFormData({ ...formData, base_ride_fare: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per KM Rate (₵)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.per_km_rate}
                    onChange={(e) => setFormData({ ...formData, per_km_rate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" /> Surge Pricing
              </h4>
              <div className="space-y-2">
                <Label>Surge Multiplier</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.surge_multiplier}
                  onChange={(e) => setFormData({ ...formData, surge_multiplier: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-slate-500">Set to 1 for no surge. Max 5x</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.delivery_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, delivery_enabled: checked })}
                  />
                  <Label>Delivery</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.rides_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, rides_enabled: checked })}
                  />
                  <Label>Rides</Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                {selectedZone ? 'Update' : 'Create'} Zone
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}