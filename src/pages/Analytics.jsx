import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Users, Package, DollarSign, Clock, MapPin } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899'];

export default function Analytics() {
  const [period, setPeriod] = useState('7d');

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders-analytics'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000),
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants-analytics'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 500),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-analytics'],
    queryFn: () => base44.entities.Driver.list('-created_date', 500),
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['riders-analytics'],
    queryFn: () => base44.entities.Rider.list('-created_date', 500),
  });

  const isLoading = loadingOrders;

  // Calculate period data
  const getPeriodDays = () => {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  };

  const days = getPeriodDays();
  const startDate = subDays(new Date(), days);

  // Revenue over time
  const revenueData = [...Array(days)].map((_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOrders = orders.filter(o => {
      if (!o?.created_date) return false;
      const orderDate = format(new Date(o.created_date), 'yyyy-MM-dd');
      return orderDate === dateStr;
    });
    return {
      date: format(date, days > 14 ? 'MMM d' : 'EEE'),
      revenue: dayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
      orders: dayOrders.length,
      deliveries: dayOrders.filter(o => o?.type === 'delivery').length,
      rides: dayOrders.filter(o => o?.type === 'ride').length,
    };
  });

  // Order type distribution
  const orderTypeData = [
    { name: 'Deliveries', value: orders.filter(o => o?.type === 'delivery').length },
    { name: 'Rides', value: orders.filter(o => o?.type === 'ride').length },
  ];

  // Payment method distribution
  const paymentData = [
    { name: 'Cash', value: orders.filter(o => o?.payment_method === 'cash').length },
    { name: 'Card', value: orders.filter(o => o?.payment_method === 'card').length },
    { name: 'Wallet', value: orders.filter(o => o?.payment_method === 'wallet').length },
  ].filter(d => d.value > 0);

  // Merchant categories
  const categoryData = Object.entries(
    merchants.reduce((acc, m) => {
      if (!m) return acc;
      acc[m.category || 'other'] = (acc[m.category || 'other'] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  // User growth
  const userGrowthData = [...Array(days)].map((_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const dateStart = startOfDay(date);
    const newMerchants = merchants.filter(m => {
      if (!m?.created_date) return false;
      const createdDate = new Date(m.created_date);
      return format(createdDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    }).length;
    const newDrivers = drivers.filter(d => {
      if (!d?.created_date) return false;
      const createdDate = new Date(d.created_date);
      return format(createdDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    }).length;
    const newRiders = riders.filter(r => {
      if (!r?.created_date) return false;
      const createdDate = new Date(r.created_date);
      return format(createdDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    }).length;
    return {
      date: format(date, days > 14 ? 'MMM d' : 'EEE'),
      merchants: newMerchants,
      drivers: newDrivers,
      riders: newRiders,
    };
  });

  // Key metrics
  const totalRevenue = Number(orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0);
  const totalCommission = Number(orders?.reduce((sum, o) => sum + (Number(o.commission_amount) || 0), 0) || 0);
  const avgOrderValue = orders?.length > 0 ? totalRevenue / orders.length : 0;
  const completedOrders = orders?.filter(o => o?.status && ['completed', 'delivered'].includes(o.status)).length || 0;
  const completionRate = orders?.length > 0 ? (completedOrders / orders.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
          <p className="text-slate-500">Platform performance and user metrics</p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-violet-500 to-violet-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">₵{totalRevenue.toFixed(0)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-violet-300" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Commission Earned</p>
              <p className="text-3xl font-bold mt-1">₵{totalCommission.toFixed(0)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-emerald-300" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Avg Order Value</p>
              <p className="text-3xl font-bold mt-1">₵{avgOrderValue.toFixed(2)}</p>
            </div>
            <Package className="w-10 h-10 text-blue-300" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold mt-1">{completionRate.toFixed(1)}%</p>
            </div>
            <Clock className="w-10 h-10 text-amber-300" />
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Revenue & Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Type */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Orders by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="deliveries" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Deliveries" />
                  <Bar dataKey="rides" fill="#6366f1" radius={[4, 4, 0, 0]} name="Rides" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Charts */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Order Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {orderTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Area type="monotone" dataKey="merchants" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Merchants" />
                <Area type="monotone" dataKey="drivers" stackId="1" stroke="#10b981" fill="#10b981" name="Drivers" />
                <Area type="monotone" dataKey="riders" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Riders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Merchant Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Merchant Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}