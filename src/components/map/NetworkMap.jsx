import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { loadGoogleMaps } from '@/lib/googleMaps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Car, Store, Package, Users, Flame, Search, X, MapPin, Phone, ExternalLink, RefreshCw } from 'lucide-react';

// Operating hubs (for the optional coverage overlay). Mirrors the customer app's markets.
const HUBS = [
  { country: 'GH', city: 'Accra', lat: 5.6037, lng: -0.1870 },
  { country: 'NG', city: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { country: 'KE', city: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  { country: 'ZA', city: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
  { country: 'TZ', city: 'Dar es Salaam', lat: -6.7924, lng: 39.2083 },
  { country: 'UG', city: 'Kampala', lat: 0.3476, lng: 32.5825 },
  { country: 'US', city: 'New York', lat: 40.7128, lng: -74.0060 },
  { country: 'CA', city: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { country: 'EU', city: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { country: 'PL', city: 'Warsaw', lat: 52.2297, lng: 21.0122 },
];
const RADIUS_KM = 40;

// Country centroids, used only to place the "rest of the user base" bubbles.
// Users store a country but no coordinates, so a country tally is the honest
// way to show everyone without inventing a precise position for them.
const COUNTRY_CENTROIDS = {
  GH: { lat: 7.95, lng: -1.03 }, NG: { lat: 9.08, lng: 8.68 }, KE: { lat: -0.02, lng: 37.91 },
  ZA: { lat: -30.56, lng: 22.94 }, TZ: { lat: -6.37, lng: 34.89 }, UG: { lat: 1.37, lng: 32.29 },
  US: { lat: 39.83, lng: -98.58 }, CA: { lat: 56.13, lng: -106.35 }, GB: { lat: 55.38, lng: -3.44 },
  DE: { lat: 51.17, lng: 10.45 }, PL: { lat: 51.92, lng: 19.15 }, AT: { lat: 47.52, lng: 14.55 },
  SI: { lat: 46.15, lng: 14.99 }, EG: { lat: 26.82, lng: 30.80 }, IN: { lat: 20.59, lng: 78.96 },
  CN: { lat: 35.86, lng: 104.20 }, FR: { lat: 46.23, lng: 2.21 }, ES: { lat: 40.46, lng: -3.75 },
  IT: { lat: 41.87, lng: 12.57 }, NL: { lat: 52.13, lng: 5.29 }, AE: { lat: 23.42, lng: 53.85 },
  CI: { lat: 7.54, lng: -5.55 }, SN: { lat: 14.50, lng: -14.45 }, CM: { lat: 7.37, lng: 12.35 },
  ET: { lat: 9.15, lng: 40.49 }, RW: { lat: -1.94, lng: 29.87 }, MA: { lat: 31.79, lng: -7.09 },
};

const DRIVER_COLOR = '#16A34A';
const PICKUP_COLOR = '#123C86';
const DROPOFF_COLOR = '#F2761A';
const USER_COLOR = '#8B5CF6';
const MERCHANT_COLORS = { food: '#F2761A', pharmacy: '#EF4444', grocery: '#10B981', marketplace: '#3B82F6', services: '#8B5CF6' };

function merchantBucket(cat) {
  cat = (cat || '').toLowerCase();
  if (/food|restaurant|meal|kitchen|eat|cafe|dish/.test(cat)) return 'food';
  if (/pharma|drug|med|health|clinic/.test(cat)) return 'pharmacy';
  if (/grocer|market|fresh|produce|super/.test(cat)) return 'grocery';
  if (/service|salon|repair|clean|beauty|barber|laundry/.test(cat)) return 'services';
  return 'marketplace';
}
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * The single live network map, shared by the Live Map page and the Dashboard so
 * both always show the same thing.
 *
 * `compact` drops the page title and shrinks the chrome for embedding.
 */
export default function NetworkMap({ compact = false, height, className = '' }) {
  const navigate = useNavigate();
  const mapEl = useRef(null);
  const searchEl = useRef(null);
  const gmaps = useRef(null);
  const map = useRef(null);
  const info = useRef(null);
  const layersRef = useRef({ drivers: [], merchants: [], orders: [], users: [], countries: [], coverage: [], heatmap: null });
  const merchantCluster = useRef(null);
  const userCluster = useRef(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState({ drivers: true, merchants: true, users: true, orders: true, coverage: false, heatmap: false });

  const live = useQuery({ queryKey: ['map-live'], queryFn: () => base44.map.live(), refetchInterval: 12000 });
  const merchants = useQuery({ queryKey: ['map-merchants'], queryFn: () => base44.map.merchants(), staleTime: 5 * 60 * 1000 });
  const usersQ = useQuery({ queryKey: ['map-users'], queryFn: () => base44.map.users(), refetchInterval: 60000 });

  const drivers = live.data?.drivers || [];
  const orders = live.data?.orders || [];
  const stores = merchants.data?.merchants || [];
  const userPoints = usersQ.data?.users || [];
  const usersByCountry = usersQ.data?.byCountry || [];
  const stats = live.data?.stats || {};
  const totalUsers = usersQ.data?.stats?.totalUsers ?? stats.users;

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((g) => {
      if (cancelled || map.current) return;
      gmaps.current = g;
      map.current = new g.Map(mapEl.current, {
        center: { lat: 6.6, lng: 3.0 }, zoom: 3,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: true, zoomControl: true,
        clickableIcons: false, gestureHandling: 'greedy',
      });
      info.current = new g.InfoWindow();
      if (searchEl.current) {
        const ac = new g.places.Autocomplete(searchEl.current, { fields: ['geometry'] });
        ac.addListener('place_changed', () => {
          const p = ac.getPlace();
          if (p.geometry?.location) { map.current.panTo(p.geometry.location); map.current.setZoom(14); }
        });
      }
      setReady(true);
    }).catch((e) => setErr(e.message || 'Map failed to load'));
    return () => { cancelled = true; };
  }, []);

  const dot = (position, color, scale, title, noMap) => new gmaps.current.Marker({
    position, map: noMap ? null : map.current, title,
    icon: { path: gmaps.current.SymbolPath.CIRCLE, scale, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 1.5 },
  });
  const bindClick = (marker, html, sel) => marker.addListener('click', () => {
    info.current.setContent(html); info.current.open(map.current, marker); setSelected(sel);
  });
  const clear = (arr) => { arr.forEach((m) => m.setMap(null)); arr.length = 0; };

  // Drivers.
  useEffect(() => {
    if (!ready) return;
    const L = layersRef.current.drivers; clear(L);
    if (show.drivers) drivers.forEach((d) => {
      if (d.lat == null || d.lng == null) return;
      const m = dot({ lat: Number(d.lat), lng: Number(d.lng) }, DRIVER_COLOR, 8, d.name);
      const html = `<div style="font:13px/1.4 system-ui"><b>${esc(d.name)}</b><br>${esc(d.vehicleType || 'Driver')}${d.plateNumber ? ' - ' + esc(d.plateNumber) : ''}<br>Status: ${esc(d.status)}</div>`;
      bindClick(m, html, { kind: 'driver', data: d }); L.push(m);
    });
  }, [ready, drivers, show.drivers]);

  // Merchants (clustered).
  useEffect(() => {
    if (!ready) return;
    if (!merchantCluster.current) merchantCluster.current = new MarkerClusterer({ map: map.current });
    merchantCluster.current.clearMarkers();
    const L = layersRef.current.merchants; L.length = 0;
    if (show.merchants) {
      stores.forEach((s) => {
        if (s.lat == null || s.lng == null) return;
        const m = dot({ lat: Number(s.lat), lng: Number(s.lng) }, MERCHANT_COLORS[merchantBucket(s.category)], 6, s.businessName, true);
        const html = `<div style="font:13px/1.4 system-ui"><b>${esc(s.businessName)}</b><br>${esc(s.category || 'Store')}${s.city ? ' - ' + esc(s.city) : ''}<br>${esc(s.status || '')}</div>`;
        bindClick(m, html, { kind: 'merchant', data: s }); L.push(m);
      });
      merchantCluster.current.addMarkers(L);
    }
  }, [ready, stores, show.merchants]);

  // Users with a real last-known position (clustered).
  useEffect(() => {
    if (!ready) return;
    if (!userCluster.current) userCluster.current = new MarkerClusterer({ map: map.current });
    userCluster.current.clearMarkers();
    const L = layersRef.current.users; L.length = 0;
    if (show.users) {
      userPoints.forEach((u) => {
        if (u.lat == null || u.lng == null) return;
        const m = dot({ lat: Number(u.lat), lng: Number(u.lng) }, USER_COLOR, 5, u.name, true);
        const seen = u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleDateString() : '';
        const html = `<div style="font:13px/1.4 system-ui"><b>${esc(u.name)}</b><br>Customer${u.country ? ' - ' + esc(u.country) : ''}<br>Last seen at ${esc(u.source)}${seen ? ' on ' + esc(seen) : ''}</div>`;
        bindClick(m, html, { kind: 'user', data: u }); L.push(m);
      });
      userCluster.current.addMarkers(L);
    }
  }, [ready, userPoints, show.users]);

  // Everyone else, tallied per country. Users store only a country, so this is
  // how the remaining base is represented without inventing coordinates.
  useEffect(() => {
    if (!ready) return;
    const L = layersRef.current.countries; clear(L);
    if (!show.users) return;
    const locatedByCountry = {};
    userPoints.forEach((u) => { if (u.country) locatedByCountry[u.country] = (locatedByCountry[u.country] || 0) + 1; });
    usersByCountry.forEach((c) => {
      const centroid = COUNTRY_CENTROIDS[c.country];
      if (!centroid) return;
      const remaining = c.count - (locatedByCountry[c.country] || 0);
      if (remaining <= 0) return;
      const circle = new gmaps.current.Circle({
        map: map.current, center: centroid,
        radius: Math.min(600000, 60000 + Math.sqrt(remaining) * 28000),
        strokeColor: USER_COLOR, strokeWeight: 1, strokeOpacity: 0.5,
        fillColor: USER_COLOR, fillOpacity: 0.16,
      });
      circle.addListener('click', () => {
        info.current.setContent(
          `<div style="font:13px/1.4 system-ui"><b>${esc(c.country)}</b><br>${remaining} user${remaining === 1 ? '' : 's'} without a recorded position<br><span style="color:#64748b">${c.count} total in this country</span></div>`,
        );
        info.current.setPosition(centroid);
        info.current.open(map.current);
      });
      L.push(circle);
    });
  }, [ready, userPoints, usersByCountry, show.users]);

  // Orders (pickup + dropoff + connecting line).
  useEffect(() => {
    if (!ready) return;
    const L = layersRef.current.orders; clear(L);
    if (show.orders) orders.forEach((o) => {
      if (o.dropoff) {
        const m = dot({ lat: Number(o.dropoff.lat), lng: Number(o.dropoff.lng) }, DROPOFF_COLOR, 6, o.customerName);
        const html = `<div style="font:13px/1.4 system-ui"><b>${esc(o.customerName || 'Customer')}</b> (${esc(o.kind)})<br>${esc(o.status)}${o.driverName ? '<br>Driver: ' + esc(o.driverName) : ''}${o.amount != null ? '<br>' + esc(o.currency || '') + ' ' + esc(o.amount) : ''}</div>`;
        bindClick(m, html, { kind: 'order', data: o }); L.push(m);
      }
      if (o.pickup) {
        const p = dot({ lat: Number(o.pickup.lat), lng: Number(o.pickup.lng) }, PICKUP_COLOR, 5, 'Pickup');
        bindClick(p, `<div style="font:13px/1.4 system-ui"><b>Pickup</b><br>${esc(o.pickup.address || '')}</div>`, { kind: 'order', data: o }); L.push(p);
      }
      if (o.pickup && o.dropoff) {
        L.push(new gmaps.current.Polyline({
          path: [{ lat: Number(o.pickup.lat), lng: Number(o.pickup.lng) }, { lat: Number(o.dropoff.lat), lng: Number(o.dropoff.lng) }],
          geodesic: true, strokeColor: DROPOFF_COLOR, strokeOpacity: 0.6, strokeWeight: 2, map: map.current,
        }));
      }
    });
  }, [ready, orders, show.orders]);

  // Coverage overlay.
  useEffect(() => {
    if (!ready) return;
    const L = layersRef.current.coverage; clear(L);
    if (show.coverage) HUBS.forEach((h) => {
      L.push(new gmaps.current.Circle({ map: map.current, center: { lat: h.lat, lng: h.lng }, radius: RADIUS_KM * 1000, strokeColor: '#123C86', strokeWeight: 1, fillColor: '#123C86', fillOpacity: 0.05, clickable: false }));
    });
  }, [ready, show.coverage]);

  // Demand heatmap over order pickup points.
  useEffect(() => {
    if (!ready) return;
    const g = gmaps.current;
    if (layersRef.current.heatmap) { layersRef.current.heatmap.setMap(null); layersRef.current.heatmap = null; }
    if (show.heatmap && g.visualization) {
      const pts = orders.filter((o) => o.pickup).map((o) => new g.LatLng(Number(o.pickup.lat), Number(o.pickup.lng)));
      if (pts.length) layersRef.current.heatmap = new g.visualization.HeatmapLayer({ data: pts, map: map.current, radius: 32, opacity: 0.7 });
    }
  }, [ready, orders, show.heatmap]);

  const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));
  const refreshAll = () => { live.refetch(); merchants.refetch(); usersQ.refetch(); };

  const Stat = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200">
      <Icon className="w-4 h-4" style={{ color }} />
      <div><div className="text-lg font-bold leading-none">{value ?? '-'}</div><div className="text-xs text-slate-500">{label}</div></div>
    </div>
  );
  const Chip = ({ k, icon: Icon, label, color }) => (
    <button onClick={() => toggle(k)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${show[k] ? 'text-white' : 'bg-white text-slate-600 border-slate-200'}`} style={show[k] ? { background: color, borderColor: color } : {}}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );

  const mapHeight = height || (compact ? 520 : 'calc(100vh - 300px)');

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={compact ? 'text-lg font-semibold text-slate-900' : 'text-2xl font-bold'}>Live Map</h2>
          <p className="text-sm text-slate-500">Drivers, merchants, users and active orders across the network.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Users} label="Total users" value={totalUsers} color={USER_COLOR} />
        <Stat icon={Store} label="Merchants" value={stats.merchants ?? stores.length} color={MERCHANT_COLORS.marketplace} />
        <Stat icon={Car} label="Online drivers" value={stats.onlineDrivers} color={DRIVER_COLOR} />
        <Stat icon={Package} label="Active orders" value={stats.activeOrders} color={DROPOFF_COLOR} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip k="users" icon={Users} label={`Users (${totalUsers ?? userPoints.length})`} color={USER_COLOR} />
        <Chip k="merchants" icon={Store} label={`Merchants (${stores.length})`} color={MERCHANT_COLORS.marketplace} />
        <Chip k="drivers" icon={Car} label={`Drivers (${drivers.length})`} color={DRIVER_COLOR} />
        <Chip k="orders" icon={Package} label={`Orders (${orders.length})`} color={DROPOFF_COLOR} />
        <Chip k="heatmap" icon={Flame} label="Demand heatmap" color="#EF4444" />
        <Chip k="coverage" icon={MapPin} label="Coverage" color="#123C86" />
        <div className="relative ml-auto min-w-[220px] flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input ref={searchEl} placeholder="Search a place to fly to" className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
        </div>
      </div>

      {show.users && userPoints.length < (totalUsers || 0) && (
        <p className="text-xs text-slate-500">
          {userPoints.length} of {totalUsers} users have a recorded position from a past order or ride. The rest are shown as
          shaded country totals, because users store a country but no coordinates.
        </p>
      )}

      <div className="relative">
        <div ref={mapEl} className="w-full rounded-xl border border-slate-200 overflow-hidden" style={{ height: mapHeight, minHeight: 420 }} />
        {err && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-600 bg-white/90 rounded-xl">{err}</div>}
        {!ready && !err && <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-white/70 rounded-xl">Loading map...</div>}

        {selected && (
          <Card className="absolute top-3 left-3 w-72 max-w-[80%] p-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="text-xs uppercase tracking-wide text-slate-500">{selected.kind}</div>
              <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            {selected.kind === 'driver' && <DriverCard d={selected.data} onOpen={() => navigate('/users')} />}
            {selected.kind === 'merchant' && <MerchantCard s={selected.data} onOpen={() => navigate('/users')} />}
            {selected.kind === 'user' && <UserCard u={selected.data} onOpen={() => navigate('/users')} />}
            {selected.kind === 'order' && <OrderCard o={selected.data} onOpen={() => navigate('/orders')} />}
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">{Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}<span>{children}</span></div>;
}
function DriverCard({ d, onOpen }) {
  return (<div className="mt-1">
    <div className="text-lg font-bold">{d.name}</div>
    <Row icon={Car}>{d.vehicleType || 'Driver'}{d.vehicleModel ? ` - ${d.vehicleModel}` : ''}{d.plateNumber ? ` (${d.plateNumber})` : ''}</Row>
    {d.phone && <Row icon={Phone}>{d.phone}</Row>}
    <Row icon={MapPin}>Status: {d.status}{d.region ? ` - ${d.region}` : ''}</Row>
    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onOpen}><ExternalLink className="w-4 h-4 mr-1" /> Open profile</Button>
  </div>);
}
function MerchantCard({ s, onOpen }) {
  return (<div className="mt-1">
    <div className="text-lg font-bold">{s.businessName}</div>
    <Row icon={Store}>{s.category || 'Store'}{s.status ? ` - ${s.status}` : ''}</Row>
    {s.ownerName && <Row icon={Users}>{s.ownerName}</Row>}
    {s.phone && <Row icon={Phone}>{s.phone}</Row>}
    {(s.city || s.country) && <Row icon={MapPin}>{[s.city, s.country].filter(Boolean).join(', ')}</Row>}
    {s.address && <Row icon={MapPin}>{s.address}</Row>}
    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onOpen}><ExternalLink className="w-4 h-4 mr-1" /> Open profile</Button>
  </div>);
}
function UserCard({ u, onOpen }) {
  return (<div className="mt-1">
    <div className="text-lg font-bold">{u.name}</div>
    <Row icon={Users}>Customer{u.country ? ` - ${u.country}` : ''}</Row>
    {u.phone && <Row icon={Phone}>{u.phone}</Row>}
    <Row icon={MapPin}>Last seen at a {u.source}{u.lastSeenAt ? ` on ${new Date(u.lastSeenAt).toLocaleDateString()}` : ''}</Row>
    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onOpen}><ExternalLink className="w-4 h-4 mr-1" /> Open profile</Button>
  </div>);
}
function OrderCard({ o, onOpen }) {
  return (<div className="mt-1">
    <div className="text-lg font-bold capitalize">{o.kind} - {o.status}</div>
    <Row icon={Users}>Customer: {o.customerName || 'Unknown'}{o.customerPhone ? ` (${o.customerPhone})` : ''}</Row>
    {o.driverName && <Row icon={Car}>Driver: {o.driverName}</Row>}
    {o.merchantName && <Row icon={Store}>{o.merchantName}</Row>}
    {o.amount != null && <Row icon={Package}>{o.currency || ''} {o.amount}</Row>}
    {o.dropoff?.address && <Row icon={MapPin}>To: {o.dropoff.address}</Row>}
    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onOpen}><ExternalLink className="w-4 h-4 mr-1" /> View order</Button>
  </div>);
}
