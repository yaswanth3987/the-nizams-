import React from 'react';
import { Sparkles, UtensilsCrossed, Monitor } from 'lucide-react';

export default function AdminFloorStatus({ orders: sessions, updateStatus, printReceipt }) {
    const confirmedSessions = sessions.filter(s => (s.status === 'confirmed' || s.status === 'active') && s.orderType !== 'takeaway');

    // Group multiple sessions for the same table into one UI card
    const groupedSessions = confirmedSessions.reduce((acc, current) => {
        const tableId = current.tableId;
        if (!acc[tableId]) {
            acc[tableId] = {
                tableId: current.tableId,
                status: 'confirmed',
                subtotal: current.subtotal || 0,
                serviceCharge: current.serviceCharge || 0,
                finalTotal: current.finalTotal || 0,
                orderType: current.orderType,
                customerName: current.customerName,
                phone: current.phone,
                ids: [current.id],
                shards: [current],
                items: [...current.items] // For synthetic receipt printing
            };
        } else {
            const existing = acc[tableId];
            existing.subtotal += (current.subtotal || 0);
            existing.serviceCharge += (current.serviceCharge || 0);
            existing.finalTotal += (current.finalTotal || 0);
            existing.ids.push(current.id);
            existing.shards.push(current);

            // Merge items just for the synthetic receipt payload
            current.items.forEach(newItem => {
                const found = existing.items.find(i => i.name === newItem.name);
                if (found) {
                    found.qty += newItem.qty;
                } else {
                    existing.items.push({ ...newItem });
                }
            });
        }
        return acc;
    }, {});

    const displaySessions = Object.values(groupedSessions);
    
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-serif text-white mb-2 tracking-wide uppercase">Floor Management</h2>
                    <p className="text-nizam-textMuted max-w-lg leading-relaxed text-sm italic">
                        Oversee {displaySessions.length} active dining tables. Monitor orders and coordinate service in real-time.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-nizam-card/50 border border-nizam-border/30 px-6 py-2 rounded-xl text-emerald-400 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{displaySessions.length} TABLES LIVE</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                {displaySessions.map((session, idx) => {
                    const isVip = session.tableId?.toString().toUpperCase().includes('VIP');

                    return (
                        <div key={session.tableId} className={`rounded-2xl border-2 p-8 flex flex-col shadow-2xl transition-all hover:scale-[1.02] hover:-translate-y-1 group relative overflow-hidden ${isVip ? 'bg-gradient-to-br from-nizam-card to-[#2a2410]/20 border-nizam-gold/40' : 'bg-nizam-card border-nizam-border/30'}`}>
                            {isVip && <div className="absolute top-0 right-0 w-24 h-24 bg-nizam-gold/5 blur-3xl -mr-8 -mt-8 rounded-full"></div>}
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div>
                                    <div className={`flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] mb-2 ${isVip ? 'text-nizam-gold' : 'text-nizam-textMuted'}`}>
                                        {isVip ? <><Sparkles className="w-3 h-3 animate-pulse" /> VIP SUITE</> : 'FLOOR TABLE'}
                                    </div>
                                    <h3 className={`text-5xl font-serif tracking-tighter ${isVip ? 'text-nizam-gold font-bold' : 'text-white'}`}>
                                        {session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY' ? 'Takeaway' : session.tableId}
                                    </h3>
                                    {(session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY') && (
                                        <p className="text-[10px] font-bold text-nizam-textMuted uppercase mt-2 tracking-widest">
                                            {session.customerName} • {session.phone}
                                        </p>
                                    )}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded border shadow-sm ${isVip ? 'text-nizam-gold/80 border-nizam-gold/30 bg-nizam-gold/5' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'}`}>
                                    {isVip ? 'PRIORITY' : 'IN SERVICE'}
                                </span>
                            </div>

                            <div className={`flex-1 space-y-4 mb-8 p-5 rounded-xl shadow-inner max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-nizam-gold/10 ${isVip ? 'bg-black/40 border border-nizam-gold/10' : 'bg-nizam-dark/40 border border-nizam-border/20'}`}>
                                {session.shards.map((shard, shardIdx) => (
                                    <div key={shard.id} className="mb-6 last:mb-0">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] border-b pb-1.5 flex-1 ${isVip ? 'text-nizam-gold/40 border-nizam-gold/20' : 'text-nizam-gold/30 border-white/5'}`}>
                                                Order Round {shardIdx + 1}
                                            </span>
                                        </div>
                                        {shard.items.map((item, i) => (
                                            <div key={i} className={`flex justify-between items-center text-xs pb-2 last:pb-0 font-medium ${isVip ? 'text-nizam-gold/90' : 'text-nizam-text'}`}>
                                                <span className="truncate pr-4">{item.name}</span>
                                                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isVip ? 'bg-nizam-gold/20 text-nizam-gold' : 'bg-white/5 text-white'}`}>x{item.qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className={`flex justify-between items-end mb-8 pt-6 border-t relative z-10 ${isVip ? 'border-nizam-gold/20' : 'border-nizam-border/30'}`}>
                                <div className="space-y-1">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isVip ? 'text-nizam-gold/50' : 'text-nizam-textMuted'} block`}>SUB: £{Number(session.subtotal || 0).toFixed(2)}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isVip ? 'text-nizam-gold/50' : 'text-nizam-textMuted'} block`}>SVC: £{Number(session.serviceCharge || 0).toFixed(2)}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[8px] font-black tracking-widest ${isVip ? 'text-nizam-gold' : 'text-nizam-textMuted'} uppercase mb-1 block`}>Table Total</span>
                                    <span className={`text-3xl font-mono font-bold tracking-tighter ${isVip ? 'text-nizam-gold' : 'text-emerald-400'}`}>£{Number(session.finalTotal || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
                                <button 
                                    onClick={() => printReceipt(session)} 
                                    className={`py-3.5 px-2 rounded-xl font-black text-[10px] tracking-[0.2em] border transition-all uppercase text-center ${isVip ? 'border-nizam-gold/30 text-nizam-gold hover:bg-nizam-gold hover:text-black' : 'border-nizam-border/40 text-nizam-textMuted hover:text-white hover:bg-nizam-dark bg-nizam-dark/50'}`}
                                >
                                    Receipt
                                </button>
                                <button 
                                    onClick={() => session.ids.forEach(id => updateStatus(id, 'billed'))} 
                                    className={`py-3.5 px-2 rounded-xl font-black text-[10px] tracking-[0.2em] transition-all uppercase text-center shadow-xl ${isVip ? 'bg-nizam-gold text-black hover:bg-white' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20'}`}
                                >
                                    Settle
                                </button>
                                <button 
                                    onClick={() => {
                                        if (confirm(`Cancel all active orders for Table ${session.tableId}?`)) {
                                            session.ids.forEach(id => {
                                                const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';
                                                fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
                                            });
                                        }
                                    }}
                                    className="col-span-2 py-3 rounded-xl font-bold text-[9px] tracking-[0.3em] transition-all uppercase text-center border border-red-900/40 text-red-500/60 hover:text-white hover:bg-red-600 bg-black/40 mt-2"
                                >
                                    Void Order
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Efficiency Stats Panel */}
                <div className="bg-nizam-card rounded-2xl border-2 border-nizam-gold/20 p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-nizam-gold/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-nizam-gold/10 transition-all duration-1000"></div>
                    <div className="relative z-10">
                        <Monitor className="w-10 h-10 text-nizam-gold mb-8 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                        <h3 className="text-2xl font-serif text-white mb-3 tracking-tight uppercase">Live Pulse</h3>
                        <p className="text-nizam-textMuted text-[11px] leading-relaxed max-w-xs font-medium italic">
                            Real-time floor occupancy and service performance tracking for today's session.
                        </p>
                    </div>

                    <div className="mt-12 space-y-6 relative z-10">
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[10px] font-black tracking-[0.2em] text-nizam-gold uppercase">Efficiency Rating</span>
                                <span className="text-2xl font-serif text-white opacity-90">96.4%</span>
                            </div>
                            <div className="h-1.5 w-full bg-nizam-dark border border-nizam-border/30 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-nizam-gold rounded-full w-[96.4%] shadow-[0_0_12px_rgba(198,168,124,0.3)]"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-nizam-border/20">
                            <span className="text-[10px] font-bold text-nizam-textMuted uppercase tracking-[0.2em]">Table Load</span>
                            <span className="text-xl font-bold text-white tabular-nums">{displaySessions.length} <span className="text-[10px] text-nizam-textMuted">/ 24</span></span>
                        </div>
                    </div>
                </div>

                {displaySessions.length === 0 && (
                     <div className="col-span-full py-40 text-center border-2 border-dashed border-nizam-border/30 rounded-2xl bg-nizam-card/20 shadow-inner">
                        <UtensilsCrossed className="w-16 h-16 text-nizam-gold/10 mx-auto mb-8 animate-pulse" />
                        <p className="text-nizam-textMuted font-serif italic text-2xl mb-2">The floor is quiet.</p>
                        <p className="text-[10px] font-black tracking-[0.4em] text-nizam-gold/20 uppercase">NO ACTIVE DINING SESSIONS RECORDED</p>
                    </div>
                )}
            </div>
        </div>
    );
}
