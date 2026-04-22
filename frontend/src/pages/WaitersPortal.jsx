import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Clock, CheckCircle, AlertTriangle, Bell, Search, 
    Plus, Minus, X, Utensils, CreditCard, ArrowLeft,
    Check, LayoutGrid, ListOrdered, Settings, User, 
    ArrowUpRight, Flame, Sparkles, Filter, MoreVertical,
    Coffee, Wine, UtensilsCrossed
} from 'lucide-react';
import { socket } from '../utils/socket';

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
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
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
                fetch(`${API_URL}/orders`)
            ]);
            
            const [tablesData, ordersData, helpData, menuData, sessionsData] = await Promise.all([
                tablesRes.json(), ordersRes.json(), helpRes.json(), menuRes.json(), sessionsRes.json()
            ]);

            setTables(tablesData);
            setAssistanceRequests(helpData.filter(r => r.status === 'pending'));
            setMenu(menuData);
            
            const allOrders = [
                ...(Array.isArray(ordersData) ? ordersData.map(o => ({...o, _source: 'new'})) : []), 
                ...(Array.isArray(sessionsData) ? sessionsData.map(o => ({...o, _source: 'session'})) : [])
            ];
            setActiveOrders(allOrders);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const refresh = () => fetchData();
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
        try {
            const endpoint = source === 'new' ? 'new-orders' : 'orders';
            await fetch(`${API_URL}/${endpoint}/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (e) { console.error(e); }
    };

    const handleClearAssistance = async (id) => {
        await fetch(`${API_URL}/assistance/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'resolved' })
        });
    };

    // UI Components
    const Sidebar = () => (
        <aside className="w-64 bg-[#0a261f] border-r border-white/5 flex flex-col p-6 hidden lg:flex">
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center text-[#0F3A2F]">
                    <Utensils size={24} strokeWidth={3} />
                </div>
                <div>
                    <h2 className="text-white font-serif font-black text-xl leading-none">The Nizam</h2>
                    <span className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest">Floor Captain</span>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {[
                    { id: 'tables', label: 'Tables', icon: LayoutGrid },
                    { id: 'orders', label: 'Orders', icon: ListOrdered },
                    { id: 'alerts', label: 'Alerts', icon: Bell, count: assistanceRequests.length },
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setView('dashboard'); }}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-[#FFD700]/10 text-[#FFD700]' : 'text-[#86a69d] hover:bg-white/5'}`}
                    >
                        <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        {item.count > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{item.count}</span>}
                    </button>
                ))}
            </nav>

            <div className="mt-auto space-y-4">
                <button onClick={() => setView('order_entry')} className="w-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#FFD700]/20 transition-all active:scale-95 flex items-center justify-center gap-2">
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
        const readyOrders = activeOrders.filter(o => o.status === 'ready');
        
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-black text-white">Live Waiter Portal</h1>
                        <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{assistanceRequests.length} ACTIVE ALERTS</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Search size={20} className="text-[#86a69d]" />
                        <div className="w-8 h-8 rounded-full bg-[#86a69d]/20 flex items-center justify-center">
                            <User size={18} className="text-[#86a69d]" />
                        </div>
                        <Settings size={20} className="text-[#86a69d]" />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar">
                    {/* Urgent Assistance */}
                    <section>
                        <h2 className="text-[#FFD700] text-2xl font-serif font-black mb-6 italic tracking-tight">Urgent Assistance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assistanceRequests.map(req => (
                                <div key={req.id} className="bg-white/5 border border-white/10 rounded-[32px] p-6 relative overflow-hidden group hover:border-[#FFD700]/30 transition-all duration-500">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.2em] mb-1">TABLE {req.tableId.replace(/\D/g, '')}</p>
                                            <h3 className="text-white text-2xl font-serif font-black italic">{req.type === 'bill' ? 'Settlement Call' : 'Immediate Call'}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[#FFD700] text-lg font-black tabular-nums">04:12</p>
                                            <p className="text-[#86a69d] text-[9px] font-black uppercase tracking-widest">WAIT TIME</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mb-8 text-[#86a69d]">
                                        {req.type === 'bill' ? <CreditCard size={16} /> : <User size={16} />}
                                        <p className="text-xs font-medium">{req.type === 'bill' ? 'Patron requesting final bill' : 'General assistance requested'}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleClearAssistance(req.id)}
                                        className="w-full bg-red-700/80 hover:bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                                    >
                                        <Check size={16} strokeWidth={3} /> Mark as Attended
                                    </button>
                                </div>
                            ))}
                            {assistanceRequests.length === 0 && (
                                <div className="col-span-full py-12 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-white/20">
                                    <Sparkles size={48} className="mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">No Urgent Calls</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Kitchen Ready */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[#FFD700] text-2xl font-serif font-black italic tracking-tight">Kitchen Ready</h2>
                            <div className="flex items-center gap-2 text-[#86a69d] text-[10px] font-black uppercase tracking-widest">
                                Sort by: Heat Status <Filter size={12} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {readyOrders.map(order => {
                                const itemsArray = Array.isArray(order.items) ? order.items : [];
                                return (
                                    <div key={order.id} className="bg-white/5 border border-white/5 rounded-[32px] p-6 flex gap-6 hover:bg-white/[0.07] transition-all">
                                        <div className="w-24 h-24 rounded-3xl bg-black/40 overflow-hidden shrink-0 border border-white/10">
                                            <img src="/logo-icon.png" className="w-full h-full object-cover opacity-50 grayscale" alt="ready" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="bg-green-500/20 text-green-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter mr-2">READY</span>
                                                    <span className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest">TABLE {order.tableId.replace(/\D/g, '')}</span>
                                                </div>
                                                <Utensils size={18} className="text-[#86a69d]" />
                                            </div>
                                            <h3 className="text-white text-xl font-bold font-serif mb-1 truncate">
                                                {itemsArray[0]?.name || 'Mystery Dish'} {itemsArray.length > 1 && `(x${itemsArray.length})`}
                                            </h3>
                                            <p className="text-[#86a69d] text-[10px] mb-4 truncate">Quick Prep • Standard Presentation</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[#86a69d]">
                                                    <Clock size={12} />
                                                    <span className="text-[10px] font-bold">Passed: 2m ago</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleUpdateOrderStatus(order.id, 'served', order._source)}
                                                    className="bg-[#86a69d]/20 hover:bg-[#86a69d]/30 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                                                >
                                                    Mark as Served
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {readyOrders.length === 0 && (
                                <div className="col-span-full py-12 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-white/20">
                                    <UtensilsCrossed size={48} className="mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">Nothing ready to serve</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Bottom Stats */}
                <footer className="px-8 py-6 bg-black/20 border-t border-white/5 flex gap-6 overflow-x-auto no-scrollbar">
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
            const needsHelp = assistanceRequests.some(r => r.tableId === tableId);
            if (needsHelp) return 'bg-blue-600 border-blue-400 text-white animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.4)]';
            const status = tables[tableId] || 'free';
            switch (status) {
                case 'free': return 'bg-white/5 border-white/10 text-[#86a69d] hover:bg-white/10';
                case 'ordering': return 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]';
                case 'occupied': return 'bg-red-500/10 border-red-500/30 text-red-400';
                case 'billing': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
                default: return 'bg-white/5 border-white/10 text-[#86a69d]';
            }
        };

        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="px-8 py-6 border-b border-white/5">
                    <h1 className="text-2xl font-black text-white">Floor Mapping</h1>
                    <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time occupancy status</p>
                </header>
                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    {[{ title: 'Royal Tables', data: tTables }, { title: 'Private Boxes', data: bTables }, { title: 'Heritage Chowkies', data: cTables }].map(section => (
                        <div key={section.title} className="mb-12">
                            <h2 className="text-[#FFD700] text-sm font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                                {section.title}
                                <div className="h-px flex-1 bg-white/5"></div>
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                {section.data.map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => { setSelectedTable(t); setView('table_details'); }}
                                        className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center transition-all active:scale-90 ${getTableColor(t)}`}
                                    >
                                        <span className="text-2xl font-serif font-black">{t}</span>
                                        <span className="text-[9px] font-black uppercase opacity-60 mt-1">{tables[t] || 'Free'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderTableDetails = () => {
        const tableOrders = activeOrders.filter(o => o.tableId === selectedTable && o.status !== 'completed' && o.status !== 'rejected');
        const tableAssistance = assistanceRequests.find(r => r.tableId === selectedTable);

        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a261f]/30">
                <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('dashboard')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-[#FFD700] font-serif">Table {selectedTable}</h1>
                            <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.2em]">Table Management Console</p>
                        </div>
                    </div>
                    <button onClick={() => setView('order_entry')} className="bg-[#FFD700] text-[#0F3A2F] px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-xl">
                        <Plus size={18} strokeWidth={3} /> New Order
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
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
                                        {order.status === 'ready' && (
                                            <button 
                                                onClick={() => handleUpdateOrderStatus(order.id, 'served', order._source)}
                                                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-xl flex items-center gap-2"
                                            >
                                                <Check size={18} strokeWidth={3} /> Mark Served
                                            </button>
                                        )}
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

                <footer className="p-8 border-t border-white/5 flex gap-4">
                    <button 
                        onClick={() => handleUpdateOrderStatus(tableOrders[0]?.id, 'billed', tableOrders[0]?._source)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10"
                    >
                        <CreditCard size={20} /> Request Final Bill
                    </button>
                    <button className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 border border-red-500/30">
                        <X size={20} /> Reset & Close Table
                    </button>
                </footer>
            </div>
        );
    };

    const renderOrderEntry = () => {
        const filteredMenu = menu.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()));

        const addToCart = (item) => {
            setCart(prev => {
                const ex = prev.find(i => i.id === item.id);
                if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
                return [...prev, { ...item, qty: 1 }];
            });
        };

        const submitOrder = async () => {
            if (cart.length === 0) return;
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const orderData = { tableId: selectedTable, items: cart, finalTotal: subtotal, status: 'new', orderType: 'dine-in' };
            try {
                const res = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                if (res.ok) { setCart([]); setView('dashboard'); }
            } catch (error) { console.error(error); }
        };

        return (
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('table_details')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"><ArrowLeft size={20} /></button>
                            <h1 className="text-xl font-black text-white">Menu Selection • {selectedTable}</h1>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search royal dishes..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#FFD700]/50"
                            />
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredMenu.map(item => (
                                <button key={item.id} onClick={() => addToCart(item)} className="bg-white/5 border border-white/5 rounded-[32px] p-6 text-left hover:bg-[#FFD700]/5 transition-all group active:scale-95">
                                    <h3 className="text-white font-bold mb-1 group-hover:text-[#FFD700] transition-colors">{item.name}</h3>
                                    <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest mb-4">{item.category}</p>
                                    <div className="text-[#FFD700] font-black text-lg">£{item.price.toFixed(2)}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="w-96 bg-black/40 border-l border-white/5 flex flex-col">
                    <div className="p-8 border-b border-white/5 font-black text-sm uppercase tracking-widest text-[#86a69d]">Order Basket</div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                        {cart.map(item => (
                            <div key={item.id} className="bg-white/5 rounded-3xl p-4 flex items-center justify-between">
                                <div className="min-w-0">
                                    <div className="text-white font-bold text-sm truncate">{item.name}</div>
                                    <div className="text-[#FFD700] font-black text-xs mt-1">£{(item.price * item.qty).toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 shrink-0">
                                    <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0))} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white"><Minus size={14} /></button>
                                    <span className="text-white font-black text-sm w-4 text-center">{item.qty}</span>
                                    <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white"><Plus size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-8 bg-black/40 border-t border-white/5">
                        <button onClick={submitOrder} disabled={cart.length === 0} className="w-full bg-[#FFD700] text-[#0F3A2F] py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm active:scale-95 shadow-[0_0_30px_rgba(255,215,0,0.25)] disabled:opacity-50">
                            Dispatch to Kitchen
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen bg-[#0F3A2F] text-white font-sans selection:bg-[#FFD700] selection:text-[#0F3A2F] flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {view === 'dashboard' && (activeTab === 'tables' ? renderTableMap() : <Dashboard />)}
                {view === 'table_details' && renderTableDetails()}
                {view === 'order_entry' && renderOrderEntry()}
            </main>
        </div>
    );
}
