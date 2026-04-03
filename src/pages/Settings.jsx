import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  DollarSign, Loader2, Percent, Globe, Save
} from 'lucide-react';
import { getCountryName } from '@/utils/country';

export default function Settings() {
  const [selectedCountry, setSelectedCountry] = useState('GH');
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const { data: platformSettings = [], isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => base44.entities.PlatformSettings.list(),
  });

  useEffect(() => {
    if (platformSettings.length > 0) {
      const current = platformSettings.find(s => s.country === selectedCountry) || platformSettings[0];
      if (current) {
        setFormData(current);
        if (current.country !== selectedCountry) {
            setSelectedCountry(current.country);
        }
      }
    }
  }, [platformSettings, selectedCountry]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.PlatformSettings.update(selectedCountry, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Settings saved successfully');
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Failed to save settings');
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    // Remove metadata fields before saving
    const { id, updatedAt, createdAt, ...payload } = formData;
    saveMutation.mutate(payload);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            <p className="text-slate-500 font-medium">Loading platform configurations...</p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
            <Globe className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Platform Settings</h2>
            <p className="text-slate-500">Configure financial rules and regional logistics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Globe className="w-4 h-4 text-slate-400 mr-2" />
            <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="border-0 bg-transparent text-sm font-semibold focus:ring-0 p-0 pr-8"
            >
                {platformSettings.map(s => (
                    <option key={s.country} value={s.country}>{getCountryName(s.country)} ({s.currency})</option>
                ))}
            </select>
          </div>
          
          <Button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700 h-10 px-6 rounded-xl shadow-lg shadow-violet-500/20">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Rules
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl w-full md:w-auto h-auto grid grid-cols-2 md:inline-flex">
          <TabsTrigger value="pricing" className="gap-2 rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <DollarSign className="w-4 h-4" /> Base Pricing
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2 rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe className="w-4 h-4" /> Region Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6 mt-6">
          <Card className="bg-white border-0 shadow-sm rounded-2xl p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Regional Logistics Costs</CardTitle>
              <CardDescription>Base operating fees for the {getCountryName(selectedCountry)} regional market</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Base Delivery Fee ({formData.currency})</Label>
                  <Input
                    type="number"
                    className="rounded-xl border-slate-200"
                    value={formData.deliveryBaseFee || ''}
                    onChange={(e) => updateField('deliveryBaseFee', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per KM Fee ({formData.currency})</Label>
                  <Input
                    type="number"
                    className="rounded-xl border-slate-200"
                    value={formData.deliveryPerKmFee || ''}
                    onChange={(e) => updateField('deliveryPerKmFee', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Order Value ({formData.currency})</Label>
                  <Input
                    type="number"
                    className="rounded-xl border-slate-200"
                    value={formData.minimumOrderValue || ''}
                    onChange={(e) => updateField('minimumOrderValue', Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    <div>
                        <p className="font-semibold text-slate-900">Regional Market Status</p>
                        <p className="text-sm text-slate-500">Automatically enable/disable all operations for this country</p>
                    </div>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateField('isActive', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}