import React, { useState, useCallback, useEffect } from 'react';
import { useWaiterData } from '../hooks/waiter/v2/useWaiterData';
import { useSoundSystem } from '../hooks/useSoundSystem';
import SidebarV2 from '../components/waiter/v2/SidebarV2';
import OrdersBoardV2 from '../components/waiter/v2/OrdersBoardV2';
import FloorMapV2 from '../components/waiter/v2/FloorMapV2';
import TableDetailsV2 from '../components/waiter/v2/TableDetailsV2';
import OrderEntryV2 from '../components/waiter/v2/OrderEntryV2';
import ConfirmDeleteModalV2 from '../components/waiter/v2/ConfirmDeleteModalV2';
import { AlertTriangle, Loader2, Bell } from 'lucide-react';
import { socket } from '../utils/socket';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

const WaitersPortalV2 = () => {
    // 1. Data & Hooks
    const { 
        tables, activeOrders, assistanceRequests, menu,
        isLoading, error, badgeCounts,
        deleteOrder, updateOrderStatus, clearAssistance, refreshData
    } = useWaiterData();

    const { playSound } = useSoundSystem(assistanceRequests.some(r => r.status === 'pending'));

    // 2. Navigation State
    const [activeTab, setActiveTab] = useState('all-in-one');
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'table_details' | 'order_entry'
    const [selectedTable, setSelectedTable] = useState(null);
    const [cart, setCart] = useState([]);
    const [editingOrder, setEditingOrder] = useState(null);
    const [orderType, setOrderType] = useState('dine-in');
    const [customerName, setCustomerName] = useState('');
    const [serviceChargeEnabled, setServiceChargeEnabled] = useState(true);

    // 3. UI Feedback State
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, order: null });

    const showToast = useCallback((message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
    }, []);

    // 4. Socket Listeners for UI Feedback
    useEffect(() => {
        const handleNotification = (data) => {
            if (data?.type === 'bill') {
                playSound('bill');
                showToast(`Table ${data.tableId} requested the bill!`, 'urgent');
            } else if (data?.type === 'assistance') {
                playSound('newOrder');
                showToast(`Table ${data.tableId} requires assistance!`, 'urgent');
            } else if (data?.status === 'ready') {
                playSound('ready');
            }
        };
        socket.on('assistanceRequested', handleNotification);
        socket.on('sessionUpdated', handleNotification);
        return () => {
            socket.off('assistanceRequested', handleNotification);
            socket.off('sessionUpdated', handleNotification);
        };
    }, [playSound, showToast]);

    // 5. Handlers
    const handleTableSelect = useCallback((tableId) => {
        setSelectedTable(tableId);
        setView('table_details');
    }, []);

    const handleSettle = useCallback(async () => {
        const tableOrders = activeOrders.filter(o => o.tableId === selectedTable && o.status !== 'completed' && o.status !== 'rejected');
        if (tableOrders.length === 0) return;
        
        if (confirm(`Request final bill for Table ${selectedTable}?`)) {
            try {
                for (const o of tableOrders) {
                    await fetch(`${API_URL}/orders/${o.id}/service-charge`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ enabled: serviceChargeEnabled })
                    });
                    await updateOrderStatus(o.id, 'billing_pending', o._source);
                }
                showToast(`Bill request sent for Table ${selectedTable}`, 'success');
                setView('dashboard');
            } catch (err) { console.error(err); }
        }
    }, [selectedTable, activeOrders, serviceChargeEnabled, updateOrderStatus, showToast]);

    const handleResetTable = useCallback(async () => {
        if (!confirm(`RESET Table ${selectedTable}? This clears all active orders.`)) return;
        try {
            const res = await fetch(`${API_URL}/tables/${encodeURIComponent(selectedTable)}/orders`, { method: 'DELETE' });
            if (res.ok) {
                setView('dashboard');
                showToast(`Table ${selectedTable} has been reset`, 'success');
            }
        } catch (err) { console.error(err); }
    }, [selectedTable, showToast]);

    const handleOrderSubmit = useCallback(async () => {
        if (cart.length === 0) return;
        const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 0)), 0);
        
        try {
            const method = editingOrder ? 'PUT' : 'POST';
            const url = editingOrder ? `${API_URL}/orders/${editingOrder.id}/items` : `${API_URL}/orders`;
            const body = editingOrder 
                ? { items: cart, finalTotal: subtotal, type: editingOrder.type }
                : { 
                    tableId: orderType === 'takeaway' ? 'TAKEAWAY' : selectedTable, 
                    items: cart, 
                    finalTotal: subtotal, 
                    status: 'new', 
                    orderType: orderType, 
                    customerName: customerName,
                    isStaff: true 
                  };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setCart([]);
                setEditingOrder(null);
                setOrderType('dine-in');
                setCustomerName('');
                setView('dashboard');
                showToast(editingOrder ? 'Order updated' : 'Order dispatched to kitchen', 'success');
            }
        } catch (err) { console.error(err); }
    }, [cart, selectedTable, editingOrder, orderType, customerName, showToast]);

    // 6. Final Render
    if (isLoading) return (
        <div className="fixed inset-0 bg-[#0F3A2F] flex flex-col items-center justify-center text-white">
            <Loader2 size={48} className="animate-spin text-[#FFD700] mb-4" />
            <p className="font-serif italic text-xl">Initializing Terminal...</p>
        </div>
    );

    if (error) return (
        <div className="fixed inset-0 bg-[#0F3A2F] flex flex-col items-center justify-center text-white p-8 text-center">
            <AlertTriangle size={48} className="text-red-500 mb-6" />
            <h2 className="text-3xl font-serif font-black italic mb-2">Sync Lost</h2>
            <p className="text-[#86a69d] max-w-md mb-8">{error}</p>
            <button onClick={() => window.location.reload()} className="px-10 py-5 bg-[#FFD700] text-[#0a261f] rounded-2xl font-black uppercase text-sm">Reconnect</button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#0F3A2F] flex overflow-hidden selection:bg-[#FFD700] selection:text-[#0a261f]">
            <SidebarV2 
                activeTab={activeTab} setActiveTab={setActiveTab} setView={setView}
                badgeCounts={badgeCounts}
                assistanceRequests={assistanceRequests}
                activeOrders={activeOrders}
                onNewTable={() => { setSelectedTable(null); setCart([]); setEditingOrder(null); setView('order_entry'); }}
                onClearAssistance={clearAssistance}
            />

            <main className="flex-1 flex flex-col min-w-0 h-full relative">
                {view === 'dashboard' && (
                    activeTab === 'tables' 
                        ? <FloorMapV2 tables={tables} activeOrders={activeOrders} assistanceRequests={assistanceRequests} onTableSelect={handleTableSelect} />
                        : <OrdersBoardV2 
                            activeOrders={activeOrders} activeTab={activeTab} 
                            onStatusUpdate={updateOrderStatus} 
                            onDelete={(o) => setDeleteModal({ isOpen: true, order: o })}
                            onEdit={(o) => { setEditingOrder({ id: o.id, type: o._source }); setCart(o.items || []); setView('order_entry'); }}
                            onViewDetails={(o) => { setSelectedTable(o.tableId); setView('table_details'); }}
                          />
                )}

                {view === 'table_details' && (
                    <TableDetailsV2 
                        selectedTable={selectedTable} 
                        tableOrders={activeOrders.filter(o => o.tableId === selectedTable && o.status !== 'completed' && o.status !== 'rejected')}
                        tableAssistance={assistanceRequests.find(r => r.tableId === selectedTable)}
                        serviceChargeEnabled={serviceChargeEnabled} setServiceChargeEnabled={setServiceChargeEnabled}
                        onBack={() => setView('dashboard')}
                        onNewOrder={() => { setCart([]); setEditingOrder(null); setView('order_entry'); }}
                        onStatusUpdate={updateOrderStatus}
                        onEditOrder={(o) => { setEditingOrder({ id: o.id, type: o._source }); setCart(o.items || []); setView('order_entry'); }}
                        onClearAssistance={clearAssistance}
                        onSettle={handleSettle}
                        onResetTable={handleResetTable}
                    />
                )}

                {view === 'order_entry' && (
                    <OrderEntryV2 
                        menu={menu} selectedTable={selectedTable} editingOrder={editingOrder} 
                        cart={cart} setCart={setCart}
                        orderType={orderType} setOrderType={setOrderType}
                        customerName={customerName} setCustomerName={setCustomerName}
                        onBack={() => setView(selectedTable ? 'table_details' : 'dashboard')}
                        onSubmit={handleOrderSubmit}
                    />
                )}
            </main>

            {/* Modals & Overlays */}
            <ConfirmDeleteModalV2 
                isOpen={deleteModal.isOpen} order={deleteModal.order}
                onClose={() => setDeleteModal({ isOpen: false, order: null })}
                onConfirm={async (id, isRaw) => { await deleteOrder(id, isRaw); setDeleteModal({ isOpen: false, order: null }); showToast('Order deleted', 'success'); }}
            />

            {/* Toast System */}
            <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95 pointer-events-none'}`}>
                <div className={`px-10 py-6 rounded-[2rem] flex items-center gap-6 shadow-2xl font-black uppercase tracking-widest text-xs border backdrop-blur-3xl ${toast.type === 'urgent' ? 'bg-red-600/90 border-red-400 text-white' : 'bg-[#FFD700]/95 border-white/20 text-[#0a261f]'}`}>
                    {toast.type === 'urgent' ? <AlertTriangle size={24} className="animate-pulse" /> : <Bell size={24} />}
                    <div className="flex flex-col">
                        <span className="opacity-60 text-[8px] mb-0.5">Terminal Notification</span>
                        {toast.message}
                    </div>
                    {toast.type === 'urgent' && (
                        <button onClick={() => { setView('dashboard'); setActiveTab('alerts'); setToast(p => ({...p, visible: false})); }} className="ml-4 bg-white/20 hover:bg-white/40 px-6 py-2.5 rounded-xl transition-all border border-white/10 active:scale-95 text-white">View Details</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WaitersPortalV2;
