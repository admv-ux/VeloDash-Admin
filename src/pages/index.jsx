import React from 'react';
import Layout from "./Layout.jsx";
import Analytics from "./Analytics";
import AuditLogs from "./AuditLogs";
import Dashboard from "./Dashboard";
import DriverAvailability from "./DriverAvailability";
import Drivers from "./Drivers";
import Merchants from "./Merchants";
import Notifications from "./Notifications";
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
import Earnings from './Earnings';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import Login from "./Login";
import SetupAdmin from "./SetupAdmin";

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }
    // Handle the camelCase matching for navigation highlight
    const pages = ['Analytics', 'AuditLogs', 'Dashboard', 'DriverAvailability', 'Drivers', 'Earnings', 'Merchants', 'Notifications', 'Orders', 'Riders', 'Settings', 'FeeStructure', 'RideSimulator', 'SupportTickets', 'Zones', 'Waitlist', 'Team', 'Wallets', 'Transactions'];
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
        <Router>
            <Routes>
                <Route path="/login" element={<LoginWrapper />} />
                <Route path="/setup-admin" element={<SetupAdmin />} />

                {/* Protected Routes */}
                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/Analytics" element={<Analytics />} />
                    <Route path="/AuditLogs" element={<AuditLogs />} />
                    <Route path="/Dashboard" element={<Dashboard />} />
                    <Route path="/DriverAvailability" element={<DriverAvailability />} />
                    <Route path="/Drivers" element={<Drivers />} />
                    <Route path="/Merchants" element={<Merchants />} />
                    <Route path="/Notifications" element={<Notifications />} />
                    <Route path="/Orders" element={<Orders />} />
                    <Route path="/Riders" element={<Riders />} />
                    <Route path="/Settings" element={<Settings />} />
                    <Route path="/finances/wallets" element={<Wallets />} />
                    <Route path="/finances/transactions" element={<Transactions />} />
                    <Route path="/earnings" element={<Earnings />} />
                    <Route path="/fee-structure" element={<FeeStructure />} />
                    <Route path="/RideSimulator" element={<RideSimulator />} />
                    <Route path="/SupportTickets" element={<SupportTickets />} />
                    <Route path="/Zones" element={<Zones />} />
                    <Route path="/Waitlist" element={<Waitlist />} />
                    <Route path="/Team" element={<Team />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}