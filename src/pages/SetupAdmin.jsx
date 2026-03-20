import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { base44, getErrorMessage } from "@/api/base44Client";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, UserPlus, ArrowLeft } from "lucide-react";

export default function SetupAdmin() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!phoneNumber) {
            toast.error("Phone number is required");
            return;
        }

        setLoading(true);
        try {
            const result = await base44.Setup.createAdmin({
                phoneNumber,
                email,
                fullName
            });
            
            toast.success("Admin user created/updated successfully!");
            console.log("Setup result:", result);
            
            // Optionally redirect to login or show success state
        } catch (error) {
            const msg = getErrorMessage(error);
            toast.error(msg);
            console.error("Setup error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mb-8">
                <Link to="/login" className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Link>
            </div>

            <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-violet-600 to-indigo-600" />
                
                <CardHeader className="space-y-1 pb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mb-4 mx-auto">
                        <ShieldCheck className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Initial Admin Setup</CardTitle>
                    <CardDescription className="text-center text-slate-500">
                        Create an administrator account with no authentication required.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Required)</Label>
                            <Input 
                                id="phone" 
                                placeholder="+233XXXXXXXXX" 
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                                className="border-slate-300 focus:ring-violet-500"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input 
                                id="email" 
                                type="email"
                                placeholder="admin@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-slate-300 focus:ring-violet-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name (Optional)</Label>
                            <Input 
                                id="name" 
                                placeholder="Velo Admin" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="border-slate-300 focus:ring-violet-500"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-2">
                        <Button 
                            type="submit" 
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-6 shadow-lg shadow-violet-200 dark:shadow-none transition-all hover:scale-[1.02]"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Admin...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    Create Admin Account
                                </div>
                            )}
                        </Button>
                        
                        <p className="text-[11px] text-center text-slate-400 italic">
                            This page has no authentication protection. Use with caution in production.
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
