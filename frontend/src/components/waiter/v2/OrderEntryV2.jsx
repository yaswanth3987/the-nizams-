import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Utensils, Plus, Minus, Trash2, Send } from 'lucide-react';

const OrderEntryV2 = ({ 
    menu, 
    selectedTable, 
    editingOrder, 
    cart, 
    setCart, 
    onBack, 
    onSubmit 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [orderType, setOrderType] = useState(editingOrder?.orderType || (selectedTable ? 'dine-in' : 'takeaway'));
    const [customerName, setCustomerName] = useState(editingOrder?.customerName || '');
    const [phone, setPhone] = useState(editingOrder?.phone || '');

    // 1. Category logic
    const categories = useMemo(() => {
        const raw = Array.from(new Set((menu || []).map(item => item.category)));
        const priority = ['Nizami Mandi', 'Mandi Platters', 'Non Veg Starters', 'Veg Starters', 'Sea Food'];
        
        const sorted = raw.sort((a, b) => {
            const indexA = priority.indexOf(a);
            const indexB = priority.indexOf(b);
            
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
        
        return ['All', ...sorted];
    }, [menu]);

    const filteredMenu = (menu || []).filter(item => {
        const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (item) => {
        setCart(prev => {
            const ex = prev.find(i => i.id === item.id);
            if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0));
    };

    const deleteFromCart = (id) => {
        setCart(prev => prev.filter(i => i.id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 0)), 0);

    return (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-black/10">
            {/* Menu Section */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="px-8 pt-8 pb-4 border-b border-white/5 bg-[#0F3A2F]/40 backdrop-blur-md flex flex-col shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-6 w-full sm:w-auto">
                            <button onClick={onBack} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all">
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-serif font-black text-white italic truncate tracking-tight">
                                    {editingOrder ? 'Edit Order' : 'New Order'}
                                </h1>
                                <p className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.3em]">
                                    {orderType === 'takeaway' ? 'Takeaway Order' : `Table ${selectedTable || 'N/A'}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="bg-black/40 p-1.5 rounded-2xl border border-white/5 flex gap-2">
                                <button 
                                    onClick={() => setOrderType('dine-in')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderType === 'dine-in' ? 'bg-[#FFD700] text-[#0a261f]' : 'text-white/40 hover:text-white'}`}
                                >
                                    Dine-in
                                </button>
                                <button 
                                    onClick={() => setOrderType('takeaway')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderType === 'takeaway' ? 'bg-[#FFD700] text-[#0a261f]' : 'text-white/40 hover:text-white'}`}
                                >
                                    Takeaway
                                </button>
                            </div>

                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Find dishes..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-[2rem] pl-16 pr-6 py-4 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category Scroll */}
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border shrink-0 ${
                                    selectedCategory === cat 
                                    ? 'bg-[#FFD700] text-[#0a261f] border-[#FFD700] shadow-xl shadow-[#FFD700]/20' 
                                    : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overscroll-contain p-8 no-scrollbar scroll-smooth">
                    {orderType === 'takeaway' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <label className="block text-[10px] font-black text-[#86a69d] uppercase tracking-[0.3em] mb-3">Customer Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter name..." 
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                                />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <label className="block text-[10px] font-black text-[#86a69d] uppercase tracking-[0.3em] mb-3">Phone (Optional)</label>
                                <input 
                                    type="tel" 
                                    placeholder="Enter phone..." 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                        {filteredMenu.map(item => (
                            <button 
                                key={item.id} 
                                onClick={() => addToCart(item)} 
                                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-left hover:bg-[#FFD700] hover:text-[#0a261f] transition-all group active:scale-95 flex flex-col min-h-[180px]"
                            >
                                <p className="text-[#86a69d] group-hover:text-[#0a261f]/60 text-[9px] font-black uppercase tracking-[0.2em] mb-2">{item.category}</p>
                                <h3 className="text-white group-hover:text-[#0a261f] font-serif font-black italic text-xl leading-tight mb-4 flex-1">{item.name}</h3>
                                <div className="text-[#FFD700] group-hover:text-[#0a261f] font-black text-2xl tabular-nums">£{(item.price || 0).toFixed(2)}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Basket Section */}
            <div className="w-full lg:w-[450px] bg-black/40 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-[50vh] lg:h-full shrink-0">
                <div className="p-8 border-b border-white/5 font-black text-[10px] uppercase tracking-[0.4em] text-[#86a69d] flex justify-between items-center bg-black/20">
                    <span>Order Basket</span>
                    <span className="bg-[#FFD700] text-[#0a261f] px-3 py-1 rounded-full text-[10px] shadow-lg shadow-[#FFD700]/10">{cart.length} ITEMS</span>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4 no-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-white/50">
                            <Utensils size={48} className="mb-4" />
                            <p className="font-serif text-lg uppercase tracking-widest">Basket Empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-5 flex items-center justify-between group">
                                <div className="min-w-0 mr-4">
                                    <div className="text-white font-black text-sm truncate">{item.name}</div>
                                    <div className="text-[#FFD700] font-black text-xs mt-1 tabular-nums">£{((item.price || 0) * (item.qty || 0)).toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-4 bg-black/40 rounded-2xl p-1 shrink-0 border border-white/5">
                                        <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"><Minus size={16} strokeWidth={3} /></button>
                                        <span className="text-white font-black text-sm w-4 text-center tabular-nums">{item.qty}</span>
                                        <button onClick={() => addToCart(item)} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"><Plus size={16} strokeWidth={3} /></button>
                                    </div>
                                    <button onClick={() => deleteFromCart(item.id)} className="w-12 h-12 flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 bg-black/60 border-t border-white/10">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.3em]">Total Value</span>
                        <span className="text-[#FFD700] text-4xl font-serif font-black italic">£{subtotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => onSubmit(cart, orderType, customerName, phone)} 
                        disabled={cart.length === 0} 
                        className="w-full bg-[#FFD700] text-[#0a261f] py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm active:scale-95 shadow-2xl shadow-[#FFD700]/20 disabled:opacity-20 transition-all flex items-center justify-center gap-4"
                    >
                        <Send size={20} strokeWidth={3} />
                        {editingOrder ? 'Update Kitchen' : 'Send to Kitchen'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(OrderEntryV2);
