import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Car, Store, MapPin, Map as MapIcon, Layers, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/AuthContext';
import 'leaflet/dist/leaflet.css';

const COUNTRY_CITIES = {
  Ghana: {
    Accra: [5.6037, -0.1870],
    Kumasi: [6.6666, -1.6163],
    Tema: [5.6667, -0.0167],
    Takoradi: [4.8917, -1.7514],
  },
  Nigeria: {
    Lagos: [6.5244, 3.3792],
    Abuja: [9.0765, 7.3986],
    "Port Harcourt": [4.8156, 7.0498],
  },
  "South Africa": {
    Johannesburg: [-26.2041, 28.0473],
    "Cape Town": [-33.9249, 18.4241],
    Pretoria: [-25.7479, 28.2293],
  },
  "CHINA": {
    Shanghai: [31.2304, 121.4737],
    Beijing: [39.9042, 116.4074],
    Guangzhou: [23.1291, 113.2644],
  },
  "Togo": {
    "Lomé": [6.1375, 1.2125],
    "Lome": [6.1375, 1.2125],
  }
};

const ALL_CITIES = {
  ...COUNTRY_CITIES.Ghana,
  ...COUNTRY_CITIES.Nigeria,
  ...COUNTRY_CITIES["South Africa"],
  ...COUNTRY_CITIES["CHINA"],
  ...COUNTRY_CITIES["Togo"],
};

export default function LiveMap({ drivers, merchants, orders, zones = [], onAdjustSurge }) {
  const { currentLocation, setLocationScope } = useAuth();
  const [selectedCity, setSelectedCity] = useState(currentLocation.city === 'All' ? 'Accra' : currentLocation.city);
  const [filters, setFilters] = useState({
    drivers: true,
    merchants: true,
    orders: true,
    heatmap: false,
  });

  // Sync with global location scope
  useEffect(() => {
    if (currentLocation.city !== 'All') {
      setSelectedCity(currentLocation.city);
    } else if (currentLocation.country !== 'All') {
      // Default to first city in country if country is selected but city is "All"
      const currentCountryName = currentLocation.country;
      const citiesInCountry = Object.keys(COUNTRY_CITIES[currentCountryName] || {});
      if (citiesInCountry.length > 0) {
        setSelectedCity(citiesInCountry[0]);
      }
    }
  }, [currentLocation]);

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setLocationScope({ city });
  };

  const currentCities = currentLocation.country === 'All' 
    ? ALL_CITIES 
    : (COUNTRY_CITIES[currentLocation.country] || {});

  const effectiveCity = currentCities[selectedCity] ? selectedCity : (Object.keys(currentCities)[0] || 'Accra');
  const center = currentCities[effectiveCity] || [5.6037, -0.1870];

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleHeatmapClick = () => {
    const zone = zones.find(z => z.city === effectiveCity || z.name.includes(effectiveCity));
    if (zone) {
      onAdjustSurge?.(zone);
    }
  };
  
  return (
    <Card className="bg-white border-0 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-4 border-b relative z-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-violet-600" />
              Live Operations Map
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Real-time logistics monitoring</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={effectiveCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent className="z-[1001]">
                {Object.keys(currentCities).map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
                {Object.keys(currentCities).length === 0 && (
                  <SelectItem value="All" disabled>No cities defined</SelectItem>
                )}
              </SelectContent>
            </Select>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFilter('drivers')}
                className={cn(
                  "h-7 px-3 text-xs gap-1.5 rounded-md transition-all",
                  filters.drivers ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                )}
              >
                <Car className="w-3.5 h-3.5" /> Drivers
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFilter('orders')}
                className={cn(
                  "h-7 px-3 text-xs gap-1.5 rounded-md transition-all",
                  filters.orders ? "bg-white text-amber-600 shadow-sm" : "text-slate-500"
                )}
              >
                <Package className="w-3.5 h-3.5" /> Orders
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFilter('heatmap')}
                className={cn(
                  "h-7 px-3 text-xs gap-1.5 rounded-md transition-all",
                  filters.heatmap ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"
                )}
              >
                <Layers className="w-3.5 h-3.5" /> Heatmap
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 relative">
        <div className="h-[500px] w-full relative">
          <MapContainer
            center={center}
            zoom={12}
            scrollWheelZoom={false}
            className="h-full w-full"
            style={{ height: '100%', width: '100%' }}
            key={selectedCity} // Re-mount on city change
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Demand Heatmap - Using real Zone data */}
            {filters.heatmap && zones?.filter(z => z.latitude && z.longitude).map((zone, idx) => {
              const demandColor = zone.demandLevel > 80 ? "#ef4444" : 
                                 zone.demandLevel > 50 ? "#f97316" : 
                                 "#10b981";
              return (
                <CircleMarker
                  key={`zone-heat-${zone.id || idx}`}
                  center={[zone.latitude, zone.longitude]}
                  radius={zone.radius_km * 5} // Scale for visibility
                  fillColor={demandColor}
                  fillOpacity={0.25}
                  stroke={true}
                  weight={1}
                  color={demandColor}
                  eventHandlers={{
                    click: () => onAdjustSurge?.(zone)
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">{zone.name}</p>
                      <p className="text-slate-500">Demand: {zone.demandLevel}%</p>
                      <p className="text-slate-500">Surge: {zone.surge_multiplier}x</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Merchants */}
            {filters.merchants && merchants?.filter(m => m?.status === 'verified' && m.latitude && m.longitude).map((merchant, idx) => (
              <CircleMarker
                key={`merchant-${idx}`}
                center={[merchant.latitude, merchant.longitude]}
                radius={6}
                fillColor="#8b5cf6"
                fillOpacity={0.9}
                stroke={true}
                weight={2}
                color="#fff"
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{merchant.business_name}</p>
                    <p className="text-slate-500">{merchant.category}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Active Orders */}
            {filters.orders && orders?.filter(o => o?.status && ['in_transit', 'picked_up'].includes(o.status) && o.dropoff_latitude && o.dropoff_longitude).map((order, idx) => (
              <CircleMarker
                key={`order-${idx}`}
                center={[order.dropoff_latitude, order.dropoff_longitude]}
                radius={7}
                fillColor="#f59e0b"
                fillOpacity={0.9}
                stroke={true}
                weight={2}
                color="#fff"
              >
                <Popup>
                  <div className="text-sm p-1">
                    <p className="font-bold">Order #{order.order_number}</p>
                    <p className="text-slate-500 capitalize">{order.status?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{order.dropoff_address}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Online Drivers */}
            {filters.drivers && drivers?.filter(d => d?.status === 'online' && d.current_latitude && d.current_longitude).map((driver, idx) => (
              <CircleMarker
                key={`driver-${idx}`}
                center={[driver.current_latitude, driver.current_longitude]}
                radius={8}
                fillColor="#10b981"
                fillOpacity={1}
                stroke={true}
                weight={2}
                color="#fff"
              >
                <Popup>
                  <div className="text-sm p-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="font-bold">{driver.full_name}</p>
                    </div>
                    <p className="text-slate-500 text-xs">{driver.vehicle_type} • {driver.plate_number}</p>
                    <Button size="xs" variant="outline" className="w-full mt-2 h-7 text-[10px]">Track Journey</Button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          
          {/* Map Overlay Controls */}
          <div className="absolute bottom-4 left-4 z-[1000] space-y-2">
            <div className="bg-white/90 backdrop-blur shadow-lg border rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-medium text-slate-600">Online Drivers ({drivers?.filter(d => d.status === 'online').length || 0})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-[10px] font-medium text-slate-600">Active Deliveries ({orders?.filter(o => ['in_transit', 'picked_up'].includes(o.status)).length || 0})</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}