import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

export default function MerchantForm({ merchant, onClose, onManageCategories }) {
  const fileInputRef = useRef(null);
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
    cover_image_url: merchant?.logo_url || merchant?.cover_image_url || '',
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['merchant-categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file) => base44.entities.Upload.uploadFile(file, 'merchants'),
    onSuccess: (res) => {
      setFormData(prev => ({ ...prev, cover_image_url: res.data.url }));
      toast.success('Image uploaded successfully');
    },
    onError: (err) => toast.error('Image upload failed'),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (merchant) {
        return base44.entities.Merchant.updateProfile(merchant.id, {
          businessName: data.business_name,
          description: data.description,
          coverImageUrl: data.cover_image_url,
          category: data.category,
          address: data.address,
        });
      }
      return base44.entities.Merchant.create({
        businessName: data.business_name,
        businessEmail: data.email,
        phone: data.phone,
        ownerName: data.owner_name,
        category: data.category,
        address: data.address,
        city: data.city,
        description: data.description,
        coverImageUrl: data.cover_image_url,
        commissionRate: data.commission_rate
      });
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      uploadMutation.mutate(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
      <div className="flex-1 overflow-y-auto pr-4 space-y-4 py-2">
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
              onValueChange={(v) => {
                if (v === 'add-new') {
                  onManageCategories();
                } else {
                  setFormData({ ...formData, category: v });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="text-violet-600 font-medium border-t mt-1">
                      + Add New category
                    </SelectItem>
                  </>
                )}
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
          <Label>Cover/Logo Image</Label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50/30 transition-all cursor-pointer group relative overflow-hidden h-32"
          >
            {formData.cover_image_url ? (
              <>
                <img 
                  src={formData.cover_image_url} 
                  alt="Preview" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData({ ...formData, cover_image_url: '' });
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-violet-600" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-600 group-hover:text-violet-700">
                  {uploadMutation.isPending ? 'Uploading...' : 'Click to upload logo'}
                </p>
                <p className="text-xs text-slate-400">PNG, JPG or WebP up to 5MB</p>
              </>
            )}
          </div>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
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
      </div>

      <div className="flex justify-end gap-3 pt-4 mt-2 border-t">
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