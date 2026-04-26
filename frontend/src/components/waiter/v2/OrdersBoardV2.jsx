import React from 'react';
import OrderCardV2 from './OrderCardV2';
import { Sparkles, ShoppingBag, Utensils, Search } from 'lucide-react';

const OrdersBoardV2 = ({ 
    activeOrders, 
    activeTab, 
    onStatusUpdate, 
    onDelete, 
    onEdit, 
    onViewDetails 
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const getFilteredOrders = () => {
        const orders = (() => {
            if (activeTab === 'new_orders') {
                return activeOrders.filter(o => o._source === 'new' && (o.status === 'new' || o.status === 'pending'));
            }
            if (activeTab === 'orders') {
                return activeOrders.filter(o => o.status === 'ready');
            }
            if (activeTab === 'confirmed') {
                return activeOrders.filter(o => ['confirmed', 'active', 'ready', 'served'].includes(o.status) && o.orderType !== 'takeaway');
            }
            if (activeTab === 'billing') {
                return activeOrders.filter(o => ['billed', 'billing_pending'].includes(o.status));
            }
            if (activeTab === 'takeaway') {
                return activeOrders.filter(o => o.orderType === 'takeaway' && o.status !== 'completed');
            }
            if (activeTab === 'completed') {
                return activeOrders.filter(o => o.status === 'completed' && o.orderType !== 'takeaway');
            }
            return activeOrders;
        })();

        return orders.filter(o => {
            const query = searchQuery.toLowerCase();
            return (o.customerName || '').toLowerCase().includes(query) || 
                   (o.tableId || '').toString().toLowerCase().includes(query) ||
                   (o.id || '').toString().includes(query);
        });
    };

    const filteredOrders = getFilteredOrders();

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-black/10 overflow-hidden">
            {/* Header Area */}
            <header className="px-8 py-8 border-b border-white/5 bg-[#0F3A2F]/40 backdrop-blur-md shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-serif font-black text-white italic tracking-tighter uppercase">
                            {activeTab.replace('_', ' ')}
                        </h1>
                        <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                            {filteredOrders.length} Active Records • Terminal Live
                        </p>
                    </div>

                    <div className="relative min-w-[300px]">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-[2rem] pl-16 pr-6 py-4 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                        />
                    </div>
                </div>
            </header>

            {/* Stable Scroll Container - Root Cause Fix */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-8 no-scrollbar scroll-smooth">
                {filteredOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
                        {filteredOrders.map(order => (
                            <OrderCardV2 
                                key={`${order._source}-${order.id}`}
                                order={order}
                                onStatusUpdate={onStatusUpdate}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onViewDetails={onViewDetails}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-[#86a69d]">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#86a69d] flex items-center justify-center mb-6">
                            <Utensils size={40} />
                        </div>
                        <h3 className="text-xl font-serif font-black italic uppercase tracking-widest">No Active Orders</h3>
                        <p className="text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">All queues cleared</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(OrdersBoardV2);
