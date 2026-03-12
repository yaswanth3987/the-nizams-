import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, X, CheckCircle, ChevronRight, ChevronDown, ChevronUp, Clock, MapPin, Phone, Instagram, Star, QrCode, BookOpen, Calendar, AlertTriangle, Globe, Flame, Bell } from 'lucide-react';
import { categoriesData, menuData } from '../data/menu.js';

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : '/api';

export default function CustomerMenu() {
    const [searchParams] = useSearchParams();
    const tableId = searchParams.get('table') || '12';

    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [addedItems, setAddedItems] = useState({});
    const [view, setView] = useState('landing'); // 'landing' | 'menu' | 'book'
    const [expandedCategory, setExpandedCategory] = useState('Biryani Thaali');
    const [flyingDots, setFlyingDots] = useState([]);
    
    const [assistanceStatus, setAssistanceStatus] = useState(null);
    const [assistanceCooldown, setAssistanceCooldown] = useState(() => {
        const saved = localStorage.getItem(`assist_cooldown_${tableId}`);
        return saved ? parseInt(saved, 10) : 0;
    });

    useEffect(() => {
        if (assistanceCooldown > 0) {
            const timer = setInterval(() => {
                if (Date.now() > assistanceCooldown) {
                    setAssistanceCooldown(0);
                    localStorage.removeItem(`assist_cooldown_${tableId}`);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [assistanceCooldown, tableId]);

    const requestAssistance = async () => {
        if (assistanceCooldown > 0) return;
        setAssistanceStatus('notifying');
        try {
            const res = await fetch(`${API_URL}/assistance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId: `T${tableId}` })
            });
            if (res.ok) {
                setAssistanceStatus('success');
                const expire = Date.now() + 180000; // 3 minutes
                setAssistanceCooldown(expire);
                localStorage.setItem(`assist_cooldown_${tableId}`, expire);
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
        // We now populate the menu instantly with our rich client-side hardcoded data
        // while also silently trying to fetch any dynamic server-side updates if present.
        setMenu(menuData);
        
        fetch(`${API_URL}/menu`)
            .then(res => res.json())
            .then(data => {
                if(data && data.length > 0) {
                   setMenu(prev => {    
                        const combined = [...prev];
                        // Overwrite or append server data
                        data.forEach(serverItem => {
                            if (!combined.find(i => i.id === serverItem.id)) {
                                combined.push(serverItem);
                            }
                        });
                        return combined;
                   });
                }
            })
            .catch(err => console.log("Silent fail on menu API, using defaults"));
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
        addToCart(item);
        
        // Button Added State
        setAddedItems(prev => ({ ...prev, [item.id]: true }));
        setTimeout(() => {
            setAddedItems(prev => ({ ...prev, [item.id]: false }));
        }, 1500);

        // Flying animation payload
        if (e && e.clientX) {
            const newDot = { id: Date.now(), x: e.clientX, y: e.clientY, image: item.image };
            setFlyingDots(prev => [...prev, newDot]);
            setTimeout(() => {
                setFlyingDots(prev => prev.filter(d => d.id !== newDot.id));
            }, 800);
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.qty + delta;
                return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const submitOrder = async () => {
        if (cart.length === 0) return;
        setOrderStatus('submitting');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const orderData = {
            tableId: `T${tableId}`,
            items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
            total,
            net: total / 1.2,
            vat: total - (total / 1.2),
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
            } else setOrderStatus('error');
        } catch (err) { setOrderStatus('error'); }
    };

    const renderLanding = () => (
        <div className="min-h-screen bg-[#C2A165] py-8 px-4 flex flex-col items-center font-sans tracking-tight">
            <div className="w-full max-w-[360px] bg-[#F7EFE1] rounded-lg shadow-xl overflow-hidden border border-white/20">
                <div className="p-6 pb-4 flex flex-col items-center">
                    <img src="/logo-with-name.png" alt="THE NIZAM'S" className="w-[140px] mb-2 drop-shadow-sm" />
                    <p className="text-[#966336] font-medium tracking-[0.15em] text-[9px] mb-6 uppercase text-center w-full border-b border-transparent">Authentic Indian Cuisine</p>

                    <div className="w-full bg-[#EAE0CA] border border-[#D5CAA1] rounded-md p-3 px-4 flex items-center justify-between mb-6 shadow-sm">
                        <p className="text-[#6D421B] text-[11px] font-medium leading-[1.4] max-w-[130px]">
                            Scan & browse the all menu. No app required.
                        </p>
                        <div className="text-right border-l border-[#D5CAA1] pl-4">
                            <p className="text-[#6D421B] text-[11px] font-semibold">Table {tableId} -</p>
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

    const renderMenu = () => (
        <div className="min-h-screen bg-[#C2A165] py-4 px-4 flex flex-col items-center font-sans tracking-tight">
            <div className="w-full max-w-[360px] bg-[#F4EBD7] rounded-lg shadow-xl overflow-hidden flex flex-col border border-white/20 flex-1 h-[90vh]">
                
                {/* Header */}
                <header className="bg-[#D35D01] text-white p-4 flex justify-between items-center z-10 relative">
                    <button onClick={() => setView('landing')} className="flex items-center gap-1 font-bold text-[13px] hover:opacity-80 active:scale-95 z-20">
                        <ChevronLeft strokeWidth={2.5} className="w-4 h-4" /> Back
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 text-center w-full z-10 px-16">
                        <h1 className="text-[16px] font-black tracking-wider uppercase leading-tight drop-shadow-sm">The Nizam's</h1>
                        <p className="text-[8px] font-bold tracking-widest uppercase opacity-90 mt-0.5">Authentic Indian Cuisine</p>
                    </div>
                    <div className="text-right text-[10px] leading-tight z-20">
                        <p className="font-semibold text-white/95">Table {tableId}</p>
                        <p className="font-medium text-white/80">QR Menu</p>
                    </div>
                </header>

                {/* Accordion List Container with custom scrollbar feel */}
                <main className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-[#FCF5E4] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#E9DCC8] overflow-hidden">
                            <div 
                                className="flex items-center p-3.5 cursor-pointer hover:bg-[#F2E5CA]/50 active:bg-[#F2E5CA] transition-colors"
                                onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                            >
                                <div className="w-[32px] h-[32px] shrink-0 rounded-full bg-[#CD6003] text-white flex items-center justify-center font-bold text-[15px] mr-3 shadow-inner">
                                    {cat.id}
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-bold text-[#6D421B] text-[15px] leading-tight drop-shadow-sm">{cat.name}</h2>
                                    <p className="text-[#966336] text-[10px] font-medium leading-snug mt-0.5">{cat.sub}</p>
                                </div>
                                <div className="text-[#6D421B] ml-2">
                                    {expandedCategory === cat.name ? <ChevronUp strokeWidth={1.5} className="w-5 h-5" /> : <ChevronDown strokeWidth={1.5} className="w-5 h-5" />}
                                </div>
                            </div>

                        {/* Items inside category */}
                        {expandedCategory === cat.name && (
                            <div className="pb-3 px-3 space-y-3">
                                {menu.filter(i => i.category === cat.name).length === 0 ? (
                                    <p className="text-center text-sm text-[#966336] py-3">Items coming soon</p>
                                ) : (
                                    menu.filter(i => i.category === cat.name).map(item => (
                                        <div key={item.id} className="bg-[#FFFFFF] rounded-md p-2.5 border border-[#E5D3BA] flex gap-3 shadow-[0_2px_5px_rgba(0,0,0,0.02)] relative">
                                            {/* Image & Badge */}
                                            <div className="relative w-[84px] h-[84px] shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[#966336]/40 text-xs text-center px-1">No Image</span>
                                                )}
                                                {item.group && (
                                                    <div className="absolute top-1.5 right-1.5 bg-[#D35D01]/95 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm flex items-center gap-0.5 shadow-sm">
                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                                        {item.group}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col justify-between py-0.5">
                                                <div>
                                                    <div className="flex justify-between items-start leading-none mb-1.5">
                                                        <h4 className="font-bold text-[#6A3D18] text-[13px]">{item.name}</h4>
                                                        <span className="font-black text-[#6A3D18] text-[13px] bg-white/60 backdrop-blur-md px-1.5 py-0.5 rounded shadow-sm border border-white/40">£{item.price.toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-[9px] leading-[1.3] text-[#986A41] max-w-[170px]">{item.desc}</p>
                                                </div>

                                                <div className="mt-1">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <div className="flex gap-0.5 text-[#AB4800]">
                                                            {Array.from({ length: item.spice || 0 }).map((_, i) => <Flame key={i} className="w-[11px] h-[11px] fill-current" strokeWidth={0} />)}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className={`w-[11px] h-[11px] flex items-center justify-center border ${item.veg ? 'border-green-600' : 'border-[#D31C13]'} rounded-[2px]`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${item.veg ? 'bg-green-600' : 'bg-[#D31C13]'}`}></div>
                                                            </div>
                                                            <span className={`text-[9.5px] font-bold tracking-tight ${item.veg ? 'text-green-700' : 'text-[#D31C13]'}`}>{item.veg ? 'Veg' : 'Non-Veg'}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => handleAddToCart(item, e)}
                                                        className={`w-full text-white text-[12px] font-bold py-1.5 rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all leading-tight flex items-center justify-center gap-1.5 ${addedItems[item.id] ? 'bg-green-600 hover:bg-green-700' : 'bg-[#CA5B04] hover:bg-[#A94C00]'}`}
                                                    >
                                                        {addedItems[item.id] ? <><CheckCircle size={14} strokeWidth={3}/> Added</> : 'Add to Cart'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </main>
        </div>

            {/* Cart Floating / Modal functionality */}
            {/* Same cart logic, re-styled to match theme */}
            {flyingDots.map(dot => (
                <div 
                    key={dot.id}
                    className="fixed z-[100] w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center pointer-events-none animate-fly-up overflow-hidden border-2 border-[#CA5B04]"
                    style={{ left: dot.x - 28, top: dot.y - 28 }}
                >
                    {dot.image ? <img src={dot.image} className="w-full h-full object-cover" /> : <Plus className="w-5 h-5 text-[#CA5B04]" strokeWidth={4} />}
                </div>
            ))}
            
            {cart.reduce((s, i) => s + i.qty, 0) > 0 && !isCartOpen && (
                <div className="fixed bottom-6 w-full max-w-md left-1/2 -translate-x-1/2 px-4 z-40">
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-[#7F4810] text-white p-4 rounded-xl shadow-[0_10px_25px_-5px_rgba(127,72,16,0.6)] flex justify-between items-center font-bold active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ShoppingCart className="w-6 h-6 text-theme_orange" />
                                <span className="absolute -top-2 -right-2 bg-theme_orange text-white text-[0.6rem] w-5 h-5 flex items-center justify-center rounded-full border border-theme_brown">
                                    {cart.reduce((s, i) => s + i.qty, 0)}
                                </span>
                            </div>
                            <span>View Order</span>
                        </div>
                        <div className="text-right bg-black/30 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-xl shadow-inner">
                            <span className="text-[11px] uppercase font-bold text-white/90 block leading-tight drop-shadow-md">Total</span>
                            <span className="text-lg font-black text-white leading-tight drop-shadow-lg">
                                £{cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
                            </span>
                        </div>
                    </button>
                </div>
            )}

            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm sm:items-center items-end pb-0 sm:pb-4 sm:px-4">
                    <div className="w-full max-w-md bg-[#FFF6E5] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-in overflow-hidden border-t border-white/20">
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center border-b border-[#EAD5B9]">
                            <h2 className="text-[15px] font-bold flex items-center gap-2 text-[#7F4810]">
                                <ShoppingCart className="w-4 h-4" strokeWidth={2.5} />
                                Your Cart ({cart.reduce((s, i) => s + i.qty, 0)} items)
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="hover:bg-black/5 p-1 rounded-md transition-colors text-[#7F4810]">
                                <X className="w-5 h-5" strokeWidth={2} />
                            </button>
                        </div>
                        
                        {/* Items list */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFF6E5]">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-[#FFFCF6] border border-[#EDDDCA] rounded-xl p-3 shadow-sm">
                                    <div className="flex-1 pr-2">
                                        <h4 className="font-medium text-[#6F3E14] text-[13px] leading-tight">{item.name}</h4>
                                        <p className="text-[11px] font-semibold text-[#A66A30] mt-1">£{item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-[22px] h-[22px] bg-[#F5D890] hover:bg-[#EEC25B] rounded-full flex items-center justify-center text-[#B26B1E] transition-colors"><Minus className="w-3.5 h-3.5" strokeWidth={3} /></button>
                                        <span className="w-3 text-center font-semibold text-[#6F3E14] text-[13px]">{item.qty}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-[22px] h-[22px] bg-[#F5D890] hover:bg-[#EEC25B] rounded-full flex items-center justify-center text-[#B26B1E] transition-colors"><Plus className="w-3.5 h-3.5" strokeWidth={3} /></button>
                                        
                                        <button onClick={() => updateQuantity(item.id, -item.qty)} className="ml-2 text-[#D43939] hover:text-red-700 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-[#FAEBD4] border-t border-[#EDDDCA]">
                            <div className="flex justify-between items-end mb-4 text-[#6F3E14]">
                                <span className="font-medium text-[14px] leading-none mb-0.5">Total:</span>
                                <span className="text-[#7F4810] font-bold text-[18px] leading-none">£{cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={submitOrder}
                                disabled={orderStatus === 'submitting'}
                                className="w-full bg-[#CC5E02] text-white py-3 rounded-lg font-bold text-[14px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-[#B05000] disabled:opacity-50 active:scale-[0.98] transition-all"
                            >
                                {orderStatus === 'submitting' ? 'Confirming...' : 'Proceed to Checkout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {orderStatus === 'success' && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-100 text-green-800 p-4 rounded-xl flex items-center gap-3 shadow-xl border border-green-200 animate-slide-in whitespace-nowrap">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="font-bold">Order placed successfully!</span>
                </div>
            )}
        </div>
    );

    const renderBookTime = () => (
        <div className="min-h-screen bg-theme_gold py-6 px-4 flex flex-col items-center font-sans">
             <div className="w-full max-w-md bg-theme_gold/80 rounded-3xl overflow-hidden relative border border-white/10">
                 {/* Placeholder for Book Table view */}
                 <div className="p-6">
                    <button onClick={() => setView('landing')} className="text-theme_brown flex items-center font-bold mb-6 hover:opacity-80"><ChevronLeft className="w-5 h-5"/> Back</button>
                    <h1 className="text-2xl font-bold text-theme_brown mb-2">Book a Table</h1>
                    <p className="text-theme_brown/80 text-sm mb-6">Reserve your table in advance for a royal dining experience.</p>
                    <div className="space-y-4">
                        <div className="bg-theme_cream rounded-xl p-4 text-center text-theme_brown/50">Form Placeholder</div>
                    </div>
                 </div>
             </div>
        </div>
    );

    const renderContent = () => {
        if (view === 'landing') return renderLanding();
        if (view === 'book') return renderBookTime();
        return renderMenu();
    };

    return (
        <>
            {renderContent()}
            <div className={`fixed ${view === 'menu' && cart.reduce((s, i) => s + i.qty, 0) > 0 ? 'bottom-28' : 'bottom-6'} w-[360px] left-1/2 -translate-x-1/2 pointer-events-none z-40 transition-all duration-300`}>
                <button 
                    onClick={requestAssistance}
                    disabled={assistanceCooldown > 0 || assistanceStatus === 'notifying'}
                    className="absolute right-4 bg-[#D31C13] pointer-events-auto text-white p-3 rounded-full shadow-2xl flex items-center justify-center disabled:opacity-80 active:scale-95 transition-transform border border-[#9b130d]"
                >
                    <div className="flex items-center gap-1.5">
                        <Bell className="w-5 h-5 fill-white" />
                        {assistanceCooldown > 0 ? (
                            <span className="text-[10px] font-bold w-6 text-center text-nowrap">
                                {Math.ceil((assistanceCooldown - Date.now())/1000)}s
                            </span>
                        ) : (
                            <span className="text-[9px] font-black leading-[1] uppercase text-left tracking-wider">Call<br/>Staff</span>
                        )}
                    </div>
                </button>
                {assistanceStatus === 'success' && (
                    <div className="absolute bottom-full right-0 mb-3 bg-green-100 text-green-800 p-2.5 px-3.5 rounded-lg text-[11px] font-bold shadow-xl border border-green-200 whitespace-nowrap animate-slide-in">
                        Staff has been notified!
                    </div>
                )}
            </div>
        </>
    );
}

// Adding a quick replacement for lucide-react ChevronLeft since I missed it in import
const ChevronLeft = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m15 18-6-6 6-6"/>
    </svg>
);
