import React, { useState, useEffect, useCallback } from 'react';
import AdminUnavailabilityScheduler from '../components/admin/AdminUnavailabilityScheduler';
import { socket } from '../utils/socket';
import Receipt from '../components/Receipt';
import AdminLayout from '../components/admin/AdminLayout';
import AdminOverview from '../components/admin/AdminOverview';
import AdminActiveRequests from '../components/admin/AdminActiveRequests';
import AdminFloorStatus from '../components/admin/AdminFloorStatus';
import AdminBilledOrders from '../components/admin/AdminBilledOrders';
import AdminNewOrders from '../components/admin/AdminNewOrders';
import AdminCompletedView from '../components/admin/AdminCompletedView';
import AdminAttendance from '../components/admin/AdminAttendance';
import AdminMenuManagement from '../components/admin/AdminMenuManagement';
import AdminTableOverview from '../components/admin/AdminTableOverview';
import AdminQuickAccess from '../components/admin/AdminQuickAccess';
import AdminTakeawayPOS from '../components/admin/AdminTakeawayPOS';
import AdminTakeawayManager from '../components/admin/AdminTakeawayManager';
import InventoryDashboard from '../components/InventoryDashboard';
import { useSoundSystem } from '../hooks/useSoundSystem';

const API_URL = import.meta.env.DEV 
    ? `http://${window.location.hostname}:3001/api` 
    : '/api';

export default function AdminDashboard() {
    const [sessions, setSessions] = useState([]);
    const [newOrders, setNewOrders] = useState([]);
    const [editingTakeaway, setEditingTakeaway] = useState(null);
    const [assistanceRequests, setAssistanceRequests] = useState([]);
    const [activeView, setActiveView] = useState('orders');

    useEffect(() => {
        document.title = "Admin - The Great Nizam";
    }, []);

    const [selectedSessionForReceipt, setSelectedSessionForReceipt] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [unreadAlerts, setUnreadAlerts] = useState(0);

    // Analytics data
    const [analyticsDaily, setAnalyticsDaily] = useState(null);
    const [itemAnalytics, setItemAnalytics] = useState([]);
    const [salesList, setSalesList] = useState([]);

    // --- Define Callbacks first for Hook Stability ---
    const fetchSessions = useCallback(() => {
        return fetch(`${API_URL}/orders?statuses=confirmed,active,ready,served,billed`)
            .then(res => {
                if(!res.ok) throw new Error("Orders API Failed");
                return res.json();
            })
            .then(data => setSessions(data))
            .catch(err => { console.error("Error fetching sessions:", err); throw err; });
    }, []);

    const fetchAssistance = useCallback(() => {
        return fetch(`${API_URL}/assistance`)
            .then(res => res.json())
            .then(data => setAssistanceRequests(data || []))
            .catch(err => { console.error("Error fetching assistance:", err); });
    }, []);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [dailyRes, itemsRes, salesRes] = await Promise.all([
                fetch(`${API_URL}/analytics/daily`),
                fetch(`${API_URL}/analytics/items`),
                fetch(`${API_URL}/orders?statuses=completed,billed,archived`)
            ]);
            
            const dailyData = dailyRes.ok ? await dailyRes.json() : null;
            const itemsData = itemsRes.ok ? await itemsRes.json() : [];
            const salesData = salesRes.ok ? await salesRes.json() : [];

            setAnalyticsDaily(dailyData || { totalOrders: 0, grossRevenue: 0, subtotal: 0, serviceCharge: 0 });
            setItemAnalytics(itemsData || []);
            setSalesList(salesData || []);
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
        }
    }, []);

    const fetchNewOrders = useCallback(() => {
        return fetch(`${API_URL}/new-orders`)
            .then(res => res.json())
            .then(data => setNewOrders(data || []))
            .catch(err => console.error(err));
    }, []);

    // Sound System Integration
    const hasUnattendedAssistance = assistanceRequests.some(r => r.status === 'pending');
    const { playSound } = useSoundSystem(hasUnattendedAssistance);

    // --- Effects next ---
    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetchSessions(),
            fetchNewOrders(),
            fetchAssistance(),
            fetchDashboardData()
        ])
        .then(() => setIsLoading(false))
        .catch(err => {
            console.error(err);
            setErrorMsg("Failed to connect to backend server.");
            setIsLoading(false);
        });
    }, [fetchSessions, fetchNewOrders, fetchAssistance, fetchDashboardData]);

    // Socket Listeners Effect
    useEffect(() => {
        const handleSessionUpdate = (session) => {
            setSessions(prev => {
                const exists = prev.find(s => s.id === session.id);
                if (exists) {
                    if (exists.status !== 'ready' && session.status === 'ready') {
                        playSound('ready');
                    }
                    return prev.map(s => s.id === session.id ? session : s);
                }
                setUnreadAlerts(unread => unread + 1);
                playSound('newOrder');
                return [session, ...prev];
            });
            
            if (['completed', 'billed'].includes(session.status)) {
                fetchDashboardData();
            }
        };

        socket.on('sessionUpdated', handleSessionUpdate);
        
        socket.on('orderCreated', (newOrder) => {
            setNewOrders(prev => {
                if (prev.some(o => o.id === newOrder.id)) return prev;
                setTimeout(() => {
                    setUnreadAlerts(u => u + 1);
                    playSound('newOrder');
                }, 0);
                return [newOrder, ...prev];
            });
        });

        socket.on('orderUpdated', () => {
             console.log('[Socket] Order updated - refreshing all states');
             fetchSessions();
             fetchNewOrders();
        });

        socket.on('tableReset', () => {
            fetchSessions();
            fetchNewOrders();
            fetchAssistance();
        });

        socket.on('assistanceRequested', (req) => {
            setAssistanceRequests(prev => {
                if (prev.some(r => r.id === req.id)) return prev;
                setTimeout(() => {
                    setUnreadAlerts(u => u + 1);
                    if (req.type === 'bill') playSound('bill');
                    else playSound('assistance');
                }, 0);
                return [req, ...prev];
            });
        });

        socket.on('assistanceUpdated', (updatedReq) => {
            setAssistanceRequests(prev => {
                if (updatedReq.status !== 'pending') {
                    return prev.filter(r => r.id !== updatedReq.id);
                }
                return prev.map(r => r.id === updatedReq.id ? updatedReq : r);
            });
        });

        socket.on('assistanceDeleted', ({ id }) => {
            setAssistanceRequests(prev => prev.filter(r => r.id !== id));
            fetchSessions(); // Refresh sessions in case assistance was tied to a bill closure
        });
        
        socket.on('orderDeleted', ({ id }) => {
            setNewOrders(prev => prev.filter(o => o.id !== id));
        });

        socket.on('sessionDeleted', ({ id }) => {
            setSessions(prev => prev.filter(s => s.id !== id));
            fetchSessions();
        });

        socket.on('forceRefresh', () => {
            fetchNewOrders();
            fetchSessions();
            fetchAssistance();
        });

        return () => {
            socket.off('sessionUpdated');
            socket.off('tableReset');
            socket.off('orderCreated');
            socket.off('orderUpdated');
            socket.off('assistanceRequested');
            socket.off('assistanceUpdated');
            socket.off('assistanceDeleted');
        };
    }, [playSound, fetchSessions, fetchNewOrders, fetchDashboardData]);

    const updateAssistance = async (id, status) => {
        try {
            await fetch(`${API_URL}/assistance/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (err) { console.error(err); }
    };

    const deleteAssistance = async (id) => {
        try {
            await fetch(`${API_URL}/assistance/${id}`, { method: 'DELETE' });
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (id, status, isRawOrder = false) => {
        try {
            const endpoint = isRawOrder ? `${API_URL}/new-orders/${id}/status` : `${API_URL}/orders/${id}/status`;
            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Failed to update status');
            
            await fetchSessions();
            if (isRawOrder) await fetchNewOrders();
        } catch (err) {
            console.error(err);
        }
    };

    const cancelOrder = async (id) => {
        if (!confirm('Reject this order? The customer will be notified.')) return;
        try {
            const res = await fetch(`${API_URL}/new-orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            if (!res.ok) throw new Error('Failed to reject order');
            await fetchNewOrders();
        } catch (err) {
            console.error('Reject failed:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const clearTable = async (tableId) => {
        // Relaxing the filter to allow "Force Reset" for any session state (confirmed/active included)
        const tableSessions = sessions.filter(s => s.tableId === tableId);
        if (tableSessions.length === 0) {
            // Even if no active session in frontend state, call backend to ensures table status is 'free'
            try {
                await fetch(`${API_URL}/tables/${encodeURIComponent(tableId)}/orders`, { method: 'DELETE' });
                fetchSessions();
            } catch (e) { console.error(e); }
            return;
        }
        
        if (!confirm(`Clear session for Table ${tableId}?`)) return;
        
        try {
            // In session system, we just mark all as archived or delete them. 
            // For now let's assume updateStatus handles it or we use the specific table clear endpoint
            const res = await fetch(`${API_URL}/tables/${encodeURIComponent(tableId)}/orders`, { method: 'DELETE' });
            if (!res.ok) throw new Error('API Error');
            fetchSessions();
        } catch (err) {
            console.error(err);
            fetchSessions();
        }
    };

    const printReceipt = (order) => {
        setSelectedSessionForReceipt(order);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const getHeaderConfig = () => {
        switch(activeView) {
            case 'all-in-one': return { title: 'Quick Access', active: 'all-in-one', tabs: [] };
            case 'pos': return { title: 'New Order Entry', active: 'pos', tabs: [] };
            case 'inventory': return { title: 'The Great Nizam', active: 'inv', tabs: [{id:'dashboard', label:'DASHBOARD'}, {id:'inv', label:'INVENTORY'}, {id:'reports', label:'REPORTS'}] };
            case 'assistance': return { title: 'The Great Nizam', active: 'ast', tabs: [{id:'live', label:'LIVE VIEW'}, {id:'reports', label:'REPORTS'}, {id:'ast', label:'ASSISTANCE'}] };
            case 'tables': return { title: 'The Great Nizam', active: 'grid', tabs: [{id:'grid', label:'TABLE OVERVIEW'}] };
            case 'confirmed': return { title: 'Confirmed Orders', active: 'conf', tabs: [{id:'new', label:'NEW REQUESTS'}, {id:'conf', label:'CONFIRMED'}, {id:'prep', label:'PREPARING'}] };
            case 'billed': return { title: 'The Great Nizam', active: 'bill', tabs: [{id:'orders', label:'ORDERS'}, {id:'conf', label:'CONFIRMED'}, {id:'bill', label:'PAYMENT'}, {id:'comp', label:'COMPLETED'}, {id:'inv2', label:'INVENTORY'}] };
            case 'orders': return { title: 'The Great Nizam', active: 'new', tabs: [{id:'new', label:'NEW ORDERS'}, {id:'all', label:'ALL ORDERS'}] };
            case 'completed': return { title: 'The Great Nizam', active: 'today', tabs: [{id:'today', label:'TODAY'}, {id:'past', label:'PAST 7 DAYS'}] };
            case 'takeaway': return { title: 'Takeaway Management', active: 'live', tabs: [{id:'live', label:'LIVE ORDERS'}, {id:'history', label:'HISTORY'}] };
            case 'attendance': return { title: 'Staff Attendance', active: 'attendance', tabs: [] };
            case 'menu': return { title: 'Menu Management', active: 'menu', tabs: [] };
            case 'scheduler': return { title: 'Temporal Scheduler', active: 'scheduler', tabs: [] };
            default: return { title: 'The Great Nizam', active: '', tabs: [] };
        }
    };

    const headerCfg = getHeaderConfig();

    if (errorMsg) {
        return (
            <div className="min-h-screen bg-[#0c0d0c] flex items-center justify-center text-white">
                <div className="text-center bg-[#111311] p-10 rounded-2xl border border-red-900/30 shadow-2xl max-w-md">
                    <h2 className="text-3xl font-serif font-bold text-red-500 mb-4">Connection Failure</h2>
                    <p className="text-sm text-white/40 mb-8 leading-relaxed">{errorMsg}</p>
                    <button onClick={() => window.location.reload()} className="w-full py-4 bg-red-900/20 hover:bg-red-900/40 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all border border-red-900/30 uppercase">Re-establish Pulse</button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0c0d0c] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#064e3b]/10 to-transparent pointer-events-none"></div>
                <div className="w-16 h-16 border-2 border-white/5 border-t-nizam-gold rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(198,168,124,0.1)]"></div>
                <p className="text-nizam-gold font-serif tracking-[0.3em] uppercase text-[10px] animate-pulse font-bold">Synchronizing Concierge Systems...</p>
            </div>
        );
    }

    const categoryCounts = {
        orders: newOrders.filter(o => (o.status === 'new' || o.status === 'pending') && o.orderType !== 'takeaway').length,
        confirmed: sessions.filter(s => ['confirmed', 'active', 'ready', 'served'].includes(s.status) && s.orderType !== 'takeaway').length,
        billed: sessions.filter(s => s.status === 'billed' && s.orderType !== 'takeaway').length,
        completed: sessions.filter(s => s.status === 'completed' && s.orderType !== 'takeaway').length,
        takeaway: newOrders.filter(o => o.orderType === 'takeaway' && (o.status === 'new' || o.status === 'pending')).length + sessions.filter(s => s.orderType === 'takeaway' && s.status !== 'completed').length,
        assistance: assistanceRequests.length,
        hasBillRequest: assistanceRequests.some(r => r.type === 'bill' && r.status === 'pending')
    };

    return (
        <>
            <AdminLayout
                activeView={activeView}
                onViewChange={setActiveView}
                onRefresh={() => { fetchSessions(); fetchAssistance(); fetchDashboardData(); }}
                title={headerCfg.title}
                tabs={headerCfg.tabs}
                activeTab={headerCfg.active}
                onTabChange={() => {}} // Dummy for visual only
                unreadAlerts={unreadAlerts}
                onClearAlerts={() => setUnreadAlerts(0)}
                counts={categoryCounts}
            >
                {activeView === 'all-in-one' && (
                    <div className="w-full">
                        <AdminQuickAccess 
                            newOrders={newOrders}
                            sessions={sessions}
                            updateStatus={updateStatus}
                            cancelOrder={cancelOrder}
                            printReceipt={printReceipt}
                            clearTable={clearTable}
                            assistanceRequests={assistanceRequests}
                            updateAssistance={updateAssistance}
                            onViewChange={setActiveView}
                        />
                    </div>
                )}

                {activeView === 'inventory' && (
                    <AdminOverview 
                        analyticsDaily={analyticsDaily} 
                        itemAnalytics={itemAnalytics} 
                        salesList={salesList} 
                    />
                )}
                
                {activeView === 'assistance' && (
                    <AdminActiveRequests 
                        assistanceRequests={assistanceRequests}
                        updateAssistance={updateAssistance}
                        deleteAssistance={deleteAssistance}
                    />
                )}

                {activeView === 'attendance' && (
                    <AdminAttendance />
                )}

                {activeView === 'menu' && (
                    <AdminMenuManagement />
                )}



                {activeView === 'scheduler' && (
                    <AdminUnavailabilityScheduler />
                )}

                {activeView === 'takeaway' && (
                    <AdminTakeawayManager 
                        sessions={sessions}
                        newOrders={newOrders}
                        updateStatus={updateStatus}
                        onViewChange={setActiveView}
                        onEdit={(order) => {
                            setEditingTakeaway(order);
                            setActiveView('pos');
                        }}
                    />
                )}

                {activeView === 'pos' && (
                    <AdminTakeawayPOS 
                        initialOrder={editingTakeaway}
                        onComplete={() => {
                            setEditingTakeaway(null);
                            setActiveView('takeaway');
                        }}
                    />
                )}

                {activeView === 'tables' && (
                    <AdminTableOverview socket={socket} API_URL={API_URL} />
                )}
                
                {activeView === 'confirmed' && (
                    <AdminFloorStatus 
                        orders={sessions}
                        updateStatus={updateStatus}
                        printReceipt={printReceipt}
                        API_URL={API_URL}
                    />
                )}
                
                {activeView === 'billed' && (
                    <AdminBilledOrders 
                        orders={sessions}
                        updateStatus={updateStatus}
                        printReceipt={printReceipt}
                    />
                )}
                
                {activeView === 'orders' && (
                    <AdminNewOrders 
                        orders={newOrders}
                        updateStatus={(id, status) => updateStatus(id, status, true)}
                        cancelOrder={cancelOrder}
                    />
                )}
                
                {activeView === 'completed' && (
                    <AdminCompletedView 
                        orders={sessions}
                        clearTable={clearTable}
                        printReceipt={printReceipt}
                    />
                )}
            </AdminLayout>

            {/* Hidden Receipt Component for Printing */}
            <div className="hidden print:block absolute top-0 left-0 w-[80mm] bg-white z-[9999]" id="receipt-print-area">
                <Receipt order={selectedSessionForReceipt} />
            </div>
        </>
    );
}
