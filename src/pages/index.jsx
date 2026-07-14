import React from 'react';
import Layout from "./Layout.jsx";
import Analytics from "./Analytics";
import AuditLogs from "./AuditLogs";
import Dashboard from "./Dashboard";
import Drivers from "./Drivers";
import Merchants from "./Merchants";
import Products from "./Products";
import Notifications from "./Notifications";
import Campaigns from "./Campaigns";
import Orders from "./Orders";
import Riders from "./Riders";
import Settings from "./Settings";
import FeeStructure from "./FeeStructure";
import RideSimulator from "./RideSimulator";
import SupportTickets from "./SupportTickets";
import Zones from "./Zones";
import Waitlist from "./Waitlist";
import Team from "./Team";
import Wallets from './Wallets';
import Transactions from './Transactions';
import GatewayPayments from './GatewayPayments';
import Earnings from './Earnings';
import Services from './Services';
import Leaderboard from './Leaderboard';
import SupabaseExplorer from './SupabaseExplorer';

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import Login from "./Login";
import SetupAdmin from "./SetupAdmin";
import UserManagement from "./UserManagement";

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }
    // Handle the camelCase matching for navigation highlight
    const pages = ['Analytics', 'AuditLogs', 'Dashboard', 'Users', 'Earnings', 'Products', 'Notifications', 'Campaigns', 'Orders', 'Settings', 'FeeStructure', 'RideSimulator', 'SupportTickets', 'Zones', 'Waitlist', 'Team', 'Wallets', 'Transactions', 'GatewayPayments', 'Services', 'Leaderboard', 'SupabaseExplorer'];

    const found = pages.find(p => p.toLowerCase() === urlLastPart.toLowerCase());
    return found || 'Dashboard';
}

function ProtectedLayout() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Initializing Velo Admin...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Outlet />
        </Layout>
    );
}

function LoginWrapper() {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    if (isAuthenticated) return <Navigate to="/" replace />;
    return <Login />;
}

export default function Pages() {
    return (
        <Routes>
            <Route path="/login" element={<LoginWrapper />} />
            <Route path="/setup-admin" element={<SetupAdmin />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/auditlogs" element={<AuditLogs />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/drivers" element={<Navigate to="/users" replace />} />
                <Route path="/merchants" element={<Navigate to="/users" replace />} />
                <Route path="/riders" element={<Navigate to="/users" replace />} />
                <Route path="/products" element={<Products />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/wallets" element={<Wallets />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/gatewaypayments" element={<GatewayPayments />} />
                <Route path="/finances/gateway-payments" element={<GatewayPayments />} />
                <Route path="/finances/wallets" element={<Wallets />} />
                <Route path="/finances/transactions" element={<Transactions />} />
                <Route path="/earnings" element={<Earnings />} />
                <Route path="/fee-structure" element={<FeeStructure />} />
                <Route path="/ridesimulator" element={<RideSimulator />} />
                <Route path="/supporttickets" element={<SupportTickets />} />
                <Route path="/zones" element={<Zones />} />
                <Route path="/waitlist" element={<Waitlist />} />
                <Route path="/team" element={<Team />} />
                <Route path="/services" element={<Services />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/supabaseexplorer" element={<SupabaseExplorer />} />

            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}