import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Store,
  Car,
  Users,
  Package,
  TicketCheck,
  Map,
  Settings,
  Bell,
  BarChart3,
  Shield,
  FileText,
  CreditCard,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Bike,
  Clock,
  Play,
  DollarSign,
  Tags,
  Briefcase,
  Megaphone,
  Crown,
  Search,
  Globe,
  Database,
  KeyRound,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import NotificationBell from '@/components/notifications/NotificationBell';
import ChangePasswordDialog from '@/components/shared/ChangePasswordDialog';
import { useAuth } from '@/AuthContext';
import { useQuery } from '@tanstack/react-query';

const navigation = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Leadership Board', href: 'Leaderboard', icon: Crown },
  { name: 'User Management', href: 'Users', icon: Users },
  { name: 'Products', href: 'Products', icon: Tags },
  { name: 'Services', href: 'Services', icon: Briefcase },
  { name: 'Orders & Rides', href: 'Orders', icon: Package },
  {
    name: 'Finances',
    href: 'Wallets', // Default to wallets for now
    icon: DollarSign,
    children: [
      { name: 'Platform Revenue', path: '/earnings', roles: ['admin', 'finance_viewer', 'country_manager'] },
      { name: 'Payouts', path: '/payouts', roles: ['admin', 'finance_viewer'] },
      { name: 'User Wallets', path: '/finances/wallets', roles: ['admin', 'finance_viewer'] },
      { name: 'Transaction Logs', path: '/finances/transactions', roles: ['admin', 'finance_viewer'] },
      { name: 'Gateway Payments', path: '/finances/gateway-payments', roles: ['admin', 'finance_viewer'] },
      { name: 'Fee & Fare Structure', path: '/fee-structure', roles: ['admin', 'finance_viewer', 'country_manager'] },
    ]
  },
  { name: 'Campaigns', href: 'Campaigns', icon: Megaphone },
  { name: 'Support Tickets', href: 'SupportTickets', icon: TicketCheck },
  { name: 'Notifications', href: 'Notifications', icon: Bell },
  { name: 'Audit Logs', href: 'AuditLogs', icon: Shield },
  { name: 'Settings', href: 'Settings', icon: Settings },
  { name: 'Waitlist', href: 'Waitlist', icon: Globe },
  { name: 'Team', href: 'Team', icon: Users },
  { name: 'Supabase Explorer', href: 'SupabaseExplorer', icon: Database },
];


export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const { user, logout, currentLocation, setLocationScope } = useAuth();

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Waitlist.getCountries(),
  });

  const handleLogout = () => {
    console.log("logout");
    logout();
  };

  const isSuperAdmin = user?.roles?.some(r => r.name === 'super_admin' || r.name === 'admin');
  const userRoles = user?.roles?.map(r => r.name) || [];

  // Filter navigation based on role
  const filteredNavigation = navigation.filter(item => {
    if (isSuperAdmin) return true;
    
    if (item.name === 'Audit Logs' || item.name === 'Team') return false;
    if ((item.name === 'Platform Earnings' || item.name === 'Fee & Fare Structure' || item.name === 'Ride Simulator') && !userRoles.includes('finance_viewer') && !userRoles.includes('country_manager') && !userRoles.includes('admin')) return false;
    
    return true;
  });

  const LocationSwitcher = () => {
    const [countrySearch, setCountrySearch] = useState('');
    if (!isSuperAdmin) return null;

    const filteredCountries = countries.filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-white/50 border-slate-200">
            <Globe className="w-4 h-4 text-violet-600" />
            <span className="hidden sm:inline">{currentLocation.country}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2">
          <div className="flex items-center gap-2 px-2 pb-2 border-b mb-1">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Input 
              placeholder="Search markets..." 
              className="h-8 text-xs border-0 focus-visible:ring-0 px-0" 
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <ScrollArea className="h-[300px]">
            <DropdownMenuItem 
              onClick={() => {
                setLocationScope({ country: 'All', city: 'All' });
                setCountrySearch('');
              }}
              className="mt-1"
            >
              All Markets
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {filteredCountries.map((country) => (
              <DropdownMenuItem 
                key={country.id} 
                onClick={() => {
                  setLocationScope({ country: country.name, city: 'All' });
                  setCountrySearch('');
                }}
              >
                {country.name}
              </DropdownMenuItem>
            ))}
            {filteredCountries.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-500">
                No markets found
              </div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Velo Admin</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          {user && (
            <div className="p-4 border-t border-slate-800">
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-violet-600 text-white text-sm">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.full_name || 'Admin'}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.roles.map(role => (
                    <span key={role.name || role} className="px-2 py-0.5 rounded-full bg-violet-500/20 text-[10px] font-medium text-violet-400 border border-violet-500/30">
                      {role.name || role}
                    </span>
                  ))}
                </div>
                {(!isSuperAdmin && currentLocation.country !== 'All') && (
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {currentLocation.country} {currentLocation.city !== 'All' ? `> ${currentLocation.city}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-slate-900">
                {navigation.find(n => n.href === currentPageName)?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <LocationSwitcher />
              <NotificationBell userEmail={user?.email} userType="admin" />

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-violet-600 text-white text-sm">
                          {user.full_name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setPwOpen(true)}>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Change password
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
