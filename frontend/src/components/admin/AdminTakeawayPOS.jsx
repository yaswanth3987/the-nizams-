import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Search, UtensilsCrossed, CheckCircle, Info } from 'lucide-react';

export default function AdminTakeawayPOS() {
    const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';
    const [menu, setMenu] = useState({ categories: [], items: [] });
    const [activeCategory, setActiveCategory] = useState('');
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/menu`)
            .then(res => res.json())
            .then(data => {
                // data is a flat array of items
                const items = Array.isArray(data) ? data : [];
                const uniqueCats = [...new Set(items.map(i => i.category))].filter(Boolean);
                setMenu({ categories: uniqueCats, items });
                if (uniqueCats.length > 0) setActiveCategory(uniqueCats[0]);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Menu load error:', err);
                setIsLoading(false);
            });
    }, []);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const newQty = item.qty + delta;
                    return newQty > 0 ? { ...item, qty: newQty } : null;
                }
                return item;
            }).filter(Boolean);
        });
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const finalTotal = subtotal; // No service charge for Admin POS Takeaway

    const submitOrder = async () => {
        if (cart.length === 0) return;
        if (!customerName) {
            alert('Please enter Customer Name.');
            return;
        }

        setIsSubmitting(true);
        const orderData = {
            tableId: 'TAKEAWAY',
            orderType: 'takeaway',
            customerName,
            phone: '', // No phone required
            items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
            finalTotal,
            subtotal,
            serviceCharge: 0,
            status: 'confirmed'
        };

        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            if (res.ok) {
                setOrderStatus('success');
                setCart([]);
                setCustomerName('');
                setTimeout(() => setOrderStatus(null), 3000);
            } else {
                setOrderStatus('error');
                setTimeout(() => setOrderStatus(null), 3000);
            }
        } catch (err) {
            setOrderStatus('error');
            setTimeout(() => setOrderStatus(null), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="w-16 h-16 border-4 border-nizam-border border-t-nizam-gold rounded-full animate-spin"></div>
            </div>
        );
    }

    const filteredItems = menu.items.filter(item => item.category === activeCategory);

    return (
        <div className="flex h-full min-h-[750px] gap-6 animate-in fade-in duration-500 pb-12 w-full pr-4">
            {/* Left side: Menu items */}
            <div className="flex-1 flex flex-col bg-[#0d0f0e] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                {/* Categories */}
                <div className="flex gap-4 overflow-x-auto p-4 border-b border-white/5 scrollbar-hide shrink-0">
                    {menu.categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${
                                activeCategory === cat 
                                    ? 'bg-nizam-gold text-black shadow-lg shadow-nizam-gold/20' 
                                    : 'bg-black/40 text-nizam-textMuted border border-white/5 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Items Grid */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="bg-black/60 border border-white/5 rounded-xl p-4 text-left hover:border-nizam-gold/50 hover:bg-black transition-all group flex flex-col justify-between min-h-[140px]"
                        >
                            <div>
                                <h3 className="text-white font-serif text-lg mb-1 group-hover:text-nizam-gold transition-colors line-clamp-2">{item.name}</h3>
                                {item.veg && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mb-2"></span>}
                            </div>
                            <div className="flex justify-between items-end mt-4">
                                <span className="text-nizam-gold font-mono font-bold text-lg">£{Number(item.price || 0).toFixed(2)}</span>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-nizam-gold/20 transition-colors">
                                    <Plus className="w-4 h-4 text-white/50 group-hover:text-nizam-gold transition-colors" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right side: Cart and Checkout */}
            <div className="w-[400px] flex flex-col bg-[#0d0f0e] border border-white/5 rounded-xl overflow-hidden shadow-2xl shrink-0">
                <div className="p-6 border-b border-white/5 bg-black/40">
                    <h2 className="text-2xl font-serif text-white tracking-wide flex items-center gap-3">
                        <ShoppingBag className="text-nizam-gold w-6 h-6" /> Takeaway Till
                    </h2>
                </div>

                <div className="px-6 py-5 border-b border-white/5 space-y-4 bg-[#111311]">
                    <div>
                        <label className="text-[10px] text-nizam-textMuted uppercase tracking-widest font-bold mb-2 block">Customer Name</label>
                        <input 
                            type="text" 
                            placeholder="John Doe"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 text-sm outline-none focus:border-nizam-gold transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-black/20">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-nizam-textMuted/40">
                            <UtensilsCrossed className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-serif text-lg italic">No items added to bill.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-4 items-center bg-black/60 p-3 rounded-xl border border-white/5 shadow-sm">
                                <div className="flex-1 min-w-0 pr-2">
                                    <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                                    <span className="text-nizam-gold font-mono text-xs opacity-80">£{Number(item.price || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-1 shrink-0">
                                    <button onClick={() => updateQty(item.id, -1)} className="text-white/50 hover:text-white p-2">
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-white font-bold w-6 text-center text-xs">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="text-white/50 hover:text-white p-2">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-nizam-gold/10 bg-gradient-to-t from-black to-[#0d0f0e]">
                    <div className="flex justify-between items-end mb-6 bg-nizam-gold/5 p-4 rounded-xl border border-nizam-gold/10">
                        <div>
                            <span className="text-nizam-textMuted font-bold uppercase tracking-widest text-[9px] block mb-1">Items: {cart.reduce((s,i)=>s+i.qty,0)}</span>
                            <span className="text-nizam-gold/80 font-bold uppercase tracking-widest text-[11px] block">Wait Time: ~15m</span>
                        </div>
                        <div className="text-right">
                            <span className="text-nizam-textMuted font-bold uppercase tracking-[0.2em] text-[9px] block mb-1">TOTAL TO PAY</span>
                            <span className="text-nizam-gold font-mono font-bold text-3xl">£{Number(finalTotal || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <button 
                        onClick={submitOrder}
                        disabled={cart.length === 0 || isSubmitting}
                        className="w-full bg-nizam-gold text-black py-5 rounded-xl font-black uppercase tracking-[0.15em] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:text-black transition-all duration-300 shadow-[0_10px_30px_rgba(198,168,124,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Sumitting...' : orderStatus === 'success' ? <><CheckCircle className="w-5 h-5" /> Submitted</> : 'Confirm Takeaway'}
                    </button>
                    {orderStatus === 'error' && <p className="text-red-500 text-xs text-center mt-4 font-bold uppercase tracking-widest">Failed to send order.</p>}
                </div>
            </div>
        </div>
    );
}
