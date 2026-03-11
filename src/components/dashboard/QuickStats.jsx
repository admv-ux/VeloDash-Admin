import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function QuickStats({ merchants, drivers, riders, orders }) {
  const stats = [
    {
      label: 'Verified Merchants',
      value: merchants?.filter(m => m?.status === 'verified').length || 0,
      total: merchants?.length || 0,
      color: 'bg-violet-500',
    },
    {
      label: 'Online Drivers',
      value: drivers?.filter(d => d?.status === 'online').length || 0,
      total: drivers?.filter(d => d?.status && ['verified', 'online', 'offline'].includes(d.status)).length || 0,
      color: 'bg-emerald-500',
    },
    {
      label: 'Active Riders',
      value: riders?.filter(r => r?.status === 'active').length || 0,
      total: riders?.length || 0,
      color: 'bg-blue-500',
    },
    {
      label: 'Completed Today',
      value: orders?.filter(o => o?.status && ['completed', 'delivered'].includes(o.status)).length || 0,
      total: orders?.length || 0,
      color: 'bg-amber-500',
    },
  ];

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {stats.map((stat, idx) => {
          const percentage = stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0;
          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{stat.label}</span>
                <span className="font-semibold text-slate-900">{stat.value}/{stat.total}</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}