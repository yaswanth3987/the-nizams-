import React, { useState, useEffect } from 'react';
import { Layers, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminTableOverview({ socket, API_URL }) {
    const allUnits = [
        ...Array.from({ length: 15 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`),
        ...Array.from({ length: 5 }, (_, i) => `B${String(i + 1).padStart(2, '0')}`),
        ...Array.from({ length: 4 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`)
    ];

    const [tableStatuses, setTableStatuses] = useState(
        allUnits.map(unitId => ({
            tableId: unitId,
            status: 'free',
            updatedAt: null
        }))
    );

    const fetchStatuses = async () => {
        try {
            const res = await fetch(`${API_URL}/table-status`);
            if (!res.ok) throw new Error('Failed to fetch table statuses');
            const data = await res.json();
            
            setTableStatuses(prev => prev.map(t => {
                const updated = data.find(apiT => apiT.tableId === t.tableId);
                return updated ? { ...t, ...updated } : t;
            }));
        } catch (err) {
            console.error('Error fetching table statuses:', err);
        }
    };

    useEffect(() => {
        fetchStatuses();

        if (socket) {
            socket.on('tableStatusUpdated', (data) => {
                setTableStatuses(prev => prev.map(t => 
                    t.tableId === data.tableId ? { ...t, ...data } : t
                ));
            });

            socket.on('tableReset', (data) => {
                setTableStatuses(prev => prev.map(t => 
                    t.tableId === data.tableId ? { ...t, status: 'free' } : t
                ));
            });
        }

        const interval = setInterval(fetchStatuses, 5000);

        return () => {
            clearInterval(interval);
            if (socket) {
                socket.off('tableStatusUpdated');
                socket.off('tableReset');
            }
        };
    }, [socket, API_URL]);

    const getStatusConfig = (status) => {
        switch(status?.toLowerCase()) {
            case 'ordering':
                return { 
                    color: 'bg-nizam-gold/5 border-nizam-gold/30 text-nizam-gold', 
                    label: 'ORDERING', 
                    iconBg: 'bg-nizam-gold',
                    glow: 'shadow-[0_0_15px_rgba(182,156,114,0.3)]'
                };
            case 'occupied':
                return { 
                    color: 'bg-blue-500/5 border-blue-500/30 text-blue-400', 
                    label: 'OCCUPIED', 
                    iconBg: 'bg-blue-500',
                    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                };
            case 'billing':
                return { 
                    color: 'bg-orange-500/5 border-orange-500/30 text-orange-400', 
                    label: 'BILLING', 
                    iconBg: 'bg-orange-500',
                    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                };
            case 'free':
            default:
                return { 
                    color: 'bg-nizam-dark/40 border-nizam-border/30 text-nizam-textMuted', 
                    label: 'FREE', 
                    iconBg: 'bg-nizam-border',
                    glow: ''
                };
        }
    };

    return (
        <div className="animate-in fade-in duration-700 pb-12">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-serif text-white tracking-widest mb-2 flex items-center gap-4 uppercase font-bold">
                        <Layers className="text-nizam-gold w-8 h-8" />
                        Table Operations
                    </h2>
                    <p className="text-nizam-textMuted text-sm font-medium italic">High-fidelity floor status monitoring.</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black tracking-[0.4em] text-nizam-gold uppercase mb-1 block">System Sync</span>
                    <div className="flex items-center gap-2 text-white/50 text-[10px] font-mono">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        LIVE REAL-TIME FEED
                    </div>
                </div>
            </div>

            <div className="bg-nizam-card border-2 border-nizam-border/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-nizam-gold/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>

                <div className="mb-10 flex flex-wrap justify-start gap-6 px-6 py-4 bg-black/40 rounded-2xl border border-nizam-border/30 w-fit backdrop-blur-md">
                    <div className="flex items-center gap-3 text-[10px] font-black text-nizam-textMuted uppercase tracking-[0.2em]"><span className="w-3 h-3 rounded-full bg-nizam-border shadow-inner"></span> Free</div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-nizam-gold uppercase tracking-[0.2em]"><span className="w-3 h-3 rounded-full bg-nizam-gold shadow-[0_0_10px_#B69C72]"></span> Ordering</div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3B82F6]"></span> Occupied</div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]"><span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_#F97316]"></span> Billing</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5">
                    {tableStatuses.map((table) => {
                        const config = getStatusConfig(table.status);

                        return (
                            <div 
                                key={table.tableId} 
                                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-500 relative overflow-hidden group shadow-xl hover:scale-[1.02] active:scale-95 ${config.color} ${config.glow}`}
                            >
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="text-3xl font-serif font-black text-white mb-2 relative z-10 transition-transform group-hover:scale-110">
                                    {table.tableId.replace(/^T/, '')}
                                </div>
                                
                                <div className="flex items-center gap-2 relative z-10">
                                    <span className={`w-2 h-2 rounded-full animate-pulse ${config.iconBg}`}></span>
                                    <span className="text-[9px] font-black tracking-[0.2em] uppercase">{config.label}</span>
                                </div>

                                {table.updatedAt && (
                                    <div className="mt-4 text-[8px] opacity-40 font-mono uppercase tracking-widest relative z-10 font-bold">
                                        {new Date(table.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                                
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Emergency reset Table ${table.tableId}? This action clears all active session data.`)) {
                                            fetch(`${API_URL}/tables/${encodeURIComponent(table.tableId)}/orders`, { method: 'DELETE' });
                                        }
                                    }}
                                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-600/90 opacity-0 group-hover:opacity-0 group-hover:hover:opacity-100 transition-all duration-300"
                                >
                                    <RotateCcw className="w-6 h-6 text-white mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Reset</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-10 bg-blue-950/10 border-2 border-blue-900/30 p-6 rounded-3xl flex items-start gap-5 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <AlertCircle className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Operational Protocol</h4>
                    <p className="text-[11px] text-nizam-textMuted leading-relaxed italic">Table states transition automatically based on guest interactions and POS checkout events. Manual reset is intended for emergency cleanup only.</p>
                </div>
            </div>
        </div>
    );
}
