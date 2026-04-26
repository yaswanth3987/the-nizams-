import React from 'react';
import { Package, CheckCircle, Clock, ShoppingBag, ArrowRight, Printer, Check, CreditCard, XCircle, Utensils, Plus, Trash2, Search } from 'lucide-react';

export default function AdminTakeawayManager({ sessions, newOrders, updateStatus, deleteOrder, onViewChange, onEdit }) {
    const [confirmDelete, setConfirmDelete] = React.useState({ isOpen: false, id: null, isRaw: false, name: '' });
    const [searchQuery, setSearchQuery] = React.useState('');

    // Filter only takeaway sessions that aren't completed yet
    const activeSessions = (sessions || []).filter(s => {
        const matchesSearch = (s.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (s.id || '').toString().includes(searchQuery);
        return s.orderType === 'takeaway' && s.status !== 'completed' && matchesSearch;
    });
    const incomingTakeaways = (newOrders || []).filter(o => {
        const matchesSearch = (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (o.id || '').toString().includes(searchQuery);
        return o.orderType === 'takeaway' && (o.status === 'new' || o.status === 'pending') && matchesSearch;
    });
    
    // Grouping by status for management columns
    const incoming = incomingTakeaways;
    const preparing = activeSessions.filter(o => o.status === 'confirmed' || o.status === 'active' || o.status === 'ready' || o.status === 'accepted');
    const billed = activeSessions.filter(o => o.status === 'billed' || o.status === 'billing_pending');
    
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 font-sans">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Takeaway Central</h2>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                        Track and manage active takeaway orders for pick-up.
                    </p>
                    <div className="mt-6 relative max-w-md">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by Guest Name or Order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white outline-none focus:border-accent/50 transition-all shadow-inner"
                        />
                    </div>
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
                                    <h3 className="text-2xl font-serif font-bold text-white italic">{order.customerName || 'Takeaway Guest'}</h3>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => setConfirmDelete({ isOpen: true, id: order.id, isRaw: true, name: order.customerName || 'Takeaway Guest' })}
                                            className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] group/del"
                                            title="Delete Order"
                                        >
                                            <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                                        </button>
                                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">NEW</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3 mb-6 pl-4">
                                    {(order.items || []).map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-white/80 font-serif italic">{item.name}</span>
                                            <span className="text-accent font-bold">x{item.qty}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex gap-2 ml-4">
                                    <button 
                                        onClick={() => onEdit?.(order)}
                                        className="flex-1 py-4 rounded-xl font-bold text-xs bg-white/5 text-white/60 uppercase border border-white/10 hover:bg-white/10 transition-all"
                                    >
                                        Edit Items
                                    </button>
                                    <button 
                                        onClick={() => updateStatus(order.id, 'accepted', true)}
                                        className="flex-[2] py-4 rounded-xl font-bold text-xs bg-accent text-black uppercase shadow-lg hover:bg-white transition-all"
                                    >
                                        Accept
                                    </button>
                                </div>
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
                            <div key={order.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl relative min-h-[420px] h-auto">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-[#FFD700] text-[#0F3A2F] px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                                            ID #{order.id}
                                        </span>
                                        {order.phone && (
                                            <span className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
                                                {order.phone}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-white text-3xl font-serif font-bold italic truncate leading-tight">
                                            {order.customerName || 'Takeaway Guest'}
                                        </h3>
                                        <button 
                                            onClick={() => setConfirmDelete({ isOpen: true, id: order.id, isRaw: false, name: order.customerName || 'Takeaway Guest' })}
                                            className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] group/del"
                                            title="Delete Order"
                                        >
                                            <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3 mb-6">
                                    {(order.items || []).map((item, i) => (
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

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onEdit?.(order)}
                                        className="flex-1 py-4 rounded-xl font-bold text-xs bg-white/5 text-white/60 uppercase border border-white/10 hover:bg-white/10 transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => updateStatus(order.id, 'billed')}
                                        className="flex-[2] py-4 rounded-xl font-bold text-xs bg-accent text-black uppercase shadow-lg hover:bg-white transition-all"
                                    >
                                        Ready to Settle
                                    </button>
                                </div>
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
                             <div key={order.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl relative min-h-[420px] h-auto group transition-all hover:bg-white/10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-[#FFD700] text-[#0F3A2F] px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                                            ID #{order.id}
                                        </span>
                                        {order.phone && (
                                            <span className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
                                                {order.phone}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-white text-3xl font-serif font-bold italic truncate leading-tight">
                                            {order.customerName || 'Takeaway Guest'}
                                        </h3>
                                        <button 
                                            onClick={() => setConfirmDelete({ isOpen: true, id: order.id, isRaw: false, name: order.customerName || 'Takeaway Guest' })}
                                            className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] group/del"
                                            title="Delete Order"
                                        >
                                            <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3 mb-6">
                                    {(order.items || []).map((item, i) => (
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

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onEdit?.(order)}
                                        className="flex-1 py-4 rounded-xl font-bold text-xs bg-white/5 text-white/60 uppercase border border-white/10 hover:bg-white/10 transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (order.status === 'billing_pending') return;
                                            console.log("Order moved to billing:", order.id);
                                            updateStatus(order.id, 'billing_pending', false);
                                        }}
                                        disabled={order.status === 'billing_pending'}
                                        className={`flex-[2] py-4 rounded-xl font-bold text-xs uppercase transition-all ${
                                            order.status === 'billing_pending' 
                                            ? 'bg-emerald-500/20 text-emerald-400 cursor-default border border-emerald-500/30' 
                                            : 'bg-white/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-500 hover:text-black'
                                        }`}
                                    >
                                        {order.status === 'billing_pending' ? 'In Billing Queue' : 'Send to Billing'}
                                    </button>
                                </div>
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

            {/* Custom Premium Delete Modal */}
            {confirmDelete.isOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
                    <div className="bg-[#111311] border border-white/5 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
                        
                        <div className="p-12 border-b border-white/5 text-center relative bg-black/40">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                                <Trash2 className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-5xl font-serif text-white font-bold tracking-tight mb-2 italic">Confirm Purge</h3>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Takeaway ID #{confirmDelete.id}</p>
                            <button 
                                onClick={() => setConfirmDelete({ isOpen: false, id: null, isRaw: false, name: '' })}
                                className="absolute right-10 top-12 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-12 space-y-10">
                            <p className="text-[15px] text-white/40 leading-relaxed text-center italic font-medium">
                                Are you sure you want to permanently <span className="text-red-500 font-bold uppercase tracking-widest px-2 underline decoration-red-500/30 underline-offset-8">DELETE</span> the order for <span className="text-white font-bold">{confirmDelete.name}</span>?
                                <br/><br/>
                                This action is <span className="text-emerald-400 font-bold italic">IRREVERSIBLE</span> and will remove all records from the system.
                            </p>

                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <button 
                                    onClick={() => setConfirmDelete({ isOpen: false, id: null, isRaw: false, name: '' })}
                                    className="h-20 bg-white/5 hover:bg-white/10 text-white py-4 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        deleteOrder?.(confirmDelete.id, confirmDelete.isRaw);
                                        setConfirmDelete({ isOpen: false, id: null, isRaw: false, name: '' });
                                    }}
                                    className="h-20 bg-gradient-to-r from-red-600 to-red-800 text-white py-4 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-[0_15px_30px_rgba(220,38,38,0.2)] hover:brightness-125 transition-all"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
