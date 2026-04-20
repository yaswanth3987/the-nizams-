import React, { useState, useEffect, useCallback } from 'react';
import { Layers, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminTableOverview({ socket, API_URL }) {
    const tableCategories = [
        { name: 'Tables', prefix: 'T', count: 4, gridCols: 'grid-cols-4' },
        { name: 'Boxes', prefix: 'B', count: 6, gridCols: 'grid-cols-6' },
        { name: 'Chowkies', prefix: 'C', count: 13, gridCols: 'grid-cols-7' }
    ];

    const allUnits = tableCategories.flatMap(cat => 
        Array.from({ length: cat.count }, (_, i) => `${cat.prefix}${String(i + 1).padStart(2, '0')}`)
    );

    const [tableStatuses, setTableStatuses] = useState(
        allUnits.map(unitId => ({
            tableId: unitId,
            status: 'free',
            updatedAt: null
        }))
    );

    const fetchStatuses = useCallback(async () => {
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
    }, [API_URL]);

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
    }, [socket, fetchStatuses]);

    const handleReset = async (tableId) => {
        if (!confirm(`Emergency reset Table ${tableId}? This action clears all active session data.`)) return;
        
        // Optimistic update
        setTableStatuses(prev => prev.map(t => 
            t.tableId === tableId ? { ...t, status: 'free' } : t
        ));

        try {
            const res = await fetch(`${API_URL}/tables/${encodeURIComponent(tableId)}/orders`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to reset table');
            // If the socket is slow, we already have the optimistic update
        } catch (err) {
            console.error('Reset failed:', err);
            fetchStatuses(); // Revert on error
        }
    };

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
        <div className="animate-in fade-in duration-700 pb-24 font-sans">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Table Management</h2>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                        Real-time seating unit management across all dining zones.
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1 block">Live Status</span>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Connected to Core
                    </div>
                </div>
            </div>

            <div className="space-y-24">
                {tableCategories.map((cat) => (
                    <div key={cat.name} className="relative">
                        <div className="flex items-center gap-6 mb-8">
                            <h3 className="text-xs font-bold text-accent uppercase tracking-widest italic">{cat.name}</h3>
                            <div className="h-px flex-1 bg-white/10"></div>
                            <span className="text-xs text-white/20 font-bold uppercase">{cat.count} Units</span>
                        </div>

                        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:${cat.gridCols} gap-8`}>
                            {tableStatuses.filter(t => t.tableId.startsWith(cat.prefix)).map((table) => {
                                const config = getStatusConfig(table.status);

                                return (
                                    <div 
                                        key={table.tableId} 
                                        className={`flex flex-col items-center justify-center h-44 rounded-3xl border transition-all duration-500 relative overflow-hidden group shadow-2xl hover:bg-white/10 ${config.color} ${config.glow}`}
                                    >
                                        <div className="text-4xl font-serif font-bold text-white mb-3 relative z-10 italic">
                                            {table.tableId.replace(/^[TBC]/, '')}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 relative z-10 border border-white/10 px-3 py-1 rounded-full bg-black/40">
                                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.iconBg}`}></span>
                                            <span className="text-[10px] font-bold text-white/60 tracking-wider uppercase">{config.label}</span>
                                        </div>

                                        {table.updatedAt && (
                                            <div className="mt-4 text-[9px] text-white/10 font-black uppercase tracking-[0.4em] relative z-10 italic">
                                                {new Date(table.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                        
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReset(table.tableId);
                                            }}
                                            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0c0d0c]/98 backdrop-blur-xl opacity-0 group-hover:hover:opacity-100 transition-all duration-500 scale-110 group-hover:hover:scale-100"
                                        >
                                            <RotateCcw className="w-10 h-10 text-nizam-gold mb-3" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-nizam-gold">Emergency Reset</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-24 p-12 bg-[#111311] border border-white/5 rounded-[3rem] flex items-center gap-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-nizam-gold/40"></div>
                <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center shrink-0 border border-white/10 relative z-10 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-10 h-10 text-nizam-gold" />
                </div>
                <div className="relative z-10">
                    <h4 className="text-[11px] font-black text-nizam-gold uppercase tracking-[0.5em] mb-4 italic">Seating Protocol Advisory</h4>
                    <p className="text-[13px] text-white/40 leading-loose italic max-w-4xl font-medium">Seating statuses update in real-time based on guest check-ins and billing events. The master override (Reset) should be reserved for exceptional operational cleanup to maintain data integrity across the concierge shard.</p>
                </div>
            </div>
        </div>
    );
}
