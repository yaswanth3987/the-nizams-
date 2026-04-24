import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Search, UtensilsCrossed, CheckCircle, Info, Printer, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function AdminTakeawayPOS({ initialOrder, onComplete }) {
    const [menu, setMenu] = useState({ categories: [], items: [] });
    const [activeCategory, setActiveCategory] = useState('');
    const [cart, setCart] = useState(initialOrder?.items || []);
    const [now, setNow] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [customerName, setCustomerName] = useState(initialOrder?.customerName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [lastOrderId, setLastOrderId] = useState(null);

    const getRemainingTime = (until) => {
        if (!until) return null;
        const diff = new Date(until) - now;
        if (diff <= 0) return null;
        const mins = Math.ceil(diff / 60000);
        if (mins >= 60) return `${Math.floor(mins/60)}h ${mins%60}m`;
        return `${mins}m`;
    };

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
        const timer = setInterval(() => setNow(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    const addToCart = (item) => {
        if (!item.isAvailable) return;
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
                const result = await res.json();
                setLastOrderId(result.id);
                setOrderStatus('success');
            } else {
                setOrderStatus('error');
                setTimeout(() => setOrderStatus(null), 3000);
            }
        } catch (error) {
            console.error('POS Checkout Failure:', error);
            setOrderStatus('error');
            setTimeout(() => setOrderStatus(null), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInstantPrint = () => {
        if (!lastOrderId) return;
        const printWindow = window.open('', '_blank', 'width=450,height=600');
        const itemsHtml = cart.map(item => `
            <div style="display: grid; grid-template-columns: repeat(12, 1fr); font-size: 11px; margin-bottom: 4px;">
                <span style="grid-column: span 6;">${item.name.toUpperCase()}</span>
                <span style="grid-column: span 3; text-align: center;">${item.qty}</span>
                <span style="grid-column: span 3; text-align: right;">${(item.price * item.qty).toFixed(2)}</span>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Order #${lastOrderId}</title>
                    <style>
                        body { font-family: monospace; padding: 20px; color: black; max-width: 300px; margin: auto; text-transform: uppercase; }
                        .header { text-align: center; margin-bottom: 15px; }
                        .dashed { border-top: 1.5px dashed black; margin: 10px 0; }
                        .total { font-weight: bold; font-size: 15px; display: flex; justify-content: space-between; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="/logo-with-name.png" style="width: 120px; filter: grayscale(1); margin-bottom: 5px;" />
                        <div class="dashed"></div>
                        <p style="font-weight: bold; margin: 5px 0;">Order ID: ${lastOrderId}</p>
                        ${customerName ? `<p style="font-weight: bold; margin: 5px 0;">Guest: ${customerName}</p>` : ''}
                        <p style="font-size: 10px; margin: 5px 0;">Date: ${new Date().toLocaleString('en-GB')}</p>
                        <div class="dashed"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(12, 1fr); font-weight: bold; font-size: 11px; margin-bottom: 10px;">
                        <span style="grid-column: span 6;">ITEM</span>
                        <span style="grid-column: span 3; text-align: center;">QTY</span>
                        <span style="grid-column: span 3; text-align: right;">PRICE</span>
                    </div>
                    <div class="items">
                        ${itemsHtml}
                    </div>
                    <div class="dashed"></div>
                    <div class="total">
                        <span>TOTAL</span>
                        <span>£ ${Number(finalTotal).toFixed(2)}</span>
                    </div>
                    <div class="dashed"></div>
                    <div style="text-align: center; margin-top: 20px; font-size: 11px;">
                        *** Thank You ***<br/>Please visit us again
                    </div>
                    <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
                </body>
            </html>
        `);
        printWindow.document.close();
        setLastOrderId(null);
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
        <div className="flex h-full gap-8 animate-in fade-in duration-700 pb-20 w-full pr-4">
            <div className="flex-1 flex flex-col bg-[#111311] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-nizam-gold/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
                
                <div className="flex gap-4 overflow-x-auto p-8 border-b border-white/10 shrink-0">
                    {menu.categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold uppercase text-xs border-2 transition-all ${
                                activeCategory === cat 
                                    ? 'bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(198,168,124,0.15)]' 
                                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
                    {filteredItems.map(item => {
                        const timeRem = getRemainingTime(item.until);
                        const isLocked = !item.isAvailable;
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => !isLocked && addToCart(item)}
                                disabled={isLocked}
                                className={`bg-white/5 border border-white/10 rounded-2xl p-5 text-left transition-all group flex flex-col justify-between h-56 relative overflow-hidden ${isLocked ? 'grayscale opacity-60 cursor-not-allowed' : 'hover:bg-white/10'}`}
                            >
                                {isLocked && (
                                    <div className="absolute inset-0 bg-red-950/40 flex flex-col items-center justify-center p-4 z-10">
                                        <UtensilsCrossed className="w-8 h-8 text-red-500 mb-2 opacity-60" />
                                        <span className="text-[10px] font-black tracking-[0.2em] text-red-400 uppercase text-center leading-tight">
                                            {timeRem ? `Unlock in ${timeRem}` : 'Temporarily Locked'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-white font-serif text-lg font-bold leading-tight italic line-clamp-3">{item.name}</h3>
                                    {item.veg && <span className="inline-block mt-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">VEG</span>}
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-accent font-serif font-bold text-2xl">£{Number(item.price).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    {!isLocked && (
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:bg-accent group-hover:text-black transition-all">
                                            <Plus size={18} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="w-[500px] flex flex-col bg-[#111311] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl shrink-0">
                <div className="p-12 border-b border-white/5 bg-black/40">
                    <h2 className="text-4xl font-serif text-white font-bold tracking-tight mb-2">{initialOrder ? 'Edit Order' : 'Checkout'}</h2>
                    <p className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">Digital POS Terminal 01</p>
                </div>

                <div className="p-10 border-b border-white/5 space-y-6">
                    <div>
                        <label className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-black mb-4 block">Guest Name (Optional)</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Royal Guest"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            disabled={!!initialOrder}
                            className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-5 text-white placeholder:text-white/10 text-xl font-serif font-bold outline-none focus:border-nizam-gold/30 transition-all italic disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-4 bg-black/10">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/10">
                            <ShoppingBag size={64} strokeWidth={1} className="mb-6 opacity-20" />
                            <p className="font-serif text-2xl italic font-bold">Ledge empty.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-6 items-center bg-black/40 p-6 rounded-3xl border border-white/5 transition-all hover:border-white/10 group">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-serif font-bold text-lg italic tracking-tight group-hover:text-accent transition-colors">{item.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-accent/40 font-serif font-bold text-xs uppercase">£</span>
                                        <span className="text-accent/60 font-serif font-bold text-sm">{Number(item.price).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-black/60 rounded-2xl p-1.5 border border-white/5 border-t-white/10">
                                    <button onClick={() => updateQty(item.id, -1)} className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-white transition-colors bg-white/5 rounded-xl">
                                        <Minus size={14} />
                                    </button>
                                    <span className="text-white font-serif font-bold w-4 text-center text-lg">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-white transition-colors bg-white/5 rounded-xl">
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 border-t border-white/10 bg-secondary">
                    <div className="p-6 rounded-2xl border border-white/10 mb-6 bg-white/5">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Payable</p>
                                <span className="text-xs text-white/60 font-bold uppercase">{cart.reduce((s,i)=>s+i.qty,0)} Items</span>
                            </div>
                            <span className="text-4xl font-serif font-bold text-accent">£{Number(finalTotal).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {orderStatus === 'success' ? (
                        <div className="flex gap-3">
                            <button 
                                onClick={handleInstantPrint}
                                className="flex-1 bg-white text-black py-5 rounded-xl font-bold text-sm uppercase transition-all shadow-xl flex items-center justify-center gap-3 h-16"
                            >
                                <Printer size={20} /> Print Receipt
                            </button>
                            <button 
                                onClick={() => { 
                                    setCart([]); 
                                    setCustomerName(''); 
                                    setOrderStatus(null); 
                                    onComplete?.(); 
                                }}
                                className="flex-1 bg-accent text-black py-5 rounded-xl font-bold text-sm uppercase transition-all shadow-xl flex items-center justify-center gap-3 h-16"
                            >
                                Next Order
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => submitOrder(false)}
                            disabled={cart.length === 0 || isSubmitting}
                            className="w-full bg-accent text-black py-5 rounded-xl font-bold text-sm uppercase transition-all shadow-xl disabled:opacity-20 flex items-center justify-center gap-3 h-16 group"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <><ArrowRight size={18} /> Authorize Order</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
