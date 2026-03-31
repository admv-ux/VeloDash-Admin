import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Megaphone, Ticket, Image as ImageIcon, Trash2, Edit, Send, UserPlus, Gift, RefreshCw } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// --- Sub-components (could be moved to separate files later) ---

const PromoList = ({ promos, isLoading, onEdit, onDelete }) => {
  const columns = [
    {
      header: 'Code',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-violet-500" />
          <span className="font-mono font-bold text-slate-900">{row.code}</span>
        </div>
      ),
    },
    {
      header: 'Discount',
      cell: (row) => (
        <span className="font-medium text-slate-700">
          {row.discountType === 'percentage' ? `${row.discountValue}%` : `₵${row.discountValue}`}
        </span>
      ),
    },
    {
      header: 'Expiry',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {row.expiresAt ? format(new Date(row.expiresAt), 'MMM d, yyyy') : 'No expiry'}
        </span>
      ),
    },
    {
      header: 'Usage',
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.currentUses} / {row.usageLimit || '∞'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
            <Edit className="w-4 h-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.id)}>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={promos}
      isLoading={isLoading}
      emptyMessage="No promo codes found"
    />
  );
};

const BannerList = ({ banners, isLoading, onEdit, onDelete }) => {
  const columns = [
    {
      header: 'Banner',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-10 rounded bg-slate-100 overflow-hidden border border-slate-200">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
          <span className="font-medium text-slate-900">{row.title}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (row) => (
        <span className="text-sm text-slate-600 capitalize">{row.type}</span>
      ),
    },
    {
      header: 'Target',
      cell: (row) => (
        <span className="text-sm text-slate-600 capitalize">{row.targetGroup}</span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
            <Edit className="w-4 h-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.id)}>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={banners}
      isLoading={isLoading}
      emptyMessage="No promotional banners found"
    />
  );
};

const ReferralList = ({ referrals, isLoading, onUpdateStatus }) => {
  const columns = [
    {
      header: 'Referrer',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{row.referralCode?.user?.full_name || 'System'}</span>
          <span className="text-xs text-slate-500 font-mono">{row.referralCode?.code}</span>
        </div>
      ),
    },
    {
      header: 'Referred User ID',
      cell: (row) => (
        <span className="text-xs text-slate-500 font-mono">{row.referredId}</span>
      ),
    },
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {format(new Date(row.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: 'Reward',
      cell: (row) => (
        <span className={`font-bold ${row.status === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`}>
          ₵{Number(row.rewardAmount).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && (
            <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                onClick={() => onUpdateStatus(row.id, 'completed')}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
          )}
          {row.status === 'pending' && (
            <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-rose-600 border-rose-100 hover:bg-rose-50"
                onClick={() => onUpdateStatus(row.id, 'revoked')}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={referrals}
      isLoading={isLoading}
      emptyMessage="No referrals found"
    />
  );
};

const BroadcastList = ({ broadcasts, isLoading }) => {
  const columns = [
    {
      header: 'Title',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{row.title}</span>
          <span className="text-xs text-slate-500 line-clamp-1">{row.body}</span>
        </div>
      ),
    },
    {
      header: 'Target',
      cell: (row) => (
        <span className="text-sm text-slate-600 capitalize">{row.targetGroup}</span>
      ),
    },
    {
      header: 'Recipients',
      cell: (row) => (
        <span className="text-sm font-medium text-indigo-600">
          {row.userCount} users
        </span>
      ),
    },
    {
      header: 'Sender',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {row.admin?.full_name || 'Admin'}
        </span>
      ),
    },
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {format(new Date(row.createdAt), 'MMM d, HH:mm')}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={broadcasts}
      isLoading={isLoading}
      emptyMessage="No broadcast history found"
    />
  );
};

// --- Main Page ---

export default function Campaigns() {
  const [activeTab, setActiveTab] = useState('promos');
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [showReferralCodeForm, setShowReferralCodeForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const queryClient = useQueryClient();

  // Queries
  const { data: promos = [], isLoading: loadingPromos } = useQuery({
    queryKey: ['promos'],
    queryFn: () => base44.entities.Promo.list(),
    enabled: activeTab === 'promos',
  });

  const { data: banners = [], isLoading: loadingBanners } = useQuery({
    queryKey: ['banners'],
    queryFn: () => base44.entities.Banner.list(),
    enabled: activeTab === 'banners',
  });

  const { data: referrals = [], isLoading: loadingReferrals } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list(),
    enabled: activeTab === 'referrals',
  });

  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => base44.entities.Referral.getStats(),
    enabled: activeTab === 'referrals',
  });

  const { data: broadcasts = [], isLoading: loadingBroadcasts } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => base44.entities.Broadcast.list(),
    enabled: activeTab === 'broadcasts',
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.Users.list(),
    enabled: showReferralCodeForm,
  });

  const [userSearch, setUserSearch] = useState('');
  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase().includes(userSearch.toLowerCase())) ||
    (u.phoneNumber?.includes(userSearch)) ||
    (u.id === userSearch)
  ).slice(0, 50); // Limit to 50 for performance

  // Mutations
  const promoMutation = useMutation({
    mutationFn: (data) => editingItem 
      ? base44.entities.Promo.update(editingItem.id, data) 
      : base44.entities.Promo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      toast.success(editingItem ? 'Promo updated' : 'Promo created');
      setShowPromoForm(false);
      setEditingItem(null);
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id) => base44.entities.Promo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      toast.success('Promo code deleted');
    },
  });

  const bannerMutation = useMutation({
    mutationFn: (data) => editingItem 
      ? base44.entities.Banner.update(editingItem.id, data) 
      : base44.entities.Banner.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success(editingItem ? 'Banner updated' : 'Banner created');
      setShowBannerForm(false);
      setEditingItem(null);
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id) => base44.entities.Banner.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner deleted');
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.broadcast(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast.success('Broadcast sent successfully');
      setShowBroadcastForm(false);
    },
  });

  const updateReferralStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Referral.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
      toast.success('Referral status updated');
    },
  });

  const referralCodeMutation = useMutation({
    mutationFn: (userId) => base44.entities.Referral.getCode(userId),
    onSuccess: (data) => {
      toast.success(`Referral code generated: ${data.code}`);
      setShowReferralCodeForm(false);
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });

  const handleEditPromo = (promo) => {
    setEditingItem(promo);
    setShowPromoForm(true);
  };

  const handleEditBanner = (banner) => {
    setEditingItem(banner);
    setShowBannerForm(true);
  };

  const handleBroadcast = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    broadcastMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campaigns & Communication</h2>
          <p className="text-slate-500">Manage promo codes, banners, and platform-wide broadcasts</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'promos' && (
            <Button onClick={() => { setEditingItem(null); setShowPromoForm(true); }} className="bg-violet-600 hover:bg-violet-700">
              <Ticket className="w-4 h-4 mr-2" /> New Promo Code
            </Button>
          )}
          {activeTab === 'banners' && (
            <Button onClick={() => { setEditingItem(null); setShowBannerForm(true); }} className="bg-indigo-600 hover:bg-indigo-700">
              <ImageIcon className="w-4 h-4 mr-2" /> New Banner
            </Button>
          )}
          {activeTab === 'broadcasts' && (
            <Button onClick={() => setShowBroadcastForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Megaphone className="w-4 h-4 mr-2" /> Send Broadcast
            </Button>
          )}
          {activeTab === 'referrals' && (
            <Button onClick={() => setShowReferralCodeForm(true)} className="bg-amber-600 hover:bg-amber-700">
              <UserPlus className="w-4 h-4 mr-2" /> Generate Code
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border p-1 shadow-sm h-12">
          <TabsTrigger value="promos" className="px-6 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Ticket className="w-4 h-4 mr-2" /> Promo Codes
          </TabsTrigger>
          <TabsTrigger value="banners" className="px-6 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            <ImageIcon className="w-4 h-4 mr-2" /> Banners
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="px-6 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Megaphone className="w-4 h-4 mr-2" /> Broadcasts
          </TabsTrigger>
          <TabsTrigger value="referrals" className="px-6 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
            <UserPlus className="w-4 h-4 mr-2" /> Referrals
          </TabsTrigger>
        </TabsList>

        <Card className="p-6 bg-white border-0 shadow-sm min-h-[400px]">
          <TabsContent value="promos" className="mt-0 outline-none">
            <PromoList 
              promos={promos} 
              isLoading={loadingPromos} 
              onEdit={handleEditPromo}
              onDelete={(id) => deletePromoMutation.mutate(id)}
            />
          </TabsContent>

          <TabsContent value="banners" className="mt-0 outline-none">
            <BannerList 
              banners={banners} 
              isLoading={loadingBanners}
              onEdit={handleEditBanner}
              onDelete={(id) => deleteBannerMutation.mutate(id)}
            />
          </TabsContent>

          <TabsContent value="broadcasts" className="mt-0 outline-none">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setShowBroadcastForm(true)} variant="outline" size="sm">
                   <Megaphone className="w-4 h-4 mr-2" /> Send New Broadcast
                </Button>
              </div>
              <BroadcastList 
                broadcasts={broadcasts} 
                isLoading={loadingBroadcasts} 
              />
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="mt-0 outline-none">
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-slate-50 border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium lowercase">Total Referrals</p>
                    <h4 className="text-2xl font-bold text-slate-900">{referralStats?.totalReferrals || 0}</h4>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-amber-600" />
                  </div>
                </Card>
                <Card className="p-4 bg-slate-50 border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium lowercase">Completed</p>
                    <h4 className="text-2xl font-bold text-slate-900">{referralStats?.completedReferrals || 0}</h4>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <StatusBadge status="completed" className="px-0 py-0 bg-transparent border-0" />
                  </div>
                </Card>
                <Card className="p-4 bg-slate-50 border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium lowercase">Total Rewards Issued</p>
                    <h4 className="text-2xl font-bold text-slate-900">₵{referralStats?.totalRewardsIssued?.toFixed(2) || '0.00'}</h4>
                  </div>
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-violet-600" />
                  </div>
                </Card>
              </div>

              <ReferralList 
                referrals={referrals} 
                isLoading={loadingReferrals}
                onUpdateStatus={(id, status) => updateReferralStatusMutation.mutate({ id, status })}
              />
            </div>
          </TabsContent>
        </Card>
      </Tabs>

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcastForm} onOpenChange={setShowBroadcastForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Platform Broadcast</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select name="targetGroup" defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platform Users</SelectItem>
                  <SelectItem value="rider">Riders Only</SelectItem>
                  <SelectItem value="driver">Drivers Only</SelectItem>
                  <SelectItem value="merchant">Merchants Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" placeholder="Important Update..." required />
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea name="body" placeholder="Type your message here..." rows={5} required />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowBroadcastForm(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={broadcastMutation.isPending}>
                <Send className="w-4 h-4 mr-2" /> Send Broadcast
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Promo Form Dialog */}
      <Dialog open={showPromoForm} onOpenChange={setShowPromoForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Promo' : 'New Promo Code'}</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              data.isActive = formData.get('isActive') === 'on';
              data.discountValue = Number(data.discountValue);
              data.usageLimit = data.usageLimit ? Number(data.usageLimit) : null;
              promoMutation.mutate(data);
            }} 
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input name="code" defaultValue={editingItem?.code} placeholder="VELO2026" required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="discountType" defaultValue={editingItem?.discountType || 'percentage'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₵)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value</Label>
                <Input name="discountValue" type="number" defaultValue={editingItem?.discountValue} required />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input name="usageLimit" type="number" defaultValue={editingItem?.usageLimit} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input name="expiresAt" type="date" defaultValue={editingItem?.expiresAt ? format(new Date(editingItem.expiresAt), 'yyyy-MM-dd') : ''} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" name="isActive" defaultChecked={editingItem ? editingItem.isActive : true} />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowPromoForm(false)}>Cancel</Button>
              <Button type="submit" disabled={promoMutation.isPending} className="bg-violet-600 hover:bg-violet-700">Save Promo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Banner Form Dialog */}
      <Dialog open={showBannerForm} onOpenChange={setShowBannerForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Banner' : 'New Banner'}</DialogTitle>
          </DialogHeader>
          <form 
             onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              data.isActive = formData.get('isActive') === 'on';
              data.priority = Number(data.priority || 0);
              bannerMutation.mutate(data);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" defaultValue={editingItem?.title} required />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input name="imageUrl" defaultValue={editingItem?.imageUrl} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Group</Label>
                <Select name="targetGroup" defaultValue={editingItem?.targetGroup || 'all'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="rider">Riders</SelectItem>
                    <SelectItem value="driver">Drivers</SelectItem>
                    <SelectItem value="merchant">Merchants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="type" defaultValue={editingItem?.type || 'promotion'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="external">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Redirect Link (Optional)</Label>
              <Input name="linkUrl" defaultValue={editingItem?.linkUrl} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" name="isActive" defaultChecked={editingItem ? editingItem.isActive : true} />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowBannerForm(false)}>Cancel</Button>
              <Button type="submit" disabled={bannerMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">Save Banner</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Referral Code Form Dialog */}
      <Dialog open={showReferralCodeForm} onOpenChange={setShowReferralCodeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Referral Code</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const userId = formData.get('userId');
              referralCodeMutation.mutate(userId);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Select User</Label>
              <div className="space-y-2">
                <Input 
                  placeholder="Search name or phone..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-8 text-sm"
                />
                <Select name="userId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                     {filteredUsers.length === 0 ? (
                       <div className="p-2 text-sm text-slate-500 text-center">No users found</div>
                     ) : (
                       filteredUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                           {u.full_name || 'No Name'} | {u.phoneNumber}
                        </SelectItem>
                       ))
                     )}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-slate-500">
                A unique referral code will be generated for this user if they don't already have one.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowReferralCodeForm(false)}>Cancel</Button>
              <Button type="submit" disabled={referralCodeMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
                {referralCodeMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Generate Code
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
