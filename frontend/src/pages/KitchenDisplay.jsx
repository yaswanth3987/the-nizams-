import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { ChefHat, Bell } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : '/api';

export default function KitchenDisplay() {
    const [orders, setOrders] = useState([]);
    const [assistanceRequests, setAssistanceRequests] = useState([]);

    const playOrderPing = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        audio.play().catch(e => console.log('Audio play blocked:', e));
    };

    const playAssistancePing = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play blocked:', e));
    };

    useEffect(() => {
        // Fetch only confirmed orders
        fetch(`${API_URL}/orders?statuses=confirmed`)
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error("Error fetching kitchen orders:", err));

        socket.on('orderCreated', (order) => {
            // New orders are not confirmed yet, so ignore until updated
            if (order.status === 'confirmed') {
                handleOrderAdded(order);
            }
        });
        
        socket.on('orderUpdated', (updatedOrder) => {
            if (updatedOrder.status === 'confirmed') {
                handleOrderAdded(updatedOrder);
            } else {
                handleOrderRemoved(updatedOrder.id);
            }
        });

        socket.on('orderDeleted', ({ id }) => handleOrderRemoved(id));
        socket.on('tableReset', () => {
            fetch(`${API_URL}/orders?statuses=confirmed`)
                .then(res => res.json())
                .then(data => setOrders(data));
        });

        // Assistance logic
        fetch(`${API_URL}/assistance`)
            .then(res => res.json())
            .then(data => setAssistanceRequests(data || []))
            .catch(console.error);

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

    const handleOrderAdded = (order) => {
        setOrders(prev => {
            if (prev.find(o => o.id === order.id)) return prev;
            playOrderPing();
            return [order, ...prev];
        });
    };

    const handleOrderRemoved = (id) => {
        setOrders(prev => prev.filter(o => o.id !== id));
    };

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <header className="bg-black text-white p-4 shadow-xl sticky top-0 z-10 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img src="/logo-icon.png" alt="Logo" className="w-12 h-12 object-contain" />
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Kitchen Display <span className="text-yellow-500">•</span> The Great Nizam</h1>
                </div>
                <div className="text-xl font-mono text-gray-400">
                    Active Orders: <span className="font-bold text-yellow-500">{orders.length}</span>
                </div>
            </header>

            <main className="p-6 space-y-6">
                {assistanceRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Bell className="w-8 h-8 text-red-500 animate-pulse" />
                            <h2 className="text-2xl font-bold text-red-500 tracking-wider uppercase drop-shadow-md">Restuarant Floor Assistance</h2>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {assistanceRequests.filter(r => r.status === 'pending').map(req => (
                                <div key={req.id} className="bg-gradient-to-br from-red-600 to-red-800 text-white font-bold px-6 py-4 rounded-lg flex items-center justify-between gap-6 shadow-xl shadow-red-900/50 border border-red-500">
                                    <span className="text-3xl tracking-tighter">Table {req.tableId.replace(/T0*/, '')}</span>
                                    <span className="font-mono text-sm opacity-80 pl-4 border-l border-white/20">{formatTime(req.createdAt)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto">
                    {orders.length === 0 ? (
                        <div className="col-span-full mt-20 flex flex-col items-center justify-center text-gray-500">
                            <ChefHat className="w-24 h-24 mb-6 opacity-20" />
                            <p className="text-3xl font-light">No active orders</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col">
                                <div className="bg-yellow-500 p-4 flex justify-between items-center relative overflow-hidden">
                                    <h2 className="text-4xl font-extrabold text-black tracking-tighter">
                                        T-{order.tableId.replace(/T0*/, '')}
                                    </h2>
                                    <div className="text-right">
                                        <p className="font-mono text-lg font-bold text-black bg-white/50 px-3 py-1 rounded inline-block">
                                            {formatTime(order.createdAt)}
                                        </p>
                                    </div>
                                    <div className="absolute -bottom-6 -right-6 text-black/10 w-24 h-24 rotate-12 pointer-events-none">
                                        <ChefHat className="w-full h-full" />
                                    </div>
                                </div>
                                
                                <div className="flex-1 p-5">
                                    <ul className="space-y-4">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-xl md:text-2xl font-medium border-b border-gray-700 pb-3 last:border-0 last:pb-0">
                                                <span className="w-10 text-yellow-500 font-bold mr-3 shrink-0 text-right">{item.qty}x</span>
                                                <span className="text-white leading-tight">{item.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
