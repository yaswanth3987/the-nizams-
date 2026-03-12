import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import Receipt from '../components/Receipt';
import InventoryDashboard from '../components/InventoryDashboard';
import { Printer, Check, X, RefreshCw, ChefHat, CheckCircle, Bell } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : '/api';

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('new'); // new, confirmed, billed, completed, assistance, inventory
    const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
    const [assistanceRequests, setAssistanceRequests] = useState([]);

    const tabs = [
        { id: 'new', label: 'Orders (New)' },
        { id: 'confirmed', label: 'Confirmed' },
        { id: 'billed', label: 'Billed' },
        { id: 'completed', label: 'Completed' },
        { id: 'assistance', label: 'Assistance' },
        { id: 'inventory', label: 'Inventory' }
    ];

    useEffect(() => {
        fetchOrders();
        fetchAssistance();

        const playAssistancePing = () => {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.log('Audio play blocked:', e));
        };

        const playOrderPing = () => {
            // A slightly different notification tone for orders
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            audio.play().catch(e => console.log('Audio play blocked:', e));
        };

        const handleNewOrder = (order) => {
            setOrders(prev => [order, ...prev]);
            playOrderPing();
        };
        socket.on('orderCreated', handleNewOrder);
        socket.on('orderUpdated', handleOrderUpdated);
        socket.on('orderDeleted', handleOrderDeleted);
        socket.on('tableReset', fetchOrders);

        socket.on('assistanceRequested', (req) => {
            setAssistanceRequests(prev => [req, ...prev]);
            playAssistancePing();
        });
        socket.on('assistanceUpdated', (updatedReq) => {
            setAssistanceRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
        });
        socket.on('assistanceDeleted', ({ id }) => {
            setAssistanceRequests(prev => prev.filter(r => r.id !== id));
        });

        return () => {
            socket.off('orderCreated');
            socket.off('orderUpdated');
            socket.off('orderDeleted');
            socket.off('tableReset');
            socket.off('assistanceRequested');
            socket.off('assistanceUpdated');
            socket.off('assistanceDeleted');
        };
    }, []);

    const fetchAssistance = () => {
        fetch(`${API_URL}/assistance`)
            .then(res => res.json())
            .then(data => setAssistanceRequests(data || []))
            .catch(err => console.error("Error fetching assistance:", err));
    };

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

    const fetchOrders = () => {
        fetch(`${API_URL}/orders`)
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error("Error fetching orders:", err));
    };

    const handleNewOrder = (order) => {
        setOrders(prev => [order, ...prev]);
    };

    const handleOrderUpdated = (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    const handleOrderDeleted = ({ id }) => {
        setOrders(prev => prev.filter(o => o.id !== id));
    };

    const updateStatus = async (id, status) => {
        try {
            await fetch(`${API_URL}/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (err) {
            console.error(err);
        }
    };

    const cancelOrder = async (id) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        try {
            await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
        } catch (err) {
            console.error(err);
        }
    };

    const clearTable = async (tableId) => {
        if (!confirm(`Clear all completed orders for Table ${tableId}?`)) return;
        try {
            await fetch(`${API_URL}/tables/${tableId}/orders`, { method: 'DELETE' });
        } catch (err) {
            console.error(err);
        }
    };

    const printReceipt = (order) => {
        setSelectedOrderForReceipt(order);
        setTimeout(() => {
            window.print();
            if (order.status === 'confirmed') {
                updateStatus(order.id, 'billed');
            }
        }, 300);
    };

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const filteredOrders = orders.filter(o => o.status === activeTab);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-primary text-text p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                    <h1 className="text-2xl font-bold tracking-tight text-accent hidden sm:block">Admin Dashboard</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchOrders} className="p-2 hover:bg-secondary rounded-full transition-colors tooltip" title="Refresh">
                        <RefreshCw className="w-5 h-5 text-accent" />
                    </button>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6 space-y-6">
                <div className="flex space-x-2 overflow-x-auto pb-2 border-b-2 border-gray-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                                activeTab === tab.id 
                                    ? 'bg-primary text-accent border-primary' 
                                    : 'bg-white text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                            {tab.id === 'new' && orders.filter(o=>o.status==='new').length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {orders.filter(o=>o.status==='new').length}
                               </span>
                            )}
                            {tab.id === 'assistance' && assistanceRequests.filter(r=>r.status==='pending').length > 0 && (
                                <span className="ml-2 bg-red-600 shadow shadow-red-500/50 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                    {assistanceRequests.filter(r=>r.status==='pending').length}
                               </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'inventory' ? (
                        <div className="col-span-full">
                            <InventoryDashboard />
                        </div>
                    ) : activeTab === 'assistance' ? (
                        <div className="col-span-full">
                            {assistanceRequests.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                                    <Bell className="w-12 h-12 mb-4 opacity-30 text-red-500" />
                                    <p className="text-lg">No active assistance requests</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                    {assistanceRequests.map(req => (
                                        <div key={req.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col ${req.status === 'pending' ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200 opacity-70'}`}>
                                            <div className={`p-4 border-b flex justify-between items-center ${req.status === 'pending' ? 'bg-red-50' : 'bg-gray-50'}`}>
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">
                                                        Table calling
                                                    </span>
                                                    <h3 className={`text-2xl font-black ${req.status === 'pending' ? 'text-red-700' : 'text-gray-900'}`}>{req.tableId}</h3>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-2 ${req.status === 'pending' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}>
                                                        {req.status}
                                                    </span>
                                                    <p className="font-mono text-xs font-medium text-gray-700 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
                                                        {formatTime(req.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white flex gap-2 mt-auto">
                                                {req.status === 'pending' ? (
                                                    <button onClick={() => updateAssistance(req.id, 'attended')} className="flex-1 bg-primary text-text px-4 py-2.5 rounded font-bold hover:bg-secondary transition-colors flex justify-center items-center gap-2 border border-primary">
                                                        <CheckCircle className="w-4 h-4" /> Mark Attended
                                                    </button>
                                                ) : (
                                                    <button onClick={() => deleteAssistance(req.id)} className="flex-1 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex justify-center items-center gap-2 shadow-sm">
                                                        <X className="w-4 h-4" /> Clear Request
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        filteredOrders.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100">
                            <p className="text-lg">No {activeTab} orders</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden flex flex-col">
                                <div className={`p-4 border-b flex justify-between items-center ${
                                    order.status === 'new' ? 'bg-orange-50 border-orange-200' :
                                    order.status === 'confirmed' ? 'bg-blue-50 border-blue-200' :
                                    order.status === 'billed' ? 'bg-purple-50 border-purple-200' :
                                    'bg-green-50 border-green-200'
                                }`}>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                            Table
                                        </span>
                                        <h3 className="text-2xl font-bold text-gray-900">{order.tableId}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                            Time
                                        </span>
                                        <p className="font-mono font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm">
                                            {formatTime(order.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="p-4 flex-1">
                                    <ul className="space-y-3">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between items-start text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                <span className="font-medium text-gray-800"><span className="text-gray-500 mr-2">{item.qty}x</span> {item.name}</span>
                                                <span className="text-gray-600 font-medium">£{(item.price * item.qty).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-4 text-lg">
                                        <span className="font-semibold text-gray-600">Total</span>
                                        <span className="font-bold text-primary text-xl">£{order.total.toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {order.status === 'new' && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'confirmed')} className="flex-1 bg-primary text-text px-4 py-2 rounded font-medium hover:bg-secondary transition-colors flex justify-center items-center gap-2">
                                                    <Check className="w-4 h-4" /> Confirm
                                                </button>
                                                <button onClick={() => cancelOrder(order.id)} className="px-4 py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200 transition-colors tooltip" title="Cancel">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {(order.status === 'confirmed' || order.status === 'billed') && (
                                            <>
                                                <button onClick={() => printReceipt(order)} className="flex-1 bg-accent text-primary px-4 py-2 rounded font-bold hover:bg-yellow-500 transition-colors flex justify-center items-center gap-2">
                                                    <Printer className="w-4 h-4" /> {order.status === 'confirmed' ? 'Gen Bill' : 'Print Again'}
                                                </button>
                                                <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 bg-primary text-text px-4 py-2 rounded font-medium hover:bg-secondary transition-colors flex justify-center items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Done
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'completed' && (
                                            <>
                                                <button onClick={() => printReceipt(order)} className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-50 transition-colors flex justify-center items-center gap-2 shadow-sm">
                                                    <Printer className="w-4 h-4" /> Receipt
                                                </button>
                                                <button onClick={() => clearTable(order.tableId)} className="flex-1 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded font-medium hover:bg-red-100 transition-colors flex justify-center items-center gap-2 shadow-sm">
                                                    Reset Table
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ))}
                </div>
            </main>

            {/* Hidden Receipt Component for Printing */}
            <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-50">
                <Receipt order={selectedOrderForReceipt} />
            </div>
        </div>
    );
}
