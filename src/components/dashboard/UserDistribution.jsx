import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Car, Users, MapPin } from 'lucide-react';

export default function UserDistribution({ merchants, drivers, riders }) {
  // Calculate totals
  const totalUsers = (merchants?.length || 0) + (drivers?.length || 0) + (riders?.length || 0);
  
  // Group by city
  const locationStats = {};
  
  merchants?.forEach(m => {
    if (!m) return;
    const city = m.city || 'Unknown';
    if (!locationStats[city]) locationStats[city] = { merchants: 0, drivers: 0, riders: 0 };
    locationStats[city].merchants++;
  });
  
  drivers?.forEach(d => {
    if (!d) return;
    const city = d.zone_id || 'Unknown';
    if (!locationStats[city]) locationStats[city] = { merchants: 0, drivers: 0, riders: 0 };
    locationStats[city].drivers++;
  });
  
  riders?.forEach(r => {
    if (!r) return;
    const city = r.city || 'Unknown';
    if (!locationStats[city]) locationStats[city] = { merchants: 0, drivers: 0, riders: 0 };
    locationStats[city].riders++;
  });

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">User Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-violet-50 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <Store className="w-6 h-6 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-violet-600">{merchants?.length || 0}</p>
            <p className="text-sm text-slate-600">Merchants</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <Car className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{drivers?.length || 0}</p>
            <p className="text-sm text-slate-600">Drivers</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{riders?.length || 0}</p>
            <p className="text-sm text-slate-600">Buyers</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="p-4 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Platform Users</p>
              <p className="text-3xl font-bold mt-1">{totalUsers}</p>
            </div>
            <Users className="w-12 h-12 opacity-30" />
          </div>
        </div>

        {/* Location Breakdown */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            By Location
          </h4>
          <div className="space-y-2">
            {Object.entries(locationStats).map(([city, stats]) => {
              const cityTotal = stats.merchants + stats.drivers + stats.riders;
              return (
                <div key={city} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">{city}</span>
                    <span className="text-sm font-semibold text-slate-600">{cityTotal} users</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Store className="w-3 h-3 text-violet-500" />
                      <span className="text-slate-600">{stats.merchants}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-3 h-3 text-emerald-500" />
                      <span className="text-slate-600">{stats.drivers}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      <span className="text-slate-600">{stats.riders}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}