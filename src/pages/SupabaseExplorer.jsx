import React, { useState, useEffect } from 'react';
import { base44, getErrorMessage } from '@/api/base44Client';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Database, 
    Search, 
    RefreshCcw, 
    ArrowRight, 
    ExternalLink, 
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function SupabaseExplorer() {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingTables, setLoadingTables] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    const fetchTables = async () => {
        setLoadingTables(true);
        try {
            const response = await base44.entities.Supabase.listTables();
            setTables(response.tables || []);
        } catch (error) {
            toast.error("Failed to load tables", { description: getErrorMessage(error) });
        } finally {
            setLoadingTables(false);
        }
    };

    const fetchTableData = async (tableName, pageNum = 1) => {
        setLoading(true);
        try {
            const response = await base44.entities.Supabase.getTableData(tableName, { page: pageNum, limit });
            setData(response.data || []);
            setTotal(response.total || 0);
            setPage(pageNum);
            setSelectedTable(tableName);
        } catch (error) {
            const msg = getErrorMessage(error);
            toast.error(`Error loading ${tableName}`, { 
                description: msg,
                action: {
                    label: "Retry",
                    onClick: () => fetchTableData(tableName, pageNum)
                }
            });
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const filteredTables = tables.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleSync = async (recordId) => {
        toast.info("Migration logic not yet implemented", {
            description: `Future update will allow syncing record ${recordId} from ${selectedTable} to the local DB.`
        });
    };

    const renderDataValue = (val) => {
        if (val === null) return <span className="text-slate-300 italic">null</span>;
        if (typeof val === 'boolean') return <Badge variant={val ? "success" : "secondary"}>{val.toString()}</Badge>;
        if (typeof val === 'object') return <span className="text-xs font-mono truncate max-w-[200px] inline-block">{JSON.stringify(val)}</span>;
        return <span className="truncate max-w-[300px] inline-block">{val.toString()}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Supabase Explorer</h2>
                    <p className="text-muted-foreground">
                        Browse and manage data from your Supabase instance during migration.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchTables} variant="outline" size="sm" className="gap-2">
                        <RefreshCcw className={loadingTables ? "animate-spin" : ""} size={16} />
                        Refresh Schema
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Tables Sidebar */}
                <Card className="md:col-span-1 border-none shadow-sm h-[calc(100vh-250px)] overflow-hidden flex flex-col">
                    <CardHeader className="pb-3 px-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Database size={16} className="text-violet-500" />
                            Public Tables
                        </CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search tables..." 
                                className="pl-8 h-9 text-xs" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto px-2 pt-0 pb-2">
                        {loadingTables ? (
                            <div className="flex flex-col gap-2 p-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-8 bg-slate-50 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : filteredTables.length === 0 ? (
                            <p className="text-xs text-center py-8 text-muted-foreground">No tables found.</p>
                        ) : (
                            <div className="space-y-1">
                                {filteredTables.map(tableName => (
                                    <button
                                        key={tableName}
                                        onClick={() => fetchTableData(tableName)}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center justify-between group ${
                                            selectedTable === tableName 
                                            ? 'bg-violet-50 text-violet-700 font-medium' 
                                            : 'hover:bg-slate-50 text-slate-600'
                                        }`}
                                    >
                                        {tableName}
                                        <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedTable === tableName ? 'opacity-100' : ''}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Data View */}
                <Card className="md:col-span-3 border-none shadow-sm flex flex-col h-[calc(100vh-250px)]">
                    <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-50">
                        <div>
                            <CardTitle className="text-lg">
                                {selectedTable ? `Table: ${selectedTable}` : "Select a table"}
                            </CardTitle>
                            {selectedTable && (
                                <CardDescription>Showing {data.length} of {total} records</CardDescription>
                            )}
                        </div>
                        {selectedTable && (
                            <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => fetchTableData(selectedTable, page)}>
                                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                                Reload Data
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                        {!selectedTable ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                                <Database size={48} className="mb-4 opacity-20" />
                                <h3 className="text-lg font-medium text-slate-400">Database Connection Active</h3>
                                <p className="max-w-xs text-sm mt-2">
                                    Choose a table from the sidebar to explore data currently stored in your Supabase instance.
                                </p>
                            </div>
                        ) : loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <span className="loading-spinner h-8 w-8 text-violet-600" />
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12">
                                <AlertCircle size={32} className="mb-2 opacity-50" />
                                <p>This table seems to be empty or inaccessible.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                                            <TableRow>
                                                {Object.keys(data[0] || {}).map(key => (
                                                    <TableHead key={key} className="whitespace-nowrap uppercase text-[10px] font-bold tracking-wider">{key}</TableHead>
                                                ))}
                                                <TableHead className="text-right">Sync</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-slate-50/30">
                                                    {Object.entries(row).map(([key, val], i) => (
                                                        <TableCell key={i} className="py-2 text-xs">
                                                            {renderDataValue(val)}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="text-right py-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-violet-500 hover:text-violet-700 hover:bg-violet-50"
                                                            onClick={() => handleSync(row.id || idx)}
                                                        >
                                                            <ExternalLink size={14} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                {/* Pagination */}
                                <div className="p-4 border-t border-slate-50 bg-white/50 flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            disabled={page === 1} 
                                            onClick={() => fetchTableData(selectedTable, page - 1)}
                                            className="h-8 px-2"
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <span className="text-xs font-medium px-2">Page {page}</span>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            disabled={page * limit >= total} 
                                            onClick={() => fetchTableData(selectedTable, page + 1)}
                                            className="h-8 px-2"
                                        >
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
