import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  // User statuses
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  suspended: 'bg-rose-100 text-rose-700 border-rose-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  offline: 'bg-slate-100 text-slate-700 border-slate-200',
  online: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  busy: 'bg-violet-100 text-violet-700 border-violet-200',
  pending_verification: 'bg-amber-100 text-amber-700 border-amber-200',
  
  // Order statuses
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  preparing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  picked_up: 'bg-violet-100 text-violet-700 border-violet-200',
  in_transit: 'bg-violet-100 text-violet-700 border-violet-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  
  // Ticket statuses
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',
  
  // Priority
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-rose-100 text-rose-700 border-rose-200',
  
  // Payment
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  refunded: 'bg-blue-100 text-blue-700 border-blue-200',
  
  // Notifications
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  sent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function StatusBadge({ status, className }) {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  
  return (
    <Badge 
      variant="outline" 
      className={cn(style, 'border font-medium capitalize', className)}
    >
      {status?.replace(/_/g, ' ')}
    </Badge>
  );
}