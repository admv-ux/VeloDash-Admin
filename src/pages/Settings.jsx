import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  DollarSign, CreditCard, Bell, FileText, Settings as SettingsIcon, 
  Save, Loader2, Percent, Clock, Shield
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('pricing');
  const [settings, setSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const { data: platformSettings = [], isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => base44.entities.PlatformSettings.list(),
  });

  useEffect(() => {
    if (platformSettings.length > 0) {
      const settingsMap = {};
      platformSettings.forEach(s => {
        settingsMap[s.setting_key] = s.setting_value;
      });
      setSettings(settingsMap);
    }
  }, [platformSettings]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings) => {
      const promises = Object.entries(newSettings).map(async ([key, value]) => {
        const existing = platformSettings.find(s => s.setting_key === key);
        if (existing) {
          return base44.entities.PlatformSettings.update(existing.id, { 
            setting_key: key, 
            setting_value: value 
          });
        } else {
          return base44.entities.PlatformSettings.create({ 
            setting_key: key, 
            setting_value: value 
          });
        }
      });
      return Promise.all(promises);
    },
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
    saveMutation.mutate(settings);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-slate-500">Configure pricing, payments, and platform content</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700">
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="w-4 h-4" /> Pricing
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" /> Payments
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="w-4 h-4" /> Content
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="w-4 h-4" /> General
          </TabsTrigger>
        </TabsList>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6 mt-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-violet-600" />
                Commission Settings
              </CardTitle>
              <CardDescription>Configure platform commission rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Merchant Commission (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.merchant_commission || '15'}
                    onChange={(e) => updateSetting('merchant_commission', e.target.value)}
                  />
                  <p className="text-sm text-slate-500">Default commission for new merchants</p>
                </div>
                <div className="space-y-2">
                  <Label>Driver Commission (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.driver_commission || '20'}
                    onChange={(e) => updateSetting('driver_commission', e.target.value)}
                  />
                  <p className="text-sm text-slate-500">Platform fee from driver earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Default Pricing
              </CardTitle>
              <CardDescription>Base pricing for new zones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Base Delivery Fee (₵)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.default_delivery_fee || '15'}
                    onChange={(e) => updateSetting('default_delivery_fee', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base Ride Fare (₵)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.default_ride_fare || '10'}
                    onChange={(e) => updateSetting('default_ride_fare', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per KM Rate (₵)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.default_per_km_rate || '3'}
                    onChange={(e) => updateSetting('default_per_km_rate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Surge Pricing
              </CardTitle>
              <CardDescription>Peak hour pricing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max Surge Multiplier</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={settings.max_surge_multiplier || '3'}
                    onChange={(e) => updateSetting('max_surge_multiplier', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Order Value (₵)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.min_order_value || '25'}
                    onChange={(e) => updateSetting('min_order_value', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6 mt-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Payment Gateway
              </CardTitle>
              <CardDescription>Configure payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium">Enable Card Payments</p>
                  <p className="text-sm text-slate-500">Accept credit/debit card payments</p>
                </div>
                <Switch
                  checked={settings.card_payments_enabled === 'true'}
                  onCheckedChange={(checked) => updateSetting('card_payments_enabled', checked.toString())}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium">Enable Wallet</p>
                  <p className="text-sm text-slate-500">Allow users to use wallet balance</p>
                </div>
                <Switch
                  checked={settings.wallet_enabled === 'true'}
                  onCheckedChange={(checked) => updateSetting('wallet_enabled', checked.toString())}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium">Enable Cash on Delivery</p>
                  <p className="text-sm text-slate-500">Allow cash payments</p>
                </div>
                <Switch
                  checked={settings.cod_enabled !== 'false'}
                  onCheckedChange={(checked) => updateSetting('cod_enabled', checked.toString())}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>Configure driver and merchant payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Payout Frequency</Label>
                  <Input
                    value={settings.payout_frequency || 'Weekly'}
                    onChange={(e) => updateSetting('payout_frequency', e.target.value)}
                    placeholder="e.g., Daily, Weekly, Monthly"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Payout Amount (₵)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.min_payout_amount || '150'}
                    onChange={(e) => updateSetting('min_payout_amount', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6 mt-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>Platform terms of service</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={8}
                value={settings.terms_conditions || ''}
                onChange={(e) => updateSetting('terms_conditions', e.target.value)}
                placeholder="Enter your terms and conditions..."
              />
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
              <CardDescription>Data privacy and protection policy</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={8}
                value={settings.privacy_policy || ''}
                onChange={(e) => updateSetting('privacy_policy', e.target.value)}
                placeholder="Enter your privacy policy..."
              />
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>FAQ Content</CardTitle>
              <CardDescription>Frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={8}
                value={settings.faq_content || ''}
                onChange={(e) => updateSetting('faq_content', e.target.value)}
                placeholder="Enter FAQ content in JSON format or markdown..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
              <CardDescription>Basic platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input
                    value={settings.platform_name || 'RideFlow'}
                    onChange={(e) => updateSetting('platform_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={settings.support_email || ''}
                    onChange={(e) => updateSetting('support_email', e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Phone</Label>
                  <Input
                    value={settings.support_phone || ''}
                    onChange={(e) => updateSetting('support_phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Input
                    value={settings.default_currency || 'GHS'}
                    onChange={(e) => updateSetting('default_currency', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-600" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium">Require Document Verification</p>
                  <p className="text-sm text-slate-500">Drivers must upload documents before going online</p>
                </div>
                <Switch
                  checked={settings.require_doc_verification !== 'false'}
                  onCheckedChange={(checked) => updateSetting('require_doc_verification', checked.toString())}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium">Enable Fraud Detection</p>
                  <p className="text-sm text-slate-500">Automatically flag suspicious activities</p>
                </div>
                <Switch
                  checked={settings.fraud_detection_enabled !== 'false'}
                  onCheckedChange={(checked) => updateSetting('fraud_detection_enabled', checked.toString())}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}