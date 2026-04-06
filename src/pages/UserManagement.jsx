import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Store, Car } from 'lucide-react';
import Riders from './Riders';
import Merchants from './Merchants';
import Drivers from './Drivers';

export default function UserManagement() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                    <p className="text-slate-500">Manage customers, merchants, and drivers in one place.</p>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger 
                        value="all" 
                        className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                        <Users className="w-4 h-4" />
                        <span>All Users</span>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="merchants" 
                        className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                        <Store className="w-4 h-4" />
                        <span>Merchants</span>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="drivers" 
                        className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                        <Car className="w-4 h-4" />
                        <span>Drivers</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0 border-0 p-0">
                    <Riders />
                </TabsContent>
                
                <TabsContent value="merchants" className="mt-0 border-0 p-0">
                    <Merchants />
                </TabsContent>

                <TabsContent value="drivers" className="mt-0 border-0 p-0">
                    <Drivers />
                </TabsContent>
            </Tabs>
        </div>
    );
}
