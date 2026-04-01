import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import { Store, Car, Users, Package, DollarSign, TrendingUp, Calendar, Clock, Shield, AlertTriangle } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/AuthContext';
import SurgeOverview from '@/components/dashboard/SurgeOverview';
import LiveMap from '@/components/dashboard/LiveMap';
import QuickStats from '@/components/dashboard/QuickStats';
import RevenueChart from '@/components/dashboard/RevenueChart';
import UserDistribution from '@/components/dashboard/UserDistribution';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, currentLocation } = useAuth();
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [showRevenueDialog, setShowRevenueDialog] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Surge Management State
  const [isSurgeDialogOpen, setIsSurgeDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.0);
  const [isUpdatingSurge, setIsUpdatingSurge] = useState(false);

  const handleAdjustSurge = (zone) => {
    setSelectedZone(zone);
    setSurgeMultiplier(zone.surge_multiplier || 1.0);
    setIsSurgeDialogOpen(true);
  };

  const handleUpdateSurge = async () => {
    if (!selectedZone) return;
    setIsUpdatingSurge(true);
    try {
      await base44.entities.Zone.update(selectedZone.id, {
        surge_multiplier: Number(surgeMultiplier)
      });
      setIsSurgeDialogOpen(false);
      refetchZones();
    } catch (error) {
      console.error("Failed to update surge:", error);
    } finally {
      setIsUpdatingSurge(false);
    }
  };

  const { data: dashboard, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats', currentLocation],
    queryFn: () => base44.entities.Dashboard.getStats(),
  });

  const handleStatClick = (title, data) => {
    setDetailData({ title, breakdown: data });
    setShowDetailDialog(true);
  };

  const { data: merchants = [], isLoading: loadingMerchants } = useQuery({
    queryKey: ['merchants', currentLocation],
    queryFn: () => base44.entities.Merchant.list('-created_date', 100),
  });

  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ['drivers', currentLocation],
    queryFn: () => base44.entities.Driver.list('-created_date', 100),
  });

  const { data: riders = [], isLoading: loadingRiders } = useQuery({
    queryKey: ['riders', currentLocation],
    queryFn: () => base44.entities.Rider.list('-created_date', 100),
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders', currentLocation],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets', currentLocation],
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 50),
  });
  
  const { data: zones = [], refetch: refetchZones } = useQuery({
    queryKey: ['zones', currentLocation],
    queryFn: () => base44.entities.Zone.list(),
  });

  const isLoading = loadingStats || loadingMerchants || loadingDrivers || loadingRiders || loadingOrders;

  // Consolidate recent activity from all sources
  const recentActivity = [
    ...(orders?.map(o => ({ ...o, activityType: 'order', timestamp: o.created_date })) || []),
    ...(drivers?.map(d => ({ ...d, activityType: 'driver', timestamp: d.created_date })) || []),
    ...(merchants?.map(m => ({ ...m, activityType: 'merchant', timestamp: m.created_date })) || []),
    ...(riders?.map(r => ({ ...r, activityType: 'rider', timestamp: r.created_date })) || []),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

  // Calculate stats - ensure all values are numbers
  const totalRevenue = Number(orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0);
  const totalCommission = Number(orders?.reduce((sum, o) => sum + (Number(o.commission_amount) || 0), 0) || 0);
  const activeOrders = orders?.filter(o => o?.status && ['pending', 'accepted', 'in_transit', 'preparing', 'picked_up'].includes(o.status)).length || 0;
  const openTickets = tickets?.filter(t => t?.status && ['open', 'in_progress'].includes(t.status)).length || 0;

  // Calculate commission breakdowns
  const today = new Date();
  const dailyCommission = orders?.filter(o => {
    const orderDate = new Date(o.created_date);
    return format(orderDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  }).reduce((sum, o) => sum + (Number(o.commission_amount) || 0), 0) || 0;

  const weeklyCommission = orders?.filter(o => {
    const orderDate = new Date(o.created_date);
    return orderDate >= startOfWeek(today) && orderDate <= endOfWeek(today);
  }).reduce((sum, o) => sum + (Number(o.commission_amount) || 0), 0) || 0;

  const monthlyCommission = orders?.filter(o => {
    const orderDate = new Date(o.created_date);
    return orderDate >= startOfMonth(today) && orderDate <= endOfMonth(today);
  }).reduce((sum, o) => sum + (Number(o.commission_amount) || 0), 0) || 0;

  // Calculate revenue breakdowns
  const dailyRevenue = orders?.filter(o => {
    const orderDate = new Date(o.created_date);
    return format(orderDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  }).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;

  const weeklyRevenue = orders?.filter(o => {
    const orderDate = new Date(o.created_date);
    return orderDate >= startOfWeek(today) && orderDate <= endOfWeek(today);
  }).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;

  const monthlyRevenue = orders?.filter(o => {
    const orderDate = new Date(o.created_date);
    return orderDate >= startOfMonth(today) && orderDate <= endOfMonth(today);
  }).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Platform Users"
          value={dashboard?.overview?.totalUsers || 0}
          change="+12%"
          changeType="positive"
          icon={Users}
          color="blue"
          onClick={() => handleStatClick("Total Platform Users", dashboard?.overview?.totalUsersByCountry)}
        />
        <StatCard
          title="Monthly Active Users"
          value={dashboard?.overview?.monthlyActiveUsers || 0}
          change="+8%"
          changeType="positive"
          icon={TrendingUp}
          color="emerald"
          onClick={() => handleStatClick("Monthly Active Users", dashboard?.overview?.monthlyActiveUsersByCountry)}
        />
        <StatCard
          title="Active Drivers"
          value={dashboard?.overview?.activeDrivers || 0}
          change="+5%"
          changeType="positive"
          icon={Car}
          color="violet"
          onClick={() => handleStatClick("Active Drivers", dashboard?.overview?.activeDriversByCountry)}
        />
        <StatCard
          title="Today's Gross Revenue"
          value={`$${(dashboard?.today?.orderRevenue || 0 + (dashboard?.today?.rideRevenue || 0)).toFixed(2)}`}
          change="+22%"
          changeType="positive"
          icon={DollarSign}
          color="amber"
          onClick={() => handleStatClick("Today's Gross Revenue", dashboard?.today?.orderRevenueByCountry)}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Orders/Rides"
          value={dashboard?.today?.totalOrders || 0}
          subtitle={dashboard?.today?.lastOrderTime ? `Last order ${formatDistanceToNow(new Date(dashboard.today.lastOrderTime))} ago` : 'No recent orders'}
          icon={Package}
          color="indigo"
          onClick={() => handleStatClick("Active Orders/Rides", dashboard?.today?.totalOrdersByCountry)}
        />
        <StatCard
          title="Platform Listings"
          value={dashboard?.overview?.totalListings || 0}
          icon={Store}
          color="rose"
          onClick={() => handleStatClick("Platform Listings", dashboard?.overview?.totalListingsByCountry)}
        />
        <StatCard
          title="Avg Delivery Time"
          value={`${dashboard?.today?.avgCompletionTimeMinutes || 0} mins`}
          icon={Clock}
          color="emerald"
          onClick={() => handleStatClick("Avg Delivery Time", dashboard?.today?.avgCompletionTimeByCountry)}
        />
        <StatCard
          title="Pending Verifications"
          value={dashboard?.pendingActions?.pendingMerchantApprovals + dashboard?.pendingActions?.pendingDriverApprovals || 0}
          icon={Shield}
          color="amber"
          onClick={() => handleStatClick("Pending Verifications", dashboard?.pendingActions?.pendingVerificationsByCountry)}
        />
      </div>

      {/* User Distribution */}
      <UserDistribution 
        merchants={merchants} 
        drivers={drivers} 
        riders={riders} 
        onStatClick={handleStatClick}
        stats={dashboard?.overview}
      />

      {/* Map and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <LiveMap 
              drivers={drivers} 
              merchants={merchants} 
              orders={orders} 
              zones={zones} 
              onAdjustSurge={handleAdjustSurge} 
            />
          </div>
          <div>
            <SurgeOverview zones={zones} onAdjust={handleAdjustSurge} />
          </div>
        </div>

      {/* Charts and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart orders={orders} />
        </div>
        <div>
          <QuickStats 
            merchants={merchants} 
            drivers={drivers} 
            riders={riders} 
            orders={orders} 
            onStatClick={handleStatClick}
            stats={dashboard?.overview}
          />
        </div>
      </div>

      {/* Revenue Breakdown Dialog */}
      <Dialog open={showRevenueDialog} onOpenChange={setShowRevenueDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revenue Breakdown</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">Today</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">${dailyRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">{format(today, 'MMM d, yyyy')}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">This Week</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">${weeklyRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">
                {format(startOfWeek(today), 'MMM d')} - {format(endOfWeek(today), 'MMM d')}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">This Month</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">${monthlyRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">{format(today, 'MMMM yyyy')}</p>
            </Card>
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Revenue (All Time)</span>
              <span className="text-xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commission Breakdown Dialog */}
      <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Platform Commission Breakdown</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">Today</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">${dailyCommission.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">{format(today, 'MMM d, yyyy')}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">This Week</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">${weeklyCommission.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">
                {format(startOfWeek(today), 'MMM d')} - {format(endOfWeek(today), 'MMM d')}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Calendar className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">This Month</span>
              </div>
              <p className="text-3xl font-bold text-violet-600">${monthlyCommission.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">{format(today, 'MMMM yyyy')}</p>
            </Card>
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Commission (All Time)</span>
              <span className="text-xl font-bold text-slate-900">${totalCommission.toFixed(2)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailData?.title} Breakdown</DialogTitle>
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
                    {detailData.title.includes('Revenue') ? `$${Number(count).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (detailData.title.includes('Time') ? `${Math.round(count)} min` : count.toLocaleString())}
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

      {/* Surge Multiplier Dialog */}
      <Dialog open={isSurgeDialogOpen} onOpenChange={setIsSurgeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="w-6 h-6 text-rose-500" />
              Manage Surge: {selectedZone?.city || selectedZone?.name}
            </DialogTitle>
            <DialogDescription>
              Adjust the multiplier to increase prices in high-demand areas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                A multiplier above 1.0 will increase delivery fees and ride fares for all users in this zone. Use with caution.
              </p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="multiplier" className="text-right font-medium">
                Multiplier
              </Label>
              <Input
                id="multiplier"
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={surgeMultiplier}
                onChange={(e) => setSurgeMultiplier(e.target.value)}
                className="col-span-3 h-11 text-lg font-bold"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsSurgeDialogOpen(false)} className="h-11">Cancel</Button>
            <Button 
              onClick={handleUpdateSurge} 
              disabled={isUpdatingSurge}
              className="bg-violet-600 hover:bg-violet-700 h-11 px-8 text-white font-semibold shadow-lg shadow-violet-200"
            >
              {isUpdatingSurge ? 'Updating...' : 'Confirm Surge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}