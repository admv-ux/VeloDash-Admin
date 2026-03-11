import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Car, MapPin, Clock, Navigation as NavigationIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';

export default function LiveTrackingMap({ order, driver }) {
  const [driverLocation, setDriverLocation] = useState(
    driver?.current_latitude && driver?.current_longitude
      ? [driver.current_latitude, driver.current_longitude]
      : null
  );
  const [eta, setEta] = useState(null);

  // Simulate real-time driver location updates
  useEffect(() => {
    if (!driver?.current_latitude || !driver?.current_longitude) return;

    const interval = setInterval(() => {
      // Simulate small movements (in production, this would be real GPS data)
      setDriverLocation((prev) => {
        if (!prev) return [driver.current_latitude, driver.current_longitude];
        const randomLat = prev[0] + (Math.random() - 0.5) * 0.001;
        const randomLng = prev[1] + (Math.random() - 0.5) * 0.001;
        return [randomLat, randomLng];
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [driver]);

  // Calculate ETA based on distance and traffic
  useEffect(() => {
    if (!driverLocation || !order?.dropoff_latitude || !order?.dropoff_longitude) {
      setEta(null);
      return;
    }

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const distance = calculateDistance(
      driverLocation[0],
      driverLocation[1],
      order.dropoff_latitude,
      order.dropoff_longitude
    );

    // Estimate time: base speed 30km/h + random traffic factor
    const trafficFactor = 1 + Math.random() * 0.5; // 1x to 1.5x
    const baseSpeed = 30; // km/h
    const effectiveSpeed = baseSpeed / trafficFactor;
    const timeInHours = distance / effectiveSpeed;
    const timeInMinutes = Math.ceil(timeInHours * 60);

    setEta(timeInMinutes);
  }, [driverLocation, order]);

  if (!order?.pickup_latitude || !order?.dropoff_latitude) {
    return (
      <Card className="bg-slate-50 border-0">
        <CardContent className="p-6 text-center text-slate-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-slate-400" />
          <p>Location data not available</p>
        </CardContent>
      </Card>
    );
  }

  const center = driverLocation || [order.pickup_latitude, order.pickup_longitude];
  const routeCoordinates = [
    driverLocation || [order.pickup_latitude, order.pickup_longitude],
    [order.dropoff_latitude, order.dropoff_longitude],
  ];

  return (
    <Card className="bg-white border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Live Tracking</CardTitle>
          {eta && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-full">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">ETA: {eta} min</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] relative">
          <MapContainer
            center={center}
            zoom={14}
            className="h-full w-full"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Route line */}
            <Polyline
              positions={routeCoordinates}
              color="#8b5cf6"
              weight={4}
              opacity={0.7}
              dashArray="10, 10"
            />

            {/* Driver location */}
            {driverLocation && (
              <Marker position={driverLocation}>
                <Popup>
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-4 h-4 text-emerald-600" />
                      <p className="font-medium">{driver?.full_name || 'Driver'}</p>
                    </div>
                    <p className="text-slate-500">{driver?.vehicle_type || 'Vehicle'}</p>
                    <p className="text-xs text-emerald-600 mt-1">Live Location</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Pickup location */}
            <Marker position={[order.pickup_latitude, order.pickup_longitude]}>
              <Popup>
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <p className="font-medium">Pickup</p>
                  </div>
                  <p className="text-slate-600">{order.pickup_address}</p>
                </div>
              </Popup>
            </Marker>

            {/* Dropoff location */}
            <Marker position={[order.dropoff_latitude, order.dropoff_longitude]}>
              <Popup>
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <p className="font-medium">Dropoff</p>
                  </div>
                  <p className="text-slate-600">{order.dropoff_address}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Trip info footer */}
        <div className="p-4 bg-slate-50 border-t grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Distance</p>
            <p className="font-semibold text-slate-900">
              {order.distance_km ? `${order.distance_km.toFixed(1)} km` : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <p className="font-semibold text-slate-900 capitalize">
              {order.status?.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Traffic</p>
            <p className="font-semibold text-amber-600">Moderate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}