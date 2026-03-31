import React, { useState } from 'react';
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
import { Loader2, Plus, X, Image as ImageIcon } from 'lucide-react';

export default function ProductForm({ product, onClose }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'marketplace',
    price: product?.price || 0,
    isActive: product?.isActive ?? true,
    images: product?.images || [],
    serviceDurationMin: product?.serviceDurationMin || 60,
    merchantId: product?.merchantId || '',
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  const queryClient = useQueryClient();

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list(),
    enabled: !product,
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
    onError: (err) => {
      toast.error('Failed to save product');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()],
      });
      setNewImageUrl('');
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!product && (
        <div className="space-y-2">
          <Label htmlFor="merchantId">Merchant *</Label>
          <Select
            value={formData.merchantId}
            onValueChange={(v) => setFormData({ ...formData, merchantId: v })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a merchant" />
            </SelectTrigger>
            <SelectContent>
              {merchants.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.business_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Product/Service Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (No phone numbers allowed)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description..."
          className="h-32"
        />
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
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="grocery">Grocery</SelectItem>
              <SelectItem value="pharmacy">Pharmacy</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
              <SelectItem value="rentals">Rentals</SelectItem>
              <SelectItem value="services">Services</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (₵)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
          />
        </div>
        {formData.category === 'services' && (
          <div className="space-y-2">
            <Label htmlFor="serviceDurationMin">Duration (Minutes)</Label>
            <Input
              id="serviceDurationMin"
              type="number"
              value={formData.serviceDurationMin}
              onChange={(e) => setFormData({ ...formData, serviceDurationMin: parseInt(e.target.value) })}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Paste image URL..."
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
          />
          <Button type="button" onClick={addImage} variant="secondary">
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {formData.images.map((img, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
              <img src={img} alt={`Product ${index}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {formData.images.length === 0 && (
            <div className="col-span-4 py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50">
              <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No images added</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="bg-violet-600 hover:bg-violet-700">
          {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? 'Update' : 'Create'} Listing
        </Button>
      </div>
    </form>
  );
}
