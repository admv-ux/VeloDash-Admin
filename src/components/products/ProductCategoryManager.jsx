import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, getErrorMessage } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit2, FolderPlus, Tag } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';

export default function ProductCategoryManager({ open, onOpenChange, defaultType = 'product' }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filterType, setFilterType] = useState(defaultType);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    type: defaultType,
  });

  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['product-categories', filterType],
    queryFn: () => base44.entities.ProductCategory.list(filterType === 'all' ? undefined : filterType),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (selectedCategory) {
        return base44.entities.ProductCategory.update(selectedCategory.id, data);
      }
      return base44.entities.ProductCategory.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success(selectedCategory ? 'Category updated' : 'Category created');
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success('Category deleted');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const resetForm = () => {
    setSelectedCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: '',
      type: filterType === 'all' ? 'product' : filterType,
    });
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || '',
      type: category.type,
    });
    setShowAddDialog(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Category Name',
      cell: (row) => (
        <div className="flex items-center gap-2">
            <span className="text-lg">{row.icon || '🏷️'}</span>
            <span className="font-medium text-slate-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (row) => (
        <span className="capitalize text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            {row.type}
        </span>
      ),
    },
    {
      header: 'Slug',
      cell: (row) => <code className="text-xs text-slate-400">{row.slug}</code>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Edit2 className="w-4 h-4 text-slate-400" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <DialogTitle>Manage Listing Categories</DialogTitle>
            <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] h-8 text-xs bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="product">Physical Products</SelectItem>
                    <SelectItem value="service">Services</SelectItem>
                    <SelectItem value="marketplace">Marketplace Items</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => { resetForm(); setShowAddDialog(true); }}
            className="bg-violet-600 hover:bg-violet-700 h-9"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </DialogHeader>

        <div className="py-4">
          <DataTable
            columns={columns}
            data={categories}
            isLoading={isLoading}
            searchPlaceholder="Search categories..."
            emptyMessage="No categories created yet for this type"
          />
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{selectedCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                    <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="product">Physical Product</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="marketplace">Marketplace Item</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="grocery">Grocery</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Haircut"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (Optional)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. haircut"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon Emoji (Optional)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g. ✂️"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} className="bg-violet-600">
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
