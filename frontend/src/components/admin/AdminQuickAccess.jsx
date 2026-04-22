import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    Printer, 
    Eye, 
    Plus, 
    Smartphone, 
    RotateCcw, 
    X,
    Clock
} from 'lucide-react';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

const StatusLegend = () => (
    <div className="flex flex-wrap items-center gap-6 py-2 mb-8 border-b border-white/5 pb-6">
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10 border border-white/20"></div>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Blank</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Running</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Printed</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]"></div>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Paid</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-nizam-gold shadow-[0_0_10px_rgba(198,168,124,0.3)]"></div>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Ordering</span>
        </div>
    </div>
);

const TableTile = ({ tableId, getTableStatus, getRemainingPrepTime, selectedTable, setSelectedTable }) => {
    const { status, session, assistance } = getTableStatus(tableId);
    
    let bgColor = "bg-white/5 border-white/10 hover:bg-white/10";
    let statusColor = "bg-white/20";
    let glow = "";
    let textColor = "text-white/40";

    if (status === 'ordering') {
        bgColor = "bg-nizam-gold/10 border-nizam-gold/40 ring-1 ring-nizam-gold/20";
        textColor = "text-nizam-gold";
        statusColor = "bg-nizam-gold";
        glow = "shadow-[0_0_20px_rgba(198,168,124,0.15)]";
    } else if (status === 'occupied') {
        bgColor = "bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20";
        textColor = "text-blue-400";
        statusColor = "bg-blue-500";
        glow = "shadow-[0_0_20px_rgba(59,130,246,0.15)]";
    } else if (status === 'billing') {
        bgColor = "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20";
        textColor = "text-emerald-400";
        statusColor = "bg-emerald-500";
        glow = "shadow-[0_0_25px_rgba(16,185,129,0.2)]";
    }

    return (
        <div 
            onClick={() => (session || assistance) && setSelectedTable({ tableId, status, session, assistance })}
            className={`group relative aspect-square rounded-[2rem] border transition-all duration-500 hover:scale-[1.05] cursor-pointer flex flex-col items-center justify-center gap-3 ${bgColor} ${glow}`}
        >
            {/* Status Dot */}
            <div className={`absolute top-4 left-4 w-2 h-2 rounded-full ${statusColor} ${status !== 'free' ? 'animate-pulse' : ''}`}></div>

            {/* Prep Timer Indicator */}
            {status === 'occupied' && session?.prepTime && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/5">
                    <Clock size={10} className={getRemainingPrepTime(session) < 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'} />
                    <span className={`text-[10px] font-black ${getRemainingPrepTime(session) < 5 ? 'text-red-500' : 'text-blue-400'}`}>
                        {getRemainingPrepTime(session)}m
                    </span>
                </div>
            )}

            {/* Table ID */}
            <div className="flex flex-col items-center">
                <span className={`text-2xl font-bold font-serif italic ${textColor}`}>
                    {tableId.replace(/^[TBC]/, '').replace(/^0+/, '')}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${status === 'free' ? 'text-white/10 group-hover:text-white/30' : 'text-white/30'}`}>
                    Unit
                </span>
            </div>

            {/* Action Indicator Row */}
            <div className="flex gap-2">
                {assistance && (
                    <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-lg animate-bounce">
                        <Bell size={10} strokeWidth={3} />
                    </div>
                )}
                {status === 'billing' && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                        <Printer size={10} strokeWidth={3} />
                    </div>
                )}
                {(status === 'occupied' || status === 'ordering') && (
                    <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg">
                        <Eye size={10} strokeWidth={3} />
                    </div>
                )}
            </div>

            {/* Selection Highlight */}
            {selectedTable?.tableId === tableId && (
                <div className="absolute inset-0 rounded-[2rem] border-2 border-nizam-gold z-10 pointer-events-none shadow-[inset_0_0_20px_rgba(198,168,124,0.2)]"></div>
            )}
        </div>
    );
};

export default function AdminQuickAccess({ 
    newOrders, 
    sessions, 
    assistanceRequests, 
    updateStatus, 
    printReceipt,
    clearTable,
    updateAssistance,
    onViewChange
}) {
    const [selectedTable, setSelectedTable] = useState(null);
    const [now, setNow] = useState(() => Date.now());
    const [isMoveKotEnabled, setIsMoveKotEnabled] = useState(false);
    const [orderTypeMode, setOrderTypeMode] = useState('delivery'); // 'delivery' | 'takeaway'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 10000); // Pulse every 10s
        return () => clearInterval(timer);
    }, []);

    const zones = [
        { name: 'A/C DINING', prefix: 'T', count: 22 },
        { name: 'NON A/C ZONE', prefix: 'B', count: 9 },
        { name: 'LOUNGE BAR', prefix: 'C', count: 8 }
    ];

    const getTableStatus = (tableId) => {
        const assistance = (assistanceRequests || []).find(r => r.tableId === tableId && r.status === 'pending');
        const session = (sessions || []).find(s => s.tableId === tableId && s.status !== 'completed' && s.status !== 'archived');
        const newOrder = (newOrders || []).find(o => o.tableId === tableId && (o.status === 'new' || o.status === 'pending'));

        // Prioritize active billing sessions
        if (session?.status === 'billed') return { status: 'billing', session, assistance };
        if (session) return { status: 'occupied', session, assistance };
        
        // Treat as ordering if there's a new request
        if (newOrder) return { status: 'ordering', session: newOrder, assistance };
        
        // Final fallback: check if there's assistance even if table is 'free'
        return { status: 'free', session: null, assistance };
    };

    const getRemainingPrepTime = (session) => {
        if (!session?.prepTime || !session?.prepStartedAt) return null;
        const start = new Date(session.prepStartedAt).getTime();
        const durationMs = session.prepTime * 60000;
        const elapsed = now - start;
        const remainingMs = durationMs - elapsed;
        return Math.max(0, Math.ceil(remainingMs / 60000));
    };

    const handleSetPrepTime = async (id, minutes, type = 'session') => {
        try {
            await fetch(`${API_URL}/orders/${id}/prep-time`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minutes, type })
            });
        } catch (error) {
            console.error('POS Error:', error);
        }
    };

    return (
        <div className="animate-in fade-in duration-700">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => onViewChange?.('pos')}
                        className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all shadow-[0_10px_30px_rgba(220,38,38,0.2)] active:scale-95 group border border-white/10"
                    >
                        <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">New Order</span>
                    </button>
                    
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-nizam-gold transition-colors">
                            <Plus size={16} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="SEARCH BILL/TABLE" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-[11px] font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-nizam-gold/40 w-44 transition-all focus:w-64"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4 py-2 px-5 bg-white/5 rounded-2xl border border-white/10">
                        <RotateCcw size={14} className="text-white/20" />
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Move KOT</span>
                        <div 
                            onClick={() => setIsMoveKotEnabled(!isMoveKotEnabled)}
                            className={`w-10 h-5 rounded-full relative p-1 cursor-pointer transition-colors ${isMoveKotEnabled ? 'bg-emerald-500/20' : 'bg-white/10'}`}
                        >
                            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isMoveKotEnabled ? 'bg-emerald-500 ml-5' : 'bg-white/20'}`}></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                        <button 
                            onClick={() => setOrderTypeMode('delivery')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${orderTypeMode === 'delivery' ? 'bg-red-600/20 text-red-500 border-red-500/20' : 'text-white/20 border-transparent hover:bg-white/5'}`}
                        >
                            Delivery
                        </button>
                        <button 
                            onClick={() => setOrderTypeMode('takeaway')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${orderTypeMode === 'takeaway' ? 'bg-blue-600/20 text-blue-500 border-blue-500/20' : 'text-white/20 border-transparent hover:bg-white/5'}`}
                        >
                            Take Away
                        </button>
                    </div>
                </div>
            </div>

            <StatusLegend />

            {/* Zones Grid */}
            <div className="space-y-16 pb-20">
                {zones.map(zone => (
                    <div key={zone.name} className="relative">
                        <div className="flex items-center gap-6 mb-8">
                            <h3 className="text-[11px] font-black text-nizam-gold uppercase tracking-[0.4em] italic whitespace-nowrap">
                                {zone.name}
                            </h3>
                            <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent"></div>
                            <span className="text-[10px] text-white/10 font-bold uppercase whitespace-nowrap tracking-widest">{zone.count} Units</span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 xl:grid-cols-11 gap-6">
                            {Array.from({ length: zone.count }, (_, i) => {
                                const tableId = `${zone.prefix}${String(i + 1).padStart(2, '0')}`;
                                // Basic filtering: if query exists, only show matching table IDs
                                if (searchQuery && !tableId.toLowerCase().includes(searchQuery.toLowerCase())) return null;
                                
                                return (
                                    <TableTile 
                                        key={tableId} 
                                        tableId={tableId} 
                                        getTableStatus={getTableStatus} 
                                        getRemainingPrepTime={getRemainingPrepTime}
                                        selectedTable={selectedTable}
                                        setSelectedTable={setSelectedTable}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Selection Drawer */}
            {selectedTable && (
                <div className="fixed inset-0 bg-[#062c23]/80 backdrop-blur-xl z-50 flex items-center justify-end p-4">
                    <div className="w-full max-w-lg h-[92vh] bg-[#0c0d0c] border border-white/10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
                        <div className="p-10 border-b border-white/5 flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <span className="text-4xl font-serif font-bold text-white italic">{selectedTable.tableId.replace(/^[TBC]/, '').replace(/^0+/, '')}</span>
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-nizam-gold uppercase tracking-[0.3em] mb-1">Seating Unit</h3>
                                    <p className="text-2xl font-serif text-white font-bold italic">{selectedTable.status === 'free' ? 'Available' : 'Active Session'}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTable(null)} className="p-4 bg-white/5 rounded-2xl text-white/20 hover:bg-white/10 hover:text-white transition-all border border-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                            {selectedTable.assistance && (
                                <div className="p-8 bg-red-600/10 border border-red-600/30 rounded-[2rem] flex items-center justify-between shadow-2xl">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-inner animate-pulse">
                                            <Bell size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Immediate Assistance</p>
                                            <p className="text-xs text-red-500/60 font-medium italic">Guest requested concierge support</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            updateAssistance(selectedTable.assistance.id, 'attended');
                                            setSelectedTable(null);
                                        }}
                                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95"
                                    >
                                        Resolve
                                    </button>
                                </div>
                            )}

                            {selectedTable.session && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] whitespace-nowrap">Order Brief</h4>
                                        <div className="h-px w-full bg-white/5"></div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {selectedTable.session.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xs font-serif text-nizam-gold/60 font-bold italic">
                                                        {item.qty}
                                                    </div>
                                                    <span className="text-[15px] text-white/80 font-serif italic tracking-wide">{item.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-nizam-gold/40">£{(item.price * item.qty).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-10 border-t border-white/10 space-y-4">
                                        <div className="flex justify-between text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">
                                            <span>Subtotal</span>
                                            <span>£{Number(selectedTable.session.subtotal).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[10px] font-black text-nizam-gold uppercase tracking-[0.5em] italic">Gross Total</span>
                                            <span className="text-5xl font-serif font-bold text-nizam-gold italic tracking-tighter">
                                                £{Number(selectedTable.session.finalTotal).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedTable.session && selectedTable.status === 'occupied' && (
                                <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Kitchen Preparation</h4>
                                                <p className="text-sm font-serif text-white/80 italic">
                                                    {selectedTable.session.prepTime 
                                                        ? `${getRemainingPrepTime(selectedTable.session)} minutes remaining` 
                                                        : 'Set estimated preparation duration'}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedTable.session.prepTime && (
                                            <div className={`text-2xl font-serif font-bold italic ${getRemainingPrepTime(selectedTable.session) < 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                                                {getRemainingPrepTime(selectedTable.session)}M
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[10, 15, 20].map(mins => (
                                            <button 
                                                key={mins}
                                                onClick={() => handleSetPrepTime(selectedTable.session.id, mins)}
                                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTable.session.prepTime === mins ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'}`}
                                            >
                                                +{mins} Min
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-10 bg-white/5 border-t border-white/5 grid grid-cols-2 gap-6">
                            {selectedTable.status === 'billing' ? (
                                <button 
                                    onClick={() => {
                                        updateStatus(selectedTable.session.id, 'completed');
                                        setSelectedTable(null);
                                    }}
                                    className="col-span-2 py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl active:scale-[0.98] transition-all border border-white/10"
                                >
                                    Reconcile & Settle
                                </button>
                            ) : selectedTable.session ? (
                                <button 
                                    onClick={() => {
                                        updateStatus(selectedTable.session.id, 'billed');
                                        setSelectedTable(null);
                                    }}
                                    className="py-6 bg-nizam-gold text-black rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl active:scale-[0.98] transition-all"
                                >
                                    Push To Billing
                                </button>
                            ) : null}

                            {selectedTable.session && (
                                <button 
                                    onClick={() => printReceipt(selectedTable.session)}
                                    className="py-6 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white/10 transition-all"
                                >
                                    Reprint Receipt
                                </button>
                            ) || (
                                <button 
                                    onClick={() => clearTable(selectedTable.tableId)}
                                    className="col-span-2 py-6 bg-red-600/10 border border-red-600/20 text-red-500 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-red-600/20 transition-all"
                                >
                                    Emergency Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
