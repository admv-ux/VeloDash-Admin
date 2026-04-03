import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, getErrorMessage } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ProductForm from '@/components/products/ProductForm';
import { MoreHorizontal, Eye, Pencil, Trash2, Package, Search, PhoneOff, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Products() {
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const queryClient = useQueryClient();

  const { data: productsData = { products: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['products', searchValue, categoryFilter],
    queryFn: () => base44.entities.Product.list({
      search: searchValue,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      limit: 100
    }),
  });

  const products = productsData.products || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.Product.update(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product status updated');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const columns = [
    {
      header: 'Product',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-md">
            <AvatarImage src={row.images?.[0]} />
            <AvatarFallback className="bg-slate-100 text-slate-600 rounded-md">
              <Package className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="max-w-[200px]">
            <p className="font-medium text-slate-900 truncate">{row.name}</p>
            <p className="text-xs text-slate-500 capitalize">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Merchant',
      cell: (row) => (
        <div className="text-sm">
          <p className="font-medium text-slate-700">{row.merchant?.merchantProfile?.businessName || 'Unknown'}</p>
          <p className="text-xs text-slate-500">{row.merchant?.phoneNumber}</p>
        </div>
      ),
    },
    {
      header: 'Price',
      cell: (row) => (
        <span className="font-medium text-slate-900">
          ₵{(row.price || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Description',
      cell: (row) => {
        const hasNumbers = /[0-9]{7,}/.test(row.description || '');
        return (
          <div className="max-w-[300px]">
            <p className={`text-sm line-clamp-2 ${hasNumbers ? 'text-amber-600 bg-amber-50 px-1 rounded' : 'text-slate-600'}`}>
              {row.description || <span className="italic opacity-50 text-xs">No description</span>}
            </p>
            {hasNumbers && (
              <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1 font-medium italic">
                <PhoneOff className="w-3 h-3" /> May contain contact info
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => (
        <StatusBadge status={row.isActive ? 'active' : 'suspended'} />
      ),
    },
    {
      header: 'Created',
      cell: (row) => (
        <span className="text-sm text-slate-500 whitespace-nowrap">
          {format(new Date(row.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: '',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedProduct(row); setShowForm(true); }}>
              <Pencil className="w-4 h-4 mr-2" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(row)}>
              <div className="flex items-center">
                {row.isActive ? 'Suspend Listing' : 'Reactivate Listing'}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                if(window.confirm('Are you sure you want to delete this listing?')) {
                  deleteMutation.mutate(row.id);
                }
              }}
              className="text-rose-600"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: 'Food' },
    { value: 'grocery', label: 'Grocery' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'rentals', label: 'Rentals' },
    { value: 'services', label: 'Services' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => { setSelectedProduct(null); setShowForm(true); }} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-white border-0 shadow-sm">
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search products or descriptions..."
          filterValue={categoryFilter}
          onFilterChange={setCategoryFilter}
          filterOptions={categoryOptions}
          filterPlaceholder="Category"
          emptyMessage="No products found"
        />
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product Listing' : 'Add New Product Listing'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={selectedProduct}
            onClose={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
