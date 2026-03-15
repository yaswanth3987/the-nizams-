import React from 'react';
import { Printer, RefreshCw, Archive } from 'lucide-react';

export default function AdminCompletedView({ orders: sessions, printReceipt, clearTable }) {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-serif text-white mb-2 tracking-wide">Historical Logs</h2>
                    <p className="text-nizam-textMuted max-w-lg leading-relaxed text-sm">
                        Audit trail of settled table sessions. Archive or reset tables to prepare for new guests.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-[#1c1e1c] border border-white/5 px-4 py-2 rounded-full text-nizam-textMuted">
                    <Archive className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{completedSessions.length} ARCHIVED</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {completedSessions.map((session) => (
                    <div key={session.id} className="bg-[#0d0f0e] rounded-xl border border-white/5 p-6 flex flex-col shadow-lg hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50">Table {session.tableId}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-full">
                                SETTLED
                            </span>
                        </div>
                        
                        <div className="mb-6 flex flex-col">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-nizam-textMuted mb-1">Final Total Paid</span>
                            <h3 className="text-2xl font-mono text-white/40 line-through decoration-white/10">£{session.finalTotal.toFixed(2)}</h3>
                        </div>

                        <div className="flex-1 space-y-2 mb-8 opacity-40 grayscale">
                             {session.items.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex justify-between text-[10px] border-b border-white/5 pb-1">
                                    <span>{item.qty}x {item.name}</span>
                                </div>
                             ))}
                             {session.items.length > 3 && <p className="text-[8px] italic">+{session.items.length - 3} more items...</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <button onClick={() => printReceipt(session)} className="py-2.5 px-3 rounded-lg font-bold text-[10px] tracking-wider bg-white/5 text-nizam-textMuted hover:text-white transition-all uppercase border border-white/5">
                                <Printer className="w-4 h-4 mx-auto mb-1 opacity-50" />
                                Receipt
                            </button>
                            <button onClick={() => clearTable(session.tableId)} className="py-2.5 px-3 rounded-lg font-bold text-[10px] tracking-wider bg-emerald-950/20 border border-emerald-900/20 text-emerald-500 hover:bg-emerald-800 hover:text-white transition-all uppercase">
                                <RefreshCw className="w-4 h-4 mx-auto mb-1 opacity-50" />
                                Reset
                            </button>
                        </div>
                    </div>
                ))}

                {completedSessions.length === 0 && (
                     <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-2xl bg-black/10">
                        <Archive className="w-12 h-12 text-white/5 mx-auto mb-4" />
                        <p className="text-nizam-textMuted font-serif italic text-xl">No historical logs today.</p>
                        <p className="text-[9px] font-bold tracking-[0.3em] text-white/10 uppercase mt-4">COMPLETED SESSIONS WILL APPEAR HERE</p>
                    </div>
                )}
            </div>
        </div>
    );
}
