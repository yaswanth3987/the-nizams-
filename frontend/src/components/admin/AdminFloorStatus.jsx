import React from 'react';
import { Sparkles, UtensilsCrossed, Monitor } from 'lucide-react';

export default function AdminFloorStatus({ orders: sessions, updateStatus, API_URL }) {
    const confirmedSessions = sessions.filter(s => ['confirmed', 'active', 'ready', 'served'].includes(s.status) && s.orderType !== 'takeaway');

    const displaySessions = confirmedSessions;
    
    return (
        <div className="flex flex-col h-full animate-in fade-in duration-700 font-sans">
            <div className="px-10 py-12">
                <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Floor Operation</h2>
                <p className="text-white/60 max-w-xl text-sm leading-relaxed">
                    Managing {displaySessions.length} active dining sessions with real-time service coordination.
                </p>
            </div>

            <div className="flex-1 px-10 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {displaySessions.map((session, idx) => {
                        const isVip = session.tableId?.toString().toUpperCase().includes('VIP');
                        const isReady = session.status === 'ready';
                        const isServed = session.status === 'served';

                        return (
                            <div key={session.id} className={`rounded-[40px] border p-8 flex flex-col shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02] ${isVip ? 'bg-secondary/40 border-accent/30' : 'bg-white/5 border-white/10'}`}>
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${isVip ? 'text-accent' : 'text-white/40'}`}>
                                            {isVip ? 'VIP SUITE' : 'TABLE ID'}
                                        </div>
                                        <h3 className={`text-3xl font-serif font-bold italic ${isVip ? 'text-accent' : 'text-white'}`}>
                                            {isVip ? 'Royal-01' : `Nizam-${session.tableId.toString().padStart(2, '0')}`}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {isReady && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-accent text-black rounded-lg animate-pulse shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                                                Ready to Serve
                                            </span>
                                        )}
                                        {isServed && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500 text-white rounded-lg">
                                                Served
                                            </span>
                                        )}
                                        {!isReady && !isServed && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-white/10 text-white/60 border border-white/10">
                                                Preparing
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar mb-8">
                                    {session.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-white/80 font-serif italic">{item.name}</span>
                                            <span className="text-accent font-bold">x{item.qty}</span>
                                        </div>
                                    ))}
                                </div>

                                    <div className="mt-auto border-t border-white/10 pt-6 mb-8">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Total</span>
                                            <span className="text-2xl font-serif font-bold text-accent glow-gold">£{Number(session.finalTotal).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => updateStatus(session.id, 'billed')}
                                        className="py-4 rounded-2xl font-black text-xs bg-accent text-black uppercase shadow-lg hover:bg-[#FFC300] transition-all glow-gold"
                                    >
                                        Ready Bill
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (confirm('Permanently delete this order from Admin?')) {
                                                fetch(`${API_URL.replace('/api','')}/api/sessions/${session.id}`, { method: 'DELETE' })
                                                    .then(res => {
                                                        if (!res.ok) alert('Delete failed');
                                                    })
                                                    .catch(err => console.error(err));
                                            }
                                        }}
                                        className="py-4 rounded-2xl font-bold text-xs bg-red-900/20 text-red-400 uppercase border border-red-900/30 hover:bg-red-900/40 transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Efficiency Rating Panel */}
                    <div className="bg-secondary/40 border border-accent/20 rounded-3xl p-8 flex flex-col shadow-2xl relative h-[480px]">
                        <div className="mb-8">
                            <Sparkles className="w-10 h-10 text-accent mb-6" />
                            <h3 className="text-3xl font-serif text-white mb-4 font-bold italic">Team Efficiency</h3>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Your floor team is serving at 94% efficiency today. confirmation to bill: 38m.
                            </p>
                        </div>
                        <div className="mt-auto">
                            <div className="h-1 bg-white/10 w-full rounded-full overflow-hidden">
                                <div className="h-full bg-accent w-[94%] shadow-[0_0_20px_rgba(255,215,0,0.5)] glow-gold"></div>
                            </div>
                            <span className="text-[10px] font-bold text-accent/60 uppercase tracking-widest mt-4 block">Peak Performance</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Footer Bar */}
            <div className="fixed bottom-0 left-64 right-0 h-20 bg-primary border-t border-white/10 flex items-center px-12 z-40 backdrop-blur-md">
                <div className="flex justify-between w-full max-w-7xl mx-auto items-center">
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Revenue</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-white/40">£</span>
                                <span className="text-2xl font-serif text-white font-bold italic">142.85</span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Orders</span>
                            <span className="text-2xl font-serif text-white font-bold italic">42</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Service Index</span>
                            <span className="text-2xl font-serif text-accent font-bold italic">0.9</span>
                        </div>
                        <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                            <Monitor className="w-5 h-5 text-accent" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
