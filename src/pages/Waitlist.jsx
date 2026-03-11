import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCcw, Mail, Phone, MapPin, UserCheck, Plus, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Waitlist() {
    const [entries, setEntries] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [isAddCountryOpen, setIsAddCountryOpen] = useState(false);
    const [newCountry, setNewCountry] = useState({ name: '', code: '' });
    const { toast } = useToast();

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const data = await base44.entities.Waitlist.list();
            setEntries(data);
        } catch (error) {
            console.error("Error fetching waitlist:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load waitlist entries.",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCountries = async () => {
        setLoadingCountries(true);
        try {
            const data = await base44.entities.Waitlist.getCountries();
            setCountries(data);
        } catch (error) {
            console.error("Error fetching countries:", error);
        } finally {
            setLoadingCountries(false);
        }
    };

    useEffect(() => {
        fetchEntries();
        fetchCountries();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to remove this entry?")) return;
        try {
            await base44.entities.Waitlist.delete(id);
            setEntries(entries.filter(e => e.id !== id));
            toast({
                title: "Success",
                description: "Entry removed from waitlist.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete entry.",
            });
        }
    };

    const handleAddCountry = async (e) => {
        e.preventDefault();
        if (!newCountry.name || !newCountry.code) return;

        try {
            const added = await base44.entities.Waitlist.addCountry(newCountry);
            setCountries([...countries, added]);
            setNewCountry({ name: '', code: '' });
            setIsAddCountryOpen(false);
            toast({
                title: "Success",
                description: `${added.name} added to supported countries.`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add country.",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Waitlist</h2>
                    <p className="text-muted-foreground">
                        Manage users waiting for platform availability in their region.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isAddCountryOpen} onOpenChange={setIsAddCountryOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Plus size={16} />
                                Add Country
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Supported Country</DialogTitle>
                                <DialogDescription>
                                    Add a new country to the waitlist options.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddCountry} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Country Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Ghana"
                                        value={newCountry.name}
                                        onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Country Code (ISO)</Label>
                                    <Input
                                        id="code"
                                        placeholder="e.g. GH"
                                        value={newCountry.code}
                                        onChange={(e) => setNewCountry({ ...newCountry, code: e.target.value.toUpperCase() })}
                                        required
                                        maxLength={10}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Save Country</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Button onClick={fetchEntries} variant="outline" size="sm" className="gap-2">
                        <RefreshCcw className={loading ? "animate-spin" : ""} size={16} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{entries.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Supported Countries</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {countries.length === 0 && !loadingCountries ? (
                                <span className="text-xs text-muted-foreground">None</span>
                            ) : (
                                countries.map(c => (
                                    <Badge key={c.id} variant="outline" className="text-[10px] py-0">
                                        {c.name} ({c.code})
                                    </Badge>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Waitlist Entries</CardTitle>
                    <CardDescription>Recent signups from interested users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-100">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Signed Up</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No entries found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entries.map((entry) => (
                                        <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-medium text-slate-900">{entry.fullName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Mail size={14} />
                                                        {entry.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Phone size={14} />
                                                        {entry.phoneNumber}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">
                                                    <MapPin size={12} />
                                                    {entry.country?.name || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(entry.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
