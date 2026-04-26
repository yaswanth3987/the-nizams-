import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, Utensils, IndianRupee, Search, Clock, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { socket } from '../../utils/socket';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function AdminMenuManagement() {
    const [menuItems, setMenuItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    
    // Availability Modal State
    const [availabilityModal, setAvailabilityModal] = useState(null); 
    const [customTimeH, setCustomTimeH] = useState('1'); 
    const [customTimeM, setCustomTimeM] = useState('0'); 
    const [alarmTime, setAlarmTime] = useState('12:00');


    const [newItem, setNewItem] = useState({
        name: '',
        price: '',
        category: 'Main Course',
        description: '',
        isPopular: false,
        isRecommended: false,
        isBestSeller: false,
        isNew: false,
        availableFrom: '',
        availableTo: ''
    });

    const [now, setNow] = useState(new Date());
    
    const getRemainingTime = (until) => {
        if (!until) return null;
        const diff = new Date(until) - now;
        if (diff <= 0) return null;
        const mins = Math.ceil(diff / 60000);
        if (mins >= 60) return `${Math.floor(mins/60)}h ${mins%60}m`;
        return `${mins}m`;
    };

    const fetchMenu = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/menu`);
            const data = await res.json();
            setMenuItems(data);
        } catch (err) {
            console.error('Failed to fetch menu:', err);
        }
    }, []);

    useEffect(() => {
        setTimeout(() => fetchMenu(), 0);
        
        const timer = setInterval(() => setNow(new Date()), 10000); // Update every 10s for timers

        socket.on('menuUpdated', (updatedItem) => {
            setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        });

        socket.on('menuReset', (fullMenu) => {
            setMenuItems(fullMenu);
        });

        return () => {
            clearInterval(timer);
            socket.off('menuUpdated');
            socket.off('menuReset');
        };
    }, [fetchMenu]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            });
            if (res.ok) {
                fetchMenu();
                setIsAddModalOpen(false);
                setNewItem({ 
                    name: '', price: '', category: 'Main Course', description: '',
                    isPopular: false, isRecommended: false, isBestSeller: false, isNew: false
                });
            }
        } catch (err) {
            console.error('Failed to add item:', err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/menu/${editingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingItem)
            });
            if (res.ok) {
                fetchMenu();
                setEditingItem(null);
            }
        } catch (err) {
            console.error('Failed to update item:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            console.log(`Deleting item ${id}...`);
            const res = await fetch(`${API_URL}/menu/${id}`, { 
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                console.log('Delete successful');
                fetchMenu();
            } else {
                const errorData = await res.json();
                console.error('Delete failed:', errorData);
                alert('Failed to delete item: ' + (errorData.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Failed to delete item:', err);
            alert('Error deleting item. Check console.');
        }
    };

    const toggleAvailability = async (targetData, isAvailable, until = null) => {
        try {
            const isCategory = targetData.targetType === 'category';
            const url = isCategory 
                ? `${API_URL}/menu/category/${encodeURIComponent(targetData.target)}/availability` 
                : `${API_URL}/menu/${targetData.target.id}/availability`;
                
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAvailable, until })
            });
            if (res.ok) {
                setAvailabilityModal(null);
                // State is updated via Socket.IO
            }
        } catch (err) {
            console.error('Failed to update availability:', err);
        }
    };


    const categories = ['All', ...new Set(menuItems.map(item => item.category))];
    
    const filteredMenu = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Grouping for "Detail" view
    const groupedMenu = filteredMenu.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 font-sans">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Menu Catalog</h2>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                        Manage your kitchen catalog, categories, and item availability.
                    </p>
                </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={async () => {
                                if (window.confirm("This will refresh the entire menu with the latest images and metadata from the system seed. Continue?")) {
                                    try {
                                        const res = await fetch(`${API_URL}/menu/seed`, { method: 'POST' });
                                        if (res.ok) alert("Menu seeded successfully!");
                                    } catch (e) { alert("Seed failed"); }
                                }
                            }}
                            className="bg-white/5 border border-white/10 text-white/40 px-6 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 transition-all flex items-center gap-3"
                        >
                            <Utensils size={14} /> Seed Menu
                        </button>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-accent text-black px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-white transition-all flex items-center gap-3"
                        >
                            <Plus size={16} /> Add Item
                        </button>
                    </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-8">
                <div className="lg:col-span-5 relative">
                    <label className="block text-xs font-bold text-white/40 uppercase mb-3 ml-1 tracking-widest">Search Catalog</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input 
                            type="text" 
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#111311] border border-white/10 rounded-xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                        />
                    </div>
                </div>
                <div className="lg:col-span-7">
                    <label className="block text-xs font-bold text-white/40 uppercase mb-3 ml-1 tracking-widest">Filter by Category</label>
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase border-2 transition-all whitespace-nowrap glow-gold ${
                                    activeCategory === cat 
                                    ? 'bg-accent/10 text-accent border-accent shadow-[0_0_25px_rgba(255,215,0,0.3)]' 
                                    : 'bg-white/5 border-white/5 text-white/60 hover:border-accent hover:text-accent'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {Object.keys(groupedMenu).sort().map(category => (
                    <div key={category} className="bg-[#111311] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-white/10 bg-white/5 flex justify-between items-center group/header">
                            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider">{category}</h3>
                            <button
                                onClick={() => setAvailabilityModal({ targetType: 'category', target: category, type: 'custom' })}
                                className="text-[10px] uppercase font-bold tracking-widest text-white/40 group-hover/header:text-accent group-hover/header:glow-gold transition-all flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent group-hover/header:border-accent/20 bg-black/20"
                            >
                                <Clock size={12} /> Category Timer
                            </button>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead className="text-[10px] uppercase font-bold text-white/20 border-b border-white/5 bg-black/20">
                                <tr>
                                    <th className="px-8 py-5 tracking-[0.2em]">Item Asset</th>
                                    <th className="px-8 py-5 tracking-[0.2em]">Metric (£)</th>
                                    <th className="px-8 py-5 tracking-[0.2em]">Status Lock</th>
                                    <th className="px-8 py-5 tracking-[0.2em] text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {groupedMenu[category].map(item => {
                                    const timeRem = getRemainingTime(item.until);
                                    const isLocked = !item.isAvailable;

                                    return (
                                        <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0 relative">
                                            <td className="px-8 py-7">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${!isLocked ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
                                                    <div>
                                                        <p className="text-white font-serif italic text-lg">{item.name}</p>
                                                        <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider">{item.category}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <span className="text-lg font-black text-accent glow-gold">£{Number(item.price).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-8 py-7">
                                                {timeRem ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                                                        <Clock size={12} className="text-red-400" />
                                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{timeRem} REMAINING</span>
                                                    </div>
                                                ) : isLocked ? (
                                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">PERMANENT LOCK</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest">OPERATIONAL</span>
                                                )}
                                                {item.availableFrom && item.availableTo && (
                                                    <div className="mt-1 text-[9px] font-black text-white/30 uppercase tracking-tighter">
                                                        SCHED: {item.availableFrom} - {item.availableTo}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-7 text-right">
                                                <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {isLocked ? (
                                                        <button
                                                            onClick={() => toggleAvailability({ targetType: 'item', target: item }, true)}
                                                            className="px-6 py-3 rounded-lg text-emerald-500 bg-emerald-500/10 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                                        >
                                                            Unlock Record
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setAvailabilityModal({ targetType: 'item', target: item, type: 'manual' })}
                                                            className="px-6 py-3 rounded-lg text-red-500 bg-red-500/10 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20"
                                                        >
                                                            Isolate Record
                                                        </button>
                                                    )}
                                                    <button onClick={() => setEditingItem(item)} className="p-3 bg-white/5 rounded-xl border border-white/10 text-white hover:text-accent hover:border-accent transition-all">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-3 bg-white/5 rounded-xl border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/40 transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* Availability Modal */}
            {availabilityModal && (
                <div className="fixed inset-0 bg-[#0c0d0c]/98 backdrop-blur-2xl z-[110] flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-[#111311] border border-white/5 rounded-[3rem] w-full max-w-md overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                        <div className="p-12 text-center border-b border-white/5 bg-black/40">
                            <div className="w-20 h-20 bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                                <Clock size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-4xl font-serif text-white mb-3 font-bold tracking-tight">System Isolation</h3>
                            <p className="text-[14px] text-white/80 italic font-medium px-4">
                                "{availabilityModal.targetType === 'category' ? `CATEGORY: ${availabilityModal.target}` : availabilityModal.target.name}"
                            </p>
                        </div>
                        <div className="p-8 space-y-4">
                            <button 
                                onClick={() => {
                                    const until = new Date();
                                    until.setHours(23, 59, 59, 999);
                                    toggleAvailability(availabilityModal, false, until.toISOString());
                                }}
                                className="w-full text-left p-8 rounded-[2rem] bg-black/40 border border-white/5 hover:border-accent transition-all group glow-gold"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-serif font-bold text-white group-hover:text-accent transition-colors italic">Shift Isolation</span>
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Until Midnight</span>
                                </div>
                            </button>
                            
                            <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-serif font-bold text-white italic">Temporal Lock</span>
                                    <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">H : M</span>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {[{label: '15m', h: '0', m: '15'}, {label: '30m', h: '0', m: '30'}, {label: '1h', h: '1', m: '0'}, {label: '2h', h: '2', m: '0'}].map(preset => (
                                        <button 
                                            key={preset.label}
                                            onClick={() => { setCustomTimeH(preset.h); setCustomTimeM(preset.m); }}
                                            className={`h-12 rounded-xl text-[10px] font-black tracking-widest transition-all ${(customTimeH === preset.h && customTimeM === preset.m) ? 'bg-accent text-black glow-gold' : 'bg-white/5 text-white/60 border border-white/5 hover:border-white/20'}`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="flex bg-[#0c0d0c] border border-white/20 rounded-xl overflow-hidden focus-within:border-accent/50 transition-colors">
                                        <input 
                                            type="number" 
                                            value={customTimeH}
                                            onChange={(e) => setCustomTimeH(e.target.value)}
                                            min="0"
                                            className="w-16 bg-transparent px-2 py-4 text-center text-white font-serif font-bold italic focus:outline-none placeholder-white/20"
                                            placeholder="HH"
                                        />
                                        <span className="flex items-center text-white/20 font-black">:</span>
                                        <input 
                                            type="number" 
                                            value={customTimeM}
                                            onChange={(e) => setCustomTimeM(e.target.value)}
                                            min="0"
                                            max="59"
                                            className="w-16 bg-transparent px-2 py-4 text-center text-white font-serif font-bold italic focus:outline-none placeholder-white/20"
                                            placeholder="MM"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const h = parseInt(customTimeH) || 0;
                                            const m = parseInt(customTimeM) || 0;
                                            if (h === 0 && m === 0) return;
                                            const until = new Date();
                                            until.setHours(until.getHours() + h);
                                            until.setMinutes(until.getMinutes() + m);
                                            toggleAvailability(availabilityModal, false, until.toISOString());
                                        }}
                                        className="flex-1 bg-accent text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#FFC300] transition-all shadow-xl shadow-accent/20 glow-gold"
                                    >
                                        Execute
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-serif font-bold text-white italic">Alarm Schedule</span>
                                    <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">Exact Time</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="flex bg-[#0c0d0c] border border-white/20 rounded-xl overflow-hidden focus-within:border-accent/50 transition-colors w-full px-4">
                                        <input 
                                            type="time" 
                                            value={alarmTime}
                                            onChange={(e) => setAlarmTime(e.target.value)}
                                            className="w-full bg-transparent py-4 text-center text-white font-serif font-bold italic focus:outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (!alarmTime) return;
                                            const [h, m] = alarmTime.split(':');
                                            const until = new Date();
                                            until.setHours(parseInt(h), parseInt(m), 0, 0);
                                            
                                            // If time is strictly in the past today, assume tomorrow
                                            if (until < new Date()) {
                                                until.setDate(until.getDate() + 1);
                                            }
                                            
                                            toggleAvailability(availabilityModal, false, until.toISOString());
                                        }}
                                        className="flex-1 bg-accent text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#FFC300] transition-all shadow-xl shadow-accent/20 glow-gold"
                                    >
                                        Execute
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-black/40 border-t border-white/5">
                            <button onClick={() => setAvailabilityModal(null)} className="w-full h-16 text-[10px] font-black text-white/60 hover:text-white uppercase tracking-[0.4em] transition-colors">
                                Abort isolation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals are kept similar but with updated visuals */}
            {(editingItem || isAddModalOpen) && (
                 <div className="fixed inset-0 bg-[#0c0d0c]/98 backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-[#111311] border border-white/5 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                        <div className="p-12 border-b border-white/5 flex justify-between items-center bg-black/40">
                            <div>
                                <h3 className="text-5xl font-serif text-white font-bold tracking-tight">{editingItem ? 'Edit Entry' : 'Manual Intake'}</h3>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">DATABASE CORE 0.1</p>
                            </div>
                            <button onClick={() => editingItem ? setEditingItem(null) : setIsAddModalOpen(false)} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={editingItem ? handleUpdate : handleAdd} className="p-12 space-y-10 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">ITEM DESIGNATION</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={editingItem ? editingItem.name : newItem.name}
                                        onChange={e => editingItem ? setEditingItem({...editingItem, name: e.target.value}) : setNewItem({...newItem, name: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-accent transition-all shadow-inner placeholder:text-white/5"
                                        placeholder="Identification..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">UNIT PRICE (GBP)</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-accent/40 font-serif font-bold text-xl italic">£</span>
                                        <input 
                                            required 
                                            type="number" 
                                            step="0.01"
                                            value={editingItem ? editingItem.price : newItem.price}
                                            onChange={e => editingItem ? setEditingItem({...editingItem, price: parseFloat(e.target.value)}) : setNewItem({...newItem, price: parseFloat(e.target.value)})}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 pl-12 text-xl text-white font-serif italic focus:outline-none focus:border-accent/50 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">CLASSIFICATION</label>
                                    <select 
                                        value={editingItem ? editingItem.category : newItem.category}
                                        onChange={e => editingItem ? setEditingItem({...editingItem, category: e.target.value}) : setNewItem({...newItem, category: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all shadow-inner appearance-none"
                                    >
                                        <option>Biryani Thaali</option>
                                        <option>Non Veg Starters</option>
                                        <option>Sea Food</option>
                                        <option>Veg Starters</option>
                                        <option>Main Course</option>
                                        <option>Mandi</option>
                                        <option>Desserts</option>
                                        <option>Drinks</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">FLAGS</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'isPopular', label: 'POPULAR', color: 'text-red-500' },
                                            { id: 'isRecommended', label: 'ELITE', color: 'text-nizam-gold' }
                                        ].map(badge => {
                                            const target = editingItem || newItem;
                                            return (
                                                <label key={badge.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${target[badge.id] ? 'bg-white/5 border-nizam-gold' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                                                    <span className={`text-[9px] font-black tracking-widest ${target[badge.id] ? badge.color : 'text-white/20'}`}>{badge.label}</span>
                                                    <input 
                                                        type="checkbox"
                                                        checked={target[badge.id]}
                                                        onChange={e => editingItem ? setEditingItem({ ...editingItem, [badge.id]: e.target.checked }) : setNewItem({ ...newItem, [badge.id]: e.target.checked })}
                                                        className="hidden"
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">AVAILABILITY START (HH:mm)</label>
                                    <input 
                                        type="time" 
                                        value={editingItem ? editingItem.availableFrom || '' : newItem.availableFrom || ''}
                                        onChange={e => editingItem ? setEditingItem({...editingItem, availableFrom: e.target.value}) : setNewItem({...newItem, availableFrom: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif focus:outline-none focus:border-nizam-gold/50 transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">AVAILABILITY END (HH:mm)</label>
                                    <input 
                                        type="time" 
                                        value={editingItem ? editingItem.availableTo || '' : newItem.availableTo || ''}
                                        onChange={e => editingItem ? setEditingItem({...editingItem, availableTo: e.target.value}) : setNewItem({...newItem, availableTo: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif focus:outline-none focus:border-nizam-gold/50 transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">CULINARY SPECIFICATIONS</label>
                                <textarea 
                                    value={editingItem ? editingItem.description : newItem.description}
                                    onChange={e => editingItem ? setEditingItem({...editingItem, description: e.target.value}) : setNewItem({...newItem, description: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-lg text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all h-32 resize-none shadow-inner placeholder:text-white/5"
                                    placeholder="Enter descriptive metadata..."
                                />
                            </div>

                            <button type="submit" className="w-full h-24 bg-accent text-black py-4 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:bg-accent-hover transition-all mt-4 glow-gold">
                                {editingItem ? 'SYNCHRONIZE DATABASE' : 'INJECT NEW ENTRY'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
