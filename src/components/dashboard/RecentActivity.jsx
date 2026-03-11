import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Car, Store, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

const activityIcons = {
  delivery: Package,
  ride: Car,
  merchant: Store,
  rider: User,
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

export default function RecentActivity({ orders }) {
  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders?.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
        ) : (
          orders?.slice(0, 8).map((order) => {
            const Icon = activityIcons[order.type] || Package;
            return (
              <div key={order.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`p-2 rounded-lg ${order.type === 'ride' ? 'bg-indigo-100' : 'bg-violet-100'}`}>
                  <Icon className={`w-4 h-4 ${order.type === 'ride' ? 'text-indigo-600' : 'text-violet-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {order.order_number || `#${order.id?.slice(-6)}`}
                    </p>
                    <Badge className={statusColors[order.status] || 'bg-slate-100 text-slate-700'}>
                      {order.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 truncate mt-0.5">
                    {order.type === 'ride' ? 'Ride' : 'Delivery'} • {order.rider_name || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {format(new Date(order.created_date), 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}