import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { base44, getErrorMessage } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

// Admin sign-in uses email + password (no OTP). The backend /auth/login returns
// the user (with phoneNumber + roles); we store an identifier for the x-user-phone
// header the admin API uses, and only allow users that hold an admin role.
const ADMIN_ROLES = ['admin', 'super_admin'];

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return;

        setLoading(true);
        try {
            const data = await base44.auth.loginWithPassword(email.trim().toLowerCase(), password);
            const user = data?.user;
            const roles = user?.roles || [];
            const isAdmin = roles.some((r) => ADMIN_ROLES.includes(r));

            if (!user || !isAdmin) {
                toast.error('Access denied', { description: 'This account does not have admin access.' });
                return;
            }

            // The admin API identifies the caller via x-user-phone (phone or UUID).
            login(user.phoneNumber || user.id);
            toast.success('Welcome back', { description: 'Signed in as Velo Admin.' });
            navigate('/');
        } catch (error) {
            toast.error('Sign in failed', { description: getErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Velo Admin</CardTitle>
                    <CardDescription className="text-base text-slate-500 dark:text-slate-400">
                        Sign in with your email and password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    type="email"
                                    placeholder="you@velocouriersvc.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    className="pl-10 h-11 border-slate-200 dark:border-slate-800 transition-all focus:ring-2 focus:ring-violet-500/20"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="pl-10 h-11 border-slate-200 dark:border-slate-800 transition-all focus:ring-2 focus:ring-violet-500/20"
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold transition-all hover:shadow-lg hover:shadow-violet-600/20 bg-violet-600 hover:bg-violet-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="fixed bottom-8 text-slate-400 text-xs">
                &copy; 2026 Velo Technologies. All rights reserved.
            </div>
        </div>
    );
}
