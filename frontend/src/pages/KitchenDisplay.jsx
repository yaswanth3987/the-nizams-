import React, { useState, useEffect, useCallback } from 'react';
import { socket } from '../utils/socket';
import { ChefHat, Bell, Search, User, Menu, FileText, BarChart2, Settings, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.DEV 
    ? `http://${window.location.hostname}:3001/api` 
    : '/api';

export default function KitchenDisplay() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('live');

    const playOrderPing = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        audio.play().catch(e => console.log('Audio play blocked:', e));
    };

    const fetchKitchenOrders = useCallback(() => {
        // Fetch confirmed, active, and ready sessions
        fetch(`${API_URL}/orders?statuses=confirmed,active,ready`)
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error("Error fetching kitchen orders:", err));
    }, []);

    useEffect(() => {
        document.title = "Kitchen - The Great Nizam";
        fetchKitchenOrders();

        socket.on('sessionUpdated', (updatedSession) => {
            if (['confirmed', 'active', 'ready'].includes(updatedSession.status)) {
                setOrders(prev => {
                    const exists = prev.find(o => o.id === updatedSession.id);
                    if (exists) {
                        return prev.map(o => o.id === updatedSession.id ? updatedSession : o);
                    }
                    if (updatedSession.status === 'confirmed') playOrderPing();
                    return [updatedSession, ...prev];
                });
            } else {
                setOrders(prev => prev.filter(o => o.id !== updatedSession.id));
            }
        });

        socket.on('orderUpdated', fetchKitchenOrders);
        socket.on('tableReset', fetchKitchenOrders);

        return () => {
            socket.off('sessionUpdated');
            socket.off('orderUpdated', fetchKitchenOrders);
            socket.off('tableReset', fetchKitchenOrders);
        };
    }, [fetchKitchenOrders]);

    const updateOrderStatus = async (id, status) => {
        try {
            // Note: The endpoint /api/orders/:id/status updates the session status
            await fetch(`${API_URL}/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const displayTableId = (id) => {
        if (!id) return '';
        const upperId = id.toString().toUpperCase();
        if (upperId === 'TAKEAWAY') return 'TAKEAWAY';
        if (upperId.startsWith('VIP')) return upperId.replace('VIP', 'VIP LOUNGE-');
        if (upperId.startsWith('T')) return `TABLE-${upperId.replace(/T0*/, '')}`;
        if (upperId.startsWith('C')) return `CHOKIE-${upperId.replace(/C0*/, '')}`;
        if (upperId.startsWith('B')) return `BOX-${upperId.replace(/B0*/, '')}`;
        return upperId;
    };

    const renderSpiceLeaf = (itemName) => {
        if (!itemName) return null;
        const lower = itemName.toLowerCase();
        if (lower.includes('mild')) return <span className="text-emerald-500 font-bold ml-2">🌱</span>;
        if (lower.includes('spicy')) return <span className="text-red-500 font-bold ml-2">🌶️</span>;
        // Check for specific note attachments simulating mockup icons
        if (lower.includes('naan')) return null;
        if (lower.includes('masala') || lower.includes('josh')) return <span className="text-red-500 font-bold drop-shadow-md text-lg inline-block ml-2 group-hover:scale-125 transition-transform">🔥</span>;
        if (lower.includes('tikka') || lower.includes('tukda')) return <span className="text-emerald-500 font-bold drop-shadow-md text-lg inline-block ml-2 group-hover:scale-125 transition-transform">🌱</span>;
        return null;
    };

    const preparingOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'active');
    const readyOrders = orders.filter(o => o.status === 'ready');

    return (
        <div className="min-h-screen bg-[#111613] text-[#e0e8e4] font-sans flex overflow-hidden">
            
            {/* Sidebar */}
            <aside className="w-[280px] bg-[#071f16] flex flex-col items-center py-10 shadow-[5px_0_15px_rgba(0,0,0,0.5)] z-20 shrink-0">
                <div className="w-20 h-20 bg-[#111312] border border-[#d4af37]/20 rounded-xl flex flex-col items-center justify-center p-2 mb-4 shadow-inner">
                    <img src="/logo-icon.png" alt="Logo" className="w-12 h-12 object-contain brightness-150" />
                </div>
                <h2 className="text-[#d4af37] font-serif text-2xl font-black mb-1">The Great</h2>
                <h2 className="text-[#d4af37] font-serif text-2xl font-black mb-1">Nizam</h2>
                <p className="text-[#849a91] text-[10px] font-black tracking-[0.2em] mb-12 uppercase">Kitchen</p>

                <nav className="w-full px-6 flex flex-col gap-2 relative">
                    <button onClick={() => setActiveTab('live')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-lg border border-transparent font-bold text-sm tracking-wide transition-all ${activeTab === 'live' ? 'bg-[#153428] text-[#d4af37] border-[#d4af37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' : 'text-[#849a91] hover:bg-[#0c2419] hover:text-[#e0e8e4]'}`}>
                        <UtensilsCrossed size={18} /> Live Orders
                        {activeTab === 'live' && <div className="absolute right-6 w-1 h-6 bg-[#d4af37] rounded-full"></div>}
                    </button>
                    <button className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-lg font-bold text-sm tracking-wide text-[#849a91] hover:bg-[#0c2419] hover:text-[#e0e8e4] transition-all`}>
                        <Menu size={18} /> Menu
                    </button>
                    <button className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-lg font-bold text-sm tracking-wide text-[#849a91] hover:bg-[#0c2419] hover:text-[#e0e8e4] transition-all`}>
                        <FileText size={18} /> Inventory
                    </button>
                    <button className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-lg font-bold text-sm tracking-wide text-[#849a91] hover:bg-[#0c2419] hover:text-[#e0e8e4] transition-all`}>
                        <BarChart2 size={18} /> Analytics
                    </button>
                    <button className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-lg font-bold text-sm tracking-wide text-[#849a91] hover:bg-[#0c2419] hover:text-[#e0e8e4] transition-all`}>
                        <Settings size={18} /> Kitchen Settings
                    </button>
                </nav>

                <div className="mt-auto px-6 w-full flex items-center gap-4 py-4 border-t border-white/5 opacity-80 cursor-pointer hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full border border-[#d4af37]/30 bg-[#0c2419] flex items-center justify-center text-[#d4af37]">
                        <User size={18} />
                    </div>
                    <div>
                        <p className="text-white text-xs font-bold">Executive Chef</p>
                        <p className="text-[#d4af37] text-[10px] font-bold">Shift Active</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen">
                
                {/* Navbar */}
                <header className="h-[80px] bg-[#071f16] border-b border-[#1b2b25] flex items-center justify-between px-10 shadow-md">
                    <div className="flex items-center gap-8 text-[#849a91] font-bold text-xs uppercase tracking-wider">
                        <span className="text-[#d4af37] font-black text-xl font-serif tracking-normal">THE GREAT NIZAM</span>
                        <div className="h-5 w-px bg-white/10 mx-2"></div>
                        <span className="text-[#d4af37] border-b-2 border-[#d4af37] py-7 cursor-pointer hover:text-[#e0e8e4] transition-colors">Main Floor</span>
                        <span className="cursor-pointer hover:text-[#e0e8e4] transition-colors">VIP Lounge</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4f645a] group-focus-within:text-[#d4af37] transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search orders..."
                                className="bg-[#0f281e] border border-transparent focus:border-[#d4af37]/30 text-white text-sm outline-none pl-10 pr-4 py-2 w-64 rounded-full placeholder-[#4f645a] transition-all"
                            />
                        </div>
                        <button className="text-[#d4af37] hover:text-white transition-colors relative">
                            <Bell className="w-5 h-5 fill-current" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#071f16]"></span>
                        </button>
                        <button className="text-[#d4af37] hover:text-white transition-colors">
                            <User className="w-5 h-5 border border-[#d4af37] rounded-full p-0.5" />
                        </button>
                    </div>
                </header>

                {/* Dashboard Boards */}
                <div className="flex-1 overflow-x-auto flex bg-[#111714] p-8 gap-8">
                    
                    {/* Column 1: Preparing */}
                    <div className="w-[450px] shrink-0 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6 pl-2">
                            <div className="flex items-center gap-3 text-[#d4af37]">
                                <UtensilsCrossed className="w-5 h-5" />
                                <h3 className="font-serif text-xl font-black uppercase tracking-widest">PREPARING</h3>
                            </div>
                            <span className="bg-[#5c4909] text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-[#d4af37]/30">
                                {preparingOrders.length} ACTIVE
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-thin scrollbar-thumb-[#153428] no-scrollbar">
                            {preparingOrders.map(order => {
                                return (
                                    <div key={order.id} className="relative bg-[#171f1a] border border-[#d4af37]/20 rounded-2xl p-6 shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:border-[#d4af37]/40 transition-all group overflow-hidden shrink-0 flex flex-col">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                                        
                                        <div className="flex justify-between items-start mb-6 relative z-10 border-b border-white/5 pb-4">
                                            <div>
                                                <h4 className="text-[#d4af37] text-2xl font-serif font-black mb-1">
                                                    {displayTableId(order.tableId)}
                                                </h4>
                                                <p className="text-[#64766f] text-xs font-mono font-bold">
                                                    ID: #NZ-{order.id.toString().padStart(4, '0')} • {formatTime(order.createdAt)}
                                                </p>
                                            </div>
                                            {order.status === 'confirmed' && (
                                                <span className="bg-white/5 border border-white/10 text-white/70 px-2 py-1 rounded text-[9px] font-black tracking-[0.2em] uppercase">NEW ORDER</span>
                                            )}
                                        </div>

                                        <div className="space-y-4 mb-8 relative z-10">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-[#dbe2e0] font-medium text-sm">
                                                    <span className="flex-1 pr-4">{item.qty}x {item.name}</span>
                                                    {renderSpiceLeaf(item.name)}
                                                    {item.name.toLowerCase().includes('mild') && <span className="text-[#64766f] text-xs font-bold">Mild</span>}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="relative z-10">
                                            {order.status === 'confirmed' ? (
                                                <button 
                                                    onClick={() => updateOrderStatus(order.id, 'active')}
                                                    className="w-full py-4 text-center bg-gradient-to-r from-[#2c4e40] to-[#203a30] border border-[#3e6857]/50 text-[#e0e8e4] hover:text-white rounded-lg font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-[0.98] transition-all"
                                                >
                                                    START PREPARING
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => updateOrderStatus(order.id, 'ready')}
                                                    className="w-full py-4 text-center border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={16} /> MARK AS READY
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-[2px] h-full bg-gradient-to-b from-transparent via-[#203a30] to-transparent mx-2 opacity-50 shrink-0"></div>

                    {/* Column 2: Ready to Serve */}
                    <div className="w-[450px] shrink-0 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6 pl-2">
                            <div className="flex items-center gap-3 text-[#d4af37]">
                                <CheckCircle2 className="w-5 h-5 fill-current text-[#111714]" />
                                <h3 className="font-serif text-xl font-black uppercase tracking-widest text-[#d4af37]">READY TO SERVE</h3>
                            </div>
                            <span className="bg-[#3e6857]/40 text-[#a2b5ac] px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-[#3e6857]/50">
                                {readyOrders.length} READY
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-thin scrollbar-thumb-[#153428] no-scrollbar">
                            {readyOrders.map(order => {
                                const isVip = order.tableId?.toString().toUpperCase().includes('VIP');

                                return (
                                    <div key={order.id} className="relative bg-[#171f1a] border border-[#d4af37]/30 rounded-2xl p-6 shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:border-[#d4af37]/50 transition-all group overflow-hidden shrink-0 flex flex-col">
                                        
                                        {/* Status Glow */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                                        
                                        {/* VIP Diagonal Sash */}
                                        {isVip && (
                                            <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-20">
                                                <div className="absolute top-6 -right-6 w-32 bg-[#e3c178] text-black font-black text-[10px] uppercase tracking-widest text-center py-1.5 rotate-45 shadow-lg flex items-center justify-center gap-1">
                                                    VIP
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-6 relative z-10 border-b border-white/5 pb-4">
                                            <div>
                                                <h4 className="text-[#d4af37] text-2xl font-serif font-black mb-1">
                                                    {displayTableId(order.tableId)}
                                                </h4>
                                                <p className="text-[#64766f] text-xs font-mono font-bold">
                                                    ID: #NZ-{order.id.toString().padStart(4, '0')} • {formatTime(order.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8 relative z-10">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-[#dbe2e0] font-medium text-sm">
                                                    <span className="flex-1 pr-4 flex items-center gap-2">
                                                        <CheckCircle2 size={12} className="text-emerald-500/50" />
                                                        {item.qty}x {item.name}
                                                    </span>
                                                    {renderSpiceLeaf(item.name)}
                                                    {item.name.toLowerCase().includes('mild') && <span className="text-[#dbe2e0] text-sm">Mild</span>}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="relative z-10">
                                            <button 
                                                onClick={() => updateOrderStatus(order.id, 'served')}
                                                className="w-full py-4 text-center border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2"
                                            >
                                                <UtensilsCrossed size={16} /> MARK AS SERVED
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer status bar */}
                <footer className="h-8 bg-[#071f16] border-t border-[#153428] flex justify-between items-center px-10 text-[9px] font-black uppercase tracking-[0.3em] text-[#4f645a]">
                    <div className="flex gap-8">
                        <span className="text-emerald-600">SERVER STATUS: ONLINE</span>
                        <span>KITCHEN DELAY: 0 MIN</span>
                    </div>
                    <div>
                        <span className="text-[#d4af37]/60">THE GREAT NIZAM • EST. 1954</span>
                        <span className="ml-8">{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second:'2-digit' })}</span>
                    </div>
                </footer>

            </div>
        </div>
    );
}
