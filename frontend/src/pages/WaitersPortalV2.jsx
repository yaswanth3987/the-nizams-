import React, { useState, useCallback, useMemo } from 'react';
import { useWaiterData } from '../hooks/waiter/v2/useWaiterData';
import SidebarV2 from '../components/waiter/v2/SidebarV2';
import OrdersBoardV2 from '../components/waiter/v2/OrdersBoardV2';
import ConfirmDeleteModalV2 from '../components/waiter/v2/ConfirmDeleteModalV2';
import { AlertTriangle, Loader2 } from 'lucide-react';

const WaitersPortalV2 = () => {
    // 1. Data & State
    const { 
        activeOrders, 
        assistanceRequests, 
        isLoading, 
        error, 
        badgeCounts,
        deleteOrder,
        updateOrderStatus,
        clearAssistance 
    } = useWaiterData();

    const [activeTab, setActiveTab] = useState('all-in-one');
    const [view, setView] = useState('dashboard');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, order: null });

    // 2. Handlers
    const handleDeleteClick = useCallback((order) => {
        setDeleteModal({ isOpen: true, order });
    }, []);

    const handleConfirmDelete = useCallback(async (id, isRaw) => {
        await deleteOrder(id, isRaw);
        setDeleteModal({ isOpen: false, order: null });
    }, [deleteOrder]);

    const handleStatusUpdate = useCallback(async (id, status, source) => {
        await updateOrderStatus(id, status, source);
    }, [updateOrderStatus]);

    const handleEditOrder = useCallback((order) => {
        console.log('Edit order:', order);
        // Integrate with existing edit logic if needed
    }, []);

    const handleViewDetails = useCallback((order) => {
        console.log('View details:', order);
        // Integrate with existing details logic if needed
    }, []);

    // 3. Render States
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#0F3A2F] flex flex-col items-center justify-center text-white">
                <Loader2 size={48} className="animate-spin text-[#FFD700] mb-4" />
                <p className="font-serif italic text-xl">Initializing Terminal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-[#0F3A2F] flex flex-col items-center justify-center text-white p-8 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                    <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-serif font-black italic mb-2">Connection Error</h2>
                <p className="text-[#86a69d] max-w-md mb-8">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-4 bg-[#FFD700] text-[#0a261f] rounded-2xl font-black uppercase tracking-widest text-sm"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0F3A2F] flex overflow-hidden selection:bg-[#FFD700] selection:text-[#0a261f]">
            {/* Stable Navigation Sidebar */}
            <SidebarV2 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setView={setView}
                badgeCounts={badgeCounts}
                onNewTable={() => setView('order_entry')}
            />

            {/* Main Application Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative">
                {view === 'dashboard' && (
                    <OrdersBoardV2 
                        activeOrders={activeOrders}
                        activeTab={activeTab}
                        onStatusUpdate={handleStatusUpdate}
                        onDelete={handleDeleteClick}
                        onEdit={handleEditOrder}
                        onViewDetails={handleViewDetails}
                    />
                )}
                
                {/* Fallbacks for other views if needed */}
                {view !== 'dashboard' && (
                    <div className="flex-1 flex items-center justify-center text-white/20 uppercase tracking-[0.5em] font-black text-xs italic">
                        Module In Transition: {view}
                    </div>
                )}
            </main>

            {/* Stable Modals */}
            <ConfirmDeleteModalV2 
                isOpen={deleteModal.isOpen}
                order={deleteModal.order}
                onConfirm={handleConfirmDelete}
                onClose={() => setDeleteModal({ isOpen: false, order: null })}
            />
        </div>
    );
};

export default WaitersPortalV2;
