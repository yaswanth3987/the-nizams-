import React from 'react';
import { Check, X, Clock, Receipt } from 'lucide-react';

export default function AdminNewOrders({ orders, updateStatus, cancelOrder }) {
    const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'pending');
    
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-serif text-white mb-2 tracking-wide">New Orders</h2>
                    <p className="text-nizam-textMuted max-w-lg leading-relaxed text-sm">
                        Incoming customer requests. Review and accept to move them to confirmed table sessions.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-nizam-gold/20 border border-nizam-gold/20 px-4 py-2 rounded-full text-nizam-gold">
                    <span className="w-2 h-2 rounded-full bg-nizam-gold animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{activeOrders.length} PENDING REQUESTS</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeOrders.map((order) => (
                    <div key={order.id} className="bg-[#0d0f0e] rounded-xl border border-white/5 p-6 flex flex-col shadow-2xl hover:border-nizam-gold/20 transition-all border-l-4 border-l-nizam-gold">
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-nizam-gold bg-nizam-gold/10 px-3 py-1 rounded-full border border-nizam-gold/20 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> NEW ORDER
                            </span>
                            <div className="text-right">
                                <p className="text-[8px] font-bold uppercase tracking-widest text-nizam-textMuted mb-0.5">RECEIVED</p>
                                <p className="font-mono text-xs text-white/60">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-baseline gap-2 mb-6">
                            <h3 className="text-3xl font-serif text-white">Table {order.tableId}</h3>
                            <span className="text-nizam-textMuted text-[10px] uppercase font-bold tracking-tighter">#{order.id}</span>
                        </div>

                        <div className="flex-1 space-y-3 mb-8 bg-black/40 p-5 rounded-lg border border-white/5 shadow-inner max-h-64 overflow-y-auto scrollbar-hide">
                            <p className="text-[9px] font-black text-nizam-gold/50 uppercase tracking-[0.2em] mb-4 border-b border-nizam-gold/10 pb-2">Order Items</p>
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-start text-xs border-b border-white/5 pb-2 last:border-0 text-nizam-textMuted">
                                    <span className="font-medium text-white/90 pr-4">{item.name}</span>
                                    <span className="font-bold text-nizam-gold bg-nizam-gold/5 px-2 py-0.5 rounded">x{item.qty}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-nizam-textMuted mb-1">FINAL TOTAL FOR THIS ORDER</p>
                                    <p className="text-2xl font-bold text-white tracking-tight">£{order.finalTotal.toFixed(2)}</p>
                                </div>
                                <div className="text-right text-[10px] text-nizam-textMuted font-mono">
                                    <p>Service Charge: £{(order.serviceCharge || 0).toFixed(2)}</p>
                                    <p>Subtotal: £{(order.subtotal || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => updateStatus(order.id, 'accepted')}
                                    className="py-3.5 rounded-lg font-bold text-[11px] tracking-[0.15em] bg-emerald-600 text-white hover:bg-emerald-500 transition-all uppercase shadow-lg shadow-emerald-900/10 flex justify-center items-center gap-2 group"
                                >
                                    <Check className="w-4 h-4" /> Accept
                                </button>
                                <button 
                                    onClick={() => cancelOrder(order.id)}
                                    className="py-3.5 rounded-lg font-bold text-[11px] tracking-[0.15em] bg-red-900/20 text-red-500 border border-red-900/30 hover:bg-red-900/40 transition-all uppercase shadow-lg flex justify-center items-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {activeOrders.length === 0 && (
                     <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-2xl bg-black/20">
                        <Receipt className="w-12 h-12 text-white/10 mx-auto mb-6 opacity-30" />
                        <p className="text-nizam-textMuted font-serif italic text-2xl">No new orders.</p>
                        <p className="text-[10px] font-bold tracking-[0.3em] text-white/20 uppercase mt-4">WAITING FOR CUSTOMERS</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const Utensils = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
);
