import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, changeType, icon: Icon, color, onClick }) {
  const colorClasses = {
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <Card 
      className={cn(
        "p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow",
        onClick && "cursor-pointer hover:border-slate-200"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {change && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              changeType === 'positive' ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {changeType === 'positive' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{change}</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colorClasses[color] || colorClasses.violet)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}