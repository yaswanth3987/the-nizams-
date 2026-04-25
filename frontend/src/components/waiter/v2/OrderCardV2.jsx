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

    const getStatusLabel = () => {
        if (order.status === 'billing_pending') return 'Bill Requested';
        if (order.status === 'billed') return 'Billed';
        if (order.status === 'ready') return 'Ready to Serve';
        if (order.status === 'confirmed') return 'In Progress';
        return order.status;
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden transition-all hover:bg-white/[0.07] relative group">
            {/* Header Color Strip */}
            <div className={`absolute top-0 left-0 w-2 h-full ${getStatusStyles().split(' ')[0]}`}></div>
            
            <div className="p-6 pl-8 flex flex-col h-full">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getStatusStyles()}`}>
                                {getStatusLabel()}
                            </span>
                            {isNew && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                            {order.orderType === 'takeaway' && (
                                <span className="bg-white/5 text-[#86a69d] text-[8px] font-black px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-widest">
                                    ID #{order.id}
                                </span>
                            )}
                        </div>
                        <h3 className="text-[#FFD700] text-3xl font-serif font-black italic tracking-tighter uppercase truncate">
                            {order.orderType === 'takeaway' 
                                ? (order.customerName || 'Takeaway') 
                                : `Table ${order.tableId}`}
                        </h3>
                        {order.orderType === 'takeaway' && order.phone && (
                            <p className="text-[#86a69d] text-[10px] font-bold mt-1 uppercase tracking-widest">{order.phone}</p>
                        )}
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-white text-lg font-black tabular-nums">£{Number(order.finalTotal || 0).toFixed(2)}</p>
                        <p className="text-[#86a69d] text-[9px] font-black uppercase tracking-[0.2em]">{order.orderType}</p>
                    </div>
                </div>

                {/* Items Preview - Full List for Takeaway, Preview for Dine-in */}
                <div className={`flex-1 space-y-1.5 mb-6 overflow-y-auto no-scrollbar ${order.orderType === 'takeaway' ? 'max-h-[120px]' : ''}`}>
                    {(order.orderType === 'takeaway' ? items : items.slice(0, 4)).map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-xs font-medium border-b border-white/5 pb-1">
                            <span className="text-white/80 truncate pr-4">
                                <span className="text-[#FFD700] font-black mr-2">{item.qty}x</span>
                                {item.name}
                            </span>
                        </div>
                    ))}
                    {items.length > 4 && order.orderType !== 'takeaway' && (
                        <p className="text-[#86a69d] text-[10px] font-bold italic pt-1">+ {items.length - 4} more items...</p>
                    )}
                </div>

                {/* Actions - Enhanced for Takeaway */}
                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-white/5">
                    {isNew ? (
                        <>
                            <button 
                                onClick={() => onStatusUpdate(order.id, order.orderType === 'takeaway' ? 'accepted' : 'confirmed', order._source)}
                                className="col-span-2 bg-[#FFD700] text-[#0a261f] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={14} strokeWidth={3} /> {order.orderType === 'takeaway' ? 'Accept Order' : 'Accept Order'}
                            </button>
                        </>
                    ) : isReady ? (
                        <button 
                            onClick={() => onStatusUpdate(order.id, 'served', order._source)}
                            className="col-span-2 bg-emerald-500 text-[#0a261f] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={14} strokeWidth={3} /> Mark Served
                        </button>
                    ) : order.orderType === 'takeaway' && order.status !== 'billing_pending' && order.status !== 'billed' ? (
                        <>
                            <button 
                                onClick={() => onEdit(order)}
                                className="bg-white/10 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/10"
                            >
                                <Edit3 size={14} /> Edit
                            </button>
                            <button 
                                onClick={() => onStatusUpdate(order.id, 'billing_pending', order._source)}
                                className="bg-emerald-500/10 text-emerald-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-500/20"
                            >
                                <ArrowRight size={14} /> Ready
                            </button>
                        </>
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

            {/* Quick Delete Overlay (Hidden by default, shown on long press/special context if needed) */}
            <button 
                onClick={() => onDelete(order)}
                className="absolute top-4 right-4 w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

export default React.memo(OrderCardV2);
