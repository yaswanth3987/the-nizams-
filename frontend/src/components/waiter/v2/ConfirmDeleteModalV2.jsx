import React from 'react';
import { Trash2, X } from 'lucide-react';

const ConfirmDeleteModalV2 = ({ 
    isOpen, 
    order, 
    onConfirm, 
    onClose 
}) => {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-[#111311] border border-white/10 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                {/* Header Decoration */}
                <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                
                <div className="p-12 text-center relative">
                    <button 
                        onClick={onClose}
                        className="absolute right-8 top-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                        <Trash2 className="w-12 h-12 text-red-500" />
                    </div>

                    <h3 className="text-4xl font-serif text-white font-black italic mb-4 tracking-tight">Confirm Deletion</h3>
                    
                    <div className="bg-white/5 rounded-3xl p-6 mb-10 border border-white/5">
                        <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.2em] mb-2">Target Order</p>
                        <h4 className="text-[#FFD700] text-3xl font-serif font-black italic uppercase">Table {order.tableId}</h4>
                        <p className="text-white/40 text-[11px] font-bold mt-2">ID: #{order.id} • {order.orderType}</p>
                    </div>

                    <p className="text-[15px] text-white/40 leading-relaxed mb-12 italic">
                        Are you sure you want to permanently remove this order? 
                        <br/>This action cannot be undone and will clear all associated data.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                        <button 
                            onClick={onClose}
                            className="h-16 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] transition-all border border-white/5 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onConfirm(order.id, order._source === 'new')}
                            className="h-16 bg-red-600 hover:bg-red-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-red-600/20 active:scale-95 transition-all"
                        >
                            Delete Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModalV2;
