import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Percent, Save, Loader2, Info, Truck, Car, ShoppingBag, Globe,
  DollarSign, Clock, Users, Zap, AlertTriangle, Bike, CheckCircle2, Briefcase
} from 'lucide-react';
import { getCountryName } from '@/utils/country';

/* ─── Reusable Components ──────────────────────────────────────── */

const SectionCard = ({ title, icon: Icon, description, children }) => (
  <Card className="border-l-4 border-l-violet-500 bg-white shadow-sm">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <div className="bg-violet-100 p-2 rounded-xl">
          <Icon className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

const FieldInput = ({ label, value, onChange, prefix, suffix, hint, type = "number", disabled }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-600">{label}</Label>
    <div className="relative">
      {prefix && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">{prefix}</div>
      )}
      <Input
        type={type}
        step="any"
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className={`${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} rounded-xl border-slate-200 font-medium h-10`}
        disabled={disabled}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">{suffix}</div>
      )}
    </div>
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
);

const SplitDisplay = ({ leftLabel, leftValue, rightLabel, rightValue, valid }) => (
  <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 space-y-1.5">
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{leftLabel}</span>
      <span className="font-bold text-violet-600">{leftValue}</span>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{rightLabel}</span>
      <span className="font-bold text-emerald-600">{rightValue}</span>
    </div>
    {valid !== undefined && (
      <div className="flex items-center gap-1 pt-1">
        {valid ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
        <span className={`text-[10px] ${valid ? 'text-emerald-500' : 'text-amber-500'}`}>
          {valid ? 'Valid split' : 'Portions should sum to 100%'}
        </span>
      </div>
    )}
  </div>
);

/* ─── Vehicle Pricing Section ──────────────────────────────────── */

const VehiclePricingSection = ({ country, currency }) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: pricingList = [], isLoading } = useQuery({
    queryKey: ['vehicle-pricing', country],
    queryFn: () => base44.entities.VehiclePricing.list(country),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VehiclePricing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-pricing'] });
      toast.success('Vehicle pricing updated');
      setEditingId(null);
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      basePrice: Number(item.basePrice),
      pricePerKm: Number(item.pricePerKm),
      pricePerMin: Number(item.pricePerMin),
      minimumFare: Number(item.minimumFare),
      bookingFee: Number(item.bookingFee ?? 0),
      bookingFeePercent: Number(item.bookingFeePercent ?? 0),
      roadLevy: Number(item.roadLevy ?? 0),
      maxPassengers: Number(item.maxPassengers),
      isActive: item.isActive,
    });
  };

  const vehicleIcons = { bike: Bike, car: Car, priority: Car, suv: Truck, truck: Truck };
  const vehicleLabels = { bike: 'Motorcycle', car: 'Standard Car', priority: 'Velo Priority', suv: 'SUV / Large', truck: 'Truck' };

  if (isLoading) return <div className="flex items-center gap-2 py-4 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading pricing...</div>;

  const filtered = pricingList.filter(p => p.country === country);
  if (filtered.length === 0) return <p className="text-sm text-slate-400 py-4">No vehicle pricing configured for {getCountryName(country)}.</p>;

  return (
    <div className="space-y-3">
      {filtered.map((item) => {
        const Icon = vehicleIcons[item.vehicleType] || Car;
        const isEditing = editingId === item.id;
        return (
          <Card key={item.id} className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 p-1.5 rounded-lg"><Icon className="w-4 h-4 text-slate-600" /></div>
                  <span className="font-semibold text-sm">{vehicleLabels[item.vehicleType] || item.vehicleType}</span>
                  <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-[10px]">
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: item.id, data: editForm })} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />} Save
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)}>Edit</Button>
                )}
              </div>
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <FieldInput label={`Base (${currency})`} value={editForm.basePrice} onChange={(v) => setEditForm({ ...editForm, basePrice: v })} />
                  <FieldInput label={`Per Km (${currency})`} value={editForm.pricePerKm} onChange={(v) => setEditForm({ ...editForm, pricePerKm: v })} />
                  <FieldInput label={`Per Min (${currency})`} value={editForm.pricePerMin} onChange={(v) => setEditForm({ ...editForm, pricePerMin: v })} />
                  <FieldInput label={`Min Fare (${currency})`} value={editForm.minimumFare} onChange={(v) => setEditForm({ ...editForm, minimumFare: v })} />
                  <FieldInput label={`Booking Fee (${currency})`} value={editForm.bookingFee} onChange={(v) => setEditForm({ ...editForm, bookingFee: v })} />
                  <FieldInput label="Booking Fee %" value={editForm.bookingFeePercent} onChange={(v) => setEditForm({ ...editForm, bookingFeePercent: v })} />
                  <FieldInput label={`Road Levy (${currency})`} value={editForm.roadLevy} onChange={(v) => setEditForm({ ...editForm, roadLevy: v })} />
                  <FieldInput label="Max Passengers" value={editForm.maxPassengers} onChange={(v) => setEditForm({ ...editForm, maxPassengers: v })} />
                  <div className="flex items-center gap-2 pt-5">
                    <Switch checked={editForm.isActive} onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })} />
                    <Label className="text-xs">Active</Label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div><p className="text-[10px] text-slate-400 uppercase">Base</p><p className="font-semibold text-sm">{currency} {Number(item.basePrice).toFixed(2)}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase">Per Km</p><p className="font-semibold text-sm">{currency} {Number(item.pricePerKm).toFixed(2)}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase">Per Min</p><p className="font-semibold text-sm">{currency} {Number(item.pricePerMin).toFixed(2)}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase">Min Fare</p><p className="font-semibold text-sm">{currency} {Number(item.minimumFare).toFixed(2)}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase">Booking Fee</p><p className="font-semibold text-sm">{currency} {Number(item.bookingFee ?? 0).toFixed(2)}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase">Booking Fee %</p><p className="font-semibold text-sm">{Number(item.bookingFeePercent ?? 0).toFixed(1)}%</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase">Road Levy</p><p className="font-semibold text-sm">{currency} {Number(item.roadLevy ?? 0).toFixed(2)}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase">Max Riders</p><p className="font-semibold text-sm">{item.maxPassengers}</p></div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────── */

export default function FeeStructure() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [form, setForm] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const queryClient = useQueryClient();

  const { data: platformSettings = [], isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => base44.entities.PlatformSettings.list(),
  });

  useEffect(() => {
    if (platformSettings.length > 0 && !selectedCountry) {
      setSelectedCountry(platformSettings[0].country);
    }
  }, [platformSettings]);

  useEffect(() => {
    if (platformSettings.length > 0 && selectedCountry) {
      const s = platformSettings.find(s => s.country === selectedCountry);
      if (s) { setForm({ ...s }); setIsDirty(false); }
    }
  }, [platformSettings, selectedCountry]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.PlatformSettings.update(selectedCountry, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Platform settings saved successfully');
      setIsDirty(false);
    },
    onError: (error) => toast.error(`Failed to save: ${error.message}`),
  });

  const handleSave = () => {
    const { id, updatedAt, createdAt, ...payload } = form;
    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-slate-500 font-medium">Loading platform settings...</p>
      </div>
    );
  }

  const currency = form.currency || 'USD';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
          <p className="text-sm text-slate-500">Configure fees, commissions, and pricing per country.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Globe className="w-4 h-4 text-violet-500 mr-2" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="border-0 bg-transparent text-sm font-semibold focus:ring-0 p-0 pr-8 cursor-pointer"
            >
              {platformSettings.map(s => (
                <option key={s.country} value={s.country}>{getCountryName(s.country)} ({s.currency})</option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !isDirty}
            className="bg-violet-600 hover:bg-violet-700 h-10 px-6 rounded-xl shadow-lg shadow-violet-500/20 gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className={`w-2.5 h-2.5 rounded-full ${form.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <span className="text-sm font-medium text-slate-700">{getCountryName(selectedCountry)} market is {form.isActive ? 'Active' : 'Inactive'}</span>
        <div className="ml-auto flex items-center gap-3">
          {isDirty && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px]">Unsaved changes</Badge>
          )}
          <Switch checked={form.isActive} onCheckedChange={(v) => updateField('isActive', v)} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl w-full md:w-auto h-auto grid grid-cols-2 md:grid-cols-5 gap-1">
          <TabsTrigger value="orders" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShoppingBag className="w-3.5 h-3.5" /> Orders
          </TabsTrigger>
          <TabsTrigger value="rides" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Car className="w-3.5 h-3.5" /> Rides
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Briefcase className="w-3.5 h-3.5" /> Services
          </TabsTrigger>
          <TabsTrigger value="vehicle-pricing" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Car className="w-3.5 h-3.5" /> Vehicle Pricing
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5 rounded-xl py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe className="w-3.5 h-3.5" /> General
          </TabsTrigger>
        </TabsList>

        {/* ── Orders Tab ───────────────────────────── */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${form.deliveryEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <div>
                <p className="text-sm font-semibold text-slate-700">Delivery & Orders</p>
                <p className="text-xs text-slate-400">{form.deliveryEnabled ? 'Customers can place delivery orders' : 'Delivery is disabled for this country'}</p>
              </div>
            </div>
            <Switch checked={form.deliveryEnabled ?? true} onCheckedChange={(v) => updateField('deliveryEnabled', v)} />
          </div>
          <SectionCard title="Merchant Commission" icon={Percent} description="Platform take from order subtotal.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label="Default Commission Rate"
                value={form.defaultCommissionRate}
                onChange={(v) => updateField('defaultCommissionRate', v)}
                suffix="%"
                hint="Merchant keeps the remainder"
              />
              <SplitDisplay
                leftLabel="Platform keeps"
                leftValue={`${form.defaultCommissionRate || 0}%`}
                rightLabel="Merchant gets"
                rightValue={`${(100 - (form.defaultCommissionRate || 0)).toFixed(1)}%`}
              />
            </div>
          </SectionCard>

          <SectionCard title="Customer Service Fee" icon={DollarSign} description="Fee charged to customer on order subtotal.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldInput
                label="Service Fee Rate"
                value={form.defaultServiceFeeRate}
                onChange={(v) => updateField('defaultServiceFeeRate', v)}
                suffix="%"
                hint="Applied to subtotal"
              />
              <FieldInput
                label={`Service Fee Cap (${currency})`}
                value={form.serviceFeeMaxCap}
                onChange={(v) => updateField('serviceFeeMaxCap', v)}
                hint="Max fee regardless of subtotal"
              />
              <FieldInput
                label="Pickup Fee Rate"
                value={form.defaultPickupFeeRate}
                onChange={(v) => updateField('defaultPickupFeeRate', v)}
                suffix="%"
                hint="Charged on pickup orders"
              />
            </div>
          </SectionCard>

          <SectionCard title="Small Order Fee" icon={AlertTriangle} description="Extra fee for small orders below threshold.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label={`Small Order Fee (${currency})`}
                value={form.smallOrderFee}
                onChange={(v) => updateField('smallOrderFee', v)}
                hint="Flat fee added to orders below threshold"
              />
              <FieldInput
                label={`Threshold (${currency})`}
                value={form.smallOrderThreshold}
                onChange={(v) => updateField('smallOrderThreshold', v)}
                hint="Orders below this amount get the fee"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <div className="flex gap-2 items-start text-blue-700">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  Orders with subtotal below <strong>{currency} {form.smallOrderThreshold || 0}</strong> will be charged
                  an extra <strong>{currency} {form.smallOrderFee || 0}</strong> small order fee.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Delivery Fees" icon={Truck} description="Delivery cost structure and driver payout share.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldInput
                label={`Base Delivery Fee (${currency})`}
                value={form.deliveryBaseFee}
                onChange={(v) => updateField('deliveryBaseFee', v)}
              />
              <FieldInput
                label={`Per KM Fee (${currency})`}
                value={form.deliveryPerKmFee}
                onChange={(v) => updateField('deliveryPerKmFee', v)}
              />
              <FieldInput
                label="Driver Delivery Share"
                value={form.driverDeliveryFeeShare}
                onChange={(v) => updateField('driverDeliveryFeeShare', v)}
                suffix="%"
                hint="Driver gets this % of delivery fee"
              />
            </div>
            <SplitDisplay
              leftLabel="Platform keeps from delivery"
              leftValue={`${(100 - (form.driverDeliveryFeeShare || 75)).toFixed(1)}%`}
              rightLabel="Driver receives from delivery"
              rightValue={`${form.driverDeliveryFeeShare || 75}%`}
            />
          </SectionCard>

          <SectionCard title="Minimum Order" icon={ShoppingBag} description="Minimum value for a customer to place an order.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label={`Minimum Order Value (${currency})`}
                value={form.minimumOrderValue}
                onChange={(v) => updateField('minimumOrderValue', v)}
                hint="0 means no minimum"
              />
            </div>
          </SectionCard>

          <SectionCard title="Internal Delivery Commission Split" icon={Percent} description="How the delivery commission is attributed internally.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <FieldInput
                  label="Total Company Take from Delivery"
                  value={form.deliveryTotalCommissionRate}
                  onChange={(v) => updateField('deliveryTotalCommissionRate', v)}
                  suffix="%"
                />
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput
                    label="Rides Portion"
                    value={form.deliveryRidePortionRate}
                    onChange={(v) => updateField('deliveryRidePortionRate', v)}
                    suffix="%"
                  />
                  <FieldInput
                    label="Service Portion"
                    value={form.deliveryServicePortionRate}
                    onChange={(v) => updateField('deliveryServicePortionRate', v)}
                    suffix="%"
                  />
                </div>
              </div>
              <SplitDisplay
                leftLabel="Rides attribution"
                leftValue={`${form.deliveryRidePortionRate || 50}%`}
                rightLabel="Service attribution"
                rightValue={`${form.deliveryServicePortionRate || 50}%`}
                valid={Number(form.deliveryRidePortionRate || 0) + Number(form.deliveryServicePortionRate || 0) === 100}
              />
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── Rides Tab ────────────────────────────── */}
        <TabsContent value="rides" className="space-y-4 mt-4">
          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${form.ridesEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <div>
                <p className="text-sm font-semibold text-slate-700">Rides Service</p>
                <p className="text-xs text-slate-400">{form.ridesEnabled ? 'Riders can book rides in this country' : 'Rides are disabled for this country'}</p>
              </div>
            </div>
            <Switch checked={form.ridesEnabled ?? true} onCheckedChange={(v) => updateField('ridesEnabled', v)} />
          </div>
          <SectionCard title="Ride Commission" icon={Car} description="Platform commission on ride fares.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label="Commission Rate"
                value={form.rideCommissionRate}
                onChange={(v) => updateField('rideCommissionRate', v)}
                suffix="%"
                hint="Deducted from fare before driver payout"
              />
              <SplitDisplay
                leftLabel="Platform commission"
                leftValue={`${form.rideCommissionRate || 15}%`}
                rightLabel="Driver receives"
                rightValue={`${(100 - (form.rideCommissionRate || 15)).toFixed(1)}%`}
              />
            </div>
          </SectionCard>

          <SectionCard title="Rider Service Fee" icon={DollarSign} description="Flat fee added on top of ride fare (goes to platform).">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label={`Service Fee (${currency})`}
                value={form.riderServiceFee}
                onChange={(v) => updateField('riderServiceFee', v)}
                hint="Added on top of fare - 100% goes to platform"
              />
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <div className="flex gap-2 items-start text-emerald-700">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-xs">
                    Rider pays: <strong>Fare + {currency} {form.riderServiceFee || 0}</strong><br />
                    Driver gets: <strong>{(100 - (form.rideCommissionRate || 15)).toFixed(0)}% of fare only</strong><br />
                    Platform gets: <strong>{form.rideCommissionRate || 15}% of fare + full service fee</strong>
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Surge Pricing" icon={Zap} description="Surge multiplier controls.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldInput
                label="Max Surge Multiplier"
                value={form.maxSurgeMultiplier}
                onChange={(v) => updateField('maxSurgeMultiplier', v)}
                suffix="×"
                hint="Cap on dynamic surge pricing"
              />
              <FieldInput
                label="Global Surge Multiplier"
                value={form.globalSurgeMultiplier}
                onChange={(v) => updateField('globalSurgeMultiplier', v)}
                suffix="×"
                hint="Current forced multiplier (1.0 = no surge)"
              />
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={form.isGlobalSurgeActive} onCheckedChange={(v) => updateField('isGlobalSurgeActive', v)} />
                <Label className="text-sm">Global Surge Active</Label>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Cash Settlement & Tax" icon={Zap} description="Withholding tax and cash debt limits for drivers on cash jobs.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldInput
                label="Withholding Tax (WHT)"
                value={form.whtRate}
                onChange={(v) => updateField('whtRate', v)}
                suffix="%"
                hint="Withheld from the driver's gross share on cash jobs (0 = off)"
              />
              <FieldInput
                label="Cash Debt Cap"
                value={form.cashDebtCap}
                onChange={(v) => updateField('cashDebtCap', v)}
                suffix={currency}
                hint="Driver is blocked from new cash jobs past this debt (0 = no limit)"
              />
              <FieldInput
                label="VAT on Commission"
                value={form.vatOnCommissionRate}
                onChange={(v) => updateField('vatOnCommissionRate', v)}
                suffix="%"
                hint="Recorded for remittance (Nigeria: 7.5)"
              />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              On a cash job the driver holds the customer's money, so their wallet is debited
              the commission plus WHT and may go negative. WHT is tagged as tax escrow for
              remittance reporting.
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── Services Tab ─────────────────────────── */}
        <TabsContent value="services" className="space-y-4 mt-4">
          <SectionCard title="Service Provider Commission" icon={ShoppingBag} description="Platform commission on service bookings.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label="Service Commission Rate"
                value={form.serviceCommissionRate}
                onChange={(v) => updateField('serviceCommissionRate', v)}
                suffix="%"
                hint="Platform take on service booking total"
              />
              <SplitDisplay
                leftLabel="Platform keeps"
                leftValue={`${form.serviceCommissionRate || 15}%`}
                rightLabel="Provider gets"
                rightValue={`${(100 - (form.serviceCommissionRate || 15)).toFixed(1)}%`}
              />
            </div>
          </SectionCard>

          <SectionCard title="Out-Call Travel Rates" icon={Truck} description="Platform-set travel fees for providers who travel to the customer (charged to the customer, converted to the local currency).">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label="Travel Fee per KM (USD)"
                value={form.serviceTravelPerKmUsd}
                onChange={(v) => updateField('serviceTravelPerKmUsd', v)}
                hint="USD per km of provider travel"
              />
              <FieldInput
                label="Travel Fee per Minute (USD)"
                value={form.serviceTravelPerMinUsd}
                onChange={(v) => updateField('serviceTravelPerMinUsd', v)}
                hint="USD per estimated minute of provider travel"
              />
            </div>
          </SectionCard>

          <SectionCard title="Booking & Cancellation Fees" icon={Clock} description="Fees for service bookings and late cancellations.">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FieldInput
                label={`Booking Fee (${currency})`}
                value={form.serviceBookingFee}
                onChange={(v) => updateField('serviceBookingFee', v)}
                hint="Fixed fee per booked date (0 = none)"
              />
              <FieldInput
                label="Booking Fee Rate"
                value={form.serviceBookingFeeRate}
                onChange={(v) => updateField('serviceBookingFeeRate', v)}
                suffix="%"
                hint="% of service price, adds to the fixed fee"
              />
              <FieldInput
                label={`Late Cancel Fee (${currency})`}
                value={form.lateCancellationFee}
                onChange={(v) => updateField('lateCancellationFee', v)}
                hint="Min cancel fee"
              />
              <FieldInput
                label={`Max Cancel Fee (${currency})`}
                value={form.lateCancellationFeeMax}
                onChange={(v) => updateField('lateCancellationFeeMax', v)}
                hint="Upper bound for cancel fee"
              />
              <FieldInput
                label="Cancel Window (minutes)"
                value={form.cancellationWindowMinutes}
                onChange={(v) => updateField('cancellationWindowMinutes', v)}
                hint="Free cancellation before this window"
              />
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
              <div className="flex gap-2 items-start text-amber-700">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  Cancellations made less than <strong>{form.cancellationWindowMinutes || 60} minutes</strong> before the scheduled service
                  will be charged between <strong>{currency} {form.lateCancellationFee || 5}</strong> and <strong>{currency} {form.lateCancellationFeeMax || 10}</strong>.
                </p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── Vehicle Pricing Tab ──────────────────── */}
        <TabsContent value="vehicle-pricing" className="space-y-4 mt-4">
          <SectionCard title={`Vehicle Pricing - ${getCountryName(selectedCountry)}`} icon={Car} description="Ride fare structure per vehicle type.">
            <VehiclePricingSection country={selectedCountry} currency={currency} />
          </SectionCard>
        </TabsContent>

        {/* ── General Tab ──────────────────────────── */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <SectionCard title="Region Info" icon={Globe} description="Country and currency configuration.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Country Code</Label>
                <Input value={form.country || ''} disabled className="rounded-xl border-slate-200 font-medium h-10 bg-slate-50" />
              </div>
              <FieldInput
                label="Currency Code"
                value={form.currency}
                onChange={(v) => updateField('currency', v)}
                type="text"
                hint="ISO 4217 (e.g. GHS, NGN, USD)"
              />
              <FieldInput
                label={`USD Exchange Rate (${currency} per 1 USD)`}
                value={form.usdExchangeRate}
                onChange={(v) => updateField('usdExchangeRate', v)}
                hint="Used to convert charges to USD when the payment gateway cannot charge this currency"
              />
              <FieldInput
                label="Processing Fee Rate"
                value={form.paymentProcessingFeeRate}
                onChange={(v) => updateField('paymentProcessingFeeRate', v)}
                suffix="%"
                hint="Card/momo fee shown to and paid by the customer (0 = platform absorbs it)"
              />
              <FieldInput
                label={`Processing Fee Fixed (${currency})`}
                value={form.paymentProcessingFeeFixed}
                onChange={(v) => updateField('paymentProcessingFeeFixed', v)}
                hint="Flat amount added to the processing fee per card/momo payment"
              />
            </div>
          </SectionCard>

          <SectionCard title="Referral Program" icon={Users} description="Referral bonus configuration.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label={`Referrer Reward (${currency})`}
                value={form.referralRewardAmount}
                onChange={(v) => updateField('referralRewardAmount', v)}
                hint="Credited to the referrer when their invite's first booking/order is confirmed"
              />
              <FieldInput
                label={`Referee Signup Bonus (${currency})`}
                value={form.referralRefereeReward}
                onChange={(v) => updateField('referralRefereeReward', v)}
                hint="Credited to a new user who signs up with a referral code"
              />
              <FieldInput
                label="Leaderboard Limit"
                value={form.leaderboardLimit}
                onChange={(v) => updateField('leaderboardLimit', v)}
                hint="Max entries shown on leaderboard"
              />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
