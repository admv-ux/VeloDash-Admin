import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Package, 
  Calendar, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  MoreVertical,
  Briefcase,
  TrendingUp,
  Clock,
  ExternalLink,
  Plus,
  FolderTree
} from 'lucide-react';
import { base44, getErrorMessage } from '@/api/base44Client';
import { getCountryName } from '@/utils/country';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import StatCard from '@/components/dashboard/StatCard';
import ProductForm from '@/components/products/ProductForm';
import ProductCategoryManager from '@/components/products/ProductCategoryManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function Services() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('providers');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const handleStatClick = (title, breakdown) => {
    setDetailData({ title, breakdown });
    setShowDetailDialog(true);
  };

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['service-stats'],
    queryFn: () => base44.entities.Service.getStats(),
  });

  const { data: providersData, isLoading: loadingProviders } = useQuery({
    queryKey: ['service-providers', search],
    queryFn: () => base44.entities.Service.listProviders({ search }),
  });

  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['service-bookings'],
    queryFn: () => base44.entities.Service.listBookings(),
  });

  const { data: catalogData, isLoading: loadingCatalog } = useQuery({
    queryKey: ['service-catalog'],
    queryFn: () => base44.entities.Product.list({ category: 'services', limit: 100 }),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.approveProvider(id),
    onSuccess: () => {
      toast.success('Provider approved successfully');
      queryClient.invalidateQueries(['service-providers']);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Services Management</h1>
        <p className="text-slate-500 mt-2">Manage service providers, catalogs, and live bookings.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Providers"
          value={stats?.totalProviders || 0}
          icon={Users}
          color="blue"
          onClick={() => handleStatClick("Total Providers", stats?.totalProvidersByCountry)}
        />
        <StatCard
          title="Active Providers"
          value={stats?.activeProviders || 0}
          icon={Briefcase}
          color="emerald"
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={Package}
          color="violet"
        />
        <StatCard
          title="Pending Hire Requests"
          value={stats?.pendingBookings || 0}
          icon={Clock}
          color="amber"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="providers" className="data-[state=active]:bg-white">Providers</TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-white">Live Bookings</TabsTrigger>
            <TabsTrigger value="catalog" className="data-[state=active]:bg-white">Catalog</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search..." 
                className="pl-10 w-[240px] h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
                variant="outline" 
                onClick={() => setShowCategoryManager(true)}
                className="h-9 border-slate-200 hover:bg-slate-50"
            >
              <FolderTree className="w-4 h-4 mr-2" /> Categories
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="providers">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b py-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Service Providers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Business Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {providersData?.providers.map((provider) => (
                      <tr key={provider.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                              {provider.businessName[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{provider.businessName}</p>
                              <p className="text-xs text-slate-500">{provider.businessEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize">{provider.category}</td>
                        <td className="px-6 py-4">
                          <Badge className={cn(
                            "px-2 py-0.5",
                            provider.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            provider.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          )}>
                            {provider.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {format(new Date(provider.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {provider.status === 'pending' && (
                              <Button 
                                size="sm" 
                                className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => approveMutation.mutate(provider.userId)}
                              >
                                Approve
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-8">Details</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Booking #</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Provider</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookingsData?.bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium">{booking.bookingNumber}</td>
                        <td className="px-6 py-4 font-medium">{booking.serviceTitle}</td>
                        <td className="px-6 py-4">{booking.customer?.email}</td>
                        <td className="px-6 py-4 font-medium">{booking.merchant?.email}</td>
                        <td className="px-6 py-4">
                          <Badge className={cn(
                            "px-2 py-0.5",
                            booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            booking.status === 'requested' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          )}>
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          {booking.currency} {Number(booking.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogData?.products.map((item) => (
              <Card key={item.id} className="overflow-hidden border-0 shadow-sm group">
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  {item.images?.[0] ? (
                    <img 
                      src={item.images[0]} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Briefcase className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-slate-900 border-0 backdrop-blur-sm">
                      {item.isActive ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2 text-xs font-medium text-indigo-600 uppercase tracking-wider">
                    <span>{item.category}</span>
                    <span className="flex items-center gap-1 text-slate-500 normal-case font-normal">
                      <Clock className="w-3 h-3" /> {item.serviceDurationMin || 60} mins
                    </span>
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 mb-1">{item.name}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{item.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-xl font-black text-slate-900">
                      ₵{Number(item.price).toFixed(2)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8"
                      onClick={() => { setSelectedItem(item); setShowForm(true); }}
                    >
                      Edit Item
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <button 
              onClick={() => { setSelectedItem(null); setShowForm(true); }}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="font-semibold text-slate-600 group-hover:text-indigo-700">Add Service Item</p>
              <p className="text-xs text-slate-400">Create a new service offering</p>
            </button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Service Item' : 'Add New Service Item'}</DialogTitle>
            <DialogDescription>
              {selectedItem ? 'Update the details for this service item.' : 'Create a new service item for the platform.'}
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            product={selectedItem} 
            onClose={() => setShowForm(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Summary Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailData?.title} Breakdown</DialogTitle>
            <DialogDescription>
              Country-wise distribution of providers for {detailData?.title.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {detailData?.breakdown && Object.entries(detailData.breakdown).sort(([, a], [, b]) => b - a).map(([country, count]) => (
                <div key={country} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 uppercase">
                      {country.substring(0, 2)}
                    </div>
                    <span className="font-medium text-slate-700">{country}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
              {(!detailData?.breakdown || Object.keys(detailData.breakdown).length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  No country data available
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProductCategoryManager 
        open={showCategoryManager} 
        onOpenChange={setShowCategoryManager} 
        defaultType="service"
      />
    </div>
  );
}
