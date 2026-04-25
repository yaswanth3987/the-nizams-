import React from 'react';
import { Clock, CheckCircle, CreditCard, Trash2, Edit3, ArrowRight } from 'lucide-react';

const OrderCardV2 = ({ 
    order, 
    onStatusUpdate, 
    onDelete, 
    onEdit, 
    onViewDetails 
}) => {
    const isNew = order.status === 'new' || order.status === 'pending';
    const isReady = order.status === 'ready';
    const isBilled = order.status === 'billed' || order.status === 'billing_pending';
    const items = Array.isArray(order.items) ? order.items : [];

    const getStatusStyles = () => {
        if (isReady) return 'bg-[#FFD700] text-[#0a261f] border-[#FFD700]';
        if (isBilled) return 'bg-emerald-500 text-white border-emerald-500';
        if (isNew) return 'bg-blue-500 text-white border-blue-500';
        return 'bg-orange-500 text-white border-orange-500';
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden transition-all hover:bg-white/[0.07] relative group min-h-[320px]">
            {/* Header Color Strip */}
            <div className={`absolute top-0 left-0 w-2 h-full ${getStatusStyles().split(' ')[0]}`}></div>
            
            <div className="p-6 pl-8 flex flex-col h-full">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getStatusStyles()}`}>
                                {order.status}
                            </span>
                            {isNew && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                        </div>
                        <h3 className="text-[#FFD700] text-2xl font-serif font-black italic tracking-tighter uppercase truncate">
                            {order.orderType === 'takeaway' ? (order.customerName || 'Takeaway') : `Table ${order.tableId}`}
                        </h3>
                        {order.orderType === 'takeaway' && order.phone && (
                            <p className="text-[#86a69d] text-[10px] font-bold mt-1 uppercase tracking-widest">{order.phone}</p>
                        )}
                        <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.2em] mt-1.5">ID: {order.id}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-white text-xl font-black tabular-nums">£{Number(order.finalTotal || 0).toFixed(2)}</p>
                        <p className="text-[#FFD700] text-[9px] font-black uppercase tracking-[0.2em] opacity-60">{order.orderType}</p>
                    </div>
                </div>

                {/* Items Preview - Expanded Density */}
                <div className="flex-1 space-y-1.5 mb-6 overflow-hidden">
                    {items.slice(0, order.orderType === 'takeaway' ? 10 : 5).map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-xs font-medium">
                            <span className="text-white/80 truncate pr-4">
                                <span className="text-[#FFD700] font-black mr-2">{item.qty}x</span>
                                {item.name}
                            </span>
                        </div>
                    ))}
                    {items.length > (order.orderType === 'takeaway' ? 10 : 5) && (
                        <p className="text-[#86a69d] text-[10px] font-bold italic pt-1">+ {items.length - (order.orderType === 'takeaway' ? 10 : 5)} more items...</p>
                    )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-white/5">
                    {isNew ? (
                        <button 
                            onClick={() => onStatusUpdate(order.id, 'confirmed', order._source)}
                            className="col-span-2 bg-[#FFD700] text-[#0a261f] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/10"
                        >
                            <CheckCircle size={14} strokeWidth={3} /> Accept Order
                        </button>
                    ) : isReady ? (
                        <button 
                            onClick={() => onStatusUpdate(order.id, 'served', order._source)}
                            className="col-span-2 bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                        >
                            <CheckCircle size={14} strokeWidth={3} /> Mark Served
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={() => onViewDetails(order)}
                                className="bg-white/10 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/10"
                            >
                                <ArrowRight size={14} /> View
                            </button>
                            <button 
                                onClick={() => onEdit(order)}
                                className="bg-[#FFD700]/10 text-[#FFD700] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#FFD700]/20"
                            >
                                <Edit3 size={14} /> Edit
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Delete - Relocated to avoid overlap */}
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(order); }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-10"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

export default React.memo(OrderCardV2);
