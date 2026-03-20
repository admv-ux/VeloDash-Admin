import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { base44, getErrorMessage } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ShieldCheck, Phone, Key, ArrowRight, Loader2 } from 'lucide-react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

export default function Login() {
    const [phoneNumber, setPhoneNumber] = useState();
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        if (!phoneNumber) return;

        setLoading(true);
        try {
            await base44.auth.requestOtp(phoneNumber);
            setStep(2);
            toast({
                title: "OTP Sent",
                description: "Please check your backend logs for the code.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp) return;

        setLoading(true);
        try {
            await base44.auth.verifyOtp(phoneNumber, otp);
            login(phoneNumber);
            toast({
                title: "Welcome Back",
                description: "Authenticated successfully as Velo Admin.",
            });
            navigate('/');
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            {/* Background decoration */}
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
                        Secure access to the platform dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <PhoneInput
                                        defaultCountry="GH"
                                        placeholder="Enter phone number"
                                        value={phoneNumber}
                                        onChange={setPhoneNumber}
                                        className="flex h-11 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                        Continue
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </Button>
                            
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Development Only</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        login("+233000000000");
                                        navigate("/");
                                        toast({
                                            title: "Guest Access",
                                            description: "Logged in as Guest Admin 1.",
                                        });
                                    }}
                                    className="h-11 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                                >
                                    Guest 1
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        login("+233000000001");
                                        navigate("/");
                                        toast({
                                            title: "Guest Access",
                                            description: "Logged in as Guest Admin 2.",
                                        });
                                    }}
                                    className="h-11 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                                >
                                    Guest 2
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        className="pl-10 h-11 border-slate-200 dark:border-slate-800 transition-all focus:ring-2 focus:ring-violet-500/20"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-center text-slate-500 mt-2">
                                    OTP sent to <span className="font-medium text-slate-700 dark:text-slate-300">{phoneNumber}</span>
                                </p>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-semibold transition-all hover:shadow-lg hover:shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Verify & Sign In'
                                )}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                            >
                                Change phone number
                            </button>
                        </form>
                    )}
                </CardContent>
            </Card>

            <div className="fixed bottom-8 text-slate-400 text-xs">
                &copy; 2026 Velo Technologies. All rights reserved.
            </div>
        </div>
    );
}
