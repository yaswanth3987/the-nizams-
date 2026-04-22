import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Clock, CheckCircle, AlertTriangle, Bell, Search, 
    Plus, Minus, X, Utensils, CreditCard, ArrowLeft,
    Check
} from 'lucide-react';
import { socket } from '../utils/socket';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function WaitersPortal() {
    const [tables, setTables] = useState({});
    const [activeOrders, setActiveOrders] = useState([]);
    const [assistanceRequests, setAssistanceRequests] = useState([]);
    const [menu, setMenu] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [view, setView] = useState('grid'); // 'grid' | 'table_details' | 'order_entry'
    
    // Order entry state
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    
    // Polling interval for timers
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch initial data
    const fetchData = useCallback(async () => {
        try {
            const [tablesRes, ordersRes, helpRes, menuRes] = await Promise.all([
                fetch(`${API_URL}/table-status`),
                fetch(`${API_URL}/new-orders`), // and maybe sessions? Wait, new-orders gets new/pending. We also need sessions for active orders!
                fetch(`${API_URL}/assistance`),
                fetch(`${API_URL}/menu`)
            ]);
            
            const [tablesData, helpData, menuData] = await Promise.all([
                tablesRes.json(), helpRes.json(), menuRes.json()
            ]);
            
            // For orders, we need both new and active sessions
            const sessionsRes = await fetch(`${API_URL}/orders`);
            const sessionsData = await sessionsRes.json();
            const ordersData = await ordersRes.json();

            setTables(tablesData);
            setAssistanceRequests(helpData.filter(r => r.status === 'pending'));
            setMenu(menuData);
            
            // Combine and format orders
            const allOrders = [...(Array.isArray(ordersData)?ordersData:[]), ...(Array.isArray(sessionsData)?sessionsData:[])];
            setActiveOrders(allOrders);

        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();

        const handleTableUpdate = () => fetchData(); // Simplest way to keep everything strictly in sync
        const handleOrderUpdate = () => fetchData();
        const handleAssistance = () => fetchData();

        socket.on('tableStatusUpdated', handleTableUpdate);
        socket.on('orderCreated', handleOrderUpdate);
        socket.on('orderUpdated', handleOrderUpdate);
        socket.on('sessionUpdated', handleOrderUpdate);
        socket.on('tableReset', handleTableUpdate);
        socket.on('assistanceRequested', handleAssistance);
        socket.on('assistanceUpdated', handleAssistance);

        return () => {
            socket.off('tableStatusUpdated', handleTableUpdate);
            socket.off('orderCreated', handleOrderUpdate);
            socket.off('orderUpdated', handleOrderUpdate);
            socket.off('sessionUpdated', handleOrderUpdate);
            socket.off('tableReset', handleTableUpdate);
            socket.off('assistanceRequested', handleAssistance);
            socket.off('assistanceUpdated', handleAssistance);
        };
    }, [fetchData]);

    // Derived Data
    const getTableColor = (tableId) => {
        // Find if table has pending assistance
        const needsHelp = assistanceRequests.some(r => r.tableId === tableId);
        if (needsHelp) return 'bg-blue-600 border-blue-400 text-white animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.5)]';
        
        const status = tables[tableId] || 'free';
        switch (status) {
            case 'free': return 'bg-[#154a3c] border-[#1f6b57] text-[#86a69d] hover:bg-[#1a5c4a]';
            case 'ordering': return 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37]';
            case 'occupied': return 'bg-red-900/40 border-red-500/50 text-red-200';
            case 'billing': return 'bg-purple-900/40 border-purple-500/50 text-purple-200';
            default: return 'bg-[#154a3c] border-[#1f6b57] text-[#86a69d]';
        }
    };

    const handleTableClick = (tableId) => {
        setSelectedTable(tableId);
        setView('table_details');
    };

    const renderTableGrid = () => {
        const tTables = Array.from({length: 4}, (_, i) => `T${String(i+1).padStart(2, '0')}`);
        const bTables = Array.from({length: 6}, (_, i) => `B${String(i+1).padStart(2, '0')}`);
        const cTables = Array.from({length: 13}, (_, i) => `C${String(i+1).padStart(2, '0')}`);
        
        return (
            <div className="p-4 sm:p-6 pb-24 h-full overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-3xl font-serif font-black text-[#FFD700] mb-1 tracking-tight">Floor Map</h1>
                        <p className="text-[#86a69d] text-sm">Select a table to manage orders</p>
                    </div>
                </div>

                {assistanceRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-white text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Bell className="text-blue-400" size={16} /> Action Required
                        </h2>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                            {assistanceRequests.map(req => (
                                <button key={req.id} onClick={() => handleTableClick(req.tableId)} className="bg-blue-600 shrink-0 px-6 py-3 rounded-xl border-2 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex flex-col items-start active:scale-95 transition-transform">
                                    <span className="text-white font-black text-xl">{req.tableId}</span>
                                    <span className="text-blue-200 text-xs font-bold uppercase">{req.type || 'Staff Call'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {[{ title: 'Tables', data: tTables }, { title: 'Boxes', data: bTables }, { title: 'Chowkies', data: cTables }].map(section => (
                    <div key={section.title} className="mb-8">
                        <h2 className="text-[#86a69d] text-xs font-black uppercase tracking-[0.2em] mb-4 border-b border-[#ffffff]/10 pb-2">{section.title}</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                            {section.data.map(t => {
                                const activeItems = activeOrders.filter(o => o.tableId === t && !['completed', 'rejected'].includes(o.status)).length;
                                return (
                                    <button 
                                        key={t}
                                        onClick={() => handleTableClick(t)}
                                        className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-90 ${getTableColor(t)}`}
                                    >
                                        <span className="text-2xl sm:text-3xl font-black font-serif">{t}</span>
                                        {activeItems > 0 && <span className="text-[10px] sm:text-xs font-bold bg-black/30 px-2 py-0.5 rounded-full mt-1">{activeItems} Orders</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const handleUpdateOrderStatus = async (orderId, newStatus, isNewOrder = false) => {
        try {
            const endpoint = isNewOrder ? 'new-orders' : 'orders';
            await fetch(`${API_URL}/${endpoint}/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (e) { console.error(e); }
    };

    const renderTableDetails = () => {
        const tableOrders = activeOrders.filter(o => o.tableId === selectedTable && o.status !== 'completed' && o.status !== 'rejected');
        const tableAssistance = assistanceRequests.find(r => r.tableId === selectedTable);

        const handleClearAssistance = async () => {
            if (!tableAssistance) return;
            await fetch(`${API_URL}/assistance/${tableAssistance.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'resolved' })
            });
        };

        const handleCloseTable = async () => {
            if (window.confirm(`Are you sure you want to close table ${selectedTable}? This will clear all orders and reset the session.`)) {
                await fetch(`${API_URL}/tables/${selectedTable}/orders`, { method: 'DELETE' });
                setView('grid');
            }
        };

        return (
            <div className="p-4 sm:p-6 pb-24 h-full overflow-y-auto no-scrollbar flex flex-col">
                <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[#0F3A2F] py-2 z-10">
                    <button onClick={() => setView('grid')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-black text-[#FFD700] leading-none">{selectedTable}</h1>
                        <p className="text-[#86a69d] text-xs font-bold uppercase tracking-widest mt-1">Manage Table</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <button onClick={() => setView('order_entry')} className="h-12 px-6 bg-[#FFD700] text-[#0F3A2F] rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-lg">
                            <Plus size={18} strokeWidth={3} /> Add Order
                        </button>
                    </div>
                </div>

                {tableAssistance && (
                    <div className="bg-blue-600 rounded-3xl p-6 mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)] border-2 border-blue-400 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                                <Bell className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-lg">Assistance Requested</h3>
                                <p className="text-blue-200 text-sm">{tableAssistance.type === 'bill' ? 'Customer is asking for the bill' : 'General staff assistance'}</p>
                            </div>
                        </div>
                        <button onClick={handleClearAssistance} className="bg-white text-blue-700 px-6 py-3 rounded-xl font-black uppercase text-xs active:scale-95 hover:bg-blue-50">
                            Mark Attended
                        </button>
                    </div>
                )}

                <div className="flex-1 space-y-4 mb-8">
                    <h2 className="text-[#86a69d] text-xs font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2 mb-4">Active Orders</h2>
                    
                    {tableOrders.length === 0 ? (
                        <div className="bg-white/5 rounded-3xl p-10 text-center border-2 border-dashed border-white/10">
                            <Utensils className="mx-auto text-white/20 mb-4" size={32} />
                            <p className="text-white/40 font-bold uppercase text-xs tracking-widest">No active orders</p>
                        </div>
                    ) : (
                        tableOrders.map(order => {
                            const isNew = order.status === 'new' || order.status === 'pending';
                            const isReady = order.status === 'ready';
                            
                            const itemsArray = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items) } catch(e) { return [] } })() : []);
                            const elapsedMins = Math.floor((now - new Date(order.createdAt).getTime()) / 60000);

                            return (
                                <div key={order.id} className="bg-white/5 rounded-[24px] p-5 border border-white/10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[#FFD700] font-black text-sm uppercase">Order #{order.id}</span>
                                                <span className="bg-white/10 text-white/70 text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider flex items-center gap-1">
                                                    <Clock size={10} /> {elapsedMins}m ago
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold capitalize text-[#86a69d]">Status: <span className="text-white">{order.status}</span></div>
                                        </div>
                                        
                                        {isReady ? (
                                            <button onClick={() => handleUpdateOrderStatus(order.id, 'served', false)} className="bg-green-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                                <Check size={16} strokeWidth={3} /> Mark Served
                                            </button>
                                        ) : order.status === 'served' ? (
                                            <div className="bg-white/10 text-[#86a69d] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                                <Check size={14} /> Served
                                            </div>
                                        ) : null}
                                    </div>
                                    
                                    <div className="bg-black/20 rounded-xl p-4 space-y-2">
                                        {itemsArray.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 bg-white/10 flex items-center justify-center rounded text-xs font-black text-[#FFD700]">{item.qty}x</span>
                                                    <span className="font-bold text-white/90">{item.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <button onClick={() => handleUpdateOrderStatus(tableOrders[0]?.id || 0, 'billed')} disabled={tableOrders.length === 0} className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
                        <CreditCard size={18} /> Request Bill
                    </button>
                    <button onClick={handleCloseTable} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-red-500/30">
                        <X size={18} strokeWidth={3} /> Close Table
                    </button>
                </div>
            </div>
        );
    };

    const renderOrderEntry = () => {
        const categories = [...new Set(menu.map(i => i.category))];
        const filteredMenu = menu.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()));

        const addToCart = (item) => {
            setCart(prev => {
                const ex = prev.find(i => i.id === item.id);
                if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
                return [...prev, { ...item, qty: 1 }];
            });
        };

        const updateCartQty = (id, delta) => {
            setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
        };

        const submitOrder = async () => {
            if (cart.length === 0) return;
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            
            const orderData = {
                tableId: selectedTable,
                items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
                finalTotal: subtotal,
                subtotal: subtotal,
                serviceCharge: 0,
                status: 'new',
                orderType: 'dine-in'
            };

            try {
                const res = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                if (res.ok) {
                    setCart([]);
                    setView('table_details');
                }
            } catch (error) {
                console.error(error);
            }
        };

        return (
            <div className="h-screen flex flex-col bg-[#0F3A2F]">
                {/* Header */}
                <div className="flex items-center gap-4 p-4 sm:p-6 bg-[#0a261f]">
                    <button onClick={() => setView('table_details')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white shrink-0">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black font-serif text-[#FFD700]">Add to {selectedTable}</h1>
                    </div>
                    <div className="relative flex-1 max-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/20 text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
                        />
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Menu Items */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {filteredMenu.map(item => (
                                <button key={item.id} onClick={() => addToCart(item)} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left hover:bg-white/10 active:scale-95 transition-all flex flex-col h-full">
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-sm leading-tight mb-1">{item.name}</h3>
                                        <p className="text-[#86a69d] text-[10px] uppercase font-black tracking-widest">{item.category}</p>
                                    </div>
                                    <div className="mt-3 font-black text-[#FFD700]">£{item.price.toFixed(2)}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cart Sidebar */}
                    <div className="w-80 bg-black/20 flex flex-col border-l border-white/5">
                        <div className="p-4 bg-black/20 font-black text-sm uppercase tracking-widest text-[#86a69d]">Current Order</div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                            {cart.length === 0 ? (
                                <div className="text-center text-white/30 text-xs font-bold uppercase py-10">Cart is empty</div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="bg-white/5 rounded-xl p-3">
                                        <div className="font-bold text-sm text-white mb-2 leading-tight">{item.name}</div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[#FFD700] font-black text-sm">£{(item.price * item.qty).toFixed(2)}</div>
                                            <div className="flex items-center gap-3 bg-black/30 rounded-lg p-1">
                                                <button onClick={() => updateCartQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white active:scale-90 bg-white/5 rounded-md"><Minus size={14} /></button>
                                                <span className="font-black text-sm w-4 text-center">{item.qty}</span>
                                                <button onClick={() => updateCartQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white active:scale-90 bg-white/5 rounded-md"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-black/40">
                            <button onClick={submitOrder} disabled={cart.length === 0} className="w-full bg-[#FFD700] text-[#0F3A2F] disabled:opacity-50 py-4 rounded-xl font-black uppercase tracking-widest text-sm active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                                Send to Kitchen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0F3A2F] text-white font-sans selection:bg-[#FFD700] selection:text-[#0F3A2F]">
            {view === 'grid' && renderTableGrid()}
            {view === 'table_details' && renderTableDetails()}
            {view === 'order_entry' && renderOrderEntry()}
        </div>
    );
}
