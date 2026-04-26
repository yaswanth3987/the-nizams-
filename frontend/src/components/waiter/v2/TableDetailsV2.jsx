import React from 'react';
import { ArrowLeft, Plus, Bell, Check, Trash2, CreditCard, Utensils } from 'lucide-react';

const TableDetailsV2 = ({ 
    selectedTable, 
    tableOrders, 
    tableAssistance, 
    serviceChargeEnabled, 
    setServiceChargeEnabled, 
    onBack, 
    onNewOrder, 
    onStatusUpdate, 
    onEditOrder, 
    onClearAssistance, 
    onSettle, 
    onResetTable 
}) => {
    const subtotal = tableOrders.reduce((sum, order) => sum + (order.subtotal || order.finalTotal || 0), 0);
    const firstOrder = tableOrders[0] || {};
    const serviceCharge = serviceChargeEnabled ? (parseFloat(firstOrder.serviceCharge) || (subtotal * 0.1)) : 0;
    const totalBill = subtotal + serviceCharge;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-black/10">
            {/* Header */}
            <header className="px-8 py-8 border-b border-white/5 bg-[#0F3A2F]/40 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-8">
                    <button onClick={onBack} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-6xl font-serif font-black text-[#FFD700] italic tracking-tight uppercase">Table {selectedTable}</h1>
                        <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.4em] mt-2">Active Management Console</p>
                    </div>
                </div>
                <button onClick={onNewOrder} className="bg-[#FFD700] text-[#0a261f] px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-2xl shadow-[#FFD700]/20">
                    <Plus size={20} strokeWidth={4} /> New Order
                </button>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-8 space-y-8 no-scrollbar pb-32">
                {/* Assistance Alert */}
                {tableAssistance && (
                    <div className="bg-blue-600 border border-blue-400 rounded-[3rem] p-10 flex items-center justify-between shadow-2xl shadow-blue-600/30 animate-pulse">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white">
                                <Bell size={40} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-white text-3xl font-serif font-black italic uppercase tracking-tight">Assistance Requested</h3>
                                <p className="text-blue-100 text-[11px] font-bold uppercase tracking-widest mt-2 opacity-80">Guest requires {tableAssistance.type || 'service'}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => onClearAssistance(tableAssistance.id)} 
                            className="bg-white text-blue-600 px-12 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest active:scale-95 shadow-xl"
                        >
                            Mark Attended
                        </button>
                    </div>
                )}

                {/* Orders List */}
                <div className="space-y-6">
                    <h2 className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.4em] mb-10 pl-2 flex items-center gap-4">
                        Active Records <div className="h-px flex-1 bg-white/5"></div>
                    </h2>
                    
                    {tableOrders.length === 0 ? (
                        <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/5">
                            <Utensils size={48} className="mx-auto text-white/10 mb-6" />
                            <p className="text-white/20 font-black uppercase tracking-[0.3em]">Table Is Empty</p>
                        </div>
                    ) : (
                        tableOrders.map(order => (
                            <div key={order.id} className="bg-white/5 border border-white/10 rounded-[3rem] p-8 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-2 h-full bg-[#FFD700]/20 group-hover:bg-[#FFD700] transition-all"></div>
                                <div className="flex justify-between items-start mb-10 pl-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-[#FFD700] text-[#0a261f] text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-[0.2em]">#{order.id}</span>
                                            <span className="text-white font-black text-sm uppercase italic tracking-wider">{order.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        {order.status === 'ready' && (
                                            <button 
                                                onClick={() => onStatusUpdate(order.id, 'served', order._source)}
                                                className="bg-emerald-500 text-[#0a261f] px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-xl flex items-center gap-2"
                                            >
                                                <Check size={18} strokeWidth={4} /> Served
                                            </button>
                                        )}
                                        {['new', 'pending', 'accepted', 'confirmed', 'active'].includes(order.status) && (
                                            <button 
                                                onClick={() => onEditOrder(order)}
                                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                                            >
                                                Modify Items
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                                    {(order.items || []).map((item, i) => (
                                        <div key={i} className="flex justify-between items-center bg-black/20 p-5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-5">
                                                <span className="w-10 h-10 bg-[#FFD700] text-[#0a261f] rounded-xl flex items-center justify-center font-black">x{item.qty}</span>
                                                <span className="text-white font-serif font-black italic">{item.name}</span>
                                            </div>
                                            <span className="text-white/40 text-xs tabular-nums">Â£{(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom Settle Actions */}
            <footer className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-2xl">
                <div className="grid grid-cols-2 gap-12 mb-10 px-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[#86a69d] uppercase font-black tracking-widest text-[10px]">Subtotal</span>
                            <span className="text-white font-serif font-black text-xl italic">Â£{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="text-[#86a69d] uppercase font-black tracking-widest text-[10px]">Service Charge</span>
                                <button 
                                    onClick={() => setServiceChargeEnabled(!serviceChargeEnabled)}
                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${serviceChargeEnabled ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}
                                >
                                    {serviceChargeEnabled ? 'Exclude' : 'Include'}
                                </button>
                            </div>
                            <span className={`font-serif font-black text-xl italic transition-all ${serviceChargeEnabled ? 'text-[#FFD700]' : 'text-white/10 line-through'}`}>
                                Â£{serviceCharge.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                        <p className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Final Settlement Due</p>
                        <span className="text-7xl font-serif font-black text-[#FFD700] italic leading-none">Â£{totalBill.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex gap-6">
                    <button 
                        onClick={onSettle}
                        disabled={tableOrders.length === 0}
                        className="flex-[3] bg-[#FFD700] text-[#0a261f] py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-[#FFD700]/30 disabled:opacity-20"
                    >
                        <CreditCard size={28} strokeWidth={3} /> Request Final Bill
                    </button>
                    <button 
                        onClick={onResetTable}
                        className="flex-1 bg-red-600/10 border border-red-500/20 text-red-500 py-8 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Trash2 size={22} /> Reset Table
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default React.memo(TableDetailsV2);
