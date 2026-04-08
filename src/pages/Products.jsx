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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductForm from '@/components/products/ProductForm';
import ProductCategoryManager from '@/components/products/ProductCategoryManager';
import { Search, Phone, Plus, FolderTree, Package, MoreVertical, Pencil, Trash2, Power } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/ProductCard.css';

const ProductCard = ({ product, categories, onEdit, onDelete, onStatusToggle, onCategoryUpdate }) => {
  const merchantName = product.merchant?.merchantProfile?.businessName || 'Unknown Merchant';
  const merchantPhone = product.merchant?.phoneNumber || 'No Contact';
  
  return (
    <div className="product-card">
      <div className="product-image-container">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="product-image" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
            <Package className="w-8 h-8" />
          </div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        
        <div className="product-meta">
          <div className="meta-item">
            <span className="meta-label">Active Category</span>
            <span className="meta-value-badge">{product.category || 'Uncategorized'}</span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">Listed By</span>
            <span className="listed-by">{merchantName}</span>
          </div>
          
          <div className="contact-pill">
            <Phone className="w-3.5 h-3.5" />
            <span>{merchantPhone}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="category-select-wrapper">
          <Select 
            value={product.category} 
            onValueChange={(value) => onCategoryUpdate(product.id, value)}
          >
            <SelectTrigger className="w-full bg-white border-slate-200">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(product)} title="Edit">
            <Pencil className="w-4 h-4 text-slate-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onStatusToggle(product)} 
            title={product.isActive ? "Suspend" : "Activate"}
            className={product.isActive ? "text-amber-500" : "text-emerald-500"}
          >
            <Power className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)} title="Delete" className="text-rose-500">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Products() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const queryClient = useQueryClient();

  const { data: productsData = { products: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['products', searchValue],
    queryFn: () => base44.entities.Product.list({
      search: searchValue,
      limit: 100
    }),
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['product-categories', 'product'],
    queryFn: () => base44.entities.ProductCategory.list('product'),
  });

  const products = productsData.products || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleStatusToggle = (product) => {
    updateMutation.mutate({ id: product.id, isActive: !product.isActive });
  };

  const handleCategoryUpdate = (id, category) => {
    updateMutation.mutate({ id, category });
  };

  return (
    <div className="max-w-[1200px] mx-auto p-8 space-y-8 min-h-screen bg-slate-50/50">
      {/* Velo Admin Global Header */}
      <div className="page-header-container">
        <div className="branding-group">
          <h1 className="brand-name">Velo Admin</h1>
          <p className="brand-subtitle">Marketplace Product Categorization</p>
        </div>
        
        <div className="search-container-top">
          <Search className="search-icon-top" />
          <input 
            type="text" 
            placeholder="Find products or categories..." 
            className="search-input-top"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Section */}
      <div className="space-y-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Inventory Master List</h2>
            <p className="text-sm text-slate-500">Manage and organize your catalog</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="items-found-pill">
              <span className="dot"></span>
              {products.length} Items Found
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowCategoryManager(true)}
              className="bg-white border-slate-200 h-11"
            >
              <FolderTree className="w-4 h-4 mr-2" /> Categories
            </Button>
            
            <Button 
              onClick={() => { setSelectedProduct(null); setShowForm(true); }} 
              className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 shadow-lg shadow-indigo-200"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 w-full bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                categories={dbCategories}
                onEdit={(p) => { setSelectedProduct(p); setShowForm(true); }}
                onDelete={(id) => {
                  if(window.confirm('Are you sure?')) deleteMutation.mutate(id);
                }}
                onStatusToggle={handleStatusToggle}
                onCategoryUpdate={handleCategoryUpdate}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No products found</h3>
              <p className="text-slate-500">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedProduct ? 'Edit Product Listing' : 'Add New Product Listing'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={selectedProduct}
            onClose={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <ProductCategoryManager 
        open={showCategoryManager} 
        onOpenChange={setShowCategoryManager} 
        defaultType="product"
      />
    </div>
  );
}

