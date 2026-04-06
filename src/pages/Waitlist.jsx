import React, { useState, useEffect } from 'react';
import { base44, getErrorMessage } from '@/api/base44Client';
import { useAuth } from '@/AuthContext';
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
import { Trash2, RefreshCcw, Mail, Phone, MapPin, UserCheck, Plus, Globe, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";

export default function Waitlist() {
  const { currentLocation } = useAuth();
    const [entries, setEntries] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [isAddCountryOpen, setIsAddCountryOpen] = useState(false);
    const [isEditCountryOpen, setIsEditCountryOpen] = useState(false);
    const [editingCountry, setEditingCountry] = useState(null);
    const [newCountry, setNewCountry] = useState({ name: '', code: '', isActive: false });

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const data = await base44.entities.Waitlist.list();
            setEntries(data);
        } catch (error) {
            console.error("Error fetching waitlist:", error);
            toast.error("Error fetching waitlist", {
                description: getErrorMessage(error)
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCountries = async () => {
        setLoadingCountries(true);
        try {
            const data = await base44.entities.Waitlist.getCountries(true); // Fetch ALL countries
            setCountries(data);
        } catch (error) {
            console.error("Error fetching countries:", error, getErrorMessage(error));
        } finally {
            setLoadingCountries(false);
        }
    };

    useEffect(() => {
        fetchEntries();
        fetchCountries();
    }, [currentLocation]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to remove this entry?")) return;
        try {
            await base44.entities.Waitlist.delete(id);
            setEntries(entries.filter(e => e.id !== id));
            toast.success("Entry removed from waitlist.");
        } catch (error) {
            toast.error("Failed to remove entry", {
                description: getErrorMessage(error)
            });
        }
    };

    const handleAddCountry = async (e) => {
        e.preventDefault();
        if (!newCountry.name || !newCountry.code) return;

        try {
            const added = await base44.entities.Waitlist.addCountry(newCountry);
            setCountries([...countries, added]);
            setNewCountry({ name: '', code: '', isActive: false });
            setIsAddCountryOpen(false);
            toast.success(`${added.name} added to countries list.`);
        } catch (error) {
            toast.error("Failed to add country", {
                description: getErrorMessage(error)
            });
        }
    };

    const handleUpdateCountry = async (e) => {
        e.preventDefault();
        if (!editingCountry) return;

        try {
            const updated = await base44.entities.Waitlist.updateCountry(editingCountry.id, editingCountry);
            setCountries(countries.map(c => c.id === updated.id ? updated : c));
            setIsEditCountryOpen(false);
            setEditingCountry(null);
            toast.success(`${updated.name} updated successfully.`);
        } catch (error) {
            toast.error("Failed to update country", {
                description: getErrorMessage(error)
            });
        }
    };

    const handleToggleStatus = async (country) => {
        try {
            const updated = await base44.entities.Waitlist.updateCountry(country.id, { isActive: !country.isActive });
            setCountries(countries.map(c => c.id === updated.id ? updated : c));
            toast.success(`${updated.name} is now ${updated.isActive ? 'Supported' : 'on the Waitlist'}.`, {
                description: updated.isActive ? "Operations enabled for this country." : "Operations disabled."
            });
        } catch (error) {
            toast.error("Failed to update status", {
                description: getErrorMessage(error)
            });
        }
    };

    const handleDeleteCountry = async (id) => {
        if (!confirm("Are you sure? This will also remove associated waitlist entries if any.")) return;
        try {
            await base44.entities.Waitlist.deleteCountry(id);
            setCountries(countries.filter(c => c.id !== id));
            toast.success("Country deleted.");
        } catch (error) {
            toast.error("Failed to delete country", {
                description: getErrorMessage(error)
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Waitlist & Countries</h2>
                    <p className="text-muted-foreground">
                        Manage platform availability and interested users worldwide.
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
                                <DialogTitle>Add New Country</DialogTitle>
                                <DialogDescription>
                                    Register a country for waitlist or immediate support.
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
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="active"
                                        checked={newCountry.isActive}
                                        onCheckedChange={(checked) => setNewCountry({ ...newCountry, isActive: checked })}
                                    />
                                    <Label htmlFor="active">Set as Supported (Operational)</Label>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Save Country</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Button onClick={() => { fetchEntries(); fetchCountries(); }} variant="outline" size="sm" className="gap-2">
                        <RefreshCcw className={loading ? "animate-spin" : ""} size={16} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Waitlist Entries</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{entries.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Supported Countries</CardTitle>
                        <Globe className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{countries.filter(c => c.isActive).length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Waitlist Countries</CardTitle>
                        <Plus className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{countries.filter(c => !c.isActive).length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Country Management Table */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Country Management</CardTitle>
                        <CardDescription>Configure which countries are operational or only for waitlist.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-slate-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead>Country</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {countries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No countries configured.</TableCell>
                                        </TableRow>
                                    ) : (
                                        countries.map((country) => (
                                            <TableRow key={country.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-medium">{country.name}</TableCell>
                                                <TableCell>{country.code}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={country.isActive}
                                                            onCheckedChange={() => handleToggleStatus(country)}
                                                        />
                                                        <Badge variant={country.isActive ? "success" : "warning"} className="text-[10px]">
                                                            {country.isActive ? "Supported" : "Waitlist"}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                   <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-slate-500"
                                                            onClick={() => {
                                                                setEditingCountry(country);
                                                                setIsEditCountryOpen(true);
                                                            }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:bg-red-50"
                                                            onClick={() => handleDeleteCountry(country.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                   </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Waitlist Entries Table */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Waitlist Entries</CardTitle>
                        <CardDescription>Recent signups from interested users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-slate-100 overflow-hidden">
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
                                            <TableCell colSpan={5} className="h-24 text-center">Loading entries...</TableCell>
                                        </TableRow>
                                    ) : entries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">No entries found.</TableCell>
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

            {/* Edit Country Dialog */}
            <Dialog open={isEditCountryOpen} onOpenChange={setIsEditCountryOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Country</DialogTitle>
                        <DialogDescription>Modify country details.</DialogDescription>
                    </DialogHeader>
                    {editingCountry && (
                        <form onSubmit={handleUpdateCountry} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Country Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editingCountry.name}
                                    onChange={(e) => setEditingCountry({ ...editingCountry, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-code">Country Code (ISO)</Label>
                                <Input
                                    id="edit-code"
                                    value={editingCountry.code}
                                    onChange={(e) => setEditingCountry({ ...editingCountry, code: e.target.value.toUpperCase() })}
                                    required
                                    maxLength={10}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Update Country</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
