import React from 'react';
import { Printer, RefreshCw, Archive, History } from 'lucide-react';

export default function AdminCompletedView({ orders: sessions, printReceipt, clearTable }) {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-serif text-white mb-2 tracking-wide uppercase">Historical Logs</h2>
                    <p className="text-nizam-textMuted max-w-lg leading-relaxed text-sm italic">
                        Audit trail of settled table sessions. Archive or reset tables to prepare for new guests.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-nizam-card/50 border border-nizam-border/30 px-4 py-2 rounded-full text-nizam-textMuted group hover:border-nizam-gold/30 transition-all">
                    <Archive className="w-3 h-3 group-hover:text-nizam-gold transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{completedSessions.length} ARCHIVED TODAY</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {completedSessions.map((session) => (
                    <div key={session.id} className="bg-nizam-card rounded-xl border border-nizam-border/30 p-6 flex flex-col shadow-2xl hover:border-nizam-gold/20 transition-all group border-l-4 border-l-emerald-900/40">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-nizam-gold flex items-center gap-2">
                                    <History className="w-3 h-3 opacity-50" />
                                    {session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY' ? 'Takeaway' : `Table ${session.tableId}`}
                                </span>
                                {(session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY') && (
                                    <span className="text-[9px] uppercase font-mono text-nizam-textMuted tracking-wider mt-1 group-hover:text-white transition-colors">
                                        {session.customerName} • {session.phone}
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded">
                                SETTLED
                            </span>
                        </div>
                        
                        <div className="mb-6 flex flex-col bg-nizam-dark/40 p-4 rounded-lg border border-nizam-border/20 shadow-inner">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-nizam-textMuted mb-2 opacity-50">FINAL TOTAL PAID</span>
                            <h3 className="text-2xl font-bold text-white/50 line-through decoration-white/20">£{Number(session.finalTotal || 0).toFixed(2)}</h3>
                            <p className="text-[10px] text-emerald-500/60 mt-1 font-medium tracking-tight">Payment Verified & Settled</p>
                        </div>

                        <div className="flex-1 space-y-2 mb-8 opacity-30 grayscale group-hover:opacity-60 transition-all overflow-hidden max-h-[100px]">
                            <p className="text-[9px] font-bold text-nizam-gold/50 uppercase tracking-widest mb-2 border-b border-nizam-gold/10 pb-1">Order Summary</p>
                             {session.items.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex justify-between text-[11px] border-b border-white/5 pb-1 last:border-0">
                                    <span className="text-white/80">{item.qty}x {item.name}</span>
                                </div>
                             ))}
                             {session.items.length > 3 && <p className="text-[9px] italic text-nizam-textMuted">+{session.items.length - 3} more items recorded</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-auto border-t border-nizam-border/20 pt-6">
                            <button 
                                onClick={() => printReceipt(session)} 
                                className="py-2.5 px-3 rounded-lg font-bold text-[10px] tracking-widest bg-nizam-dark/50 text-nizam-textMuted hover:text-white hover:bg-nizam-dark transition-all uppercase border border-nizam-border/30 flex flex-col items-center gap-1 group/btn"
                            >
                                <Printer className="w-4 h-4 opacity-50 group-hover/btn:text-nizam-gold transition-colors" />
                                Receipt
                            </button>
                            <button 
                                onClick={() => clearTable(session.tableId)} 
                                className="py-2.5 px-3 rounded-lg font-bold text-[10px] tracking-widest bg-emerald-950/20 border border-emerald-900/30 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all uppercase flex flex-col items-center gap-1 group/btn"
                            >
                                <RefreshCw className="w-4 h-4 opacity-50 group-hover/btn:animate-spin" />
                                Reset Table
                            </button>
                        </div>
                    </div>
                ))}

                {completedSessions.length === 0 && (
                     <div className="col-span-full py-40 text-center border-2 border-dashed border-nizam-border/30 rounded-2xl bg-nizam-card/20 shadow-inner">
                        <div className="w-20 h-20 bg-nizam-card rounded-full flex items-center justify-center mx-auto mb-8 border border-nizam-border/50">
                            <Archive className="w-10 h-10 text-nizam-gold opacity-10" />
                        </div>
                        <p className="text-nizam-textMuted font-serif italic text-2xl mb-2">No historical logs found.</p>
                        <p className="text-[10px] font-bold tracking-[0.4em] text-nizam-gold/20 uppercase">SYSTEM WAITING FOR SETTLED SESSIONS</p>
                    </div>
                )}
            </div>
        </div>
    );
}
