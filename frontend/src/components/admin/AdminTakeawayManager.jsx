import React from 'react';
import { Package, CheckCircle, Clock, ShoppingBag, ArrowRight, Printer, Check, CreditCard, XCircle, Utensils, Plus } from 'lucide-react';

export default function AdminTakeawayManager({ sessions, newOrders, updateStatus, onViewChange }) {
    // Filter only takeaway sessions that aren't completed yet
    const activeSessions = sessions.filter(s => s.orderType === 'takeaway' && s.status !== 'completed');
    const incomingTakeaways = newOrders.filter(o => o.orderType === 'takeaway' && (o.status === 'new' || o.status === 'pending'));
    
    // Grouping by status for management columns
    const incoming = incomingTakeaways;
    const preparing = activeSessions.filter(o => o.status === 'confirmed' || o.status === 'active' || o.status === 'ready');
    const billed = activeSessions.filter(o => o.status === 'billed');
    
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 font-sans">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Takeaway Central</h2>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                        Track and manage active takeaway orders for pick-up.
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => onViewChange?.('pos')}
                        className="h-14 px-8 rounded-xl bg-accent text-black font-bold text-sm flex items-center gap-3 transition-all hover:bg-white shadow-xl"
                    >
                        <Plus size={20} /> 
                        New Takeaway
                    </button>
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Queue Size</p>
                        <p className="text-xl font-serif font-bold text-emerald-500">{activeSessions.length + incomingTakeaways.length} Total Orders</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Column: New Requests */}
                <div className="space-y-6">
                    <h3 className="flex items-center gap-3 text-accent font-bold text-xs uppercase tracking-wider">
                        <ShoppingBag className="w-4 h-4" /> Incoming Requests
                    </h3>
                    <div className="space-y-6">
                        {incoming.map(order => (
                            <div key={order.id} className="bg-white/5 border border-accent/20 rounded-3xl p-8 flex flex-col shadow-2xl relative">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
                                <div className="flex justify-between items-start mb-6 pl-4">
                                    <h3 className="text-2xl font-serif font-bold text-white italic">{order.customerName || 'Guest'}</h3>
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">NEW</span>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar mb-6 pl-4">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-white/80 font-serif italic">{item.name}</span>
                                            <span className="text-accent font-bold">x{item.qty}</span>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => updateStatus(order.id, 'accepted', true)}
                                    className="ml-4 py-4 rounded-xl font-bold text-xs bg-accent text-black uppercase shadow-lg hover:bg-white transition-all"
                                >
                                    Accept Takeaway
                                </button>
                            </div>
                        ))}
                        {incoming.length === 0 && (
                            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/5">
                                <p className="text-white/10 text-xs font-bold uppercase tracking-widest">No New Requests</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column: Food Preparation */}
                <div className="space-y-6">
                    <h3 className="flex items-center gap-3 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                        <Clock className="w-4 h-4" /> In Preparation
                    </h3>
                    <div className="space-y-6">
                        {preparing.map(order => (
                            <div key={order.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl relative h-[420px]">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-2xl font-serif font-bold text-white italic">{order.customerName}</h3>
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">TK-{order.id.toString().slice(-3)}</span>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar mb-6">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-white/80 font-serif italic">{item.name}</span>
                                            <span className="text-accent font-bold">x{item.qty}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto border-t border-white/10 pt-6 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Order Total</span>
                                        <span className="text-2xl font-serif font-bold text-accent">£{Number(order.finalTotal).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => updateStatus(order.id, 'billed')}
                                    className="w-full py-4 rounded-xl font-bold text-xs bg-accent text-black uppercase shadow-lg hover:bg-white transition-all"
                                >
                                    Ready to Settle
                                </button>
                            </div>
                        ))}
                        {preparing.length === 0 && (
                            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/5">
                                <p className="text-white/10 text-xs font-bold uppercase tracking-widest">No Active Prep</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column: Ready & Payment */}
                <div className="space-y-6">
                    <h3 className="flex items-center gap-3 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <CheckCircle className="w-4 h-4" /> Ready for Collection
                    </h3>
                    <div className="space-y-6">
                        {billed.map(order => (
                             <div key={order.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl relative h-[420px] group transition-all hover:bg-white/10">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-2xl font-serif font-bold text-white italic">{order.customerName}</h3>
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">COLLECT</span>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar mb-6">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-white/80 font-serif italic">{item.name}</span>
                                            <span className="text-accent font-bold">x{item.qty}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto border-t border-white/10 pt-6 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Settlement Due</span>
                                        <span className="text-2xl font-serif font-bold text-accent">£{Number(order.finalTotal).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => updateStatus(order.id, 'completed')}
                                    className="w-full py-4 rounded-xl font-bold text-xs bg-white/10 text-emerald-400 border border-emerald-400/20 uppercase hover:bg-emerald-500 hover:text-black transition-all"
                                >
                                    Close Order
                                </button>
                            </div>
                        ))}
                        {billed.length === 0 && (
                            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/5">
                                <p className="text-white/10 text-xs font-bold uppercase tracking-widest">No Billed Orders</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
