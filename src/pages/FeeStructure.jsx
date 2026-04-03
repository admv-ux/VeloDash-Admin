import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Percent, Save, Loader2, Info, ArrowRight, Truck, Car, ShoppingBag, Globe
} from 'lucide-react';
import { getCountryName } from '@/utils/country';

const ProfessionalModelCard = ({ title, icon: Icon, children, description }) => (
  <Card className="mb-6 border-l-4 border-l-primary">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {children}
    </CardContent>
  </Card>
);

const FeeInput = ({ label, value, onChange, prefix = "", suffix = "%", disabled }) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
    <div className="relative">
      {prefix && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
          {prefix}
        </div>
      )}
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} font-semibold`}
        disabled={disabled}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

export default function FeeStructure() {
  const [selectedCountry, setSelectedCountry] = useState('GH');
  const [form, setForm] = useState({
    rideCommissionRate: 20,
    deliveryTotalCommissionRate: 40,
    deliveryRidePortionRate: 50,
    deliveryServicePortionRate: 50,
    serviceCommissionRate: 15
  });

  const queryClient = useQueryClient();

  const { data: platformSettings = [], isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => base44.entities.PlatformSettings.list(),
  });

  useEffect(() => {
    if (platformSettings.length > 0) {
      const activeSettings = platformSettings.find(s => s.country === selectedCountry) || platformSettings[0];
      if (activeSettings) {
        setSelectedCountry(activeSettings.country);
        setForm({
          rideCommissionRate: activeSettings.rideCommissionRate || 20,
          deliveryTotalCommissionRate: activeSettings.deliveryTotalCommissionRate || 40,
          deliveryRidePortionRate: activeSettings.deliveryRidePortionRate || 50,
          deliveryServicePortionRate: activeSettings.deliveryServicePortionRate || 50,
          serviceCommissionRate: activeSettings.serviceCommissionRate || 15
        });
      }
    }
  }, [platformSettings, selectedCountry]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.PlatformSettings.update(selectedCountry, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['platform-settings']);
      toast.success('Fee structure updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee & Fare Structure</h1>
          <p className="text-muted-foreground">Manage VeloHUB's professional calculation model across countries.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm font-medium">
                <Globe className="w-4 h-4" />
                <span>Country Scope:</span>
                <select 
                    value={selectedCountry} 
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 cursor-pointer text-primary"
                >
                    {platformSettings.map(s => (
                        <option key={s.country} value={s.country}>{getCountryName(s.country)}</option>
                    ))}
                </select>
            </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <ProfessionalModelCard 
        title="1. Pure Rides" 
        icon={Car}
        description="Standard ride-hailing commission model."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <FeeInput 
            label="Company Commission" 
            value={form.rideCommissionRate} 
            onChange={(v) => setForm({...form, rideCommissionRate: v})}
          />
          <div className="bg-muted/50 p-4 rounded-lg flex flex-col justify-center border border-dashed">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Company Keeps:</span>
              <span className="font-bold text-primary">{form.rideCommissionRate}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Driver Receives:</span>
              <span className="font-bold text-green-600">{100 - form.rideCommissionRate}%</span>
            </div>
          </div>
        </div>
      </ProfessionalModelCard>

      <ProfessionalModelCard 
        title="2. Deliveries" 
        icon={Truck}
        description="Comprehensive delivery model with internal revenue splitting."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          <div className="space-y-4">
            <FeeInput 
              label="Total Company Take" 
              value={form.deliveryTotalCommissionRate} 
              onChange={(v) => setForm({...form, deliveryTotalCommissionRate: v})}
            />
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
               <div className="flex gap-2 items-start text-blue-700 dark:text-blue-300">
                 <Info className="w-4 h-4 mt-0.5" />
                 <p className="text-xs">
                   This is the total percentage deducted from the Delivery Fare (TDF).
                   The remaining <span className="font-bold">{100 - form.deliveryTotalCommissionRate}%</span> goes to the Delivery Partner.
                 </p>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-bold">Internal Commission Split</Label>
            <div className="grid grid-cols-2 gap-4">
              <FeeInput 
                label="Rides Portion" 
                value={form.deliveryRidePortionRate} 
                onChange={(v) => setForm({...form, deliveryRidePortionRate: v})}
              />
              <FeeInput 
                label="Service Portion" 
                value={form.deliveryServicePortionRate} 
                onChange={(v) => setForm({...form, deliveryServicePortionRate: v})}
              />
            </div>
            <div className="relative pt-4">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    <span>Audit Attribution</span>
                    <span className={Number(form.deliveryRidePortionRate) + Number(form.deliveryServicePortionRate) === 100 ? 'text-green-600' : 'text-red-500'}>
                        Total: {Number(form.deliveryRidePortionRate) + Number(form.deliveryServicePortionRate)}%
                    </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                    <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${(form.deliveryRidePortionRate / (Number(form.deliveryRidePortionRate) + Number(form.deliveryServicePortionRate))) * 100}%` }}
                    />
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${(form.deliveryServicePortionRate / (Number(form.deliveryRidePortionRate) + Number(form.deliveryServicePortionRate))) * 100}%` }}
                    />
                </div>
            </div>
          </div>
        </div>
      </ProfessionalModelCard>

      <ProfessionalModelCard 
        title="3. Service Providers" 
        icon={ShoppingBag}
        description="Marketplace commissions for grocery, food, and other services."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <FeeInput 
            label="Service Commission" 
            value={form.serviceCommissionRate} 
            onChange={(v) => setForm({...form, serviceCommissionRate: v})}
          />
          <div className="bg-muted/50 p-4 rounded-lg flex flex-col justify-center border border-dashed">
            <p className="text-xs text-muted-foreground mb-2 italic">
               * This commission is applied to the subtotal of orders from marketplace merchants.
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Platform Earnings (on $100):</span>
              <span className="font-bold text-primary">${(100 * form.serviceCommissionRate / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </ProfessionalModelCard>
    </div>
  );
}
