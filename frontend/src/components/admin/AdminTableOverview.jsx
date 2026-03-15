import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';

export default function AdminTableOverview({ socket, API_URL }) {
    const [tableStatuses, setTableStatuses] = useState(
        Array.from({ length: 24 }, (_, i) => ({
            tableId: `T${String(i + 1).padStart(2, '0')}`,
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

            // Also listen to overall table reset which means it's free
            socket.on('tableReset', (data) => {
                setTableStatuses(prev => prev.map(t => 
                    t.tableId === data.tableId ? { ...t, status: 'free' } : t
                ));
            });
        }

        // Fallback refresh every 5 seconds
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
                return { color: 'bg-yellow-500/20 border-yellow-500 text-yellow-500', label: 'Ordering', iconBg: 'bg-yellow-500' };
            case 'occupied':
                return { color: 'bg-blue-500/20 border-blue-500 text-blue-400', label: 'Occupied', iconBg: 'bg-blue-500' };
            case 'billing':
                return { color: 'bg-orange-500/20 border-orange-500 text-orange-400', label: 'Billing', iconBg: 'bg-orange-500' };
            case 'free':
            default:
                return { color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400', label: 'Free', iconBg: 'bg-emerald-500' };
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-12">
            <div className="mb-8">
                <h2 className="text-3xl font-serif text-white tracking-wide mb-2 flex items-center gap-3">
                    <Layers className="text-nizam-gold" />
                    Table Operations
                </h2>
                <p className="text-[#a8b8b2] text-sm">Real-time status overview of all restaurant tables.</p>
            </div>

            <div className="p-4 bg-nizam-card border border-nizam-border rounded-lg shadow-xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-nizam-gold/5 blur-[50px] rounded-full point-events-none"></div>

                {/* Legend - Moved to Top */}
                <div className="mb-6 flex flex-wrap justify-start gap-4 px-4 py-2 bg-black/20 rounded-lg border border-white/5 w-fit">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider"><span className="w-2 h-2 rounded bg-emerald-500"></span> Free</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-500 uppercase tracking-wider"><span className="w-2 h-2 rounded bg-yellow-500"></span> Ordering</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-wider"><span className="w-2 h-2 rounded bg-blue-500"></span> Occupied</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-wider"><span className="w-2 h-2 rounded bg-orange-500"></span> Billing</div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {tableStatuses.map((table) => {
                        const config = getStatusConfig(table.status);

                        return (
                            <div 
                                key={table.tableId} 
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 relative overflow-hidden group shadow-md ${config.color}`}
                            >
                                {/* Light bleed effect for the specific color */}
                                <div className={`absolute top-0 inset-x-0 h-1/2 opacity-10 bg-gradient-to-b ${config.color.split(' ')[0]} to-transparent`}></div>

                                <div className="text-xl font-serif font-bold text-white mb-1 relative z-10 flex items-center gap-2">
                                    {table.tableId}
                                </div>
                                <div className="flex items-center gap-1.5 relative z-10">
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_6px_currentColor] ${config.iconBg}`}></span>
                                    <span className="text-[10px] font-semibold tracking-widest uppercase">{config.label}</span>
                                </div>
                                {table.updatedAt && (
                                    <div className="mt-2 text-[8px] opacity-60 uppercase tracking-widest relative z-10">
                                        {new Date(table.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                                
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Force reset Table ${table.tableId}? This will archive all active orders.`)) {
                                            fetch(`${API_URL}/tables/${encodeURIComponent(table.tableId)}/orders`, { method: 'DELETE' });
                                        }
                                    }}
                                    className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 border border-white/10 hover:border-red-500/50 hover:text-red-400 text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded relative z-20"
                                >
                                    Reset Table
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
