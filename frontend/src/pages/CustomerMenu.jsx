import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    ChevronLeft, 
    BookOpen, 
    ChevronRight, 
    Calendar, 
    AlertTriangle, 
    Phone, 
    Globe, 
    MapPin, 
    Instagram, 
    Star, 
    QrCode, 
    ChevronUp, 
    ChevronDown, 
    Flame, 
    ShoppingCart, 
    X, 
    Minus, 
    Plus,
    Bell,
    CheckCircle,
    Clock,
    Search,
    Menu as MenuIcon,
    ShoppingBag
} from 'lucide-react';
import { categoriesData, menuData } from '../data/menu.js';
import { socket } from '../utils/socket';

const API_URL = import.meta.env.DEV 
    ? `http://${window.location.hostname}:3001/api` 
    : '/api';

export default function CustomerMenu() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tableParam = searchParams.get('table');
    const [selectedTable, setSelectedTable] = useState(tableParam || null);

    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [addedItems, setAddedItems] = useState({});
    const [view, setView] = useState('menu'); // 'menu' | 'search' | 'orders'
    const [expandedCategory, setExpandedCategory] = useState('Biryani Thaali');
    const [myOrders, setMyOrders] = useState([]);
    const [activeEffect, setActiveEffect] = useState(null); // { id, effect }
    const [cartPulse, setCartPulse] = useState(false);

    const KITCHEN_EFFECTS = ['steam', 'spice', 'flame'];

    const triggerKitchenFeedback = (itemId) => {
        const randomEffect = KITCHEN_EFFECTS[Math.floor(Math.random() * KITCHEN_EFFECTS.length)];
        setActiveEffect({ id: itemId, effect: randomEffect });
        setCartPulse(true);
        if (window.navigator.vibrate) window.navigator.vibrate(10);
        setTimeout(() => {
            setActiveEffect(null);
            setCartPulse(false);
        }, 1000);
    };
    const [isOrdersLoading, setIsOrdersLoading] = useState(false);
    
    const [assistanceStatus, setAssistanceStatus] = useState(null);
    const [assistanceCooldown, setAssistanceCooldown] = useState(() => {
        const saved = localStorage.getItem(`assist_cooldown_${selectedTable}`);
        return saved ? parseInt(saved, 10) : 0;
    });

    useEffect(() => {
        if (!selectedTable) return;

        // Auto-mark table as ordering when customer opens the menu
        fetch(`${API_URL}/table-status/${selectedTable.startsWith('T') ? selectedTable : `T${selectedTable}`}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ordering' })
        }).catch(err => console.log('Silent table status update failed', err));

        if (assistanceCooldown > 0) {
            const timer = setInterval(() => {
                if (Date.now() > assistanceCooldown) {
                    setAssistanceCooldown(0);
                    localStorage.removeItem(`assist_cooldown_${selectedTable}`);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [assistanceCooldown, selectedTable]);

    const requestAssistance = async () => {
        if (assistanceCooldown > 0 || !selectedTable) return;
        setAssistanceStatus('notifying');
        try {
            const res = await fetch(`${API_URL}/assistance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId: selectedTable.startsWith('T') ? selectedTable : `T${selectedTable}` })
            });
            if (res.ok) {
                setAssistanceStatus('success');
                const expire = Date.now() + 180000; // 3 minutes
                setAssistanceCooldown(expire);
                localStorage.setItem(`assist_cooldown_${selectedTable}`, expire);
                setTimeout(() => setAssistanceStatus(null), 3000);
            } else {
                setAssistanceStatus('error');
                setTimeout(() => setAssistanceStatus(null), 3000);
            }
        } catch(err) {
            setAssistanceStatus('error');
            setTimeout(() => setAssistanceStatus(null), 3000);
        }
    };

    useEffect(() => {
        setMenu(menuData);
        
        const fetchRemoteMenu = () => {
            fetch(`${API_URL}/menu`)
                .then(res => res.json())
                .then(data => {
                    if(data && data.length > 0) {
                        setMenu(data); // Use server data as source of truth
                    }
                })
                .catch(err => console.log("Silent fail on menu API, using defaults"));
        };

        fetchRemoteMenu();

        socket.on('menuUpdated', (updatedItem) => {
            setMenu(prev => prev.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item));
        });

        socket.on('menuReset', (fullMenu) => {
            setMenu(fullMenu);
        });

        return () => {
            socket.off('menuUpdated');
            socket.off('menuReset');
        };
    }, []);

    const categories = categoriesData;

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const handleAddToCart = (item, e) => {
        if (e) e.stopPropagation();
        triggerKitchenFeedback(item.id);
        addToCart(item);
        setAddedItems(prev => ({ ...prev, [item.id]: true }));
        setTimeout(() => setAddedItems(prev => ({ ...prev, [item.id]: false })), 1500);
    };

    const updateQuantity = (id, delta) => {
        if (delta > 0) triggerKitchenFeedback(id);
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.qty + delta;
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const submitOrder = async () => {
        if (cart.length === 0 || !selectedTable) return;
        setOrderStatus('submitting');
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const serviceCharge = Number((subtotal * 0.10).toFixed(2));
        const finalTotal = Number((subtotal + serviceCharge).toFixed(2));
        
        const orderData = {
            tableId: selectedTable.startsWith('T') ? selectedTable : `T${selectedTable}`,
            items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
            finalTotal,
            subtotal,
            serviceCharge,
            status: 'new'
        };

        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            if (res.ok) {
                setCart([]);
                setOrderStatus('success');
                setIsCartOpen(false);
                setTimeout(() => setOrderStatus(null), 3000);
            } else {
                setOrderStatus('error');
            }
        } catch (err) { setOrderStatus('error'); }
    };

    const handleTableSelect = (table) => {
        setSelectedTable(table);
        setSearchParams({ table });
    };

    const fetchMyOrders = async () => {
        if (!selectedTable) return;
        setIsOrdersLoading(true);
        try {
            const tableId = selectedTable.startsWith('T') ? selectedTable : `T${selectedTable}`;
            const [sessionsRes, newOrdersRes] = await Promise.all([
                fetch(`${API_URL}/tables/${tableId}/sessions`),
                fetch(`${API_URL}/tables/${tableId}/new-orders`)
            ]);
            const sessionsData = await sessionsRes.json();
            const newOrdersData = await newOrdersRes.json();
            
            // Format sessions as status display
            const formattedSessions = sessionsData.map(s => ({
                id: s.id,
                items: s.items,
                total: s.finalTotal,
                status: s.status === 'confirmed' ? 'Preparing' : (s.status === 'billed' ? 'Billed' : 'Completed'),
                createdAt: s.createdAt
            }));

            const formattedNew = newOrdersData.map(o => ({
                id: o.id,
                items: o.items,
                total: o.finalTotal,
                status: 'Pending',
                createdAt: o.createdAt
            }));

            setMyOrders([...formattedNew, ...formattedSessions]);
        } catch (err) {
            console.error("Failed to fetch my orders", err);
        } finally {
            setIsOrdersLoading(false);
        }
    };

    useEffect(() => {
        let interval;
        if (view === 'orders') {
            fetchMyOrders();
            interval = setInterval(fetchMyOrders, 10000); // Refresh every 10s
        }
        return () => clearInterval(interval);
    }, [view]);

    const renderTableSelection = () => (
        <div className="min-h-screen bg-[#111312] py-8 px-4 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-[360px] bg-[#1c1e1c] rounded-2xl shadow-2xl overflow-hidden border border-[#d4af37]/20 p-8 text-center">
                <img src="/logo-icon.png" alt="Logo" className="w-16 h-16 mx-auto mb-4 drop-shadow-md brightness-150" />
                <h2 className="text-3xl font-serif text-[#d4af37] mb-2 leading-tight">Welcome to<br/>The Nizam's</h2>
                <p className="text-[#a8b8b2] text-sm mb-8">Please select your table number to view the menu.</p>
                
                <div className="grid grid-cols-3 gap-3">
                    {Array.from({length: 24}).map((_, i) => {
                        const t = `T${String(i+1).padStart(2, '0')}`;
                        return (
                            <button 
                                key={t}
                                onClick={() => handleTableSelect(t)}
                                className="bg-[#111312] border border-[#d4af37]/30 text-[#d4af37] py-3 rounded-lg font-bold text-xl hover:bg-[#d4af37]/10 transition-colors shadow-inner"
                            >
                                {t}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderLanding = () => (
        <div className="min-h-screen bg-[#C2A165] py-8 px-4 flex flex-col items-center font-sans tracking-tight">
            <div className="w-full max-w-[360px] bg-[#F7EFE1] rounded-lg shadow-xl overflow-hidden border border-white/20">
                <div className="p-6 pb-4 flex flex-col items-center">
                    <img src="/logo-with-name.png" alt="THE NIZAM'S" className="w-[160px] mb-2 drop-shadow-sm mix-blend-multiply" />
                    <p className="text-[#966336] font-medium tracking-[0.15em] text-[9px] mb-6 uppercase text-center w-full border-b border-transparent">Authentic Indian Cuisine</p>

                    <div className="w-full bg-[#EAE0CA] border border-[#D5CAA1] rounded-md p-3 px-4 flex items-center justify-between mb-6 shadow-sm">
                        <p className="text-[#6D421B] text-[11px] font-medium leading-[1.4] max-w-[130px]">
                            Scan & browse the all menu. No app required.
                        </p>
                        <div className="text-right border-l border-[#D5CAA1] pl-4">
                            <p className="text-[#6D421B] text-[11px] font-semibold">Table: {selectedTable}</p>
                            <p className="text-[#6D421B] text-[11px] font-semibold">Westminster</p>
                        </div>
                    </div>

                    <div className="w-full space-y-2.5">
                        <button onClick={() => setView('menu')} className="w-full bg-[#D66B16] text-white rounded-md p-3.5 flex items-center gap-3 hover:bg-[#B95910] transition-colors shadow-md group">
                            <BookOpen strokeWidth={1.5} className="w-5 h-5 shrink-0" />
                            <div className="text-left flex-1">
                                <h3 className="font-bold text-[13px] leading-tight">View Menu</h3>
                                <p className="text-white/90 text-[10px] opacity-90 font-medium">See biryanis, kebabs, curries & more</p>
                            </div>
                            <ChevronRight strokeWidth={2} className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button onClick={() => setView('book')} className="w-full bg-[#F5EFE3] text-[#6D421B] border border-[#E3D7C1] rounded-md p-3.5 flex items-center gap-3 hover:bg-[#EAE0CA] transition-colors shadow-sm">
                            <Calendar strokeWidth={1.5} className="w-5 h-5 shrink-0 text-[#9E6E3D]" />
                            <div className="text-left flex-1">
                                <h3 className="font-semibold text-[13px] leading-tight text-[#6D421B]">Book Table</h3>
                                <p className="text-[#9E6E3D] text-[10px] font-medium">Reserve your royal dining experience</p>
                            </div>
                            <ChevronRight strokeWidth={2} className="w-4 h-4 text-[#9E6E3D]" />
                        </button>

                        <button className="w-full bg-[#F5EFE3] text-[#6D421B] border border-[#E3D7C1] rounded-md p-3.5 flex items-center gap-3 hover:bg-[#EAE0CA] transition-colors shadow-sm">
                            <AlertTriangle strokeWidth={1.5} className="w-5 h-5 shrink-0 text-[#9E6E3D]" />
                            <div className="text-left flex-1">
                                <h3 className="font-semibold text-[13px] leading-tight text-[#6D421B]">Allergens & Dietary Info</h3>
                                <p className="text-[#9E6E3D] text-[10px] font-medium">View allergens, spice levels & symbols</p>
                            </div>
                            <ChevronRight strokeWidth={2} className="w-4 h-4 text-[#9E6E3D]" />
                        </button>

                        <button 
                            onClick={requestAssistance}
                            disabled={assistanceCooldown > 0 || assistanceStatus === 'notifying'}
                            className="w-full bg-[#F5EFE3] text-[#6D421B] border border-[#E3D7C1] rounded-md p-3.5 flex items-center gap-3 hover:bg-[#EAE0CA] transition-colors shadow-sm disabled:opacity-75 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <Phone strokeWidth={1.5} className="w-5 h-5 shrink-0 text-[#9E6E3D]" />
                            <div className="text-left flex-1">
                                <h3 className="font-semibold text-[13px] leading-tight text-[#6D421B]">Call for Assistance</h3>
                                <p className="text-[#9E6E3D] text-[10px] font-medium">Ask staff for help or special requests</p>
                            </div>
                            {assistanceCooldown > 0 ? (
                                <span className="text-xs font-bold text-[#D31C13] bg-[#F4EBD7] px-2 py-1 rounded">
                                    {Math.ceil((assistanceCooldown - Date.now())/1000)}s
                                </span>
                            ) : (
                                <ChevronRight strokeWidth={2} className="w-4 h-4 text-[#9E6E3D] group-hover:translate-x-1 transition-transform" />
                            )}
                            
                            {/* Inner Status Toast */}
                            {assistanceStatus === 'success' && (
                                <div className="absolute inset-0 bg-green-50 flex items-center justify-center gap-2 text-green-700 font-bold animate-slide-in">
                                    <CheckCircle className="w-5 h-5" /> Staff has been notified
                                </div>
                            )}
                        </button>

                        <button 
                            onClick={() => setView('orders')}
                            className="w-full bg-[#F5EFE3] text-[#6D421B] border border-[#E3D7C1] rounded-md p-3.5 flex items-center gap-3 hover:bg-[#EAE0CA] transition-colors shadow-sm"
                        >
                            <Clock strokeWidth={1.5} className="w-5 h-5 shrink-0 text-[#9E6E3D]" />
                            <div className="text-left flex-1">
                                <h2 className="font-semibold text-[13px] leading-tight text-[#6D421B]">My Orders</h2>
                                <p className="text-[#9E6E3D] text-[10px] font-medium">Track your active orders & bill status</p>
                            </div>
                            <ChevronRight strokeWidth={2} className="w-4 h-4 text-[#9E6E3D]" />
                        </button>

                        <button className="w-full bg-[#F5EFE3] text-[#6D421B] border border-[#E3D7C1] rounded-md p-3.5 flex items-center gap-3 hover:bg-[#EAE0CA] transition-colors shadow-sm">
                            <Globe strokeWidth={1.5} className="w-5 h-5 shrink-0 text-[#9E6E3D]" />
                            <div className="text-left flex-1">
                                <h3 className="font-semibold text-[13px] leading-tight text-[#6D421B]">Visit Website</h3>
                                <p className="text-[#9E6E3D] text-[10px] font-medium">View full story, gallery & events</p>
                            </div>
                            <ChevronRight strokeWidth={2} className="w-4 h-4 text-[#9E6E3D]" />
                        </button>
                    </div>

                    <div className="w-full mt-6">
                        <div className="flex justify-around py-4 border-t border-b border-[#D5CAA1]">
                            <div className="flex flex-col items-center text-[#9E6E3D] hover:opacity-80 cursor-pointer">
                                <MapPin strokeWidth={1.5} className="w-[18px] h-[18px] mb-1.5" />
                                <span className="text-[10px] font-medium">Location</span>
                            </div>
                            <div className="flex flex-col items-center text-[#9E6E3D] hover:opacity-80 cursor-pointer">
                                <Phone strokeWidth={1.5} className="w-[18px] h-[18px] mb-1.5" />
                                <span className="text-[10px] font-medium">Call</span>
                            </div>
                            <div className="flex flex-col items-center text-[#9E6E3D] hover:opacity-80 cursor-pointer">
                                <Clock strokeWidth={1.5} className="w-[18px] h-[18px] mb-1.5" />
                                <span className="text-[10px] font-medium">Hours</span>
                            </div>
                        </div>
                        <div className="py-4 border-b border-[#D5CAA1] flex justify-center cursor-pointer hover:opacity-80">
                            <div className="flex items-center gap-2 text-[#9E6E3D]">
                                <Instagram strokeWidth={1.5} className="w-[18px] h-[18px]" />
                                <span className="text-[11px] font-semibold">Follow Us</span>
                            </div>
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button className="flex-1 bg-[#F1E8D5] border border-[#E3D7C1] py-2.5 rounded-md flex items-center justify-center gap-1.5 text-[#6D421B] text-[11px] font-semibold hover:bg-[#EAE0CA]">
                                <Star strokeWidth={1.5} className="w-[14px] h-[14px] text-[#A66D31]" /> Rate Us
                            </button>
                            <button className="flex-1 bg-[#F1E8D5] border border-[#E3D7C1] py-2.5 rounded-md flex items-center justify-center gap-1.5 text-[#6D421B] text-[11px] font-semibold hover:bg-[#EAE0CA]">
                                <QrCode strokeWidth={1.5} className="w-[14px] h-[14px] text-[#A66D31]" /> Save QR
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-center pb-5 pt-1 text-[#AB8B63] text-[9px] font-medium tracking-wide">
                    Designed for QR table-top menus
                </div>
            </div>
        </div>
    );

    const renderHeader = () => (
        <header className="sticky top-0 z-50 bg-[#F6EFE6]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-[#0B3A2E]/5">
            <div className="flex items-center gap-3">
                <img src="/logo-icon.png" alt="The Nizam's" className="h-10 w-10 object-contain drop-shadow-sm brightness-90" />
                <div className="h-8 w-px bg-[#0B3A2E]/10 mx-1"></div>
                <p className="text-[#C29958] text-[9px] uppercase tracking-[0.2em] font-bold leading-tight">Royal Dining<br/>Experience</p>
            </div>
            <div className="bg-[#0B3A2E] text-white px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest shadow-lg border border-white/10">
                TABLE {selectedTable}
            </div>
        </header>
    );

    const renderTabs = () => (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B3A2E] px-8 py-2 pb-6 flex justify-between items-center z-[60] rounded-t-[28px] shadow-[0_-10px_30px_rgba(0,0,0,0.3)] border-t border-white/5">
            <button 
                onClick={() => setView('menu')}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'menu' ? 'text-[#C29958] scale-105' : 'text-white/40'}`}
            >
                <div className={`p-2 rounded-xl transition-all ${view === 'menu' ? 'bg-white/5' : ''}`}>
                    <MenuIcon size={20} strokeWidth={view === 'menu' ? 2.5 : 2} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">Menu</span>
            </button>
            <button 
                onClick={() => setView('search')}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'search' ? 'text-[#C29958] scale-105' : 'text-white/40'}`}
            >
                <div className={`p-2 rounded-xl transition-all ${view === 'search' ? 'bg-white/5' : ''}`}>
                    <Search size={20} strokeWidth={view === 'search' ? 2.5 : 2} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">Search</span>
            </button>
            <button 
                onClick={() => setView('orders')}
                className="relative -top-5 flex flex-col items-center gap-1 transition-all group"
            >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl border-4 border-[#F6EFE6] ${view === 'orders' ? 'bg-[#C29958] text-[#0B3A2E] rotate-[360deg]' : 'bg-[#0B3A2E] text-white/80'}`}>
                    <Clock size={24} strokeWidth={2.5} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.15em] mt-0.5 ${view === 'orders' ? 'text-[#C29958]' : 'text-white/40'}`}>Orders</span>
                {myOrders.length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-[#C29958] text-[#0B3A2E] rounded-full text-[9px] font-black flex items-center justify-center border-2 border-[#F6EFE6]">
                        {myOrders.length}
                    </span>
                )}
            </button>
            <button 
                onClick={() => setIsCartOpen(true)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${isCartOpen ? 'text-[#C29958] scale-105' : 'text-white/40'} ${cartPulse ? 'animate-cart-bounce' : ''}`}
            >
                <div className={`p-2 rounded-xl transition-all ${isCartOpen ? 'bg-white/5' : ''} relative`}>
                    <ShoppingBag size={20} strokeWidth={isCartOpen ? 2.5 : 2} />
                    {cart.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C29958] rounded-full animate-pulse shadow-[0_0_10px_#C29958]"></span>
                    )}
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">Cart</span>
            </button>
        </div>
    );

    const renderPremiumMenu = () => {
        const categories = categoriesData;
        const featuredItem = menu.find(i => i.name === 'Nizami Dum Biryani') || menu[0];

        return (
            <div className="flex-1 overflow-y-auto pb-48 no-scrollbar scroll-smooth">
                {/* Categories Bar */}
                <div className="flex overflow-x-auto px-6 py-5 gap-8 no-scrollbar sticky top-0 bg-[#F9F6F0]/90 backdrop-blur-xl z-[45] border-b border-[#0B3A2E]/5 shadow-sm">
                    {categories.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => {
                                setExpandedCategory(cat.name);
                                document.getElementById(`cat-${cat.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`whitespace-nowrap transition-all relative py-1 ${expandedCategory === cat.name ? 'text-[#0B3A2E] scale-105' : 'text-[#6D5D4B] opacity-60 hover:opacity-100'}`}
                        >
                            <span className="text-[12px] font-black uppercase tracking-[0.15em]">{cat.name}</span>
                            {expandedCategory === cat.name && (
                                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#0B3A2E] rounded-full shadow-[0_2px_4px_rgba(11,58,46,0.3)] anim-grow"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Hero Feature */}
                <div className="px-6 mb-10 pt-6">
                    <div className="relative h-[240px] rounded-[40px] overflow-hidden shadow-2xl group active:scale-[0.98] transition-all duration-500">
                        {featuredItem?.image && (
                            <img src={featuredItem.image} alt={featuredItem.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-px w-6 bg-[#C29958]"></div>
                                <span className="text-[#C29958] text-[10px] font-black uppercase tracking-[0.25em]">Chef's Signature</span>
                            </div>
                            <h2 className="text-white text-4xl font-black font-serif leading-tight drop-shadow-2xl">{featuredItem?.name}</h2>
                        </div>
                    </div>
                </div>

                {/* Menu Grid */}
                <div className="px-6 space-y-10">
                    {categories.map(cat => (
                        <div key={cat.id} id={`cat-${cat.name}`} className="space-y-6 pt-2 scroll-mt-24">
                            <div className="flex items-center gap-4">
                                <h3 className="text-[#0B3A2E] text-2xl font-black font-serif">{cat.name}</h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-[#0B3A2E]/20 to-transparent"></div>
                            </div>
                            <div className="space-y-5">
                                {menu.filter(i => i.category === cat.name).map(item => {
                                    const inCart = cart.find(i => i.id === item.id);
                                    return (
                                        <div 
                                            key={item.id} 
                                            className={`flex gap-5 p-3 rounded-[32px] transition-all duration-500 ${inCart ? 'bg-white shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-[#C29958]/10' : 'hover:bg-white/40'}`}
                                        >
                                            <div className={`relative w-28 h-28 shrink-0 rounded-[28px] overflow-hidden bg-white shadow-lg border border-white ${activeEffect?.id === item.id ? 'animate-item-pop' : ''}`}>
                                                {/* Kitchen Effects Overlays */}
                                                {activeEffect?.id === item.id && (
                                                    <div className="absolute inset-0 z-10 pointer-events-none">
                                                        {activeEffect.effect === 'steam' && (
                                                            <div className="absolute inset-x-0 bottom-0 flex justify-center">
                                                                <div className="w-12 h-12 bg-white/20 rounded-full blur-xl animate-steam"></div>
                                                            </div>
                                                        )}
                                                        {activeEffect.effect === 'spice' && (
                                                            <div className="absolute inset-0 animate-spice-glow rounded-[28px]"></div>
                                                        )}
                                                        {activeEffect.effect === 'flame' && (
                                                            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent animate-flame"></div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="bg-[#0B3A2E] text-[#C29958] text-[8px] font-black uppercase px-3 py-1.5 rounded-full shadow-2xl animate-toast border border-[#C29958]/20">
                                                                Added to cart
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className={`w-full h-full object-cover transition-all duration-500 ${item.isAvailable ? '' : 'grayscale opacity-40'} ${inCart ? 'scale-105' : ''}`} />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-2">
                                                        <ShoppingBag size={20} className="text-gray-200" />
                                                        <span className="text-[8px] text-gray-300 uppercase font-black mt-1">No Image</span>
                                                    </div>
                                                )}
                                                {!item.isAvailable && (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                                                        <span className="bg-white/90 text-black text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-widest shadow-xl">Out</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between py-1.5 pr-2">
                                                <div>
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <h4 className="font-extrabold text-[#0B3A2E] text-[15px] leading-tight pr-3">{item.name}</h4>
                                                        <span className="font-black text-[#0B3A2E] text-base">£{item.price.toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-[#6D5D4B] text-[11px] leading-relaxed line-clamp-2 font-medium opacity-80">{item.desc}</p>
                                                </div>
                                                <div className="flex justify-start pt-3">
                                                    {inCart ? (
                                                        <div className="flex items-center gap-4 bg-[#F5E6CC]/40 rounded-full p-1.5 border border-[#C29958]/20 transition-all animate-slide-in shadow-inner">
                                                            <button 
                                                                onClick={() => updateQuantity(item.id, -1)}
                                                                className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-[#0B3A2E] shadow-md active:scale-75 transition-all"
                                                            >
                                                                <Minus size={14} strokeWidth={3} />
                                                            </button>
                                                            <span className="text-sm font-black text-[#0B3A2E] min-w-[16px] text-center tabular-nums">{inCart.qty}</span>
                                                            <button 
                                                                onClick={() => updateQuantity(item.id, 1)}
                                                                className="w-7 h-7 bg-[#0B3A2E] rounded-full flex items-center justify-center text-white shadow-lg active:scale-75 transition-all animate-button-tap"
                                                            >
                                                                <Plus size={14} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={(e) => handleAddToCart(item, e)}
                                                            disabled={!item.isAvailable}
                                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[10px] tracking-[0.1em] uppercase transition-all shadow-lg active:scale-95 ${!item.isAvailable ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#0B3A2E] text-white hover:bg-[#082e25] ring-4 ring-transparent hover:ring-[#0B3A2E]/10'} ${activeEffect?.id === item.id ? 'animate-button-tap' : ''}`}
                                                        >
                                                            {item.isAvailable ? <><Plus size={14} strokeWidth={3} /> Add</> : 'Unavailable'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Floating Bottom Cart Summary */}
                {cart.length > 0 && !isCartOpen && (
                    <div className="fixed bottom-36 left-6 right-6 z-50 animate-slide-in">
                        <button 
                            onClick={() => setIsCartOpen(true)}
                            className="w-full bg-[#0B3A2E] p-4 pr-6 rounded-[36px] shadow-[0_25px_50px_rgba(0,0,0,0.4)] flex justify-between items-center group active:scale-[0.98] transition-all duration-300 border border-white/10"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-[#C29958] rounded-[24px] flex items-center justify-center text-[#0B3A2E] shadow-inner rotate-3 group-hover:rotate-0 transition-transform">
                                    <ShoppingBag size={28} strokeWidth={2.5} />
                                </div>
                                <div className="text-left">
                                    <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">{cart.reduce((s, i) => s + i.qty, 0)} Items</p>
                                    <p className="text-white text-2xl font-black tabular-nums">£{cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="bg-[#C29958] text-[#0B3A2E] px-8 py-3.5 rounded-[22px] font-black uppercase tracking-[0.15em] text-[11px] group-hover:bg-white group-hover:scale-105 transition-all shadow-xl">
                                VIEW CART
                            </div>
                        </button>
                    </div>
                )}
            </div>
        );
    };


    const renderCartSheet = () => {
        if (!isCartOpen) return null;
        const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const serviceCharge = Number((subtotal * 0.10).toFixed(2));
        const finalTotal = Number((subtotal + serviceCharge).toFixed(2));

        return (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                <div className="absolute inset-0 bg-[#0B3A2E]/20 backdrop-blur-md transition-opacity duration-500" onClick={() => setIsCartOpen(false)}></div>
                <div className="w-full bg-[#F9F6F0] rounded-t-[50px] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] relative z-10 flex flex-col max-h-[92vh] animate-slide-in border-t border-white">
                    <div className="w-16 h-1.5 bg-[#0B3A2E]/10 rounded-full mx-auto my-5 shrink-0"></div>
                    
                    <div className="px-10 pb-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-[#0B3A2E] text-3xl font-black font-serif">Your Selection</h2>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="w-2 h-2 bg-[#C29958] rounded-full"></span>
                                <p className="text-[#C29958] text-[10px] font-black uppercase tracking-[0.2em]">{cart.length} Items Reserved</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsCartOpen(false)}
                            className="w-14 h-14 bg-white rounded-[22px] flex items-center justify-center text-[#0B3A2E] shadow-md border border-black/5 active:scale-90 transition-all"
                        >
                            <X size={26} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-10 py-2 space-y-8 no-scrollbar">
                        {cart.length === 0 ? (
                            <div className="py-20 text-center opacity-40">
                                <ShoppingBag size={64} className="mx-auto mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">Your bag is empty</p>
                            </div>
                        ) : cart.map(item => (
                            <div key={item.id} className="flex gap-6 animate-fade-in">
                                <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-white shadow-xl shrink-0 border-2 border-white">
                                    <img src={item.image || '/logo-icon.png'} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-1.5">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-[#0B3A2E] text-base leading-tight pr-4">{item.name}</h4>
                                        <span className="font-black text-[#0B3A2E] text-base whitespace-nowrap">£{(item.price * item.qty).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex items-center gap-4 bg-white rounded-[20px] p-2 shadow-inner border border-black/5">
                                            <button 
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-8 h-8 bg-[#F9F6F0] rounded-full flex items-center justify-center text-[#0B3A2E] shadow-sm active:scale-75 transition-all"
                                            >
                                                <Minus size={16} strokeWidth={3} />
                                            </button>
                                            <span className="text-base font-black text-[#0B3A2E] min-w-[18px] text-center tabular-nums">{item.qty}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-8 h-8 bg-[#0B3A2E] rounded-full flex items-center justify-center text-white shadow-lg active:scale-75 transition-all"
                                            >
                                                <Plus size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => updateQuantity(item.id, -item.qty)}
                                            className="w-10 h-10 text-red-500/40 hover:text-red-500 transition-colors flex items-center justify-center"
                                        >
                                            <X size={24} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="pt-6 pb-10">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="h-px bg-[#0B3A2E]/10 flex-1"></div>
                                <p className="text-[#0B3A2E]/40 text-[10px] font-black uppercase tracking-[0.25em]">Special Requests</p>
                                <div className="h-px bg-[#0B3A2E]/10 flex-1"></div>
                             </div>
                             <textarea 
                                className="w-full bg-white border border-[#0B3A2E]/5 rounded-[28px] p-6 text-[13px] font-medium text-[#0B3A2E] focus:ring-2 focus:ring-[#C29958]/20 transition-all outline-none shadow-inner placeholder:opacity-30"
                                placeholder="e.g. Extra spicy, no coriander, allergies..."
                                rows="3"
                             ></textarea>
                        </div>
                    </div>

                    <div className="p-10 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.05)] rounded-t-[50px] space-y-6 border-t border-black/5">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs text-[#6D5D4B] font-bold uppercase tracking-widest opacity-60">
                                <span>Subtotal</span>
                                <span className="tabular-nums">£{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-[#6D5D4B] font-bold uppercase tracking-widest opacity-60">
                                <span>Royal Service Fee (10%)</span>
                                <span className="tabular-nums">£{serviceCharge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-5 mt-2 border-t border-[#0B3A2E]/5">
                                <div>
                                    <span className="text-[#0B3A2E] text-[10px] font-black uppercase tracking-[0.25em] opacity-40 block mb-1">Grand Total</span>
                                    <span className="text-[#0B3A2E] text-sm font-bold opacity-60">To be settled later</span>
                                </div>
                                <span className="text-[#0B3A2E] text-4xl font-black font-serif tabular-nums">£{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <button 
                            onClick={submitOrder}
                            disabled={orderStatus === 'submitting' || cart.length === 0}
                            className="w-full bg-[#0B3A2E] text-white py-6 rounded-[35px] font-black uppercase tracking-[0.2em] text-[13px] shadow-[0_20px_40px_rgba(11,58,46,0.3)] flex items-center justify-center gap-4 active:scale-[0.97] transition-all disabled:opacity-30 disabled:grayscale group"
                        >
                            {orderStatus === 'submitting' ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>CONFIRMING...</span>
                                </div>
                            ) : (
                                <>
                                    <span>CONFIRM ORDER</span>
                                    <span className="text-xl group-hover:scale-125 transition-transform duration-500">✨</span>
                                </>
                            )}
                        </button>
                        <button onClick={() => setIsCartOpen(false)} className="w-full text-[#6D5D4B] text-[10px] font-black uppercase tracking-[0.2em] text-center pb-4 py-2 hover:opacity-100 opacity-60 transition-opacity">
                            CLOSE & CONTINUE BROWSING
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPremiumMyOrders = () => (
        <div className="flex-1 overflow-y-auto px-8 py-10 pb-48 no-scrollbar scroll-smooth">
            <h2 className="text-[#0B3A2E] text-5xl font-black font-serif mb-3 leading-tight">My Orders</h2>
            <p className="text-[#6D5D4B] text-sm leading-relaxed mb-12 font-medium opacity-80">Tracing your journey through the royal kitchens of Hyderabad.</p>

            <div className="space-y-16">
                <section>
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[#0B3A2E] text-2xl font-black font-serif">Current Delights</h3>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-[#C29958] rounded-full animate-pulse"></div>
                             <span className="text-[#C29958] text-[10px] font-black uppercase tracking-widest">IN PROGRESS</span>
                        </div>
                    </div>
                    {myOrders.filter(o => o.status === 'Pending' || o.status === 'Preparing').length === 0 ? (
                        <div className="bg-white/40 rounded-[40px] p-20 text-center border-2 border-dashed border-[#0B3A2E]/5 flex flex-col items-center">
                            <Clock className="w-12 h-12 text-[#0B3A2E]/10 mb-5" strokeWidth={1.5} />
                            <p className="text-[#6D5D4B] text-xs font-black uppercase tracking-widest opacity-40">No active delights</p>
                            <button onClick={() => setView('menu')} className="mt-8 bg-[#0B3A2E]/5 text-[#0B3A2E] px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0B3A2E]/10 transition-all">Start Ordering</button>
                        </div>
                    ) : (
                        myOrders.filter(o => o.status === 'Pending' || o.status === 'Preparing').map(order => (
                            <div key={order.id} className="bg-white rounded-[45px] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.06)] relative overflow-hidden mb-8 border border-white transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)]">
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#C29958]/5 blur-[60px] rounded-full"></div>
                                <div className="flex justify-between items-start mb-8">
                                    <div className="bg-[#0B3A2E]/5 px-5 py-2.5 rounded-2xl">
                                        <p className="text-[#0B3A2E] text-[10px] font-black uppercase tracking-[0.15em] opacity-50 mb-0.5">Order #NIZ-{order.id.toString().slice(-4)}</p>
                                        <h4 className="text-[#0B3A2E] text-xl font-bold font-serif leading-none italic">Dakhni Chowgra Table</h4>
                                    </div>
                                    <span className="bg-[#F5E6CC] text-[#7F5E24] px-5 py-2.5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.1em] shadow-sm">
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="space-y-4 mb-8">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-[#0B3A2E] opacity-90">{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#C29958] text-[11px] font-black">×</span>
                                                <span className="font-black text-[#0B3A2E] text-base">{item.qty}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-[#0B3A2E]/5 flex items-center gap-3 text-[#C29958]">
                                    <div className="w-10 h-10 bg-[#F5E6CC]/40 rounded-full flex items-center justify-center">
                                         <Clock size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Estimated arrival: 12-15 mins</span>
                                </div>
                            </div>
                        ))
                    )}
                </section>

                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <h3 className="text-[#0B3A2E] text-2xl font-black font-serif">Heritage Record</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#0B3A2E]/10 to-transparent"></div>
                    </div>
                    <div className="space-y-6">
                        {myOrders.filter(o => o.status === 'Billed' || o.status === 'Completed').length === 0 ? (
                            <p className="text-center py-10 text-[#6D5D4B]/40 text-xs font-black uppercase tracking-widest italic">No past records yet</p>
                        ) : myOrders.filter(o => o.status === 'Billed' || o.status === 'Completed').map(order => (
                            <div key={order.id} className="bg-white rounded-[35px] p-5 flex gap-6 items-center border border-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                                <div className="w-20 h-20 rounded-[28px] overflow-hidden bg-gray-50 shadow-md shrink-0 border border-white">
                                    <img src={order.items[0]?.image || '/logo-icon.png'} alt="Order" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2 text-green-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-80">
                                        <CheckCircle size={10} strokeWidth={3} /> CONFIRMED
                                    </div>
                                    <h4 className="text-[#0B3A2E] font-black text-base leading-tight mb-1 truncate">{order.items[0]?.name}{order.items.length > 1 ? ` & ${order.items.length - 1} more` : ''}</h4>
                                    <p className="text-[#6D5D4B] text-[10px] font-black opacity-40 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long' })} • {order.items.length} Items</p>
                                </div>
                                <div className="text-[#0B3A2E] font-black text-lg tabular-nums bg-[#F5E6CC]/20 px-4 py-2 rounded-2xl">
                                    £{order.total.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <button 
                onClick={() => setView('menu')}
                className="w-full mt-16 bg-[#0B3A2E] text-white py-6 rounded-[40px] font-black uppercase tracking-[0.25em] text-[12px] shadow-2xl active:scale-[0.98] transition-all hover:bg-[#082e25]"
            >
                RETURN TO GRAND MENU
            </button>
        </div>
    );

    const renderPremiumContent = () => {
        if (!selectedTable) return renderTableSelection();
        return (
            <div className="fixed inset-0 bg-[#F6EFE6] flex flex-col font-sans animate-fade-in no-scrollbar overflow-hidden select-none">
                {renderHeader()}
                <div className="flex-1 overflow-hidden flex flex-col relative">
                    {view === 'menu' && renderPremiumMenu()}
                    {view === 'orders' && renderPremiumMyOrders()}
                    {view === 'search' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                            <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center text-[#C29958] shadow-2xl mb-8">
                                <Search size={40} />
                            </div>
                            <h2 className="text-[#0B3A2E] text-3xl font-black font-serif mb-3 italic">Seeking a Royal Flavor?</h2>
                            <p className="text-[#6D5D4B] text-sm font-medium opacity-60 leading-relaxed uppercase tracking-widest">Our royal search engine is being<br/>polished for your convenience.</p>
                        </div>
                    )}
                    {renderTabs()}
                </div>
                {renderCartSheet()}
                
                {/* Visual Feedback Overlays */}
                {orderStatus === 'success' && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center px-8 animate-fade-in">
                        <div className="absolute inset-0 bg-[#0B3A2E]/60 backdrop-blur-xl" onClick={() => setOrderStatus(null)}></div>
                        <div className="bg-white p-12 rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col items-center gap-6 text-center animate-slide-in relative z-10 border border-white">
                            <div className="w-24 h-24 bg-[#C29958] rounded-full flex items-center justify-center text-[#0B3A2E] shadow-2xl animate-kitchen-fly-up relative">
                                <CheckCircle size={48} strokeWidth={2.5} />
                                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
                            </div>
                            <div>
                                 <h3 className="text-[#0B3A2E] text-4xl font-black font-serif mb-2 italic">Order Received!</h3>
                                 <p className="text-[#6D5D4B] text-xs font-black leading-[1.6] uppercase tracking-[0.25em] opacity-60">Our chefs have started preparing<br/>your royal selection.</p>
                            </div>
                            <button 
                                onClick={() => { setOrderStatus(null); setView('orders'); }}
                                className="mt-4 bg-[#0B3A2E] text-white px-10 py-5 rounded-[30px] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl active:scale-95 transition-all"
                            >
                                Track Progress
                            </button>
                        </div>
                    </div>
                )}

                {/* Assistance Floating Button - Redesigned */}
                <div className={`fixed transition-all duration-500 z-[55] ${view === 'menu' && cart.length > 0 && !isCartOpen ? 'bottom-56 right-6' : 'bottom-32 right-6'}`}>
                    <button 
                        onClick={requestAssistance}
                        disabled={assistanceCooldown > 0 || assistanceStatus === 'notifying'}
                        className="group bg-red-600 text-white w-14 h-14 rounded-full shadow-[0_15px_30px_rgba(220,38,38,0.4)] flex items-center justify-center active:scale-90 transition-all border-4 border-white relative overflow-hidden disabled:bg-red-400"
                    >
                        {assistanceCooldown > 0 ? (
                            <span className="text-[12px] font-black">{Math.ceil((assistanceCooldown - Date.now())/1000)}s</span>
                        ) : (
                            <Bell className={`w-6 h-6 ${assistanceStatus === 'notifying' ? 'animate-bounce' : 'group-hover:animate-shake'}`} />
                        )}
                        {assistanceStatus === 'success' && (
                            <div className="absolute inset-0 bg-green-500 flex items-center justify-center animate-fade-in">
                                <CheckCircle size={20} strokeWidth={3} />
                            </div>
                        )}
                    </button>
                    {assistanceStatus === 'success' && (
                        <div className="absolute bottom-full right-0 mb-4 bg-white text-[#0B3A2E] p-4 px-6 rounded-[25px] text-[10px] font-black uppercase tracking-widest shadow-2xl border border-black/5 whitespace-nowrap animate-slide-in">
                             ✨ Staff notified!
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return renderPremiumContent();
}

