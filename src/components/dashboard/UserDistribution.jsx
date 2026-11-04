import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Car, Users, MapPin } from 'lucide-react';

export default function UserDistribution({ merchants, drivers, riders, onStatClick, stats }) {
  // Calculate totals
  // Real platform user count from the database. Summing the three role lists
  // double-counts anyone holding more than one role, so prefer the server total.
  const totalUsers = stats?.totalUsers
    ?? ((merchants?.length || 0) + (drivers?.length || 0) + (riders?.length || 0));
  const segmentMemberships = stats?.segmentMemberships || 0;
  
  // Group by city
  const locationStats = {};
  
  merchants?.forEach(m => {
    if (!m) return;
    const city = m.city || 'Unknown';
    if (!locationStats[city]) locationStats[city] = { merchants: 0, drivers: 0, riders: 0, onlineDrivers: 0 };
    locationStats[city].merchants++;
  });
  
  drivers?.forEach(d => {
    if (!d) return;
    const city = d.zone_id || 'Unknown';
    if (!locationStats[city]) locationStats[city] = { merchants: 0, drivers: 0, riders: 0, onlineDrivers: 0 };
    locationStats[city].drivers++;
    if (d.status === 'online') locationStats[city].onlineDrivers++;
  });
  
  riders?.forEach(r => {
    if (!r) return;
    const city = r.city || 'Unknown';
    if (!locationStats[city]) locationStats[city] = { merchants: 0, drivers: 0, riders: 0, onlineDrivers: 0 };
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
          <div
            className="text-center p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => onStatClick?.("Total Buyers", stats?.totalRidersByCountry)}
          >
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats?.totalRiders ?? riders?.length ?? 0}</p>
            <p className="text-sm text-slate-600">Buyers</p>
          </div>
          <div
            className="text-center p-4 bg-violet-50 rounded-xl cursor-pointer hover:bg-violet-100 transition-colors"
            onClick={() => onStatClick?.("Total Merchants", stats?.totalMerchantsByCountry)}
          >
            <div className="flex items-center justify-center mb-2">
              <Store className="w-6 h-6 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-violet-600">{stats?.totalMerchants ?? merchants?.length ?? 0}</p>
            <p className="text-sm text-slate-600">Merchants</p>
          </div>
          <div
            className="text-center p-4 bg-emerald-50 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors"
            onClick={() => onStatClick?.("Total Drivers", stats?.totalDriversByCountry)}
          >
            <div className="flex items-center justify-center mb-2">
              <Car className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats?.totalDrivers ?? drivers?.length ?? 0}</p>
            <p className="text-sm text-slate-600">Drivers</p>
            <p className="text-[10px] text-emerald-500 font-medium mt-1">
              {stats?.driversOnline ?? drivers?.filter(d => d?.status === 'online').length ?? 0} online now
            </p>
          </div>
        </div>

        {/* Total Users. The three tiles above overlap - nearly every merchant and
            driver also holds a buyer role - so they deliberately do not add up
            to this number, and the caption says so rather than leaving it
            looking like a contradiction. */}
        <div className="p-4 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Platform Users</p>
              <p className="text-3xl font-bold mt-1">{Number(totalUsers || 0).toLocaleString()}</p>
              <p className="text-[11px] opacity-85 mt-1">
                Distinct accounts
                {segmentMemberships ? ` - the three segments above overlap and total ${segmentMemberships.toLocaleString()} memberships` : ''}
              </p>
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
                      <span className="text-slate-600">{stats.drivers} <span className="text-[10px] text-emerald-500 font-medium ml-1">({stats.onlineDrivers} on)</span></span>
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