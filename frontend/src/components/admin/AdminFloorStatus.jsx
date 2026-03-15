import React from 'react';
import { Sparkles, UtensilsCrossed } from 'lucide-react';

export default function AdminFloorStatus({ orders: sessions, updateStatus, printReceipt }) {
    const confirmedSessions = sessions.filter(s => s.status === 'confirmed');

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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-serif text-white mb-2 tracking-wide">Floor Management</h2>
                    <p className="text-nizam-textMuted max-w-lg leading-relaxed text-sm">
                        Oversee {displaySessions.length} active dining tables. Monitor orders and coordinate service.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-[#0d2a1f] border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 opacity-75 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{displaySessions.length} TABLES DINING</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                {displaySessions.map((session, idx) => {
                    const isVip = session.tableId.toString().toUpperCase().includes('VIP');

                    return (
                        <div key={session.tableId} className={`rounded-xl border p-6 flex flex-col shadow-2xl transition-all hover:scale-[1.01] ${isVip ? 'bg-gradient-to-br from-[#2a2410] to-[#1a1608] border-nizam-gold/40' : 'bg-[#0d0f0e] border-white/5'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className={`flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] mb-1 ${isVip ? 'text-nizam-gold' : 'text-nizam-textMuted'}`}>
                                        {isVip ? <><Sparkles className="w-3 h-3" /> VIP SUITE</> : 'FLOOR TABLE'}
                                    </div>
                                    <h3 className={`text-3xl font-serif ${isVip ? 'text-nizam-gold' : 'text-white'}`}>{session.tableId}</h3>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${isVip ? 'text-nizam-gold/50 border-nizam-gold/20' : 'text-emerald-500 border-emerald-500/10 bg-emerald-500/5'}`}>
                                    {isVip ? 'PRIORITY' : 'IN SERVICE'}
                                </span>
                            </div>

                            <div className={`flex-1 space-y-3 mb-8 p-4 rounded-lg shadow-inner max-h-48 overflow-y-auto ${isVip ? 'bg-black/40 border border-nizam-gold/10' : 'bg-black/20 border border-white/5 scrollbar-thin scrollbar-thumb-white/10'}`}>
                                {session.shards.map((shard, shardIdx) => (
                                    <div key={shard.id} className="mb-4 last:mb-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest border-b pb-1 flex-1 ${isVip ? 'text-nizam-gold/60 border-nizam-gold/20' : 'text-nizam-textMuted border-white/5'}`}>
                                                Order Round {shardIdx + 1}
                                            </span>
                                        </div>
                                        {shard.items.map((item, i) => (
                                            <div key={i} className={`flex justify-between items-center text-xs pb-1.5 last:pb-0 ${isVip ? 'text-nizam-gold/80 italic' : 'text-nizam-textMuted'}`}>
                                                <span className="truncate pr-2">{item.name}</span>
                                                <span className={`font-bold ${isVip ? 'text-nizam-gold' : 'text-white'}`}>x{item.qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className={`flex justify-between items-end mb-6 pt-4 border-t ${isVip ? 'border-nizam-gold/20' : 'border-white/5'}`}>
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isVip ? 'text-nizam-gold/60' : 'text-nizam-textMuted'} block`}>SUBTOTAL: £{(session.subtotal || 0).toFixed(2)}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isVip ? 'text-nizam-gold/60' : 'text-nizam-textMuted'} block`}>SERVICE: £{(session.serviceCharge || 0).toFixed(2)}</span>
                                </div>
                                <span className={`text-2xl font-bold ${isVip ? 'text-nizam-gold' : 'text-emerald-400'}`}>£{(session.finalTotal || 0).toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <button onClick={() => printReceipt(session)} className={`py-3 px-2 rounded font-bold text-[10px] sm:text-xs tracking-wider border transition-all uppercase text-center ${isVip ? 'border-nizam-gold/30 text-nizam-gold hover:bg-nizam-gold/10 bg-black/20' : 'border-white/10 text-nizam-textMuted hover:text-white hover:bg-white/10 bg-white/5'}`}>
                                    Print Receipt
                                </button>
                                <button onClick={() => session.ids.forEach(id => updateStatus(id, 'billed'))} className={`py-3 px-2 rounded font-bold text-[10px] sm:text-xs tracking-wider transition-all uppercase text-center shadow-lg ${isVip ? 'bg-gradient-to-b from-nizam-gold to-[#9e8020] text-black hover:brightness-110' : 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-100 hover:from-emerald-600'}`}>
                                    Settle Table
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Efficiency Stats Panel (Visual Only) */}
                <div className="bg-gradient-to-br from-[#0a1f18] to-[#040d0a] rounded-xl border border-emerald-900/50 p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                        <UtensilsCrossed className="w-48 h-48 text-emerald-500" />
                    </div>
                    <div>
                        <Sparkles className="w-6 h-6 text-emerald-400 mb-6 animate-pulse" />
                        <h3 className="text-xl font-serif text-white mb-2 tracking-tight">Service Efficiency</h3>
                        <p className="text-emerald-100/50 text-xs leading-relaxed max-w-[90%]">
                            Table turnover rate is up 12% today. Average session duration: 42 mins.
                        </p>
                    </div>

                    <div className="mt-12 space-y-5 relative z-10">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-black tracking-widest text-emerald-500/80 uppercase">PERFORMANCE INDEX</span>
                            <span className="text-2xl font-serif text-white opacity-90">0.96</span>
                        </div>
                        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-[96%] shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] font-bold text-nizam-textMuted uppercase tracking-tighter">Active Slots</span>
                            <span className="text-lg font-bold text-white tabular-nums">{displaySessions.length} / 24</span>
                        </div>
                    </div>
                </div>

                {displaySessions.length === 0 && (
                     <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-2xl bg-black/20">
                        <UtensilsCrossed className="w-12 h-12 text-white/10 mx-auto mb-6 opacity-30" />
                        <p className="text-nizam-textMuted font-serif italic text-xl">Floors are clear.</p>
                        <p className="text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mt-4">NO ACTIVE DINING SESSIONS</p>
                    </div>
                )}
            </div>
        </div>
    );
}
