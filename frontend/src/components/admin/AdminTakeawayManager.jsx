import React from 'react';
import { Package, CheckCircle, Clock, ShoppingBag, ArrowRight, Printer, Check, CreditCard, XCircle, Utensils } from 'lucide-react';

export default function AdminTakeawayManager({ orders: sessions, updateStatus, printReceipt }) {
    // Filter only takeaway sessions that aren't completed yet
    const takeawayOrders = sessions.filter(s => s.orderType === 'takeaway' && s.status !== 'completed');
    
    // Grouping by status for management columns
    const preparing = takeawayOrders.filter(o => o.status === 'confirmed');
    const billed = takeawayOrders.filter(o => o.status === 'billed');

    if (takeawayOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-1000">
                <div className="w-24 h-24 rounded-full bg-nizam-card border-2 border-nizam-border/30 flex items-center justify-center mb-8 shadow-2xl relative group">
                     <div className="absolute inset-0 bg-nizam-gold/5 blur-2xl rounded-full animate-pulse"></div>
                     <ShoppingBag className="w-10 h-10 text-nizam-gold/20 group-hover:text-nizam-gold transition-colors relative z-10" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-3 uppercase tracking-widest">No Active Takeaways</h3>
                <p className="text-nizam-textMuted max-w-sm text-sm font-medium italic leading-relaxed">The takeaway queue is currently empty. New orders from the POS terminal will propagate here instantly.</p>
            </div>
        );
    }

    const OrderCard = ({ order, nextStatus, nextLabel, nextIcon: NextIcon, color, accentColor }) => (
        <div className="bg-nizam-dark border-2 border-nizam-border/30 rounded-2xl p-6 shadow-2xl flex flex-col relative group hover:border-nizam-gold/20 transition-all active:scale-[0.98]">
            <div className={`absolute top-0 left-0 w-full h-1 bg-${accentColor} opacity-30 rounded-t-2xl`}></div>
            
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h4 className="text-white font-bold text-base tracking-tight uppercase">{order.customerName}</h4>
                    <p className="text-[10px] text-nizam-gold font-mono uppercase tracking-[0.2em] mt-1.5 font-black">TK-{order.id.toString().padStart(3, '0')}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] bg-black/40 text-${accentColor} border border-${accentColor}/20`}>
                    {order.status === 'confirmed' ? 'PREPARING' : 'PENDING PAY'}
                </div>
            </div>

            <div className="space-y-2 mb-8 flex-grow">
                {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-nizam-textMuted items-center border-b border-white/5 pb-2 last:border-0">
                        <span className="flex items-center gap-3">
                            <span className="text-white font-black">{item.qty}x</span>
                            <span className="font-medium">{item.name}</span>
                        </span>
                        <span className="font-mono text-white/30 text-[10px]">£{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-5 mb-6">
                <span className="text-[10px] font-black text-nizam-textMuted uppercase tracking-[0.3em]">Total Receivable</span>
                <span className="text-2xl font-serif text-nizam-gold font-bold">£{order.finalTotal.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => printReceipt(order)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-nizam-border/30 text-nizam-textMuted hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    <Printer className="w-4 h-4" /> REPRINT
                </button>
                <button 
                    onClick={() => updateStatus(order.id, nextStatus)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-${accentColor}/10 border-2 border-${accentColor}/30 text-${accentColor} hover:bg-${accentColor} hover:text-black transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-xl`}
                >
                    <NextIcon className="w-4 h-4" /> {nextLabel}
                </button>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700 pb-12">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-serif text-white tracking-widest mb-3 uppercase font-bold flex items-center gap-4">
                        <ShoppingBag className="text-nizam-gold w-8 h-8" />
                        Takeaway Queue
                    </h2>
                    <p className="text-nizam-textMuted text-sm font-medium italic">High-velocity collection management.</p>
                </div>
                <div className="flex gap-6">
                    <div className="text-center px-6 py-3 bg-nizam-gold/5 border-2 border-nizam-gold/20 rounded-2xl shadow-xl">
                        <span className="block text-[9px] font-black text-nizam-gold/60 tracking-[0.3em] uppercase mb-1">In Preparation</span>
                        <span className="text-3xl font-serif text-white font-bold">{preparing.length}</span>
                    </div>
                    <div className="text-center px-6 py-3 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-2xl shadow-xl">
                        <span className="block text-[9px] font-black text-emerald-500/60 tracking-[0.3em] uppercase mb-1">Awaiting Pay</span>
                        <span className="text-3xl font-serif text-white font-bold">{billed.length}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Column: Food Preparation */}
                <div className="space-y-8">
                    <h3 className="flex items-center gap-4 text-nizam-gold font-black tracking-[0.3em] text-[10px] uppercase mb-8 bg-nizam-gold/10 p-5 rounded-2xl border-2 border-nizam-gold/20 shadow-2xl backdrop-blur-sm">
                        <Clock className="w-5 h-5 animate-pulse" /> KITCHEN: FOOD PREPARATION
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {preparing.map(order => (
                            <OrderCard 
                                key={order.id} 
                                order={order} 
                                nextStatus="billed" 
                                nextLabel="SETTLE" 
                                nextIcon={CreditCard} 
                                accentColor="nizam-gold"
                            />
                        ))}
                        {preparing.length === 0 && (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-nizam-border/30 rounded-3xl bg-black/20">
                                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-black italic">Kitchen pipeline clear</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column: Ready & Payment */}
                <div className="space-y-8">
                    <h3 className="flex items-center gap-4 text-emerald-400 font-black tracking-[0.3em] text-[10px] uppercase mb-8 bg-emerald-500/10 p-5 rounded-2xl border-2 border-emerald-500/20 shadow-2xl backdrop-blur-sm">
                        <CheckCircle className="w-5 h-5" /> COUNTER: COLLECTION & PAY
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {billed.map(order => (
                            <OrderCard 
                                key={order.id} 
                                order={order} 
                                nextStatus="completed" 
                                nextLabel="FINALIZE" 
                                nextIcon={Check} 
                                accentColor="emerald-400"
                            />
                        ))}
                        {billed.length === 0 && (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-nizam-border/30 rounded-3xl bg-black/20">
                                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-black italic">No pending settlements</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="mt-16 p-8 bg-nizam-card border-2 border-nizam-border/30 rounded-3xl flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-nizam-gold/50"></div>
                <div className="w-16 h-16 rounded-2xl bg-nizam-gold/5 border border-nizam-gold/20 flex items-center justify-center text-nizam-gold self-start shrink-0 group-hover:scale-110 transition-transform">
                    <Utensils className="w-8 h-8" />
                </div>
                <div>
                    <h5 className="text-white font-serif text-xl mb-2 uppercase tracking-widest font-bold">Takeaway Isolation Core</h5>
                    <p className="text-[11px] text-nizam-textMuted leading-relaxed max-w-4xl font-medium italic">
                        The Takeaway Manager operates on a dedicated logical shard. Orders processed here are isolated from table-specific session locks, ensuring high-throughput operations during peak hours without impacting floor management metrics.
                    </p>
                </div>
            </div>
        </div>
    );
}
