import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, X, Image as ImageIcon, Upload, Store } from 'lucide-react';

export default function ProductForm({ product, onClose }) {
  const fileInputRef = useRef(null);
  const [isCreatingMerchant, setIsCreatingMerchant] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [newMerchant, setNewMerchant] = useState({
    businessName: '',
    businessEmail: '',
    phone: '',
    category: 'services'
  });

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'services',
    price: product?.price || 0,
    isActive: product?.isActive ?? true,
    images: product?.images || [],
    serviceDurationMin: product?.serviceDurationMin || 60,
    merchantId: product?.merchantId || '',
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  const queryClient = useQueryClient();

  // Queries
  const { data: merchants = [], refetch: refetchMerchants } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list(),
  });

  // Mutations
  const createMerchantMutation = useMutation({
    mutationFn: (data) => base44.entities.Merchant.create(data),
    onSuccess: (res) => {
      toast.success('Merchant created successfully');
      setIsCreatingMerchant(false);
      refetchMerchants();
      setFormData(prev => ({ ...prev, merchantId: res.user.id })); // User ID is merchantId in Product
    },
    onError: (err) => toast.error('Failed to create merchant'),
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => base44.entities.Upload.uploadFile(file, 'products'),
    onSuccess: (res) => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, res.data.url]
      }));
      toast.success('Image uploaded');
    },
    onError: (err) => toast.error('Upload failed'),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (product) {
        return base44.entities.Product.update(product.id, data);
      }
      return base44.entities.Product.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['service-catalog'] });
      toast.success(product ? 'Product updated' : 'Product created');
      onClose();
    },
    onError: (err) => toast.error('Failed to save product'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      category: isCreatingCategory ? customCategory : formData.category
    };
    mutation.mutate(finalData);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!product && (
        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-500" />
              <Label className="font-semibold">Merchant Source</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Create New</span>
              <Switch 
                checked={isCreatingMerchant} 
                onCheckedChange={setIsCreatingMerchant} 
              />
            </div>
          </div>

          {!isCreatingMerchant ? (
            <Select
              value={formData.merchantId}
              onValueChange={(v) => setFormData({ ...formData, merchantId: v })}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select existing merchant" />
              </SelectTrigger>
              <SelectContent>
                {merchants.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.business_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-3 pt-2">
              <Input
                placeholder="Business Name"
                className="bg-white"
                value={newMerchant.businessName}
                onChange={e => setNewMerchant({...newMerchant, businessName: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Business Email"
                  className="bg-white"
                  value={newMerchant.businessEmail}
                  onChange={e => setNewMerchant({...newMerchant, businessEmail: e.target.value})}
                />
                <Input
                  placeholder="Business Phone"
                  className="bg-white"
                  value={newMerchant.phone}
                  onChange={e => setNewMerchant({...newMerchant, phone: e.target.value})}
                />
              </div>
              <Button 
                type="button" 
                size="sm" 
                onClick={() => createMerchantMutation.mutate(newMerchant)}
                disabled={createMerchantMutation.isPending}
                className="w-full bg-slate-800 hover:bg-slate-900"
              >
                {createMerchantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm New Merchant'}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Listing Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Premium Haircut"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the service..."
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={isCreatingCategory ? 'custom' : formData.category}
                onValueChange={(v) => {
                  if (v === 'custom') {
                    setIsCreatingCategory(true);
                  } else {
                    setIsCreatingCategory(false);
                    setFormData({ ...formData, category: v });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                  <SelectItem value="custom" className="text-violet-600 font-medium">
                    + Create New Category
                  </SelectItem>
                </SelectContent>
              </Select>
              {isCreatingCategory && (
                <Input
                  placeholder="Enter custom category..."
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="mt-2 animate-in slide-in-from-top-1"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceDurationMin">Duration (Minutes)</Label>
            <Input
              id="serviceDurationMin"
              type="number"
              value={formData.serviceDurationMin}
              onChange={(e) => setFormData({ ...formData, serviceDurationMin: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Listing Images</Label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Click to upload images</p>
              <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {formData.images.map((img, index) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                <img src={img} alt={`Product ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onClose} className="px-8">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={mutation.isPending || (isCreatingMerchant && !formData.merchantId)} 
          className="bg-violet-600 hover:bg-violet-700 px-8 shadow-lg shadow-violet-200"
        >
          {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? 'Update' : 'Create'} Service Listing
        </Button>
      </div>
    </form>
  );
}
