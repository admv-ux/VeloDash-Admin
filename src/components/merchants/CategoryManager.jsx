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
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit2, FolderPlus } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';

export default function CategoryManager({ open, onOpenChange }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
  });

  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['merchant-categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (selectedCategory) {
        return base44.entities.Category.update(selectedCategory.id, data);
      }
      return base44.entities.Category.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-categories'] });
      toast.success(selectedCategory ? 'Category updated' : 'Category created');
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-categories'] });
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
    });
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || '',
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
      cell: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      header: 'Slug',
      cell: (row) => <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{row.slug}</code>,
    },
    {
      header: 'Icon',
      cell: (row) => <span className="text-lg">{row.icon || '-'}</span>,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Manage Store Categories</DialogTitle>
          <Button 
            onClick={() => { resetForm(); setShowAddDialog(true); }}
            className="bg-violet-600 hover:bg-violet-700 h-9"
          >
            <Plus className="w-4 h-4 mr-2" /> New Category
          </Button>
        </DialogHeader>

        <div className="py-4">
          <DataTable
            columns={columns}
            data={categories}
            isLoading={isLoading}
            searchPlaceholder="Search categories..."
            emptyMessage="No categories created yet"
          />
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{selectedCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pharmacy"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (Optional)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. pharmacy"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon Emoji (Optional)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g. 💊"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} className="bg-violet-600">
                  {mutation.isPending ? 'Saving...' : 'Save Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
