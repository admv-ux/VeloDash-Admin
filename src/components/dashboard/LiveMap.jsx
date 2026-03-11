import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Car, Store, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function LiveMap({ drivers, merchants, orders }) {
  const center = [5.6037, -0.1870]; // Default to Accra, Ghana
  
  return (
    <Card className="bg-white border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Live Map</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Online Drivers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span className="text-slate-600">Merchants</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-600">Active Orders</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] relative">
          <MapContainer
            center={center}
            zoom={12}
            className="h-full w-full"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Online Drivers */}
            {drivers?.filter(d => d?.status === 'online' && d.current_latitude && d.current_longitude).map((driver, idx) => (
              (
                <CircleMarker
                  key={`driver-${idx}`}
                  center={[driver.current_latitude, driver.current_longitude]}
                  radius={8}
                  fillColor="#10b981"
                  fillOpacity={0.9}
                  stroke={true}
                  weight={2}
                  color="#fff"
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{driver.full_name}</p>
                      <p className="text-slate-500">{driver.vehicle_type}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            ))}

            {/* Merchants */}
            {merchants?.filter(m => m?.status === 'verified' && m.latitude && m.longitude).map((merchant, idx) => (
              (
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
                      <p className="font-medium">{merchant.business_name}</p>
                      <p className="text-slate-500">{merchant.category}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            ))}

            {/* Active Orders */}
            {orders?.filter(o => o?.status && ['in_transit', 'picked_up'].includes(o.status) && o.dropoff_latitude && o.dropoff_longitude).map((order, idx) => (
              (
                <CircleMarker
                  key={`order-${idx}`}
                  center={[order.dropoff_latitude, order.dropoff_longitude]}
                  radius={6}
                  fillColor="#f59e0b"
                  fillOpacity={0.9}
                  stroke={true}
                  weight={2}
                  color="#fff"
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-slate-500">{order.status?.replace(/_/g, ' ')}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}