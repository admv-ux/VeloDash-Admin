import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Car, Store, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const activityIcons = {
  order: Package,
  ride: Car,
  merchant: Store,
  rider: User,
  driver: Car,
};

const activityLabels = {
  order: 'New Order',
  ride: 'New Ride',
  merchant: 'New Merchant Signup',
  rider: 'New Rider Signup',
  driver: 'New Driver Application',
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  verified: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

export default function RecentActivity({ activity }) {
  return (
    <Card className="bg-white border-0 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {!activity || activity.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
        ) : (
          activity.map((item, idx) => {
            const Icon = activityIcons[item.activityType] || Package;
            const title = item.order_number || item.full_name || item.business_name || item.name || item.email || `Event #${idx}`;
            
            return (
              <div key={`${item.activityType}-${item.id}`} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className={cn(
                  "p-2 rounded-lg transition-transform group-hover:scale-110",
                  item.activityType === 'order' ? 'bg-amber-100 text-amber-600' :
                  item.activityType === 'ride' ? 'bg-indigo-100 text-indigo-600' :
                  item.activityType === 'merchant' ? 'bg-violet-100 text-violet-600' :
                  'bg-blue-100 text-blue-600'
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {title}
                    </p>
                    {item.status && (
                      <Badge className={cn("text-[10px] h-5 px-1.5", statusColors[item.status] || 'bg-slate-100 text-slate-700')}>
                        {item.status?.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">
                    {activityLabels[item.activityType]}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
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