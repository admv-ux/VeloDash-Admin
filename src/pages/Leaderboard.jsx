import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/AuthContext';
import { getCountryName } from '@/utils/country';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Trophy, 
  Medal, 
  MessageSquare, 
  Users, 
  Car, 
  Crown,
  Store,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

export default function Leaderboard() {
  const { currentLocation } = useAuth();
  const [activeTab, setActiveTab] = useState('mobility'); // mobility, commerce, customers
  const [subType, setSubType] = useState('riders'); // riders vs drivers, merchants vs services
  const [selectedCountry, setSelectedCountry] = useState(currentLocation.country || 'GH');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMsgDialog, setShowMsgDialog] = useState(false);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard', activeTab, subType, selectedCountry],
    queryFn: () => {
      const type = activeTab === 'mobility' ? subType : 
                   activeTab === 'commerce' ? subType : 'customers';
      return base44.entities.Leaderboard.get(type, selectedCountry);
    },
    enabled: !!selectedCountry
  });

  const handleSendMessage = async () => {
    if (!selectedUser || !msgTitle || !msgBody) return;
    setIsSending(true);
    try {
      await base44.entities.Notification.sendPrivate(selectedUser.userId, {
        title: msgTitle,
        body: msgBody
      });
      toast.success(`Message sent to ${selectedUser.name}!`);
      setShowMsgDialog(false);
      setMsgTitle('');
      setMsgBody('');
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-amber-500" />;
      case 2: return <Medal className="w-5 h-5 text-slate-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-700" />;
      default: return <span className="font-bold text-slate-400">#{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Crown className="w-7 h-7 text-amber-500" />
            Leadership Board
          </h2>
          <p className="text-slate-500">Recognizing top performers in {selectedCountry === 'ALL' ? 'ALL Countries' : getCountryName(selectedCountry)}</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="GH">Ghana</option>
            <option value="NG">Nigeria</option>
            <option value="CI">Côte d'Ivoire</option>
            <option value="ALL">ALL Countries</option>
          </select>
          <Badge variant="outline" className="bg-white px-3 py-1 shadow-sm h-9">
            Country: {selectedCountry === 'ALL' ? 'ALL' : getCountryName(selectedCountry)}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        if (val === 'mobility') setSubType('riders');
        if (val === 'commerce') setSubType('merchants');
      }} className="w-full">
        <div className="flex items-center justify-between gap-4 mb-6">
          <TabsList className="bg-white p-1 border shadow-sm">
            <TabsTrigger value="mobility" className="flex items-center gap-2 px-6">
              <Car className="w-4 h-4" />
              Top Power Drivers/Riders
            </TabsTrigger>
            <TabsTrigger value="commerce" className="flex items-center gap-2 px-6">
              <Store className="w-4 h-4" />
              Top Power Merchants/Service Providers
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2 px-6">
              <Users className="w-4 h-4" />
              Top Customers
            </TabsTrigger>
          </TabsList>
        </div>

        {activeTab !== 'customers' && (
          <div className="flex gap-2 mb-6">
            <Button 
              variant={subType === (activeTab === 'mobility' ? 'riders' : 'merchants') ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubType(activeTab === 'mobility' ? 'riders' : 'merchants')}
              className={subType === (activeTab === 'mobility' ? 'riders' : 'merchants') ? 'bg-violet-600' : 'bg-white'}
            >
              {activeTab === 'mobility' ? 'Riders' : 'Merchants'}
            </Button>
            <Button 
              variant={subType === (activeTab === 'mobility' ? 'drivers' : 'services') ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubType(activeTab === 'mobility' ? 'drivers' : 'services')}
              className={subType === (activeTab === 'mobility' ? 'drivers' : 'services') ? 'bg-violet-600' : 'bg-white'}
            >
              {activeTab === 'mobility' ? 'Drivers' : 'Service Providers'}
            </Button>
          </div>
        )}

        <TabsContent value="mobility" className="m-0 focus-visible:ring-0">
          <LeaderboardTable 
            data={leaderboard} 
            isLoading={isLoading} 
            type={subType === 'riders' ? 'rides' : 'rides-driver'}
            onMessage={(user) => { setSelectedUser(user); setShowMsgDialog(true); }}
            getRankIcon={getRankIcon}
          />
        </TabsContent>

        <TabsContent value="commerce" className="m-0 focus-visible:ring-0">
          <LeaderboardTable 
            data={leaderboard} 
            isLoading={isLoading} 
            type="merchants"
            onMessage={(user) => { setSelectedUser(user); setShowMsgDialog(true); }}
            getRankIcon={getRankIcon}
          />
        </TabsContent>

        <TabsContent value="customers" className="m-0 focus-visible:ring-0">
          <LeaderboardTable 
            data={leaderboard} 
            isLoading={isLoading} 
            type="purchases"
            onMessage={(user) => { setSelectedUser(user); setShowMsgDialog(true); }}
            getRankIcon={getRankIcon}
          />
        </TabsContent>
      </Tabs>

      {/* Messaging Dialog */}
      <Dialog open={showMsgDialog} onOpenChange={setShowMsgDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-500" />
              Send Reward Message
            </DialogTitle>
            <DialogDescription>
              A direct notification will be sent to <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Subject</Label>
              <Input 
                id="title" 
                placeholder="e.g. You're in the Top 10! 🏆" 
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Message Body</Label>
              <Textarea 
                id="body" 
                placeholder="Share the good news and maybe a promo code..." 
                className="min-h-[120px]"
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMsgDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={isSending || !msgTitle || !msgBody}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeaderboardTable({ data, isLoading, type, onMessage, getRankIcon }) {
  if (isLoading) {
    return (
      <Card className="p-8 border-0 shadow-sm bg-white text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-100 rounded w-full"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-50 rounded w-full"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-12 border-0 shadow-sm bg-white text-center flex flex-col items-center gap-4">
        <div className="p-4 bg-slate-50 rounded-full">
          <Crown className="w-12 h-12 text-slate-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">No Champions Yet</h3>
          <p className="text-slate-500">Wait for more activity in this region to generate rankings.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            <TableHead className="w-[100px]">Rank</TableHead>
            <TableHead>{type === 'merchants' ? 'Merchant' : 'User'}</TableHead>
            <TableHead className="text-center">
              {type === 'rides' || type === 'rides-driver' ? 'Total Rides' : 
               type === 'merchants' ? 'Total Orders' : 'Total Purchases'}
            </TableHead>
            {type === 'merchants' && <TableHead className="text-right">Revenue</TableHead>}
            <TableHead className="text-right pr-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.userId} className="hover:bg-slate-50/30">
              <TableCell className="font-medium align-middle">
                <div className="flex items-center justify-center w-10">
                  {getRankIcon(row.rank)}
                </div>
              </TableCell>
              <TableCell className="align-middle">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 ring-2 ring-white">
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-bold">
                      {row.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">ID: {row.userId.substring(0, 8)}...</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center align-middle">
                <Badge variant="secondary" className="px-3 py-1 font-bold text-sm bg-violet-50 text-violet-700 border-violet-100">
                  {row.count}
                </Badge>
              </TableCell>
              {type === 'merchants' && (
                <TableCell className="text-right font-semibold text-emerald-600 align-middle">
                  ₵{(row.revenue || 0).toFixed(2)}
                </TableCell>
              )}
              <TableCell className="text-right pr-6 align-middle">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onMessage(row)}
                  className="hover:bg-violet-50 hover:text-violet-600 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
