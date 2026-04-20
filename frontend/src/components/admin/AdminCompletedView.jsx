import React from 'react';
import { Printer, RefreshCw, Archive, History } from 'lucide-react';

export default function AdminCompletedView({ orders: sessions, printReceipt, clearTable }) {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 font-sans">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Settled Ledger</h2>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                        Audit trail of settled table sessions. Archive or reset tables to prepare for new guests.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-accent/60">
                    <History className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{completedSessions.length} Cycles Logged</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {completedSessions.map((session) => (
                    <div key={session.id} className="bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col shadow-2xl relative group h-[320px]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-white italic group-hover:text-accent transition-colors">Table {session.tableId}</h3>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">LOG REF #{session.id.toString().slice(-4)}</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                SETTLED
                            </span>
                        </div>

                        <div className="mb-6 space-y-1">
                             <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Final Value</p>
                             <h3 className="text-4xl font-serif font-bold text-accent italic">
                                 £{Number(session.finalTotal).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-auto">
                            <button 
                                onClick={() => printReceipt(session)} 
                                className="py-3 rounded-xl font-bold text-xs bg-white/5 text-white/60 uppercase border border-white/10 hover:bg-white hover:text-black transition-all"
                            >
                                Receipt
                            </button>
                            <button 
                                onClick={() => clearTable(session.tableId)} 
                                className="py-3 rounded-xl font-bold text-xs bg-accent text-black uppercase shadow-lg hover:bg-white transition-all"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                ))}

                {completedSessions.length === 0 && (
                    <div className="col-span-full py-40 text-center border border-white/5 rounded-[2rem] bg-[#111311] shadow-inner flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                            <Archive size={32} className="text-white/10" />
                        </div>
                        <p className="text-white/40 font-serif italic text-4xl font-bold mb-4">No archived logs.</p>
                        <p className="text-[10px] font-black tracking-[0.5em] text-white/10 uppercase">JOURNAL IS CURRENTLY VACANT</p>
                    </div>
                )}
            </div>
        </div>
    );
}
