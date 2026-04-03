import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MapPin, Zap, Settings, ShieldAlert, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export default function SurgeOverview({ 
  zones = [], 
  globalSurge = { isActive: false, multiplier: 1.0 },
  onAdjust,
  onGlobalToggle,
  onGlobalMultiplierChange
}) {
  const activeSurges = zones.filter(z => Number(z.surge_multiplier) > 1).length;

  return (
    <Card className="bg-white border-0 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            Surge Control Center
          </CardTitle>
          <Badge variant={globalSurge.isActive ? "success" : "outline"} className="text-[10px] font-medium">
            {globalSurge.isActive ? "GLOBAL ACTIVE" : "PLATFORM NORMAL"}
          </Badge>
        </div>

        {/* Global Surge Control Section */}
        <div className={cn(
          "p-4 rounded-2xl border transition-all duration-300",
          globalSurge.isActive ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-2 rounded-xl",
                globalSurge.isActive ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-500"
              )}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Global Pricing Surge</p>
                <p className="text-[10px] text-slate-500">Apply multiplier platform-wide</p>
              </div>
            </div>
            <Switch 
              checked={globalSurge.isActive} 
              onCheckedChange={onGlobalToggle}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pricing Multiplier</span>
              <span className={cn(
                "text-lg font-black tabular-nums",
                globalSurge.isActive ? "text-amber-600" : "text-slate-400"
              )}>{globalSurge.multiplier.toFixed(1)}x</span>
            </div>
            <Slider
              disabled={!globalSurge.isActive}
              value={[globalSurge.multiplier]}
              min={1.0}
              max={3.0}
              step={0.1}
              onValueChange={(val) => onGlobalMultiplierChange?.(val[0])}
              className={cn("py-2", !globalSurge.isActive && "opacity-50 grayscale")}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Zone Specific Metrics</h3>
          <span className="text-[10px] text-slate-400">{activeSurges} active hotspots</span>
        </div>

        {zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No zones configured</p>
          </div>
        ) : (
          zones.map((zone) => {
            const multiplier = Number(zone.surge_multiplier) || 1.0;
            const isSurging = multiplier > 1 || globalSurge.isActive;
            const demandLevel = zone.demandLevel || 0;
            
            return (
              <div 
                key={zone.id} 
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-xl border transition-all hover:shadow-md group",
                  isSurging 
                    ? "bg-rose-50/50 border-rose-100/50 hover:border-rose-200" 
                    : "bg-white border-slate-100 hover:border-violet-200"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-colors",
                    isSurging ? "bg-rose-100 text-rose-600" : "bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600"
                  )}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{zone.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 grayscale-[0.5] group-hover:grayscale-0 transition-all">
                        <Activity className={cn(
                          "w-3 h-3",
                          demandLevel > 70 ? "text-rose-500" : demandLevel > 40 ? "text-amber-500" : "text-emerald-500"
                        )} />
                        <span className="text-[10px] font-medium text-slate-500">{demandLevel}% Demand</span>
                      </div>
                      {isSurging && (
                        <div className="flex items-center gap-1 text-[10px] text-rose-600 font-bold">
                          <TrendingUp className="w-3 h-3" /> 
                          {multiplier.toFixed(1)}x
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg hover:bg-white hover:text-violet-600 border border-transparent hover:border-slate-100 shadow-none ml-2"
                  onClick={() => onAdjust?.(zone)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
