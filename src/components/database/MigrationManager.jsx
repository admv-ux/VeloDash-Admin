import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Terminal, CopyCheck, AlertTriangle, Play, Loader2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/api/base44Client';

export default function MigrationManager({ triggerButton }) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, running, complete, error
    const [logs, setLogs] = useState([]);
    const [progressStats, setProgressStats] = useState({
        currentTable: '-',
        tableIndex: 0,
        totalTables: 80,
        rowsMigrated: 0
    });
    
    const streamRef = useRef(null);
    const scrollRef = useRef(null);

    // Auto-scroll terminal
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const addLog = (type, text) => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type, text }]);
    };

    const startMigration = async () => {
        if (status === 'running') return;
        
        setStatus('running');
        setLogs([]);
        addLog('info', 'Starting migration stream connection...');
        
        try {
            const token = localStorage.getItem('base44_token') || sessionStorage.getItem('base44_token');
            const phone = localStorage.getItem('admin_phone') || '';
            const countryScope = localStorage.getItem('v_country_scope') || '';
            const cityScope = localStorage.getItem('v_city_scope') || '';
            const apiKey = import.meta.env.VITE_API_KEY || 'your-api-key-here'; 
            
            const response = await fetch(`${API_BASE_URL}/admin/supabase/migrate/stream`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'x-api-key': apiKey,
                    'x-user-phone': phone,
                    'x-country-scope': countryScope,
                    'x-city-scope': cityScope,
                    'Accept': 'text/event-stream'
                }
            });

            if (!response.ok) {
                throw new Error(`Connection failed: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            const processStream = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop(); // Keep incomplete chunk

                    for (const part of parts) {
                        const evtLines = part.split('\n');
                        let eventType = 'message';
                        let dataObj = {};

                        for (const line of evtLines) {
                            if (line.startsWith('event: ')) {
                                eventType = line.substring(7).trim();
                            } else if (line.startsWith('data: ')) {
                                try {
                                    dataObj = JSON.parse(line.substring(6).trim());
                                } catch (e) {
                                    console.error("Parse error", e);
                                }
                            }
                        }

                        if (Object.keys(dataObj).length > 0) {
                            handleEvent(eventType, dataObj);
                        }
                    }
                }
            };

            processStream().catch(e => {
                console.error("Stream disrupted", e);
                setStatus('error');
                addLog('error', `Stream disrupted: ${e.message}`);
                toast.error("Migration stream disrupted");
            });

        } catch (err) {
            console.error("Migration request error", err);
            setStatus('error');
            addLog('error', `Failed to start migration: ${err.message}`);
        }
    };

    const handleEvent = (type, dataObj) => {
        if (type === 'progress') {
            setProgressStats(prev => ({
                currentTable: dataObj.table,
                tableIndex: dataObj.tableIndex,
                totalTables: dataObj.totalTables,
                rowsMigrated: dataObj.rowsMigrated
            }));
            
            // Only log if rows migrated is 0 (start of table) or if we want verbose
            if (dataObj.rowsMigrated === 0) {
                addLog('info', `[${dataObj.tableIndex}/${dataObj.totalTables}] ${dataObj.message}`);
            } else if (dataObj.rowsMigrated % 10000 === 0) { // log interval
                addLog('info', `   -> Migrated ${dataObj.rowsMigrated} rows in ${dataObj.table}...`);
            }
        } 
        else if (type === 'info' || type === 'warning' || type === 'error' || type === 'complete') {
            addLog(type, dataObj.message || JSON.stringify(dataObj));
            
            if (type === 'error') {
                setStatus('error');
            } else if (type === 'complete') {
                setStatus('complete');
                setProgressStats(prev => ({ ...prev, tableIndex: prev.totalTables })); // Max out bar
                toast.success("Database fully migrated!");
            }
        }
    };

    // Derived progress percentage based on tables
    const percentage = Math.max(0, Math.min(100, Math.round(((progressStats.tableIndex - 1) / progressStats.totalTables) * 100))) || 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div onClick={() => setOpen(true)} className="inline-block">
                {triggerButton || (
                    <Button variant="default" className="gap-2 bg-violet-600 hover:bg-violet-700">
                        <Database className="w-4 h-4" />
                        Run Migration
                    </Button>
                )}
            </div>

            <DialogContent className="sm:max-w-[700px] gap-0 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-slate-50 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-violet-600" />
                        Live Database Migration
                    </DialogTitle>
                    <DialogDescription>
                        This tool connects to your Supabase instance and syncs data to the local DB. 
                        Do not close the browser window while running.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Status Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-100/50 p-3 rounded-md border border-slate-100 text-center">
                            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Current Table</p>
                            <p className="font-mono mt-1 text-base">{progressStats.currentTable}</p>
                        </div>
                        <div className="bg-slate-100/50 p-3 rounded-md border border-slate-100 text-center">
                            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Process Status</p>
                            <p className="mt-1 font-medium capitalize flex items-center justify-center gap-2">
                                {status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                {status === 'complete' && <CopyCheck className="w-4 h-4 text-emerald-500" />}
                                {status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                {status}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span>{percentage}% overall progress</span>
                            <span>{progressStats.tableIndex} / {progressStats.totalTables} Tables</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                    </div>

                    {/* Terminal Window */}
                    <div className="rounded-md border bg-slate-950 overflow-hidden">
                        <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                        </div>
                        <div 
                            ref={scrollRef}
                            className="p-4 h-[250px] overflow-y-auto font-mono text-[11px] leading-relaxed select-text"
                        >
                            {logs.length === 0 && <span className="text-slate-600">Waiting to initialize...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 font-mono">
                                    <span className="text-slate-600 shrink-0">{log.time}</span>
                                    <span className={`
                                        ${log.type === 'error' ? 'text-red-400' : ''}
                                        ${log.type === 'warning' ? 'text-amber-400' : ''}
                                        ${log.type === 'info' ? 'text-blue-300' : ''}
                                        ${log.type === 'complete' ? 'text-emerald-400 font-bold' : ''}
                                        ${log.type === 'progress' ? 'text-slate-300' : 'text-slate-300'}
                                    `}>
                                        {log.text}
                                    </span>
                                </div>
                            ))}
                            {status === 'running' && (
                                <div className="animate-pulse flex items-center text-slate-500 mt-2">
                                    <span className="mr-2">_</span> processing...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-slate-50 border-t">
                    <Button 
                        variant="outline" 
                        onClick={() => setOpen(false)}
                        disabled={status === 'running'}
                    >
                        {status === 'complete' || status === 'error' ? 'Close' : 'Cancel'}
                    </Button>
                    <Button 
                        onClick={startMigration} 
                        disabled={status === 'running' || status === 'complete'}
                        className="bg-violet-600 hover:bg-violet-700 font-medium"
                    >
                        {status === 'idle' && 'Start Migration'}
                        {status === 'running' && 'Running...'}
                        {status === 'error' && 'Retry Failed Migration'}
                        {status === 'complete' && 'Done'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
