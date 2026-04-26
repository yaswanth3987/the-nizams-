import React from 'react';
import { Check, X, Clock, Receipt, UtensilsCrossed, Utensils as UtensilsIcon, Edit3 } from 'lucide-react';

export default function AdminNewOrders({ orders, updateStatus, cancelOrder, onEdit }) {
    // Filter only standard dine-in 'new' or 'pending' orders
    const activeOrders = (orders || []).filter(o => (o.status === 'new' || o.status === 'pending') && o.orderType !== 'takeaway');
    
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 font-sans">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Incoming Requests</h2>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed font-sans">
                        Review and accept guest requests to initialize table sessions.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-accent">
                    <span className="w-2 h-2 bg-accent animate-pulse rounded-full"></span>
                    <span className="text-xs font-bold uppercase tracking-widest">{activeOrders.length} Pending Audits</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeOrders.map((order) => (
                    <div key={order.id} className="bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
                        
                        <div className="flex justify-between items-start mb-8 pl-4">
                            <div>
                                <h3 className="text-3xl font-serif font-bold text-white">Table {order.tableId}</h3>
                                <p className="text-xs font-bold text-white/40 tracking-wider uppercase mt-1">Ref #{order.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Status</p>
                                <p className="font-sans text-sm text-accent font-bold uppercase tracking-widest">{order.status}</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto mb-8 pl-4">
                            {(order.items || []).map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-white/80 font-serif italic">{item.name}</span>
                                    <span className="text-accent font-bold">x{item.qty}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/10 pl-4">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xs font-bold text-white/40 uppercase">Intake Total</span>
                                <span className="text-2xl font-serif font-bold text-emerald-400">£{Number(order.finalTotal).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => onEdit?.(order)}
                                    className="px-6 bg-white/5 text-white/60 border border-white/10 rounded-xl hover:bg-accent hover:text-black hover:border-accent transition-all flex items-center justify-center"
                                >
                                    <Edit3 size={20} />
                                </button>
                                <button
                                    onClick={() => updateStatus(order.id, 'accepted')}
                                    className="flex-1 bg-emerald-500 text-black font-bold text-xs py-4 rounded-xl uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                                >
                                    Accept Order
                                </button>
                                <button
                                    onClick={() => cancelOrder(order.id)}
                                    className="px-6 bg-white/5 text-white/40 border border-white/10 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {activeOrders.length === 0 && (
                    <div className="col-span-full py-32 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                            <UtensilsIcon className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-white/40 font-serif italic text-3xl font-bold mb-2">No incoming calls</p>
                        <p className="text-xs font-bold tracking-widest text-white/10 uppercase">Waiting for guest requests</p>
                    </div>
                )}
            </div>
        </div>
    );
}
