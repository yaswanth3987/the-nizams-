import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Utensils, IndianRupee, Search, Clock, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { socket } from '../../utils/socket';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function AdminMenuManagement() {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    
    // Availability Modal State
    const [availabilityModal, setAvailabilityModal] = useState(null); // { item, type: 'manual'|'today'|'custom' }
    const [customTime, setCustomTime] = useState('1'); // Hours

    const [newItem, setNewItem] = useState({
        name: '',
        price: '',
        category: 'Main Course',
        description: ''
    });

    useEffect(() => {
        fetchMenu();
        
        socket.on('menuUpdated', (updatedItem) => {
            setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        });

        socket.on('menuReset', (fullMenu) => {
            setMenuItems(fullMenu);
        });

        return () => {
            socket.off('menuUpdated');
            socket.off('menuReset');
        };
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await fetch(`${API_URL}/menu`);
            const data = await res.json();
            setMenuItems(data);
        } catch (err) {
            console.error('Failed to fetch menu:', err);
        } finally {
            setLoading(false);
        }
    };

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
                setNewItem({ name: '', price: '', category: 'Main Course', description: '' });
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

    const toggleAvailability = async (item, isAvailable, until = null) => {
        try {
            const res = await fetch(`${API_URL}/menu/${item.id}/availability`, {
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nizam-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-serif text-white mb-2 tracking-wide">Menu Management</h2>
                    <p className="text-nizam-textMuted text-sm max-w-lg">
                        Control item availability in real-time. Changes reflect instantly on customer devices.
                    </p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-nizam-gold text-black hover:bg-yellow-500 px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-nizam-gold/10"
                >
                    <Plus className="w-4 h-4" /> Add Item
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nizam-textMuted" />
                    <input 
                        type="text" 
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#111312] border border-nizam-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-nizam-gold/50 transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
                                activeCategory === cat 
                                ? 'bg-nizam-gold/10 border-nizam-gold text-nizam-gold' 
                                : 'bg-[#111312] border-nizam-border text-nizam-textMuted hover:border-white/20'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu List */}
            <div className="space-y-8">
                {Object.keys(groupedMenu).sort().map(category => (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xs font-bold text-nizam-gold uppercase tracking-[0.2em] whitespace-nowrap">{category}</h3>
                            <div className="h-[1px] w-full bg-gradient-to-r from-nizam-gold/20 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {groupedMenu[category].map(item => (
                                <div key={item.id} className={`bg-[#0d0f0e] border rounded-lg p-4 flex items-center justify-between transition-all group ${!item.isAvailable ? 'border-red-900/30 opacity-70' : 'border-white/5 hover:border-white/10 shadow-lg shadow-black/20'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className={`font-medium ${!item.isAvailable ? 'text-nizam-textMuted line-through' : 'text-white'}`}>{item.name}</h4>
                                            {!item.isAvailable && (
                                                <span className="bg-red-950/40 text-red-500 text-[9px] font-bold px-2 py-0.5 rounded border border-red-900/30 uppercase tracking-widest">
                                                    Unavailable {item.unavailableUntil && new Date(item.unavailableUntil) > new Date() ? `until ${new Date(item.unavailableUntil).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : '(Manual)'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-nizam-textMuted text-xs mt-1 truncate max-w-md">{item.description || 'No description available.'}</p>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-nizam-gold font-bold text-sm">£{item.price.toFixed(2)}</p>
                                        </div>

                                        <div className="flex items-center h-10 gap-2">
                                            {/* Availability Toggle */}
                                            <button 
                                                onClick={() => {
                                                    if (item.isAvailable) setAvailabilityModal(item);
                                                    else toggleAvailability(item, true);
                                                }}
                                                className={`h-full px-4 rounded text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-2 ${
                                                    item.isAvailable 
                                                    ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-500 hover:bg-emerald-900/40' 
                                                    : 'bg-red-950/20 border-red-900/50 text-red-500 hover:bg-red-900/40'
                                                }`}
                                            >
                                                {item.isAvailable ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                                {item.isAvailable ? 'Available' : 'Unavailable'}
                                            </button>

                                            <div className="flex items-center gap-1 border-l border-white/5 pl-2">
                                                <button 
                                                    onClick={() => setEditingItem(item)}
                                                    className="p-2.5 rounded hover:bg-white/5 text-nizam-textMuted hover:text-white transition-all shadow-sm"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2.5 rounded hover:bg-red-950/20 text-nizam-textMuted hover:text-red-500 transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Availability Modal */}
            {availabilityModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-[#111312] border border-nizam-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 text-center">
                            <div className="w-12 h-12 bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900/50">
                                <Clock className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-serif text-white mb-2">Mark Unavailable</h3>
                            <p className="text-sm text-nizam-textMuted italic">"{availabilityModal.name}"</p>
                        </div>
                        <div className="p-4 space-y-2">
                            <button 
                                onClick={() => {
                                    const until = new Date();
                                    until.setHours(23, 59, 59, 999);
                                    toggleAvailability(availabilityModal, false, until.toISOString());
                                }}
                                className="w-full text-left p-4 rounded-lg bg-black/40 border border-white/5 hover:border-nizam-gold/50 hover:bg-nizam-gold/5 transition-all group"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-white group-hover:text-nizam-gold transition-colors">Today Only</span>
                                    <span className="text-[10px] text-nizam-textMuted uppercase tracking-widest">Until Midnight</span>
                                </div>
                            </button>
                            <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-white">Custom Time</span>
                                    <span className="text-[10px] text-nizam-textMuted uppercase tracking-widest">Select Hours</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {['1', '2', '4', '8'].map(h => (
                                        <button 
                                            key={h}
                                            onClick={() => setCustomTime(h)}
                                            className={`py-2 rounded border text-[10px] font-bold transition-all ${customTime === h ? 'bg-nizam-gold border-nizam-gold text-black' : 'bg-white/5 border-white/10 text-nizam-textMuted hover:border-white/30'}`}
                                        >
                                            {h}h
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={customTime}
                                        onChange={(e) => setCustomTime(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nizam-gold"
                                        placeholder="Enter hours..."
                                    />
                                    <button 
                                        onClick={() => {
                                            if (customTime && !isNaN(customTime)) {
                                                const until = new Date(Date.now() + parseInt(customTime) * 3600000);
                                                toggleAvailability(availabilityModal, false, until.toISOString());
                                            }
                                        }}
                                        className="bg-nizam-gold text-black px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                                    >
                                        Set
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleAvailability(availabilityModal, false, null)}
                                className="w-full text-left p-4 rounded-lg bg-black/40 border border-white/5 hover:border-nizam-gold/50 hover:bg-nizam-gold/5 transition-all group"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-white group-hover:text-nizam-gold transition-colors">Manual Enable</span>
                                    <span className="text-[10px] text-nizam-textMuted uppercase tracking-widest">Infinite</span>
                                </div>
                            </button>
                        </div>
                        <div className="p-4 bg-black/40 border-t border-white/5">
                            <button onClick={() => setAvailabilityModal(null)} className="w-full py-2 text-xs font-bold text-nizam-textMuted hover:text-white uppercase tracking-widest transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Add Modals (Similar to before but without image field) */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#111312] border border-nizam-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-serif text-white tracking-wide">Edit Item</h3>
                            <button onClick={() => setEditingItem(null)} className="text-nizam-textMuted hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-nizam-textMuted uppercase tracking-widest mb-2">Item Name</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={editingItem.name}
                                    onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                                    className="w-full bg-black/40 border border-nizam-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-nizam-gold shadow-inner"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-nizam-textMuted uppercase tracking-widest mb-2">Price (£)</label>
                                    <input 
                                        required 
                                        type="number" 
                                        step="0.01"
                                        value={editingItem.price}
                                        onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                                        className="w-full bg-black/40 border border-nizam-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-nizam-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-nizam-textMuted uppercase tracking-widest mb-2">Category</label>
                                    <select 
                                        value={editingItem.category}
                                        onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                                        className="w-full bg-black/40 border border-nizam-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-nizam-gold appearance-none shadow-inner"
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
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-nizam-textMuted uppercase tracking-widest mb-2">Description</label>
                                <textarea 
                                    value={editingItem.description}
                                    onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                                    className="w-full bg-black/40 border border-nizam-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-nizam-gold h-24 resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-nizam-gold text-black font-bold uppercase tracking-widest text-xs rounded-lg mt-4 shadow-lg shadow-nizam-gold/10 hover:brightness-110 transition-all">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#111312] border border-nizam-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-serif text-white tracking-wide">Add Item</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-nizam-textMuted hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-nizam-textMuted uppercase tracking-widest mb-2">Item Name</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={newItem.name}
                                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                                    className="w-full bg-black/40 border border-nizam-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-nizam-gold shadow-inner"
                                    placeholder="e.g. Lamb Chops"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-nizam-textMuted uppercase tracking-widest mb-2">Price (£)</label>
                                    <input 
                                        required 
                                        type="number" 
                                        step="0.01"
                                        value={newItem.price}
                                        onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                                        className="w-full bg-black/40 border border-nizam-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-nizam-gold"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-nizam-textMuted uppercase tracking-widest mb-2">Category</label>
                                    <select 
                                        value={newItem.category}
                                        onChange={e => setNewItem({...newItem, category: e.target.value})}
                                        className="w-full bg-black/40 border border-nizam-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-nizam-gold appearance-none shadow-inner"
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
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-nizam-textMuted uppercase tracking-widest mb-2">Description</label>
                                <textarea 
                                    value={newItem.description}
                                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                                    className="w-full bg-black/40 border border-nizam-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-nizam-gold h-24 resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs rounded-lg mt-4 shadow-lg hover:bg-emerald-600 transition-all">
                                Create Item
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
