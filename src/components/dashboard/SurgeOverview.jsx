import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MapPin, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SurgeOverview({ zones = [], onAdjust }) {
  const activeSurges = zones.filter(z => Number(z.surge_multiplier) > 1).length;

  return (
    <Card className="bg-white border-0 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            Active Surge Zones
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500">
            {activeSurges} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No zones configured</p>
          </div>
        ) : (
          zones.map((zone) => {
            const multiplier = Number(zone.surge_multiplier) || 1.0;
            const isSurging = multiplier > 1;
            
            return (
              <div 
                key={zone.id} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md group",
                  isSurging 
                    ? "bg-rose-50/50 border-rose-100/50 hover:border-rose-200" 
                    : "bg-white border-slate-100 hover:border-violet-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-colors",
                    isSurging ? "bg-rose-100 text-rose-600" : "bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600"
                  )}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{zone.city || zone.name}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      {isSurging ? (
                        <span className="flex items-center gap-1 text-rose-600 font-medium">
                          <TrendingUp className="w-3 h-3" /> 
                          High Demand
                        </span>
                      ) : (
                        "Normal Demand"
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={cn(
                      "text-sm font-black tabular-nums",
                      isSurging ? "text-rose-600" : "text-slate-900"
                    )}>
                      {multiplier.toFixed(1)}x
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg hover:bg-white hover:text-violet-600 border border-transparent hover:border-slate-100 shadow-none"
                    onClick={() => onAdjust?.(zone)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
