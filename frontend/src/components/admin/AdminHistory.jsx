import React, { useState, useEffect } from 'react';
import { History, Search, Calendar, Clock, ChevronRight, FileText, Printer, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

const AdminHistory = ({ printReceipt }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/history`);
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setHistory(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredHistory = history.filter(h => 
        h.tableId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.id?.toString().includes(searchQuery)
    );

    return (
        <div className="flex gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* List Section */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold text-white italic">Order History</h2>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Retaining past 4 days of service</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-nizam-gold transition-colors" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY TABLE / NAME" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-black text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-nizam-gold/40 w-64 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-10">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white/5 border-t-nizam-gold rounded-full animate-spin"></div>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[3rem] text-white/20 gap-4">
                            <History size={40} strokeWidth={1} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No records found in current retention window</p>
                        </div>
                    ) : (
                        filteredHistory.map((order) => (
                            <div 
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`group p-6 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between ${selectedOrder?.id === order.id ? 'bg-nizam-gold/10 border-nizam-gold/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-serif font-bold text-xl italic transition-colors ${selectedOrder?.id === order.id ? 'bg-nizam-gold text-black' : 'bg-white/5 text-white/40'}`}>
                                        {order.tableId?.replace(/^[TBC]/, '').replace(/^0+/, '') || 'TA'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-sm font-serif font-bold text-white italic">{order.customerName || 'Walk-in Guest'}</span>
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase tracking-widest">Completed</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[9px] font-black text-white/20 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Amount</p>
                                        <p className="text-lg font-serif font-bold text-nizam-gold italic">£{Number(order.finalTotal).toFixed(2)}</p>
                                    </div>
                                    <ChevronRight size={20} className={`transition-transform duration-500 ${selectedOrder?.id === order.id ? 'translate-x-1 text-nizam-gold' : 'text-white/10 group-hover:text-white/30'}`} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Section */}
            <div className="w-96 bg-[#0c0d0c] border border-white/10 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl relative">
                {selectedOrder ? (
                    <>
                        <div className="p-8 border-b border-white/5 bg-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-nizam-gold/10 border border-nizam-gold/20 flex items-center justify-center text-nizam-gold">
                                    <FileText size={18} />
                                </div>
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Order #{selectedOrder.id}</span>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-2xl font-serif font-bold text-white italic mb-1">Service Details</h3>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Table {selectedOrder.tableId}</p>
                            </div>

                            <button 
                                onClick={() => printReceipt(selectedOrder)}
                                className="w-full py-4 bg-nizam-gold text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_20px_rgba(198,168,124,0.3)] hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Printer size={14} /> Print Audit Copy
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                            <div className="space-y-4">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-serif text-nizam-gold/60 font-bold italic">
                                                {item.qty}
                                            </div>
                                            <span className="text-xs text-white/80 font-serif italic">{item.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-nizam-gold/40">£{(item.price * item.qty).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/10 space-y-3">
                                <div className="flex justify-between text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                                    <span>Subtotal</span>
                                    <span>£{Number(selectedOrder.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                                    <span>Service Charge</span>
                                    <span>£{Number(selectedOrder.serviceCharge).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-2">
                                    <span className="text-[10px] font-black text-nizam-gold uppercase tracking-[0.5em] italic">Settled</span>
                                    <span className="text-3xl font-serif font-bold text-nizam-gold italic">
                                        £{Number(selectedOrder.finalTotal).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {selectedOrder.paymentDetails && (() => {
                                try {
                                    const details = typeof selectedOrder.paymentDetails === 'string' ? JSON.parse(selectedOrder.paymentDetails) : selectedOrder.paymentDetails;
                                    return (
                                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 mt-8">
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Payment Distribution</p>
                                            <div className="space-y-2">
                                                {details.payments?.map((p, i) => p.amount > 0 && (
                                                    <div key={i} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-white/40 uppercase tracking-widest">{p.method}</span>
                                                        <span className="text-white font-bold">£{Number(p.amount).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                } catch (_) { return null; }
                            })()}
                        </div>

                        <div className="p-8 bg-white/5 border-t border-white/5 text-center">
                            <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Audit record verified and sealed</p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/10">
                            <CheckCircle2 size={32} strokeWidth={1} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Audit Desk</p>
                            <p className="text-sm font-serif text-white/20 italic">Select an order from the list to view granular service details.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminHistory;
