import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Clock, CheckCircle, AlertTriangle, Bell, Search, 
    Plus, Minus, X, Utensils, CreditCard, ArrowLeft,
    Check, LayoutGrid, ListOrdered, Settings, User, 
    Trash2, Sparkles, ArrowUpRight, ShoppingBag, FileText, SquareCheck as CheckSquare
} from 'lucide-react';
import { socket } from '../utils/socket';
import { useSoundSystem } from '../hooks/useSoundSystem';

// Admin Components Integration
import AdminQuickAccess from '../components/admin/AdminQuickAccess';
import AdminFloorStatus from '../components/admin/AdminFloorStatus';
import AdminNewOrders from '../components/admin/AdminNewOrders';
import AdminCompletedView from '../components/admin/AdminCompletedView';
import AdminTakeawayManager from '../components/admin/AdminTakeawayManager';
import AdminTakeawayPOS from '../components/admin/AdminTakeawayPOS';
import AdminUnavailabilityScheduler from '../components/admin/AdminUnavailabilityScheduler';
import Receipt from '../components/Receipt';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function WaitersPortal() {
    const [tables, setTables] = useState({});
    const [activeOrders, setActiveOrders] = useState([]);
    const [assistanceRequests, setAssistanceRequests] = useState([]);
    const [menu, setMenu] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [activeTab, setActiveTab] = useState('alerts'); // 'tables' | 'orders' | 'alerts'
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'table_details' | 'order_entry'
    
    // Order entry state
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [editingOrder, setEditingOrder] = useState(null); // { id, type }
    const [now, setNow] = useState(Date.now());
    const { playSound } = useSoundSystem((assistanceRequests || []).some(r => r.status === 'pending'));

    // Admin integration states
    const [editingTakeaway, setEditingTakeaway] = useState(null);
    const [selectedSessionForReceipt, setSelectedSessionForReceipt] = useState(null);

    const lastScrollTop = React.useRef(0);

    useEffect(() => {
        document.title = "Waiter - The Great Nizam";
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [tablesRes, ordersRes, helpRes, menuRes, sessionsRes] = await Promise.all([
                fetch(`${API_URL}/table-status`),
                fetch(`${API_URL}/new-orders`),
                fetch(`${API_URL}/assistance`),
                fetch(`${API_URL}/menu`),
                fetch(`${API_URL}/orders?statuses=confirmed,active,ready,served,billed,billing_pending`)
            ]);
            
            const [tablesData, ordersData, helpData, menuData, sessionsData] = await Promise.all([
                tablesRes.json(), ordersRes.json(), helpRes.json(), menuRes.json(), sessionsRes.json()
            ]);

            const statusMap = {};
            if (Array.isArray(tablesData)) {
                tablesData.forEach(t => {
                    if (t.tableId) statusMap[t.tableId.toUpperCase()] = t.status;
                });
            }
            setTables(statusMap);
            setAssistanceRequests(helpData.filter(r => r.status === 'pending' || r.status === 'attended'));
            setMenu(menuData);
            
            const allOrders = [
                ...(Array.isArray(ordersData) ? ordersData.map(o => ({...o, _source: 'new'})) : []), 
                ...(Array.isArray(sessionsData) ? sessionsData.map(o => ({...o, _source: 'session'})) : [])
            ].sort((a, b) => b.id - a.id);
            setActiveOrders(allOrders);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        let debounceTimer;
        const refresh = (data) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchData();
            }, 300);
            
            // Play notification sounds based on event type and content
            if (data?.type === 'bill') {
                playSound('bill');
            } else if (data?.status === 'ready') {
                playSound('ready');
            } else if (data?.status === 'new' || data?.status === 'pending' || data?.type === 'assistance') {
                // Only play newOrder for actually NEW things, not every status update
                if (data?.type === 'assistance' || data?.tableId) {
                    playSound('newOrder');
                }
            }
        };
        socket.on('tableStatusUpdated', refresh);
        socket.on('orderCreated', refresh);
        socket.on('orderUpdated', refresh);
        socket.on('sessionUpdated', refresh);
        socket.on('tableReset', refresh);
        socket.on('assistanceRequested', refresh);
        socket.on('assistanceUpdated', refresh);

        return () => {
            socket.off('tableStatusUpdated', refresh);
            socket.off('orderCreated', refresh);
            socket.off('orderUpdated', refresh);
            socket.off('sessionUpdated', refresh);
            socket.off('tableReset', refresh);
            socket.off('assistanceRequested', refresh);
            socket.off('assistanceUpdated', refresh);
        };
    }, [fetchData]);

    const handleUpdateOrderStatus = async (orderId, newStatus, source = 'session') => {
        // Optimistic UI update
        setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        
        try {
            const endpoint = source === 'new' ? 'new-orders' : 'orders';
            await fetch(`${API_URL}/${endpoint}/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (e) { 
            console.error(e); 
            // Revert on error if needed
            fetchData();
        }
    };

    const handleClearAssistance = async (id) => {
        try {
            await fetch(`${API_URL}/assistance/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });
            // Locally clear to ensure instant UI feedback
            setAssistanceRequests(prev => prev.filter(r => r.id.toString() !== id.toString()));
        } catch (err) { console.error(err); }
    };

    const handleUpdateAssistance = async (id, status) => {
        // Optimistic UI update
        setAssistanceRequests(prev => prev.map(r => r.id.toString() === id.toString() ? { ...r, status } : r));
        
        try {
            await fetch(`${API_URL}/assistance/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (err) { 
            console.error(err);
            fetchData(); // Revert on error
        }
    };

    // Admin Wrapper Methods
    const adminUpdateStatus = async (id, status, isRawOrder = false) => {
        handleUpdateOrderStatus(id, status, isRawOrder ? 'new' : 'session');
    };

    const cancelOrder = async (id) => {
        if (!confirm('Reject this order? The customer will be notified.')) return;
        try {
            await fetch(`${API_URL}/new-orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            fetchData();
        } catch (err) { console.error('Reject failed:', err); }
    };

    const clearTable = async (tableId) => {
        const tableSessions = (activeOrders || []).filter(s => s.tableId === tableId && s._source === 'session');
        if (tableSessions.length === 0) {
            try {
                await fetch(`${API_URL}/tables/${encodeURIComponent(tableId)}/orders`, { method: 'DELETE' });
                fetchData();
            } catch (e) { console.error(e); }
            return;
        }
        if (!confirm(`Clear session for Table ${tableId}?`)) return;
        try {
            await fetch(`${API_URL}/tables/${encodeURIComponent(tableId)}/orders`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const printReceipt = (order) => {
        setSelectedSessionForReceipt(order);
        setTimeout(() => { window.print(); }, 300);
    };

    const handleAdminViewChange = (newView) => {
        if (newView === 'orders') setActiveTab('new_orders');
        else if (newView === 'assistance') setActiveTab('alerts');
        else if (newView === 'pos') setActiveTab('takeaway_pos');
        else setActiveTab(newView);
    };

    // UI Components
    const Sidebar = () => (
        <aside className="w-64 bg-[#0a261f] border-r border-white/5 flex flex-col p-6 hidden lg:flex">
            <div className="flex items-center gap-3 mb-12">
                <img src="/logo-icon.png" className="w-12 h-12 object-contain" alt="Logo" />
                <div>
                    <h2 className="text-white font-serif font-black text-xl leading-none italic tracking-tight">The Nizam</h2>
                    <span className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest opacity-60">Waiter</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
                {[
                    { id: 'all-in-one', label: 'Quick Access', icon: LayoutGrid, count: 0 },
                    { id: 'tables', label: 'Tables', icon: LayoutGrid, count: [...new Set([...(assistanceRequests || []).map(r => (r?.tableId || '').toString().toUpperCase()), ...(activeOrders || []).filter(o => o?.status === 'ready').map(o => (o?.tableId || '').toString().toUpperCase())])].filter(Boolean).length },
                    { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag, count: (activeOrders || []).filter(o => o?.orderType === 'takeaway' && (o?.status === 'new' || o?.status === 'pending')).length },
                    { id: 'new_orders', label: 'New Orders', icon: FileText, count: (activeOrders || []).filter(o => o?._source === 'new' && (o?.status === 'new' || o?.status === 'pending')).length },
                    { id: 'orders', label: 'Ready Orders', icon: ListOrdered, count: (activeOrders || []).filter(o => o?.status === 'ready').length },
                    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, count: (activeOrders || []).filter(o => ['confirmed', 'active', 'ready', 'served'].includes(o?.status) && o?.orderType !== 'takeaway').length },
                    { id: 'billing', label: 'Billing', icon: CreditCard, count: (activeOrders || []).filter(o => ['billed', 'billing_pending'].includes(o?.status)).length },
                    { id: 'alerts', label: 'Alerts', icon: Bell, count: (assistanceRequests || []).filter(r => r?.status === 'pending').length },
                    { id: 'completed', label: 'Completed', icon: CheckSquare, count: (activeOrders || []).filter(o => o?.status === 'completed' && o?.orderType !== 'takeaway').length },
                    { id: 'scheduler', label: 'Scheduler', icon: Clock, count: 0 }
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setView('dashboard'); if("vibrate" in navigator) navigator.vibrate(20); }}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-[#FFD700]/10 text-[#FFD700]' : 'text-[#86a69d] active:bg-white/5'}`}
                    >
                        <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        {item.count > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{item.count}</span>}
                    </button>
                ))}
            </nav>

            <div className="mt-auto space-y-4">
                <button 
                    onClick={() => {
                        setSelectedTable(null);
                        setCart([]);
                        setView('order_entry');
                    }} 
                    className="w-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:bg-[#FFD700]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Plus size={18} strokeWidth={3} /> New Table
                </button>
                <div className="flex items-center gap-3 p-4 bg-black/20 rounded-2xl">
                    <div className="w-10 h-10 bg-[#FFD700]/20 rounded-full flex items-center justify-center text-[#FFD700]">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-white text-xs font-black">Staff #402</p>
                        <p className="text-[#86a69d] text-[10px] font-bold">Shift: Dinner</p>
                    </div>
                </div>
            </div>
        </aside>
    );

    const StatCard = ({ icon: Icon, label, value, sub }) => (
        <div className="bg-black/20 p-5 rounded-3xl flex items-center gap-4 border border-white/5 flex-1">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#86a69d]">
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
                <h4 className="text-white text-xl font-black">{value}</h4>
                {sub && <p className="text-[#86a69d] text-[10px] font-bold">{sub}</p>}
            </div>
        </div>
    );

    const Dashboard = () => {
        const readyOrders = (activeOrders || []).filter(o => o.status === 'ready');
        
        return (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Header */}
                <header className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-black text-white">Live Waiter Portal</h1>
                        <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{(assistanceRequests || []).length} ACTIVE ALERTS</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Search size={20} className="text-[#86a69d]" />
                        <div className="w-8 h-8 rounded-full bg-[#86a69d]/20 flex items-center justify-center">
                            <User size={18} className="text-[#86a69d]" />
                        </div>
                        <Settings size={20} className="text-[#86a69d]" />
                    </div>
                </header>

                <div 
                    className="flex-1 overflow-y-auto p-8 space-y-12 min-h-0"
                >

                    
                    {/* Urgent Assistance - Only show in Alerts tab to reduce clutter in Orders */}
                    {activeTab === 'alerts' && (
                        <section>
                        <h2 className="text-[#FFD700] text-2xl font-serif font-black mb-6 italic tracking-tight">Urgent Assistance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(assistanceRequests || []).map(req => {
                                const isAttended = req.status === 'attended';
                                const createdTime = new Date(req.createdAt);
                                const diffMins = Math.floor((new Date() - createdTime) / 60000);
                                
                                let stateColor = isAttended ? 'border-white/5' : 'border-red-500/30';
                                if (!isAttended && diffMins > 5) stateColor = 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.2)]';

                                return (
                                    <div key={req.id} className={`bg-white/5 border ${stateColor} rounded-[40px] flex flex-col overflow-hidden hover:bg-white/10 transition-all group animate-in slide-in-from-right duration-500 relative`}>
                                        {/* Status Color Strip */}
                                        <div className={`absolute top-0 left-0 w-2 h-full ${isAttended ? 'bg-emerald-500' : 'bg-red-600'} shadow-[4px_0_15px_rgba(0,0,0,0.3)]`}></div>
                                        
                                        <div className="p-8 pl-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                            req.type === 'bill' ? 'bg-[#FFD700] text-[#0F3A2F]' : 
                                                            isAttended ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 
                                                            'bg-red-500 text-white'
                                                        }`}>
                                                            {req.type === 'bill' ? 'BILL REQUEST' : isAttended ? 'ATTENDED' : 'NEW REQUEST'}
                                                        </span>
                                                        {!isAttended && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                                                    </div>
                                                    <h3 className="text-[#FFD700] text-5xl font-serif font-black italic mb-1 uppercase tracking-tighter">Table {req.tableId}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[#FFD700] text-lg font-black tabular-nums">{diffMins}m</p>
                                                    <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest">WAITING</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${isAttended ? 'bg-emerald-500' : 'bg-red-600'}`}>
                                                    {req.type === 'bill' ? <CreditCard size={20} /> : <AlertTriangle size={20} />}
                                                </div>
                                                <p className="text-xs font-bold text-white/60 leading-tight">
                                                    {req.type === 'bill' ? 'Patron is ready for the final bill settlement.' : isAttended ? 'Staff is currently assisting the table.' : 'Customer requires immediate staff attention.'}
                                                </p>
                                            </div>

                                            <div className="flex gap-3">
                                                {!isAttended ? (
                                                    <button 
                                                        onClick={() => handleUpdateAssistance(req.id, 'attended')}
                                                        className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-600/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Check size={18} strokeWidth={3} /> Mark Attended
                                                    </button>
                                                ) : (
                                                    <div className="flex-[2] bg-white/5 border border-white/10 text-white/20 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 cursor-default">
                                                        <CheckCircle size={18} /> In Service
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={() => handleClearAssistance(req.id)}
                                                    className="w-16 h-16 bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl flex items-center justify-center transition-all active:scale-95"
                                                    title="Clear Request"
                                                >
                                                    <X size={24} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {(assistanceRequests || []).length === 0 && (
                                <div className="col-span-full py-12 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-white/20">
                                    <Sparkles size={48} className="mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">No Urgent Calls</p>
                                </div>
                            )}
                        </div>
                        </section>
                    )}

                    {/* Kitchen Ready Section - Show in Orders tab */}
                    {activeTab === 'orders' && readyOrders.length > 0 && (
                        <section className="animate-in slide-in-from-top duration-500">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[#FFD700] text-2xl font-serif font-black italic tracking-tight">Kitchen Dispatch</h2>
                                <span className="bg-green-500/20 text-green-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{readyOrders.length} READY TO SERVE</span>
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                                {readyOrders.map(order => {
                                    const itemsArray = Array.isArray(order.items) ? order.items : [];
                                    return (
                                        <div key={order.id} className="bg-white/5 border border-[#FFD700]/30 rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative min-h-[160px] h-auto">
                                            {/* Status Color Strip */}
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                                            
                                            <div className="p-3 pl-4 flex flex-col h-full">
                                                <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                                                    <h3 className="text-[#FFD700] text-2xl font-serif font-black italic tracking-tighter">Table {order.tableId}</h3>
                                                    <p className="text-green-400 text-[10px] font-black tabular-nums uppercase bg-green-500/10 px-2 py-1 rounded-md">READY</p>
                                                </div>

                                                <div className="flex-1 space-y-2 mb-3">
                                                    {itemsArray.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-start text-xs italic font-medium leading-tight">
                                                            <span className="text-white"><span className="text-[#FFD700] font-black not-italic mr-1.5">{item.qty}x</span> {item.name}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button 
                                                    onClick={() => handleUpdateOrderStatus(order.id, 'served', order._source)}
                                                    className="w-full mt-auto bg-green-500 text-black py-2.5 rounded-xl font-black uppercase text-sm tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={16} strokeWidth={3} /> Serve
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>                        </section>
                    )}

                    {/* New & Processing Orders - Show in Orders tab */}
                    {activeTab === 'orders' && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[#FFD700] text-2xl font-serif font-black italic tracking-tight">Active Floor Orders</h2>
                                <div className="flex items-center gap-2 text-[#86a69d] text-[10px] font-black uppercase tracking-widest">
                                    Processing {(activeOrders || []).filter(o => ['new', 'pending', 'accepted', 'confirmed', 'active', 'ready'].includes(o.status)).length}
                                </div>
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                                {(activeOrders || []).filter(o => !['completed', 'cancelled', 'ready', 'billed', 'billing_pending'].includes(o.status)).map(order => {
                                    const isNew = order.status === 'new' || order.status === 'pending';
                                    const isReady = order.status === 'ready';
                                    return (
                                        <div key={`order-${order.id}`} className={`bg-white/5 border rounded-2xl flex flex-col overflow-hidden transition-all duration-500 relative border-white/10 min-h-[160px] h-auto`}>
                                        {/* Status Color Strip */}
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${
                                            isReady ? 'bg-[#FFD700]' : 
                                            isNew ? 'bg-blue-500' : 'bg-orange-500'
                                        }`}></div>

                                        <div className="p-3 pl-4 flex flex-col h-full">
                                            <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                                                <h3 className="text-[#FFD700] text-2xl font-serif font-black italic tracking-tighter">Table {order.tableId}</h3>
                                                <p className={`text-[10px] font-black uppercase tabular-nums px-2 py-1 rounded-md ${isReady ? 'text-[#FFD700] bg-[#FFD700]/10' : isNew ? 'text-blue-400 bg-blue-500/10' : 'text-orange-400 bg-orange-500/10'}`}>
                                                    {order.status}
                                                </p>
                                            </div>

                                            <div className="flex-1 space-y-2 mb-4">
                                                {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
                                                    <div key={i} className="flex justify-between items-start text-xs italic font-medium leading-tight">
                                                        <span className="text-white"><span className="text-[#FFD700] font-black not-italic mr-1.5">{item.qty}x</span> {item.name}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center mb-3 px-1 border-t border-white/5 pt-3">
                                                <div className="text-[9px] font-black text-[#86a69d] tracking-widest uppercase">Total Due</div>
                                                <div className="text-xl font-serif font-black text-[#FFD700]">£{Number(order.finalTotal || 0).toFixed(2)}</div>
                                            </div>

                                            <div className="mt-auto flex gap-2">
                                                {isNew ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleUpdateOrderStatus(order.id, 'confirmed', order._source)}
                                                            className="flex-[2] bg-[#FFD700] text-[#0F3A2F] py-2 rounded-xl font-black uppercase text-xs tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-1"
                                                        >
                                                            <CheckCircle size={14} /> Accept
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedTable(order.tableId);
                                                                setCart(order.items || []);
                                                                setView('order_entry');
                                                            }}
                                                            className="flex-1 bg-white/5 text-white/60 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform border border-white/10"
                                                        >
                                                            Edit
                                                        </button>
                                                    </>
                                                ) : (order.status === 'billed' || order.status === 'billing_pending') ? (
                                                    <button 
                                                        onClick={() => { setSelectedTable(order.tableId); setView('table_details'); }}
                                                        className="w-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] py-2 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform"
                                                    >
                                                        Awaiting Settlement
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => {
                                                                if (confirm(`Request final bill for Table ${order.tableId}? Total: £${Number(order.finalTotal || 0).toFixed(2)}`)) {
                                                                    handleUpdateOrderStatus(order.id, 'billing_pending', order._source);
                                                                }
                                                            }}
                                                            className="flex-[2] bg-[#FFD700] text-[#0F3A2F] py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-transform"
                                                        >
                                                            <CreditCard size={12} /> Bill
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedTable(order.tableId);
                                                                setCart(order.items || []);
                                                                setEditingOrder({ id: order.id, type: order._source });
                                                                setView('order_entry');
                                                            }}
                                                            className="flex-1 bg-white/10 text-white py-2.5 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-transform"
                                                        >
                                                            Modify
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Billing Orders - Show in Billing tab */}
                    {activeTab === 'billing' && (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[#FFD700] text-2xl font-serif font-black italic tracking-tight">Pending Settlements</h2>
                                <div className="flex items-center gap-2 text-[#86a69d] text-[10px] font-black uppercase tracking-widest">
                                    Awaiting {(activeOrders || []).filter(o => ['billed', 'billing_pending'].includes(o.status)).length}
                                </div>
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                                {(activeOrders || []).filter(o => ['billed', 'billing_pending'].includes(o.status)).map(order => {
                                    return (
                                        <div key={`billing-${order.id}`} className={`bg-white/5 border rounded-2xl flex flex-col overflow-hidden transition-all duration-500 relative border-[#FFD700]/30 min-h-[160px] h-auto`}>
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FFD700]"></div>
                                            <div className="p-3 pl-4 flex flex-col h-full">
                                                <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                                                    <h3 className="text-[#FFD700] text-2xl font-serif font-black italic tracking-tighter">Table {order.tableId}</h3>
                                                    <p className="text-[#FFD700] text-[10px] font-black uppercase tabular-nums px-2 py-1 rounded-md bg-[#FFD700]/10">
                                                        {order.status}
                                                    </p>
                                                </div>
                                                <div className="flex-1 space-y-2 mb-4">
                                                    {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
                                                        <div key={i} className="flex justify-between items-start text-xs italic font-medium leading-tight">
                                                            <span className="text-white"><span className="text-[#FFD700] font-black not-italic mr-1.5">{item.qty}x</span> {item.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center mb-3 px-1 border-t border-white/5 pt-3">
                                                    <div className="text-[9px] font-black text-[#86a69d] tracking-widest uppercase">Total Due</div>
                                                    <div className="text-xl font-serif font-black text-[#FFD700]">£{Number(order.finalTotal || 0).toFixed(2)}</div>
                                                </div>
                                                <div className="mt-auto">
                                                    <button 
                                                        onClick={() => { setSelectedTable(order.tableId); setView('table_details'); }}
                                                        className="w-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform"
                                                    >
                                                        Awaiting Settlement at Counter
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Admin Integrated Views */}
                    {activeTab === 'all-in-one' && (
                        <div className="w-full">
                            <AdminQuickAccess 
                                newOrders={activeOrders.filter(o => o._source === 'new')}
                                sessions={activeOrders.filter(o => o._source === 'session')}
                                updateStatus={adminUpdateStatus}
                                cancelOrder={cancelOrder}
                                printReceipt={printReceipt}
                                clearTable={clearTable}
                                assistanceRequests={assistanceRequests}
                                updateAssistance={handleUpdateAssistance}
                                onViewChange={handleAdminViewChange}
                            />
                        </div>
                    )}
                    {activeTab === 'takeaway' && (
                        <div className="w-full">
                            <AdminTakeawayManager 
                                sessions={activeOrders.filter(o => o._source === 'session')}
                                newOrders={activeOrders.filter(o => o._source === 'new')}
                                updateStatus={adminUpdateStatus}
                                onViewChange={handleAdminViewChange}
                                onEdit={(order) => {
                                    setEditingTakeaway(order);
                                    setActiveTab('takeaway_pos');
                                }}
                            />
                        </div>
                    )}
                    {activeTab === 'takeaway_pos' && (
                        <div className="w-full">
                            <AdminTakeawayPOS 
                                initialOrder={editingTakeaway}
                                onComplete={() => {
                                    setEditingTakeaway(null);
                                    setActiveTab('takeaway');
                                }}
                            />
                        </div>
                    )}
                    {activeTab === 'new_orders' && (
                        <div className="w-full">
                            <AdminNewOrders 
                                orders={activeOrders.filter(o => o._source === 'new')}
                                updateStatus={(id, status) => adminUpdateStatus(id, status, true)}
                                cancelOrder={cancelOrder}
                            />
                        </div>
                    )}
                    {activeTab === 'confirmed' && (
                        <div className="w-full">
                            <AdminFloorStatus 
                                orders={activeOrders.filter(o => o._source === 'session')}
                                updateStatus={adminUpdateStatus}
                                printReceipt={printReceipt}
                                API_URL={API_URL}
                            />
                        </div>
                    )}
                    {activeTab === 'completed' && (
                        <div className="w-full">
                            <AdminCompletedView 
                                orders={activeOrders.filter(o => o._source === 'session')}
                                clearTable={clearTable}
                                printReceipt={printReceipt}
                            />
                        </div>
                    )}
                    {activeTab === 'scheduler' && (
                        <div className="w-full">
                            <AdminUnavailabilityScheduler />
                        </div>
                    )}
                </div>

                {/* Bottom Stats */}
                <footer className="px-8 py-6 bg-black/20 border-t border-white/5 flex gap-6 overflow-x-auto">
                    <StatCard icon={Clock} label="Avg Response Time" value="1m 42s" />
                    <StatCard icon={ArrowUpRight} label="Total Served (Shift)" value="42 Covers" />
                    <StatCard icon={CheckCircle} label="Efficiency Rating" value="98%" />
                    <div className="flex flex-col justify-center px-4 shrink-0">
                        <div className="flex items-center gap-2 text-[#86a69d] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div> System Live
                        </div>
                        <p className="text-white/30 text-[9px] font-bold uppercase">Terminal 04</p>
                    </div>
                </footer>
            </div>
        );
    };

    const renderTableMap = () => {
        const tTables = Array.from({length: 4}, (_, i) => `T${String(i+1).padStart(2, '0')}`);
        const bTables = Array.from({length: 6}, (_, i) => `B${String(i+1).padStart(2, '0')}`);
        const cTables = Array.from({length: 13}, (_, i) => `C${String(i+1).padStart(2, '0')}`);
        
    const getTableColor = (tableId) => {
        const normalizedId = tableId.toString().toUpperCase();
        
        const needsHelp = (assistanceRequests || []).some(r => {
            const rId = (r.tableId || '').toString().toUpperCase();
            return rId === normalizedId && r.status === 'pending';
        });
        if (needsHelp) return 'bg-blue-600 border-blue-400 text-white animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.4)]';
        
        const hasReadyOrder = (activeOrders || []).some(o => {
            const oId = (o.tableId || '').toString().toUpperCase();
            return oId === normalizedId && o.status === 'ready';
        });
        if (hasReadyOrder) return 'bg-[#FFD700] border-[#FFD700] text-[#0F3A2F] animate-pulse shadow-[0_0_25px_rgba(255,215,0,0.6)]';

        const status = (tables[normalizedId] || 'free').toLowerCase();
        switch (status) {
            case 'free': return 'bg-white/5 border-white/10 text-[#86a69d] hover:bg-white/10';
            case 'ordering': return 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]';
            case 'occupied': return 'bg-red-500/10 border-red-500/30 text-red-400';
            case 'billing': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
            default: return 'bg-white/5 border-white/10 text-[#86a69d]';
        }
    };

        return (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <header className="px-8 py-6 border-b border-white/5">
                    <h1 className="text-2xl font-black text-white">Floor Mapping</h1>
                    <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time occupancy status</p>
                </header>
                <div className="flex-1 overflow-y-auto p-8 min-h-0">
                    {[{ title: 'Royal Tables', data: tTables }, { title: 'Private Boxes', data: bTables }, { title: 'Heritage Chowkies', data: cTables }].map(section => {
                        const sectionAlerts = section.data.filter(tableId => {
                            const normalizedId = tableId.toUpperCase();
                            return (assistanceRequests || []).some(r => (r.tableId || '').toString().toUpperCase() === normalizedId) || 
                                   (activeOrders || []).some(o => (o.tableId || '').toString().toUpperCase() === normalizedId && o.status === 'ready');
                        }).length;

                        return (
                            <div key={section.title} className="mb-12">
                                <h2 className="text-[#FFD700] text-sm font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                                    <span className="flex items-center gap-3">
                                        {section.title}
                                        {sectionAlerts > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse tracking-normal">
                                                {sectionAlerts}
                                            </span>
                                        )}
                                    </span>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                {section.data.map(t => {
                                    const tableOrders = (activeOrders || []).filter(o => (o.tableId || '').toString().toUpperCase() === t.toUpperCase() && o.status !== 'completed' && o.status !== 'rejected');
                                    const tableTotal = (tableOrders || []).reduce((sum, o) => sum + Number(o.finalTotal || 0), 0);
                                    
                                    return (
                                        <button 
                                            key={t}
                                            onClick={() => { setSelectedTable(t); setView('table_details'); }}
                                            className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center transition-all active:scale-90 ${getTableColor(t)}`}
                                        >
                                            <span className="text-4xl font-serif font-black">{t}</span>
                                            {tableTotal > 0 ? (
                                                <span className="text-xs font-black text-white/90 mt-1 bg-black/20 px-2 py-0.5 rounded-lg">£{(tableTotal || 0).toFixed(2)}</span>
                                            ) : (
                                                <span className="text-xs font-black uppercase opacity-60 mt-1">{tables[t] || 'Free'}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>
        );
    };

    const renderTableDetails = () => {
        const tableOrders = (activeOrders || []).filter(o => o.tableId === selectedTable && o.status !== 'completed' && o.status !== 'rejected');
        const tableAssistance = (assistanceRequests || []).find(r => r.tableId === selectedTable);
        const totalBill = (tableOrders || []).reduce((sum, order) => sum + (order.finalTotal || 0), 0);

        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a261f]/30">
                <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('dashboard')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-5xl font-black text-[#FFD700] font-serif">Table {selectedTable}</h1>
                            <p className="text-[#86a69d] text-xs font-black uppercase tracking-[0.2em] mt-2">Table Management Console</p>
                        </div>
                    </div>
                    <button onClick={() => setView('order_entry')} className="bg-[#FFD700] text-[#0F3A2F] px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-xl">
                        <Plus size={18} strokeWidth={3} /> New Order
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {tableAssistance && (
                        <div className="bg-blue-600/20 border border-blue-500/50 rounded-[32px] p-8 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white animate-bounce">
                                    <Bell size={32} />
                                </div>
                                <div>
                                    <h3 className="text-white text-xl font-black uppercase tracking-tight">Assistance Requested</h3>
                                    <p className="text-blue-200 text-sm opacity-80">Guest is awaiting your arrival for {tableAssistance.type || 'service'}.</p>
                                </div>
                            </div>
                            <button onClick={() => handleClearAssistance(tableAssistance.id)} className="bg-white text-blue-700 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-xl">
                                Attend Now
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h2 className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.3em] mb-6">Active Table Orders</h2>
                        {tableOrders.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                                <Utensils size={48} className="mx-auto text-white/10 mb-4" />
                                <p className="text-white/20 font-black uppercase tracking-widest">No Active Orders</p>
                            </div>
                        ) : (
                            tableOrders.map(order => (
                                <div key={order.id} className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">ORDER #{order.id}</span>
                                            <div className="text-white font-bold text-lg capitalize">{order.status}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {order.status === 'ready' && (
                                                <button 
                                                    onClick={() => handleUpdateOrderStatus(order.id, 'served', order._source)}
                                                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-xl flex items-center gap-2"
                                                >
                                                    <Check size={18} strokeWidth={3} /> Mark Served
                                                </button>
                                            )}
                                            {['new', 'pending', 'accepted', 'confirmed', 'active'].includes(order.status) && (
                                                <button 
                                                    onClick={() => {
                                                        setSelectedTable(order.tableId);
                                                        setCart(order.items || []);
                                                        setEditingOrder({ id: order.id, type: order._source });
                                                        setView('order_entry');
                                                        if("vibrate" in navigator) navigator.vibrate(50);
                                                    }}
                                                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                                                >
                                                    Modify Order
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center bg-black/20 p-4 rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 bg-[#FFD700]/10 rounded-lg flex items-center justify-center text-[#FFD700] font-black">x{item.qty}</span>
                                                    <span className="text-white font-bold">{item.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <footer className="p-8 border-t border-white/5 flex flex-col gap-6 bg-black/40">
                    <div className="flex justify-between items-end px-4">
                        <div>
                            <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.3em] mb-1">Total Table Balance</p>
                            <p className="text-white/40 text-xs font-bold">{tableOrders.length} active orders</p>
                        </div>
                        <div className="text-right">
                            <span className="text-5xl font-serif font-black text-[#FFD700]">£{(totalBill || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => {
                                if (tableOrders.length === 0) return alert("No active orders to settle.");
                                if (confirm(`Request final bill for Table ${selectedTable}? Total: £${(totalBill || 0).toFixed(2)}`)) {
                                    tableOrders.forEach(o => handleUpdateOrderStatus(o.id, 'billing_pending', o._source));
                                    alert("Bill request sent to counter.");
                                    setView('dashboard');
                                }
                            }}
                            className="flex-1 bg-[#FFD700] text-[#0F3A2F] py-6 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#FFD700]/20"
                        >
                            <CreditCard size={24} /> Settle & Bill Table
                        </button>
                        <button 
                            onClick={() => setView('dashboard')}
                            className="w-20 bg-white/5 hover:bg-white/10 text-white/20 hover:text-white rounded-[2rem] flex items-center justify-center transition-all border border-white/5"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    </div>
                </footer>
            </div>
        );
    };

    const renderOrderEntry = () => {
        const filteredMenu = (menu || []).filter(item => (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()));

        const addToCart = (item) => {
            setCart(prev => {
                const ex = prev.find(i => i.id === item.id);
                if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
                return [...prev, { ...item, qty: 1 }];
            });
        };

        const submitOrder = async () => {
            if (cart.length === 0) return;
            if (!selectedTable && !editingOrder) {
                alert("Please select a table first.");
                setView('dashboard');
                setActiveTab('tables');
                return;
            }
            const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 0)), 0);
            
            try {
                if (editingOrder) {
                    // Update existing order
                    const res = await fetch(`${API_URL}/orders/${editingOrder.id}/items`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            items: cart, 
                            finalTotal: subtotal,
                            type: editingOrder.type
                        })
                    });
                    if (res.ok) { 
                        setCart([]); 
                        setEditingOrder(null);
                        setView('dashboard'); 
                    } else {
                        const err = await res.json();
                        alert(`Error: ${err.error || 'Failed to update order'}`);
                    }
                } else {
                    // Create new order
                    const orderData = { 
                        tableId: selectedTable, 
                        items: cart, 
                        finalTotal: subtotal, 
                        status: 'new', 
                        orderType: 'dine-in',
                        isStaff: true
                    };
                    const res = await fetch(`${API_URL}/orders`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData)
                    });
                    if (res.ok) { setCart([]); setView('dashboard'); }
                    else {
                        const err = await res.json();
                        alert(`Error: ${err.error || 'Failed to record order'}`);
                    }
                }
            } catch (error) { console.error(error); }
        };

        return (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="px-4 md:px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button onClick={() => setView('table_details')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"><ArrowLeft size={20} /></button>
                            <h1 className="text-xl font-black text-white truncate">Menu • {selectedTable || 'Select Table'}</h1>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search dishes..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#FFD700]/50"
                            />
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredMenu.map(item => (
                                <button key={item.id} onClick={() => addToCart(item)} className="bg-white/5 border border-white/5 rounded-[32px] p-6 text-left hover:bg-[#FFD700]/5 transition-all group active:scale-95">
                                    <h3 className="text-white font-bold mb-1 group-hover:text-[#FFD700] transition-colors">{item.name}</h3>
                                    <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest mb-4">{item.category}</p>
                                    <div className="text-[#FFD700] font-black text-lg">£{(item.price || 0).toFixed(2)}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Order Basket - Collapsible/Responsive */}
                <div className="w-full lg:w-96 bg-black/40 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-[40vh] lg:h-full">
                    <div className="px-8 py-4 border-b border-white/5 font-black text-[10px] uppercase tracking-widest text-[#86a69d] flex justify-between items-center">
                        <span>Order Basket</span>
                        <span className="bg-[#FFD700] text-[#0F3A2F] px-2 py-0.5 rounded-full text-[9px]">{cart.length} ITEMS</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-sm">
                                <Utensils size={32} className="mb-2" />
                                <p>Basket is empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="bg-white/5 rounded-3xl p-4 flex items-center justify-between">
                                    <div className="min-w-0 mr-4">
                                        <div className="text-white font-bold text-sm truncate">{item.name}</div>
                                        <div className="text-[#FFD700] font-black text-xs mt-1">£{((item.price || 0) * (item.qty || 0)).toFixed(2)}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 shrink-0">
                                            <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0))} className="w-8 h-8 flex items-center justify-center text-white/40 active:text-white"><Minus size={14} /></button>
                                            <span className="text-white font-black text-sm w-4 text-center">{item.qty}</span>
                                            <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-white/40 active:text-white"><Plus size={14} /></button>
                                        </div>
                                        <button 
                                            onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                                            className="w-10 h-10 flex items-center justify-center text-red-500/40 active:text-red-500 active:bg-red-500/10 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-6 md:p-8 bg-black/40 border-t border-white/5">
                        <button onClick={submitOrder} disabled={cart.length === 0} className="w-full bg-[#FFD700] text-[#0F3A2F] py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm active:scale-95 shadow-[0_0_30px_rgba(255,215,0,0.25)] disabled:opacity-50">
                            Dispatch to Kitchen
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[100dvh] bg-[#0F3A2F] text-white font-sans selection:bg-[#FFD700] selection:text-[#0F3A2F] flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {view === 'dashboard' && (activeTab === 'tables' ? renderTableMap() : Dashboard())}
                {view === 'table_details' && renderTableDetails()}
                {view === 'order_entry' && renderOrderEntry()}
            </main>
        </div>
    );
}
