import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, ShoppingBag, X, Droplets } from 'lucide-react';
import { categoriesData, menuData } from '../data/menu.js';
import { socket } from '../utils/socket';

const API_URL = import.meta.env.DEV 
    ? `http://${window.location.hostname}:3001/api` 
    : '/api';

export default function TakeawayMenu() {
    const navigate = useNavigate();
    const name = localStorage.getItem('takeaway_name') || '';
    const phone = localStorage.getItem('takeaway_phone') || '';
    const [menu, setMenu] = useState(menuData);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [activeCategory, setActiveCategory] = useState(categoriesData[0]?.name);

    useEffect(() => {
        if (!name || !phone) {
            navigate('/');
            return;
        }

        fetch(`${API_URL}/menu`)
            .then(res => res.json())
            .then(data => { if(data && data.length > 0) setMenu(data); })
            .catch(() => {});
        
        const handleUpdate = (updatedItem) => setMenu(prev => prev.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item));
        const handleReset = (fullMenu) => setMenu(fullMenu);
        socket.on('menuUpdated', handleUpdate);
        socket.on('menuReset', handleReset);

        return () => {
            socket.off('menuUpdated', handleUpdate);
            socket.off('menuReset', handleReset);
        };
    }, [navigate, name, phone]);

    const handleAddToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, qty: item.qty + delta };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const submitOrder = async () => {
        if (cart.length === 0) return;
        setOrderStatus('submitting');
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        // Assuming Takeaway doesn't have 10% Royal Service charge, or if it does, add it here.
        // As per the previous chat instruction: "Moving the application of service charges... only applied to overall order" - let's skip for takeaway.
        const serviceCharge = 0;
        const finalTotal = subtotal;
        
        const orderData = {
            tableId: 'TAKEAWAY',
            orderType: 'takeaway',
            customerName: name,
            phone: phone,
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
                setTimeout(() => setOrderStatus(null), 3000);
            }
        } catch { 
            setOrderStatus('error'); 
            setTimeout(() => setOrderStatus(null), 3000);
        }
    };

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

    return (
        <div className="min-h-screen bg-[#F6EFE6] font-sans pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-[#F6EFE6]/90 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between border-b border-[#0B3A2E]/10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-black/5">
                        <ChevronLeft className="text-[#0B3A2E]" />
                    </button>
                    <div>
                        <h1 className="text-xl font-serif font-bold text-[#0B3A2E]">Takeaway Menu</h1>
                        <p className="text-[10px] uppercase tracking-wider text-[#C29958] font-bold">Hello, {name}</p>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="sticky top-[69px] z-30 bg-[#F6EFE6] border-b border-[#0B3A2E]/5 overflow-x-auto shadow-sm">
                <div className="flex gap-2 p-3 px-6">
                    {categoriesData.map(c => (
                        <button
                            key={c.id}
                            onClick={() => {
                                setActiveCategory(c.name);
                                document.getElementById(`cat-${c.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                                activeCategory === c.name 
                                ? 'bg-[#0B3A2E] text-white shadow-md' 
                                : 'bg-white text-[#0B3A2E] border border-[#0B3A2E]/10'
                            }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {orderStatus === 'success' && (
                <div className="mx-4 mt-6 p-4 bg-green-50 rounded-xl border border-green-200 text-green-800 text-center font-medium animate-slide-in">
                    Your takeaway order has been placed successfully!
                </div>
            )}
            
            <div className="px-4 py-4 space-y-6">
                {categoriesData.map(cat => (
                    <div key={cat.id} id={`cat-${cat.name}`} className="scroll-mt-[130px]">
                        <h2 className="text-[#0B3A2E] text-lg font-bold font-serif mb-3 px-2">{cat.name}</h2>
                        <div className="flex flex-col gap-3">
                            {(menu || []).filter(i => i.category === cat.name).map(item => {
                                const inCart = (cart || []).find(i => i.id === item.id);
                                return (
                                    <div key={item.id} className="bg-white p-3 rounded-2xl flex gap-4 premium-shadow items-center">
                                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-black/5 flex items-center justify-center">
                                            <img 
                                                src={item.image || '/logo-icon.png'} 
                                                alt={item.name} 
                                                className={`w-full h-full ${item.image ? 'object-cover' : 'object-contain p-3'} ${item.isAvailable ? '' : 'grayscale opacity-50'}`} 
                                                onError={(e) => { e.target.src = '/logo-icon.png'; e.target.className = 'w-full h-full object-contain p-3'; }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-[#0B3A2E] text-sm leading-tight">{item.name}</h3>
                                            <p className="text-xs text-[#6D5D4B] font-semibold mt-1">£{(item.price || 0).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            {!item.isAvailable ? (
                                                <span className="text-[10px] font-bold text-red-500 uppercase">Sold Out</span>
                                            ) : !inCart ? (
                                                <button onClick={() => handleAddToCart(item)} className="w-8 h-8 rounded-full bg-[#F6EFE6] text-[#0B3A2E] flex items-center justify-center hover:bg-[#0B3A2E] hover:text-white transition-all">
                                                    <Plus size={16} strokeWidth={3} />
                                                </button>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 bg-[#F6EFE6] p-1 rounded-full border border-black/5">
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full bg-[#0B3A2E] text-white flex items-center justify-center">
                                                        <Plus size={14} />
                                                    </button>
                                                    <span className="text-xs font-bold text-[#0B3A2E] py-1">{inCart.qty}</span>
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full bg-white text-[#0B3A2E] shadow flex items-center justify-center">
                                                        <Minus size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky Cart */}
            {cart.length > 0 && !isCartOpen && (
                <div className="fixed bottom-6 left-4 right-4 z-40 animate-slide-in">
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-[#0B3A2E] text-white py-4 px-6 rounded-2xl shadow-xl flex justify-between items-center"
                    >
                        <div className="flex items-center gap-3">
                            <span className="bg-[#C29958] text-[#0B3A2E] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {cart.reduce((s, i) => s + i.qty, 0)}
                            </span>
                            <span className="font-semibold text-sm">View Cart</span>
                        </div>
                        <span className="font-bold text-lg">£{(subtotal || 0).toFixed(2)}</span>
                    </button>
                </div>
            )}

            {/* Cart Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
                    <div className="bg-white w-full rounded-t-3xl shadow-2xl relative z-10 max-h-[85vh] flex flex-col animate-slide-in">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#F6EFE6] rounded-t-3xl">
                            <h2 className="text-xl font-serif font-bold text-[#0B3A2E]">Review Order</h2>
                            <button onClick={() => setIsCartOpen(false)} className="bg-white p-2 rounded-full shadow-sm">
                                <X size={20} className="text-[#0B3A2E]" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-4">
                            {(cart || []).map(item => (
                                <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-4">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-[#0B3A2E] text-sm">{item.name}</h4>
                                        <p className="text-xs text-[#6D5D4B] mt-0.5">£{((item.price || 0) * (item.qty || 0)).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-[#F6EFE6] rounded-full p-1 border border-black/5">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0B3A2E] shadow-sm">
                                            <Minus size={16} />
                                        </button>
                                        <span className="text-sm font-bold text-[#0B3A2E] min-w-[20px] text-center">{item.qty}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-full bg-[#0B3A2E] flex items-center justify-center text-white">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center justify-between mt-2 mb-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                                <div className="flex flex-col">
                                    <h4 className="font-bold text-[#0B3A2E] text-sm flex items-center gap-2">
                                        <span className="text-lg"><Droplets size={16} /></span> Add Bottle
                                    </h4>
                                    <p className="text-[10px] text-[#6D5D4B] font-bold opacity-60 uppercase tracking-widest pl-7 mt-0.5">Chilled Natural Water</p>
                                </div>
                                <div className="flex items-center gap-3 bg-white rounded-full p-1 shadow-sm border border-black/5">
                                    <button 
                                        onClick={() => updateQuantity('dr3', -1)}
                                        disabled={!cart.find(i => i.id === 'dr3')}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${cart.find(i => i.id === 'dr3') ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}
                                    >
                                        <Minus size={14} strokeWidth={2} />
                                    </button>
                                    <span className="font-bold text-[#0B3A2E] text-xs min-w-[14px] text-center tabular-nums">{cart.find(i => i.id === 'dr3')?.qty || 0}</span>
                                    <button 
                                        onClick={() => {
                                            const waterItem = menu.find(i => i.id === 'dr3') || { id: 'dr3', name: 'WATER BOTTLE', price: 0.00, category: 'Drinks' };
                                            if (!cart.find(i => i.id === 'dr3')) {
                                                handleAddToCart(waterItem);
                                            } else {
                                                updateQuantity('dr3', 1);
                                            }
                                        }}
                                        className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all"
                                    >
                                        <Plus size={14} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-[#F6EFE6] border-t border-gray-100 rounded-t-3xl -mt-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[#6D5D4B] text-sm font-bold uppercase">Total amount</span>
                                <span className="text-[#0B3A2E] text-2xl font-black tabular-nums">£{(subtotal || 0).toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={submitOrder}
                                disabled={orderStatus === 'submitting'}
                                className="w-full bg-[#0B3A2E] text-[#C29958] py-4 rounded-xl font-bold uppercase tracking-wider disabled:opacity-50"
                            >
                                {orderStatus === 'submitting' ? 'Confirming...' : 'Place Takeaway Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
