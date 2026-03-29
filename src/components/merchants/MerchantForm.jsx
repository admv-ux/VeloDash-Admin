import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function MerchantForm({ merchant, onClose }) {
  const [formData, setFormData] = useState({
    business_name: merchant?.business_name || '',
    owner_name: merchant?.owner_name || '',
    email: merchant?.email || '',
    phone: merchant?.phone || '',
    address: merchant?.address || '',
    city: merchant?.city || '',
    category: merchant?.category || 'restaurant',
    status: merchant?.status || 'pending',
    commission_rate: merchant?.commission_rate || 15,
    description: merchant?.description || '',
    cover_image_url: merchant?.logo_url || merchant?.cover_image_url || '', // Using logo_url from detail view if present
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => {
      if (merchant) {
        // Two calls if both status/core and profile info changed
        // But for simplicity, we focus on profile update here
        return base44.entities.Merchant.updateProfile(merchant.id, {
          businessName: data.business_name,
          description: data.description,
          coverImageUrl: data.cover_image_url,
          category: data.category,
          address: data.address,
        });
      }
      return base44.entities.Merchant.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      toast.success(merchant ? 'Merchant updated' : 'Merchant created');
      onClose();
    },
    onError: (err) => {
      toast.error('Failed to save merchant');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name *</Label>
          <Input
            id="business_name"
            value={formData.business_name}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_name">Owner Name</Label>
          <Input
            id="owner_name"
            value={formData.owner_name}
            onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => setFormData({ ...formData, category: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restaurant">Restaurant</SelectItem>
              <SelectItem value="grocery">Grocery</SelectItem>
              <SelectItem value="pharmacy">Pharmacy</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="commission_rate">Commission Rate (%)</Label>
          <Input
            id="commission_rate"
            type="number"
            min="0"
            max="100"
            value={formData.commission_rate}
            onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (No phone numbers allowed)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="About the merchant..."
          className="h-24"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover_image_url">Cover/Logo Image URL</Label>
        <Input
          id="cover_image_url"
          value={formData.cover_image_url}
          onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="bg-violet-600 hover:bg-violet-700">
          {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {merchant ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}