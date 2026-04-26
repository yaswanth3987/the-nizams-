import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
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
    ShoppingBag,
    Trophy,
    Sparkles,
    Users,
    Info,
    PoundSterling
} from 'lucide-react';
import { categoriesData, menuData } from '../data/menu.js';
import { socket } from '../utils/socket';
import { SoundContext } from '../context/SoundContextDefinition';

const API_URL = import.meta.env.DEV 
    ? `http://${window.location.hostname}:3001/api` 
    : '/api';

const generateSessionId = (tableId) => {
    let sid = localStorage.getItem(`session_${tableId}`);
    if (!sid) {
        sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        if (tableId) {
            localStorage.setItem(`session_${tableId}`, sid);
        }
    }
    return sid;
};

export default function CustomerMenu() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tableParam = searchParams.get('table');
    const [selectedTable, setSelectedTable] = useState(tableParam || null);

    const [menu, setMenu] = useState(menuData);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [view, setView] = useState('menu'); // 'menu' | 'search' | 'orders'
    const [expandedCategory, setExpandedCategory] = useState("Chef's Specials");
    const [myOrders, setMyOrders] = useState([]);
    const [activeEffect, setActiveEffect] = useState(null); // { id, effect }
    const [cartPulse, setCartPulse] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewItem, setPreviewItem] = useState(null);
    const [specialRequest, setSpecialRequest] = useState('');
    const [spiceLevel, setSpiceLevel] = useState('');
    const [billRequestStatus, setBillRequestStatus] = useState(null); // 'notifying', 'success', 'error'
    const [lastScrollTime, setLastScrollTime] = useState(0);
    const [isMenuLoading, setIsMenuLoading] = useState(true);
    const [menuError, setMenuError] = useState(null);
    const [expandedPlatters, setExpandedPlatters] = useState({}); // { id: boolean }

    const [now, setNow] = useState(() => Date.now());

    const { soundEnabled } = useContext(SoundContext);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const playWhoosh = useCallback(() => {
        // Use SoundContext logic or a shared audio if we want more control
        // For now, let's keep it simple but respect soundEnabled
        if (!soundEnabled) return;
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.05;
        audio.play().catch(() => {});
    }, [soundEnabled]);

    const handleScroll = () => {
        const currentTime = Date.now();
        if (currentTime - lastScrollTime > 800) { // Throttle 800ms
            playWhoosh();
            setLastScrollTime(currentTime);
        }
    };

    const triggerKitchenFeedback = useCallback((itemId) => {
        const KITCHEN_EFFECTS = ['steam', 'spice', 'flame'];
        const randomEffect = KITCHEN_EFFECTS[Math.floor(Math.random() * KITCHEN_EFFECTS.length)];
        setActiveEffect({ id: itemId, effect: randomEffect });
        setCartPulse(true);
        if (window.navigator.vibrate) window.navigator.vibrate(10);
        setTimeout(() => {
            setActiveEffect(null);
            setCartPulse(false);
        }, 1000);
    }, []);

    const [assistanceStatus, setAssistanceStatus] = useState(null);
    const [assistanceCooldown, setAssistanceCooldown] = useState(0);
    const [sessionError, setSessionError] = useState(false);
    
    const sessionId = useMemo(() => generateSessionId(selectedTable), [selectedTable]);

    // Handle assistance cooldown per table
    useEffect(() => {
        const saved = selectedTable ? localStorage.getItem(`assist_cooldown_${selectedTable}`) : null;
        let expire = 0;
        if (saved) {
            const parsed = parseInt(saved, 10);
            if (parsed > Date.now()) {
                expire = parsed;
            } else {
                localStorage.removeItem(`assist_cooldown_${selectedTable}`);
            }
        }
        
        // Use a functional update or just the value; the key is reducing nesting if possible
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAssistanceCooldown(expire);
    }, [selectedTable]);

    const validateSession = useCallback(async () => {
        if (!selectedTable) return;
        try {
            const sid = localStorage.getItem(`session_${selectedTable}`) || sessionId;
            const formattedTable = /^[A-Z]/.test(selectedTable) ? selectedTable : `T${selectedTable}`;
            const res = await fetch(`${API_URL}/sessions/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId: formattedTable, sessionId: sid })
            });
            if (!res.ok) {
                setSessionError(true);
            }
        } catch (e) {
            console.error(e);
        }
    }, [selectedTable, sessionId]);

    const fetchRemoteMenu = useCallback(() => {
        setIsMenuLoading(true);
        setMenuError(null);
        fetch(`${API_URL}/menu`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load menu');
                return res.json();
            })
            .then(data => {
                if(data && data.length > 0) {
                    setMenu(data);
                }
                setIsMenuLoading(false);
            })
            .catch((err) => {
                console.error('Menu load error:', err);
                setIsMenuLoading(false);
                setMenuError('Temporary connection issue. Please refresh.');
            });
    }, []);

    useEffect(() => {
        if (!selectedTable) return;
        
        setTimeout(() => validateSession(), 0);

        // Auto-mark table as ordering when customer opens the menu
        const formattedTable = /^[A-Z]/.test(selectedTable) ? selectedTable : `T${selectedTable}`;
        fetch(`${API_URL}/table-status/${formattedTable}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ordering' })
        }).catch(() => {});

        if (assistanceCooldown > 0) {
            const timer = setInterval(() => {
                if (Date.now() > assistanceCooldown) {
                    setAssistanceCooldown(0);
                    localStorage.removeItem(`assist_cooldown_${selectedTable}`);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [assistanceCooldown, selectedTable, validateSession]);

    const requestAssistance = async () => {
        if (assistanceCooldown > 0 || !selectedTable) return;
        setAssistanceStatus('notifying');
        try {
            const formattedTable = /^[A-Z]/.test(selectedTable) ? selectedTable : `T${selectedTable}`;
            const res = await fetch(`${API_URL}/assistance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId: formattedTable })
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
        } catch (error) {
            console.error('Assistance Request Failed:', error);
            setAssistanceStatus('error');
            setTimeout(() => setAssistanceStatus(null), 3000);
        }
    };
    const requestBill = async () => {
        if (!selectedTable || assistanceCooldown > 0) return;
        setBillRequestStatus('notifying');
        try {
            const formattedTable = /^[A-Z]/.test(selectedTable) ? selectedTable : `T${selectedTable}`;
            const res = await fetch(`${API_URL}/assistance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId: formattedTable, type: 'bill' })
            });
            if (res.ok) {
                setBillRequestStatus('success');
                const expire = Date.now() + 180000;
                setAssistanceCooldown(expire);
                localStorage.setItem(`assist_cooldown_${selectedTable}`, expire);
                setTimeout(() => setBillRequestStatus(null), 4000);
            } else {
                setBillRequestStatus('error');
                setTimeout(() => setBillRequestStatus(null), 3000);
            }
        } catch (error) {
            console.error('Bill Request Failed:', error);
            setBillRequestStatus('error');
            setTimeout(() => setBillRequestStatus(null), 3000);
        }
    };
    useEffect(() => {
        setTimeout(() => fetchRemoteMenu(), 0);

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
    }, [fetchRemoteMenu]);

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
        if (cart.length === 0 || !selectedTable || orderStatus === 'submitting') return;
        setOrderStatus('submitting');
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const serviceCharge = 0; // Configurable in future
        const finalTotal = subtotal + serviceCharge;
        
        const formattedTable = /^[A-Z]/.test(selectedTable) ? selectedTable : `T${selectedTable}`;
        const itemsList = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
        
        if (specialRequest || spiceLevel) {
            const noteText = [spiceLevel ? `[${spiceLevel}]` : '', specialRequest].filter(Boolean).join(' ');
            itemsList.push({ id: `note_${Date.now()}`, name: `Note: ${noteText}`, price: 0, qty: 1 });
        }
        
        const orderData = {
            tableId: formattedTable,
            items: itemsList,
            finalTotal,
            subtotal,
            serviceCharge,
            status: 'new',
            sessionId: sessionId
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
                setSpecialRequest('');
                setSpiceLevel('');
                setTimeout(() => setOrderStatus(null), 3000);
            } else {
                const errData = await res.json().catch(() => ({}));
                if (res.status === 403) {
                    setSessionError(true);
                }
                setOrderStatus(errData.message || 'error');
                setTimeout(() => setOrderStatus(null), 4000);
            }
        } catch (error) { 
            console.error('Order Submission Failed:', error);
            setOrderStatus('Network Error. Please try again.'); 
            setTimeout(() => setOrderStatus(null), 4000);
        }
    };

    const handleTableSelect = (table) => {
        setSelectedTable(table);
        setSearchParams({ table });
    };

    const fetchMyOrders = useCallback(async () => {
        if (!selectedTable) return;
        try {
            const tableId = /^[A-Z]/.test(selectedTable) ? selectedTable : `T${selectedTable}`;
            const [sessionsRes, newOrdersRes] = await Promise.all([
                fetch(`${API_URL}/tables/${tableId}/sessions`),
                fetch(`${API_URL}/tables/${tableId}/new-orders`)
            ]);
            const sessionsData = await sessionsRes.json();
            const newOrdersData = await newOrdersRes.json();
            
            const statusLabel = (s) => {
                if (s === 'confirmed') return 'Order Received';
                if (s === 'active') return 'Cooking Started';
                if (s === 'ready') return 'Ready to Serve';
                if (s === 'served') return 'Served';
                if (s === 'billed' || s === 'payment') return 'Ready to Pay';
                if (s === 'completed') return 'Completed';
                return 'Processing';
            };

            const formattedSessions = (Array.isArray(sessionsData) ? sessionsData : [])
                .map(s => ({
                id: s.id,
                items: Array.isArray(s.items) ? s.items : (typeof s.items === 'string' ? (() => { try { return JSON.parse(s.items) } catch(e) { return [] } })() : []),
                total: s.subtotal || s.finalTotal || 0,
                status: statusLabel(s.status),
                createdAt: s.createdAt
            }));

            const rawStatusLabel = (s) => {
                if (s === 'accepted') return 'Accepted âœ“';
                if (s === 'rejected') return 'Rejected âœ—';
                return 'Pending';
            };

            const formattedNew = (Array.isArray(newOrdersData) ? newOrdersData : [])
                .map(o => ({
                id: o.id,
                items: Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? (() => { try { return JSON.parse(o.items) } catch(e) { return [] } })() : []),
                total: o.subtotal || o.finalTotal || 0,
                status: rawStatusLabel(o.status),
                createdAt: o.createdAt
            }));

            setMyOrders([...formattedNew, ...formattedSessions]);
        } catch (error) {
            console.error("Failed to fetch my orders", error);
        }
    }, [selectedTable, sessionId]);

    useEffect(() => {
        let interval;
        if (view === 'orders') {
            setTimeout(() => fetchMyOrders(), 0);
            interval = setInterval(fetchMyOrders, 10000);
            
            const handleUpdate = () => fetchMyOrders();
            socket.on('orderUpdated', handleUpdate);
            socket.on('sessionUpdated', handleUpdate);
            socket.on('tableReset', handleUpdate);
            
            return () => {
                clearInterval(interval);
                socket.off('orderUpdated', handleUpdate);
                socket.off('sessionUpdated', handleUpdate);
                socket.off('tableReset', handleUpdate);
            };
        }
    }, [view, selectedTable, fetchMyOrders]);

    const renderTableSelection = () => (
        <div className="min-h-screen bg-[#111312] py-8 px-4 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-[360px] bg-[#1c1e1c] rounded-2xl shadow-2xl overflow-hidden border border-[#d4af37]/20 p-8 text-center">
                <img src="/logo-icon.png" alt="Logo" className="w-16 h-16 mx-auto mb-4 drop-shadow-md brightness-150" />
                <h2 className="text-3xl font-serif text-[#d4af37] mb-2 leading-tight">Welcome to<br/>The Nizam's</h2>
                <p className="text-[#a8b8b2] text-sm mb-6">Please select your seating unit to view the menu.</p>
                
                <div className="text-left mb-2 text-[#d4af37] text-xs font-bold uppercase tracking-widest border-b border-[#d4af37]/30 pb-1">Tables</div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {Array.from({length: 4}).map((_, i) => {
                        const t = `T${String(i+1).padStart(2, '0')}`;
                        return (
                            <button key={t} onClick={() => handleTableSelect(t)} className="bg-[#111312] border border-[#d4af37]/30 text-[#d4af37] py-2 rounded font-bold text-sm hover:bg-[#d4af37]/10 transition-colors shadow-inner">{t}</button>
                        );
                    })}
                </div>

                <div className="text-left mb-2 text-[#d4af37] text-xs font-bold uppercase tracking-widest border-b border-[#d4af37]/30 pb-1">Boxes</div>
                <div className="grid grid-cols-6 gap-2 mb-4">
                    {Array.from({length: 6}).map((_, i) => {
                        const b = `B${String(i+1).padStart(2, '0')}`;
                        return (
                            <button key={b} onClick={() => handleTableSelect(b)} className="bg-[#111312] border border-[#d4af37]/30 text-emerald-300 py-2 rounded font-bold text-sm hover:bg-[#d4af37]/10 transition-colors shadow-inner">{b}</button>
                        );
                    })}
                </div>

                <div className="text-left mb-2 text-[#d4af37] text-xs font-bold uppercase tracking-widest border-b border-[#d4af37]/30 pb-1">Chowkies</div>
                <div className="grid grid-cols-5 gap-2">
                    {Array.from({length: 13}).map((_, i) => {
                        const c = `C${String(i+1).padStart(2, '0')}`;
                        return (
                            <button key={c} onClick={() => handleTableSelect(c)} className="bg-[#111312] border border-[#d4af37]/30 text-emerald-500 py-2 rounded font-bold text-sm hover:bg-[#d4af37]/10 transition-colors shadow-inner">{c}</button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderHeader = () => (
        <header className="sticky top-0 z-50 bg-[#F6EFE6]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-[#0B3A2E]/5 shadow-sm">
            <div className="flex items-center gap-3">
                <img src="/logo-icon.png" alt="The Nizam's" className="h-10 w-10 object-contain drop-shadow-sm brightness-90" />
                <div className="h-8 w-px bg-[#0B3A2E]/10 mx-1"></div>
                <p className="text-[#C29958] text-[9px] uppercase tracking-[0.2em] font-bold leading-tight">Royal Dining<br/>Experience</p>
            </div>
            <div className="flex items-center gap-3">
                <a 
                    href="https://www.instagram.com/thegreatnizam/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative flex items-center justify-center p-2 rounded-xl bg-white shadow-[0_2px_10px_rgba(225,48,108,0.2)] border border-[#E1306C]/20 hover:scale-105 active:scale-95 transition-all group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] to-[#cc2366] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Instagram size={16} className="text-[#E1306C] group-hover:text-white relative z-10 transition-colors duration-300" strokeWidth={2.5} />
                </a>
                <div className="flex items-center bg-[#0B3A2E] text-white px-4 py-2 rounded-2xl shadow-lg border border-white/10">
                    <span className="text-[10px] font-black tracking-widest uppercase">
                        {selectedTable}
                    </span>
                </div>
            </div>
        </header>
    );

    const renderTabs = () => (
        <div className="fixed bottom-0 left-0 right-0 h-[64px] bg-[#0B3A2E]/95 backdrop-blur-xl px-8 flex justify-between items-center z-[100] rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.3)] border-t border-white/10">
            <button 
                onClick={() => setView('menu')}
                className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${view === 'menu' ? 'text-[#C29958] scale-105' : 'text-white/40'}`}
            >
                <div className={`p-1.5 rounded-lg transition-all ${view === 'menu' ? 'bg-white/5' : ''}`}>
                    <MenuIcon size={18} strokeWidth={view === 'menu' ? 2.5 : 2} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-[0.15em]">Menu</span>
            </button>
            <button 
                onClick={() => setView('search')}
                className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${view === 'search' ? 'text-[#C29958] scale-105' : 'text-white/40'}`}
            >
                <div className={`p-1.5 rounded-lg transition-all ${view === 'search' ? 'bg-white/5' : ''}`}>
                    <Search size={18} strokeWidth={view === 'search' ? 2.5 : 2} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-[0.15em]">Search</span>
            </button>
            <button 
                onClick={() => setView('orders')}
                className="relative -top-4 flex flex-col items-center gap-0.5 transition-all group"
            >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-2xl border-4 border-[#F6EFE6] ${view === 'orders' ? 'bg-[#C29958] text-[#0B3A2E] rotate-[360deg]' : 'bg-[#0B3A2E] text-white/80'}`}>
                    <Clock size={20} strokeWidth={2.5} />
                </div>
                <span className={`text-[7px] font-black uppercase tracking-[0.15em] mt-0.5 ${view === 'orders' ? 'text-[#C29958]' : 'text-white/40'}`}>Orders</span>
                {myOrders.length > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#C29958] text-[#0B3A2E] rounded-full text-[8px] font-black flex items-center justify-center border-2 border-[#F6EFE6]">
                        {myOrders.length}
                    </span>
                )}
            </button>
            <button 
                onClick={() => setIsCartOpen(true)}
                className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${isCartOpen ? 'text-[#C29958] scale-105' : 'text-white/40'} ${cartPulse ? 'animate-cart-bounce' : ''}`}
            >
                <div className={`p-1.5 rounded-lg transition-all ${isCartOpen ? 'bg-white/5' : ''} relative`}>
                    <ShoppingBag size={18} strokeWidth={isCartOpen ? 2.5 : 2} />
                    {cart.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-[#C29958] rounded-full animate-pulse shadow-[0_0_10px_#C29958] border border-[#0B3A2E]"></span>
                    )}
                </div>
                <span className="text-[7px] font-black uppercase tracking-[0.15em]">Cart</span>
            </button>
        </div>
    );

    const renderItemBadge = (item) => {
        const badges = [];
        if (item.isPopular) badges.push({ 
            label: 'Popular', 
            icon: <Flame size={8} fill="currentColor" />, 
            class: 'bg-red-500 text-white border-red-400/30' 
        });
        if (item.isBestSeller) badges.push({ 
            label: 'Best Seller', 
            icon: <Trophy size={8} fill="currentColor" />, 
            class: 'bg-emerald-500 text-white border-emerald-400/30' 
        });
        if (item.isRecommended) badges.push({ 
            label: 'Recommended', 
            icon: <Star size={8} fill="currentColor" />, 
            class: 'bg-[#C29958] text-[#0B3A2E] border-white/20' 
        });
        if (item.isNew) badges.push({ 
            label: 'New', 
            icon: <Sparkles size={8} fill="currentColor" />, 
            class: 'bg-blue-500 text-white border-blue-400/30' 
        });

        const displayBadges = badges.slice(0, 2);

        if (displayBadges.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1.5 mb-1.5 animate-fade-in">
                {displayBadges.map((badge, idx) => (
                    <div 
                        key={idx}
                        className={`${badge.class} text-[8px] font-black px-2 py-0.5 rounded-[4px] shadow-sm flex items-center gap-1 border border-white/20 animate-in slide-in-from-left duration-500`}
                        style={{ animationDelay: `${idx * 150}ms` }}
                    >
                        {badge.icon} {badge.label.toUpperCase()}
                    </div>
                ))}
            </div>
        );
    };

    const renderImagePreviewModal = () => {
        if (!previewItem) return null;
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setPreviewItem(null)}></div>
                <div className="relative bg-white rounded-[40px] overflow-hidden max-w-sm w-full shadow-2xl animate-zoom-in">
                    <button 
                        onClick={() => setPreviewItem(null)}
                        className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>
                    {previewItem.image ? (
                        <img 
                            src={previewItem.image} 
                            alt={previewItem.name} 
                            className="w-full h-72 object-cover" 
                            onError={(e) => { e.target.src = '/logo-icon.png'; e.target.className = 'w-full h-72 object-contain p-8 bg-[#F6EFE6]'; }}
                        />
                    ) : (
                        <div className="w-full h-72 bg-[#F6EFE6] flex items-center justify-center">
                            <ShoppingBag size={64} className="text-[#C29958]/20" />
                        </div>
                    )}
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[#0B3A2E] text-2xl font-black font-serif uppercase tracking-tight">{previewItem.name}</h3>
                            <span className="text-2xl font-black text-[#0B3A2E]">£{(previewItem.price || 0).toFixed(2)}</span>
                        </div>
                        {renderItemBadge(previewItem)}
                        <p className="text-[#6D5D4B] text-sm leading-relaxed mb-4 opacity-80 italic font-medium mt-2">"{previewItem.desc || previewItem.description}"</p>
                        
                        {previewItem.category === 'Mandi Platters' && previewItem.platterItems && (
                            <div className="mb-6 bg-[#F6EFE6]/50 rounded-2xl p-4 border border-[#C29958]/10">
                                <h4 className="text-[10px] font-black text-[#C29958] uppercase tracking-[0.2em] mb-3">Complete Feast Includes:</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {previewItem.platterItems.map((pi, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#C29958]"></div>
                                                <span className="text-[#0B3A2E] font-bold">{pi.name}</span>
                                            </div>
                                            <span className="text-[#C29958] font-black">{pi.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => { handleAddToCart(previewItem); setPreviewItem(null); }}
                            className="w-full bg-[#0B3A2E] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all"
                        >
                            Add to Feast
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPlatterDetails = (item) => {
        const isExpanded = expandedPlatters[item.id];
        const toggleExpand = (e) => {
            e.stopPropagation();
            setExpandedPlatters(prev => ({ ...prev, [item.id]: !prev[item.id] }));
        };

        if (!item.platterItems) return null;

        return (
            <div className="mt-2 mb-4 space-y-3">
                {/* Highlight Badges */}
                <div className="flex flex-wrap gap-1.5">
                    {item.group && (
                        <div className="flex items-center gap-1 bg-[#0B3A2E]/5 border border-[#0B3A2E]/10 px-2 py-0.5 rounded-md">
                            <Users size={8} className="text-[#0B3A2E]" />
                            <span className="text-[7px] font-black text-[#0B3A2E] uppercase">Serves {item.group}</span>
                        </div>
                    )}
                    <div className="bg-[#C29958]/10 border border-[#C29958]/20 px-2 py-0.5 rounded-md">
                        <span className="text-[7px] font-black text-[#C29958] uppercase">Mixed Platter</span>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                        <span className="text-[7px] font-black text-red-600 uppercase">Non-Veg Feast</span>
                    </div>
                </div>

                {/* Includes Section */}
                <div className="bg-[#F6EFE6]/40 rounded-xl p-3 border border-black/5">
                    <div className="text-[8px] font-black text-[#C29958] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Info size={10} />
                        What's Included?
                    </div>
                    
                    <ul className="grid grid-cols-1 gap-1.5">
                        {item.platterItems.slice(0, 3).map((pi, idx) => (
                            <li key={idx} className="flex items-center justify-between text-[9px] text-[#6D5D4B] font-bold">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#C29958]"></div>
                                    <span>{pi.name}</span>
                                </div>
                                <span className="text-[#0B3A2E] opacity-60">x {pi.qty}</span>
                            </li>
                        ))}
                    </ul>

                    {isExpanded && (
                        <div className="mt-1.5 pt-1.5 border-t border-black/5 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                            {item.platterItems.slice(3).map((pi, idx) => (
                                <li key={idx} className="flex items-center justify-between text-[9px] text-[#6D5D4B] font-bold list-none">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-[#C29958]"></div>
                                        <span>{pi.name}</span>
                                    </div>
                                    <span className="text-[#0B3A2E] opacity-60">x {pi.qty}</span>
                                </li>
                            ))}
                        </div>
                    )}

                    {item.platterItems.length > 3 && (
                        <button 
                            onClick={toggleExpand}
                            className="mt-3 w-full flex items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#0B3A2E] bg-white/50 py-1.5 rounded-lg border border-black/5 hover:bg-white transition-all shadow-sm"
                        >
                            {isExpanded ? (
                                <>View Less <ChevronUp size={10} /></>
                            ) : (
                                <>View Full Contents ({item.platterItems.length} items) <ChevronDown size={10} /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderPremiumMenu = () => {
        const featuredItem = (menu || []).find(i => i.name === 'NIZAMI LAMB CURRY (REGULAR)') || (menu || []).find(i => i.name === 'Nizami Dum Biryani') || (menu || [])[0];

        return (
            <div 
                className="flex-1 overflow-y-auto pb-[90px]"
                onScroll={handleScroll}
            >
                <div className="flex overflow-x-auto px-6 py-5 gap-8 sticky top-0 bg-[#F9F6F0] z-[45] border-b border-[#0B3A2E]/5 shadow-sm">
                    {categoriesData.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => {
                                setExpandedCategory(cat.name);
                                document.getElementById(`cat-${cat.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`whitespace-nowrap transition-all relative py-1 ${expandedCategory === cat.name ? 'text-[#0B3A2E] scale-105 font-bold' : 'text-[#6D5D4B] opacity-60 hover:opacity-100'}`}
                        >
                            <span className="text-[12px] font-black uppercase tracking-[0.15em]">{cat.name}</span>
                            {expandedCategory === cat.name && (
                                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#C29958] rounded-full shadow-[0_2px_4px_rgba(194,153,88,0.3)] anim-grow"></div>
                            )}
                        </button>
                    ))}
                </div>

                {menuError && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 animate-slide-in">
                        <AlertTriangle size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{menuError}</span>
                    </div>
                )}

                <div className="py-8 px-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[#0B3A2E] text-2xl font-black font-serif italic">Nizam's Favorites</h3>
                        <div className="flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-[#C29958]/20"></div>
                             <div className="w-2 h-2 rounded-full bg-[#C29958]"></div>
                        </div>
                    </div>
                    <div className="flex overflow-x-auto gap-6 pb-4 -mx-2 px-2">
                        {(menu || []).filter(i => i.isPopular || i.isRecommended).map(item => (
                            <div 
                                key={`pop-${item.id}`}
                                onClick={() => setPreviewItem(item)}
                                className="min-w-[180px] bg-white rounded-[32px] p-3 shadow-xl border border-black/5 hover:-translate-y-2 hover:shadow-[0_25px_50px_-10px_rgba(11,58,46,0.2)] active:scale-95 transition-all duration-500"
                            >
                                <div className="relative h-32 rounded-[24px] overflow-hidden mb-3 bg-[#F6EFE6]/30">
                                    <img 
                                        src={item.image || '/logo-icon.png'} 
                                        alt={item.name} 
                                        className={`w-full h-full ${item.image ? 'object-cover' : 'object-contain p-4'}`}
                                        onError={(e) => { e.target.src = '/logo-icon.png'; e.target.className = 'w-full h-full object-contain p-4'; }}
                                    />
                                </div>
                                <h4 className="text-[#0B3A2E] font-black text-[12px] uppercase tracking-tight leading-none mb-1.5 truncate">{item.name}</h4>
                                {renderItemBadge(item)}
                                <div className="flex justify-between items-center mt-auto pt-1">
                                    <span className="text-[#C29958] text-xs font-black">£{(item.price || 0).toFixed(2)}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                                        className="w-8 h-8 bg-[#0B3A2E] text-white rounded-full flex items-center justify-center shadow-lg active:rotate-12 transition-all"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-6 mb-10 pt-6">
                    <div 
                        className="relative h-[240px] rounded-[40px] overflow-hidden shadow-2xl group active:scale-[0.98] transition-[transform,shadow] duration-300 select-none touch-manipulation"
                        style={{ WebkitTapHighlightColor: 'transparent', willChange: 'transform' }}
                    >
                        {featuredItem?.image && (
                            <img 
                                src={featuredItem.image} 
                                alt={featuredItem.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                onError={(e) => { e.target.src = '/logo-icon.png'; e.target.className = 'w-full h-full object-contain p-12 bg-black/20'; }}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-px w-6 bg-[#C29958]"></div>
                                <span className="text-[#C29958] text-[10px] font-black uppercase tracking-[0.25em]">Chef's Signature</span>
                            </div>
                            <h2 className="text-white text-4xl font-black font-serif leading-tight drop-shadow-2xl">{featuredItem?.name?.replace(' (REGULAR)', '')}</h2>
                        </div>
                    </div>
                </div>

                <div className="px-4 space-y-8 mt-2">
                    {isMenuLoading ? (
                        [1,2,3,4].map(n => (
                            <div key={n} className="flex gap-4 p-4 bg-white rounded-[20px] premium-shadow border border-black/5 animate-pulse">
                                <div className="w-24 h-24 bg-gray-100 rounded-[18px] skeleton shrink-0"></div>
                                <div className="flex-1 space-y-3 py-1">
                                    <div className="h-4 bg-gray-100 rounded-full w-3/4 skeleton"></div>
                                    <div className="h-3 bg-gray-100 rounded-full w-1/2 skeleton"></div>
                                    <div className="pt-4 flex gap-2">
                                        <div className="h-8 bg-gray-100 rounded-full w-20 skeleton"></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        categoriesData.map(cat => (
                            <div key={cat.id} id={`cat-${cat.name}`} className="space-y-5 pt-2 scroll-mt-24">
                                <div className="flex items-center gap-4 mb-2">
                                    <h3 className="text-[#0B3A2E] text-xl font-bold font-serif opacity-90">{cat.name}</h3>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-[#0B3A2E]/10 to-transparent"></div>
                                </div>
                                <div className="space-y-5 flex flex-col">
                                    {(menu || []).filter(i => i.category === cat.name).map(item => {
                                        const inCart = (cart || []).find(i => i.id === item.id);
                                        return (
                                            <div 
                                                key={item.id} 
                                                className={`flex gap-4 p-4 rounded-[20px] bg-white premium-shadow border border-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(11,58,46,0.15)] ${inCart ? 'ring-2 ring-[#C29958] bg-gradient-to-br from-white to-[#F6EFE6]' : ''}`}
                                            >
                                                <div 
                                                    onClick={() => !item.isTemporarilyUnavailable && setPreviewItem(item)}
                                                    className={`relative w-24 h-24 shrink-0 rounded-[18px] overflow-hidden bg-[#F6EFE6]/30 border border-black/5 select-none touch-manipulation active:scale-[0.96] transition-transform duration-200 cursor-pointer ${activeEffect?.id === item.id ? 'animate-item-pop' : ''} ${item.isTemporarilyUnavailable ? 'grayscale ring-1 ring-red-500/20' : ''}`}
                                                    style={{ WebkitTapHighlightColor: 'transparent', willChange: 'transform' }}
                                                >
                                                    {item.isTemporarilyUnavailable && (
                                                        <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center z-10">
                                                            <Clock size={20} className="text-white/80 drop-shadow-md" />
                                                        </div>
                                                    )}
                                                    {activeEffect?.id === item.id && (
                                                        <div className="absolute inset-0 z-10 pointer-events-none">
                                                            {activeEffect.effect === 'steam' && (
                                                                <div className="absolute inset-x-0 bottom-0 flex justify-center">
                                                                    <div className="w-12 h-12 bg-white/30 rounded-full blur-xl animate-steam"></div>
                                                                </div>
                                                            )}
                                                            {activeEffect.effect === 'spice' && (
                                                                <div className="absolute inset-0 animate-spice-glow rounded-[18px]"></div>
                                                            )}
                                                            {activeEffect.effect === 'flame' && (
                                                                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent animate-flame"></div>
                                                            )}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="bg-[#0B3A2E]/90 backdrop-blur-md text-[#C29958] text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-2xl animate-toast border border-[#C29958]/20">
                                                                    Added
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <img 
                                                        src={item.image || '/logo-icon.png'} 
                                                        alt={item.name} 
                                                        loading="lazy"
                                                        className={`w-full h-full transition-all duration-700 ${item.image ? 'object-cover' : 'object-contain p-4'} ${item.isAvailable ? '' : 'grayscale opacity-40'} ${inCart ? 'scale-110' : ''}`} 
                                                        onError={(e) => { e.target.src = '/logo-icon.png'; e.target.className = 'w-full h-full object-contain p-4'; }}
                                                    />
                                                    {!item.isAvailable && (
                                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-[3px] p-2 text-center">
                                                            <span className="bg-white text-black text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-[0.2em] shadow-xl mb-1.5">UNAVAILABLE</span>
                                                            {item.unavailableUntil && (
                                                                <div className="flex items-center gap-1.5 text-white/90 text-[7px] font-bold uppercase tracking-widest bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse">
                                                                    <Clock size={8} /> Available after {new Date(item.unavailableUntil).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between py-0.5">
                                                    <div>
                                                        <div className="flex justify-between items-start gap-2 mb-1">
                                                            <h4 className="font-extrabold text-[#0B3A2E] text-[14px] leading-tight flex-1">{item.name}</h4>
                                                            <span className="font-black text-[#0B3A2E] text-sm">£{(item.price || 0).toFixed(2)}</span>
                                                        </div>
                                                        {renderItemBadge(item)}
                                                        {item.category === 'Mandi Platters' ? (
                                                            renderPlatterDetails(item)
                                                        ) : (
                                                            <p className="text-[#6D5D4B] text-[10px] leading-relaxed line-clamp-2 font-medium opacity-70 mb-3">{item.desc}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-start">
                                                        {inCart ? (
                                                            <div className="flex items-center gap-3 bg-[#0B3A2E] rounded-full p-1 border border-white/10 transition-all animate-slide-in shadow-lg">
                                                                <button 
                                                                    onClick={() => updateQuantity(item.id, -1)}
                                                                    className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-75 transition-all"
                                                                >
                                                                    <Minus size={12} strokeWidth={3} />
                                                                </button>
                                                                <span className="text-xs font-black text-white min-w-[14px] text-center tabular-nums">{inCart.qty}</span>
                                                                <button 
                                                                    onClick={() => updateQuantity(item.id, 1)}
                                                                    className="w-7 h-7 bg-[#C29958] rounded-full flex items-center justify-center text-[#0B3A2E] shadow-lg active:scale-125 transition-all animate-button-tap"
                                                                >
                                                                    <Plus size={12} strokeWidth={3} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={(e) => handleAddToCart(item, e)}
                                                                disabled={!item.isAvailable}
                                                                className={`group relative flex items-center gap-1.5 px-5 py-2 rounded-full font-black text-[9px] tracking-[0.05em] uppercase transition-all shadow-md active:scale-95 ${!item.isAvailable ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#0B3A2E] text-white hover:bg-[#082e25] border border-white/5'} ${activeEffect?.id === item.id ? 'animate-button-tap' : ''}`}
                                                            >
                                                                {item.isAvailable ? (
                                                                    <>
                                                                        <Plus size={12} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> 
                                                                        <span>Add</span>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-0.5">
                                                                        <span className="opacity-60">Locked</span>
                                                                        {item.unavailableUntil && (
                                                                            <span className="text-[6px] normal-case opacity-40 lowercase">{new Date(item.unavailableUntil).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && !isCartOpen && (
                    <div className="fixed bottom-[76px] left-4 right-4 z-50 animate-slide-in">
                        <button 
                            onClick={() => setIsCartOpen(true)}
                            className="w-full bg-[#0B3A2E] p-3.5 pr-5 rounded-[28px] shadow-[0_20px_40px_rgba(0,0,0,0.35)] flex justify-between items-center group active:scale-[0.98] transition-all duration-300 border border-white/10"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-[#C29958] rounded-[18px] flex items-center justify-center text-[#0B3A2E] shadow-inner">
                                    <ShoppingBag size={20} strokeWidth={2.5} />
                                </div>
                                <div className="text-left">
                                    <p className="text-white/50 text-[8px] font-black uppercase tracking-[0.2em] mb-0">{cart.reduce((s, i) => s + i.qty, 0)} Items in cart</p>
                                    <p className="text-white text-lg font-black tabular-nums leading-tight">£{(cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0) || 0).toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="bg-[#C29958] text-[#0B3A2E] px-5 py-2.5 rounded-[18px] font-black uppercase tracking-[0.1em] text-[10px] group-hover:bg-white transition-all shadow-lg">
                                View Cart â†’
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
        const finalTotal = subtotal;

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

                    <div className="flex-1 overflow-y-auto px-10 py-2 space-y-8">
                        {cart.length === 0 ? (
                            <div className="py-20 text-center opacity-40">
                                <ShoppingBag size={64} className="mx-auto mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">Your bag is empty</p>
                            </div>
                        ) : (cart || []).map(item => (
                            <div key={item.id} className="flex gap-6 animate-fade-in">
                                <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-white shadow-xl shrink-0 border-2 border-white flex items-center justify-center">
                                    <img 
                                        src={item.image || '/logo-icon.png'} 
                                        alt={item.name} 
                                        className={`w-full h-full ${item.image ? 'object-cover' : 'object-contain p-4'}`}
                                        onError={(e) => { e.target.src = '/logo-icon.png'; e.target.className = 'w-full h-full object-contain p-4'; }}
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-1.5">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-[#0B3A2E] text-base leading-tight pr-4">{item.name}</h4>
                                        <span className="font-black text-[#0B3A2E] text-base whitespace-nowrap">£{((item.price || 0) * (item.qty || 0)).toFixed(2)}</span>
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

                        <div className="pt-4">
                             <div className="flex items-center justify-between mb-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm animate-fade-in">
                                 <div className="flex flex-col">
                                     <h4 className="font-bold text-[#0B3A2E] text-sm flex items-center gap-2">
                                         <span className="text-xl">ðŸ’§</span> Add Bottle
                                     </h4>
                                     <p className="text-[10px] text-[#6D5D4B] font-bold opacity-60 uppercase tracking-widest pl-7 mt-0.5">Chilled Natural Water</p>
                                 </div>
                                 <div className="flex items-center gap-3 bg-white rounded-[16px] p-1.5 shadow-sm border border-black/5">
                                     <button 
                                         onClick={() => updateQuantity('dr3', -1)}
                                         disabled={!cart.find(i => i.id === 'dr3')}
                                         className={`w-8 h-8 rounded-[12px] flex items-center justify-center transition-all ${cart.find(i => i.id === 'dr3') ? 'bg-blue-50 text-blue-600 active:scale-75' : 'bg-gray-50 text-gray-400'}`}
                                     >
                                         <Minus size={14} strokeWidth={3} />
                                     </button>
                                     <span className="font-black text-[#0B3A2E] text-sm min-w-[16px] text-center tabular-nums">{cart.find(i => i.id === 'dr3')?.qty || 0}</span>
                                     <button 
                                         onClick={() => {
                                             const waterId = 'dr3';
                                             const waterItem = (menu || []).find(i => i.id === waterId) || menuData.find(i => i.id === waterId);
                                             if (waterItem) {
                                                 const inCart = (cart || []).find(i => i.id === waterId);
                                                 if (!inCart) {
                                                     handleAddToCart(waterItem);
                                                 } else {
                                                     updateQuantity(waterId, 1);
                                                 }
                                             }
                                         }}
                                         className="w-8 h-8 bg-blue-500 text-white rounded-[12px] flex items-center justify-center shadow-md active:scale-75 transition-all"
                                     >
                                         <Plus size={14} strokeWidth={3} />
                                     </button>
                                 </div>
                             </div>
                        </div>

                        <div className="pt-2 pb-10">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="h-px bg-[#0B3A2E]/10 flex-1"></div>
                                <p className="text-[#0B3A2E]/40 text-[10px] font-black uppercase tracking-[0.25em]">Special Requests</p>
                                <div className="h-px bg-[#0B3A2E]/10 flex-1"></div>
                             </div>
                             
                             <div className="flex gap-3 mb-4">
                                 <button 
                                     onClick={() => setSpiceLevel(spiceLevel === 'MILD' ? '' : 'MILD')}
                                     className={`flex-1 py-3 rounded-2xl border text-xs font-black tracking-widest uppercase transition-all duration-300 ${spiceLevel === 'MILD' ? 'bg-[#F5EFE3] text-[#0B3A2E] border-[#C29958] shadow-[0_0_15px_rgba(194,153,88,0.2)]' : 'bg-white text-[#6D5D4B]/50 border-black/5'}`}
                                 >
                                     Mild
                                 </button>
                                 <button 
                                     onClick={() => setSpiceLevel(spiceLevel === 'SPICY' ? '' : 'SPICY')}
                                     className={`flex-1 py-3 rounded-2xl border text-xs font-black tracking-widest uppercase transition-all duration-300 ${spiceLevel === 'SPICY' ? 'bg-red-50 text-red-600 border-red-200 shadow-[0_0_15px_rgba(220,38,38,0.15)]' : 'bg-white text-[#6D5D4B]/50 border-black/5'}`}
                                 >
                                     Spicy
                                 </button>
                             </div>

                             <textarea 
                                value={specialRequest}
                                onChange={(e) => setSpecialRequest(e.target.value)}
                                className="w-full bg-white border border-[#0B3A2E]/5 rounded-[28px] p-6 text-[13px] font-medium text-[#0B3A2E] focus:ring-2 focus:ring-[#C29958]/20 transition-all outline-none shadow-inner placeholder:opacity-30"
                                placeholder="e.g. No coriander, allergies..."
                                rows="3"
                             ></textarea>
                        </div>
                    </div>

                    <div className="p-10 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.05)] rounded-t-[50px] space-y-6 border-t border-black/5">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end pt-5 mt-2">
                                <div>
                                    <span className="text-[#0B3A2E] text-[10px] font-black uppercase tracking-[0.25em] block mb-1">Items Total</span>
                                    <span className="text-[#0B3A2E] text-[10px] font-medium opacity-60">Excluding service fee</span>
                                </div>
                                <span className="text-[#0B3A2E] text-4xl font-black font-serif tabular-nums">£{(finalTotal || 0).toFixed(2)}</span>
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
                                    <span className="text-xl group-hover:scale-125 transition-transform duration-500">âœ¨</span>
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
        <div className="flex-1 overflow-y-auto px-8 py-10 pb-48">
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
                    {(myOrders || []).filter(o => ['Pending', 'Order Received', 'Cooking Started', 'Ready to Serve', 'Served', 'Accepted âœ“', 'Rejected âœ—'].includes(o.status)).length === 0 ? (
                        <div className="bg-white/40 rounded-[40px] p-20 text-center border-2 border-dashed border-[#0B3A2E]/5 flex flex-col items-center">
                            <Clock className="w-12 h-12 text-[#0B3A2E]/10 mb-5" strokeWidth={1.5} />
                            <p className="text-[#6D5D4B] text-xs font-black uppercase tracking-widest opacity-40">No active delights</p>
                            <button onClick={() => setView('menu')} className="mt-8 bg-[#0B3A2E]/5 text-[#0B3A2E] px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0B3A2E]/10 transition-all">Start Ordering</button>
                        </div>
                    ) : (
                        (myOrders || []).filter(o => ['Pending', 'Order Received', 'Cooking Started', 'Ready to Serve', 'Served', 'Accepted âœ“', 'Rejected âœ—'].includes(o.status)).map(order => {
                            const steps = [
                                { label: 'PREPARING', trigger: ['Pending', 'Order Received', 'Cooking Started', 'Ready to Serve', 'Served', 'Accepted âœ“'] },
                                { label: 'READY', trigger: ['Ready to Serve', 'Served'] },
                                { label: 'SERVED', trigger: ['Served'] },
                            ];
                            let currentStepIndex = -1;
                            for (let i = steps.length - 1; i >= 0; i--) {
                                if (steps[i].trigger.includes(order.status)) {
                                    currentStepIndex = i;
                                    break;
                                }
                            }
                            const isRejected = order.status === 'Rejected âœ—';

                            return (
                                <div key={order.id} className="bg-white rounded-[45px] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.06)] relative overflow-hidden mb-8 border border-white transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)]">
                                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#C29958]/5 blur-[60px] rounded-full pointer-events-none"></div>
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="bg-[#0B3A2E]/5 px-5 py-2.5 rounded-2xl">
                                            <p className="text-[#0B3A2E] text-[10px] font-black uppercase tracking-[0.15em] opacity-50 mb-0.5">Order #NIZ-{order.id?.toString().slice(-4) || '0000'}</p>
                                            <h4 className="text-[#0B3A2E] text-xl font-bold font-serif leading-none italic">Royal Order</h4>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 mb-8 relative z-10">
                                        {(order.items || []).map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-[#0B3A2E]/5 pb-3 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-5 h-5 bg-[#C29958]/10 text-[#C29958] flex items-center justify-center rounded text-[10px] font-black">x{item?.qty || 1}</span>
                                                    <span className="font-bold text-[#0B3A2E] opacity-90">{item?.name || 'Item'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 mb-4 px-2 relative z-10">
                                        {isRejected ? (
                                            <div className="text-red-500 font-bold text-[10px] uppercase tracking-widest text-center bg-red-50 p-4 rounded-2xl border border-red-100">
                                                Order Rejected by Restaurant
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center relative pt-2 pb-6">
                                                <div className="absolute left-[10px] right-[10px] top-4 h-[2px] bg-[#0B3A2E]/10 z-0"></div>
                                                <div className="absolute left-[10px] top-4 h-[2px] bg-[#0B3A2E] z-0 transition-all duration-1000 ease-in-out" style={{ width: `calc(${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}% - 20px)` }}></div>
                                                
                                                {steps.map((step, idx) => {
                                                    const active = idx <= currentStepIndex;
                                                    const current = idx === currentStepIndex;
                                                    return (
                                                        <div key={idx} className="relative z-10 flex flex-col items-center">
                                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-700 bg-white shadow-sm ${active ? 'border-[#0B3A2E]' : 'border-[#0B3A2E]/20'}`}>
                                                                {active && <div className={`w-3 h-3 rounded-full ${current ? 'bg-[#C29958] animate-pulse shadow-[0_0_8px_rgba(194,153,88,0.5)]' : 'bg-[#0B3A2E]'}`}></div>}
                                                            </div>
                                                            <span className={`text-[8px] font-black uppercase tracking-widest absolute -bottom-5 w-max text-center transition-colors duration-500 ${current ? 'text-[#C29958]' : active ? 'text-[#0B3A2E]' : 'text-[#0B3A2E]/40'}`}>
                                                                {step.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-[#0B3A2E]/5 flex items-center gap-3 text-[#C29958] mt-4 relative z-10">
                                        <div className="w-10 h-10 bg-[#F5E6CC]/40 rounded-full flex items-center justify-center">
                                             <Clock size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                                {currentStepIndex >= 3 ? 'Arrived at table' : 'Live Kitchen Tracking Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>

                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <h3 className="text-[#0B3A2E] text-2xl font-black font-serif">Heritage Record</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#0B3A2E]/10 to-transparent"></div>
                    </div>
                    <div className="space-y-6">
                        {(myOrders || []).filter(o => ['Ready to Pay', 'Completed', 'Billed'].includes(o.status)).length === 0 ? (
                            <p className="text-center py-10 text-[#6D5D4B]/40 text-xs font-black uppercase tracking-widest italic">No past records yet</p>
                        ) : (myOrders || []).filter(o => ['Ready to Pay', 'Completed', 'Billed'].includes(o.status)).map(order => (
                            <div key={order.id} className="bg-white rounded-[35px] p-5 flex gap-6 items-center border border-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                                <div className="w-20 h-20 rounded-[28px] overflow-hidden bg-gray-50 shadow-md shrink-0 border border-white flex items-center justify-center">
                                    <img 
                                        src={(order.items && order.items[0]?.image) || '/logo-icon.png'} 
                                        alt="Order" 
                                        className={`w-full h-full ${(order.items && order.items[0]?.image) ? 'object-cover' : 'object-contain p-3'}`}
                                        onError={(e) => { e.target.src = '/logo-icon.png'; e.target.className = 'w-full h-full object-contain p-3'; }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2 text-green-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-80">
                                        <CheckCircle size={10} strokeWidth={3} /> CONFIRMED
                                    </div>
                                    <h4 className="text-[#0B3A2E] font-black text-base leading-tight mb-1 truncate">{(order.items && order.items[0]?.name) || 'Royal Feast'}{(order.items && order.items.length > 1) ? ` & ${order.items.length - 1} more` : ''}</h4>
                                    <p className="text-[#6D5D4B] text-[10px] font-black opacity-40 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long' })} â€¢ {(order.items && order.items.length) || 0} Items</p>
                                </div>
                                <div className="text-[#0B3A2E] font-black text-lg tabular-nums bg-[#F5E6CC]/20 px-4 py-2 rounded-2xl">
                                    £{(order.total || 0).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="mt-8">
                    <div className="bg-[#0B3A2E] rounded-[45px] p-8 shadow-2xl relative overflow-hidden border border-white/10 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C29958]/10 blur-3xl rounded-full"></div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-[#C29958] rounded-full flex items-center justify-center text-[#0B3A2E] mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                <PoundSterling size={32} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-white text-2xl font-black font-serif italic mb-2 tracking-tight">Ready for Settlement?</h3>
                            <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-8 leading-relaxed px-4">Our stewards will arrive with your royal bill<br/>and preferred payment unit.</p>
                            
                            <button 
                                onClick={requestBill}
                                disabled={assistanceCooldown > 0 || billRequestStatus === 'notifying'}
                                className={`w-full py-5 rounded-[28px] font-black uppercase tracking-[0.25em] text-[11px] transition-all duration-500 active:scale-95 flex items-center justify-center gap-3 ${
                                    billRequestStatus === 'success' 
                                    ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)]' 
                                    : 'bg-[#C29958] text-[#0B3A2E] shadow-[0_15px_30px_rgba(194,153,88,0.3)] hover:bg-white'
                                }`}
                            >
                                {billRequestStatus === 'notifying' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-[#0B3A2E]/20 border-t-[#0B3A2E] rounded-full animate-spin"></div>
                                        <span>CALLING STEWARD...</span>
                                    </>
                                ) : billRequestStatus === 'success' ? (
                                    <>
                                        <CheckCircle size={18} strokeWidth={3} />
                                        <span>STEWARD NOTIFIED</span>
                                    </>
                                ) : (
                                    <>
                                        <span>REQUEST FINAL BILL</span>
                                        <ChevronRight size={18} strokeWidth={3} />
                                    </>
                                )}
                            </button>
                        </div>
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

    const renderSessionError = () => (
        <div className="min-h-screen bg-[#111312] py-8 px-4 flex flex-col items-center justify-center font-sans tracking-tight">
            <div className="w-full max-w-[360px] bg-[#1c1e1c] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-[#d4af37]/20 p-8 text-center text-white">
                <img src="/logo-icon.png" alt="Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-md brightness-150" />
                <AlertTriangle className="mx-auto mb-4 text-[#d4af37] w-12 h-12" />
                <h2 className="text-2xl font-serif text-[#d4af37] mb-3 leading-tight">Table In Use</h2>
                <p className="text-[#a8b8b2] text-sm mb-6 leading-relaxed">
                    This table is currently in use. Please contact staff for assistance.
                </p>
                <button 
                    onClick={() => { localStorage.removeItem(`session_${selectedTable}`); window.location.reload(); }}
                    className="w-full bg-[#0B3A2E] text-[#C29958] py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    const renderPremiumContent = () => {
        if (!selectedTable) return renderTableSelection();
        // EMERGENCY BYPASS: Ignore sessionError for today's opening to prevent any lockout.
        // if (sessionError) return renderSessionError();
        return (
            <div className="fixed inset-0 bg-[#F6EFE6] flex flex-col font-sans animate-fade-in overflow-hidden select-none">
                {renderHeader()}
                <div className="flex-1 overflow-hidden flex flex-col relative">
                    {view === 'menu' && renderPremiumMenu()}
                    {view === 'orders' && renderPremiumMyOrders()}
                    {view === 'search' && (
                        <div className="flex-1 flex flex-col bg-white animate-fade-in relative z-10">
                            <div className="p-6 border-b border-black/5 bg-[#F9F6F0]">
                                <div className="relative group">
                                    <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-[#C29958]' : 'text-[#6D5D4B]/30'}`}>
                                        <Search size={20} strokeWidth={3} />
                                    </div>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Crave something royal?"
                                        className="w-full bg-white rounded-[24px] py-5 px-14 text-sm font-bold text-[#0B3A2E] placeholder:text-[#6D5D4B]/20 outline-none focus:ring-4 focus:ring-[#C29958]/10 shadow-inner transition-all border border-black/5"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/5 text-[#6D5D4B]/40 rounded-full flex items-center justify-center"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {searchQuery ? (
                                    <>
                                        {(menu || []).filter(i => 
                                            (i.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            (i.category || '').toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map(item => {
                                            return (
                                                <div 
                                                    key={item.id} 
                                                    className="flex items-center gap-4 animate-slide-in"
                                                    onClick={() => setPreviewItem(item)}
                                                >
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-black/5 bg-gray-50 flex items-center justify-center">
                                                        <img 
                                                            src={item.image || '/logo-icon.png'} 
                                                            alt={item.name} 
                                                            className={`w-full h-full ${item.image ? 'object-cover' : 'object-contain p-3'}`}
                                                            onError={(e) => { e.target.src = '/logo-icon.png'; e.target.className = 'w-full h-full object-contain p-3'; }}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-[#0B3A2E] font-black text-xs uppercase tracking-tight leading-tight">{item.name}</h4>
                                                        <p className="text-[#6D5D4B] text-[9px] font-black uppercase tracking-widest opacity-40">{item.category}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black text-[#0B3A2E]">£{(item.price || 0).toFixed(2)}</span>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                                                            className="w-10 h-10 bg-[#0B3A2E] text-white rounded-xl flex items-center justify-center shadow-lg"
                                                        >
                                                            <Plus size={16} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(menu || []).filter(i => 
                                            (i.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            (i.category || '').toLowerCase().includes(searchQuery.toLowerCase())
                                        ).length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                <ShoppingBag size={48} className="mb-4" />
                                                <p className="font-black uppercase tracking-[0.2em] text-[10px]">No matches in our kitchen</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                                        <div className="w-20 h-20 bg-[#F9F6F0] rounded-[30px] flex items-center justify-center text-[#C29958] mb-6">
                                            <Search size={32} />
                                        </div>
                                        <h3 className="text-[#0B3A2E] text-xl font-black font-serif italic mb-2">Search our delicacies</h3>
                                        <p className="text-[#6D5D4B] text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Type a dish name or category</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {renderTabs()}
                </div>
                {renderCartSheet()}
                {renderImagePreviewModal()}
                
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
                            <span className="text-[12px] font-black">{Math.ceil((assistanceCooldown - now)/1000)}s</span>
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
                             âœ¨ Staff notified!
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return renderPremiumContent();
}

