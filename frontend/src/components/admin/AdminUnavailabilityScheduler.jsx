import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Check, X, AlertTriangle, ChevronDown, Utensils, LayoutGrid, Timer } from 'lucide-react';
import { socket } from '../../utils/socket';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function AdminUnavailabilityScheduler() {
    const [schedules, setSchedules] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    
    // Form state
    const [newSchedule, setNewSchedule] = useState({
        label: '',
        type: 'daily',
        startTime: '14:00',
        endTime: '17:00',
        startDate: new Date().toISOString().split('T')[0],
        daysOfWeek: [], // ['1', '2', '3'] etc
        itemIds: [],
        category: ''
    });

    const categories = ['All', ...new Set(menuItems.map(item => item.category))];

    useEffect(() => {
        fetchData();
        socket.on('menuReset', fetchData);
        return () => socket.off('menuReset', fetchData);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [schedRes, menuRes] = await Promise.all([
                fetch(`${API_URL}/schedules`),
                fetch(`${API_URL}/menu`)
            ]);
            setSchedules(await schedRes.json());
            setMenuItems(await menuRes.json());
        } catch (err) {
            console.error('Failed to fetch scheduler data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...newSchedule,
                daysOfWeek: newSchedule.daysOfWeek.join(',')
            };
            const res = await fetch(`${API_URL}/schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                fetchData();
                setIsAddOpen(false);
                resetForm();
            }
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setNewSchedule({
            label: '',
            type: 'daily',
            startTime: '14:00',
            endTime: '17:00',
            startDate: new Date().toISOString().split('T')[0],
            daysOfWeek: [],
            itemIds: [],
            category: ''
        });
    };

    const toggleStatus = async (id, currentEnabled) => {
        try {
            const sched = schedules.find(s => s.id === id);
            await fetch(`${API_URL}/schedules/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...sched, isEnabled: !currentEnabled })
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this schedule?')) return;
        try {
            await fetch(`${API_URL}/schedules/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const applyPreset = (preset) => {
        if (preset === 'lunch') {
            setNewSchedule(prev => ({ ...prev, label: 'Lunch Block', startTime: '14:00', endTime: '17:00' }));
        } else if (preset === 'dinner') {
            setNewSchedule(prev => ({ ...prev, label: 'Late Night Block', startTime: '22:00', endTime: '23:59' }));
        }
    };

    const toggleDay = (day) => {
        setNewSchedule(prev => {
            const days = prev.daysOfWeek.includes(day) 
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day];
            return { ...prev, daysOfWeek: days };
        });
    };

    const toggleItemSelection = (id) => {
        setNewSchedule(prev => {
            const ids = prev.itemIds.includes(id)
                ? prev.itemIds.filter(i => i !== id)
                : [...prev.itemIds, id];
            return { ...prev, itemIds: ids };
        });
    };

    if (isLoading) return <div className="text-white/40 animate-pulse uppercase text-[10px] font-black tracking-widest">Loading Chronosphere...</div>;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-5xl font-serif text-white font-bold italic mb-2 tracking-tight">Unavailability Scheduler</h2>
                    <p className="text-white/40 text-sm max-w-xl leading-relaxed">
                        Automate your menu dynamics. Set temporal locks for specific items or entire categories to manage availability without manual oversight.
                    </p>
                </div>
                <button 
                    onClick={() => setIsAddOpen(true)}
                    className="group relative bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 px-8 py-5 rounded-[2rem] transition-all flex items-center gap-4 overflow-hidden glow-gold"
                >
                    <div className="absolute inset-0 bg-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <Plus size={20} className="relative z-10" />
                    <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.2em]">Deploy Schedule</span>
                </button>
            </div>

            {/* Active Schedules Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {schedules.length === 0 ? (
                    <div className="lg:col-span-3 py-24 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                        <Calendar size={48} className="mx-auto text-white/10 mb-6" />
                        <p className="text-white/40 font-serif italic text-lg">No active temporal locks detected.</p>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-2">Chronos Logic Offline</p>
                    </div>
                ) : (
                    schedules.map(sched => (
                        <div key={sched.id} className={`relative bg-[#111311] border rounded-[2.5rem] p-8 transition-all hover:bg-white/[0.03] ${sched.isEnabled ? 'border-accent/40 shadow-[0_20px_50px_rgba(255,215,0,0.1)]' : 'border-white/5 opacity-60'}`}>
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <Clock size={24} className={sched.isEnabled ? 'text-accent' : 'text-white/20'} />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => toggleStatus(sched.id, sched.isEnabled)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sched.isEnabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}
                                    >
                                        {sched.isEnabled ? 'Active' : 'Disabled'}
                                    </button>
                                    <button onClick={() => handleDelete(sched.id)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 mb-8">
                                <div>
                                    <h4 className="text-2xl font-serif text-white font-bold italic leading-tight">{sched.label || 'Unnamed Schedule'}</h4>
                                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mt-1 glow-gold">{sched.type}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/40 p-4 rounded-3xl border border-white/5">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Engage</p>
                                        <p className="text-xl font-serif subpixel-antialiased text-white italic">{sched.startTime}</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-3xl border border-white/5">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Release</p>
                                        <p className="text-xl font-serif subpixel-antialiased text-white italic">{sched.endTime}</p>
                                    </div>
                                </div>

                                {sched.type === 'weekly' && sched.daysOfWeek && (
                                    <div className="flex gap-2 flex-wrap">
                                        {sched.daysOfWeek.split(',').map(d => (
                                            <span key={d} className="px-2 py-1 bg-accent/10 border border-accent/20 rounded text-[9px] text-accent font-black uppercase">
                                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][parseInt(d)]}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                
                                {sched.type === 'one-time' && sched.startDate && (
                                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
                                        <Calendar size={12} /> {new Date(sched.startDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <Utensils size={14} className="text-white/20" />
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                        {sched.category ? `Category: ${sched.category}` : `${JSON.parse(sched.itemIds || '[]').length} Items Linked`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal: Deploy Schedule */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-[#0c0d0c]/98 backdrop-blur-3xl z-[200] flex items-center justify-center p-8 animate-in fade-in duration-500 overflow-y-auto">
                    <div className="bg-[#111311] border border-white/5 rounded-[4rem] w-full max-w-4xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] my-auto relative">
                        <div className="p-12 border-b border-white/5 flex justify-between items-center bg-black/40">
                            <div>
                                <h3 className="text-5xl font-serif text-white font-bold tracking-tight italic">Temporal Configuration</h3>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">DEPLOYMENT UNIT ALPHA</p>
                            </div>
                            <button onClick={() => setIsAddOpen(false)} className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="p-12 space-y-10 max-h-[60vh] overflow-y-auto no-scrollbar">
                            {/* Line 1: Label & Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Schedule Identity</label>
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="e.g., Lunch Shutdown"
                                        value={newSchedule.label}
                                        onChange={e => setNewSchedule({...newSchedule, label: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-accent/50 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Repetition Logic</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['daily', 'weekly', 'one-time'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewSchedule({...newSchedule, type})}
                                                className={`py-6 rounded-3xl text-[9px] font-black uppercase tracking-widest transition-all ${newSchedule.type === type ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'bg-black/40 text-white/20 border border-white/5'}`}
                                            >
                                                {type.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Line 2: Time Range & Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Time Window</label>
                                        <div className="flex gap-3">
                                            <button type="button" onClick={() => applyPreset('lunch')} className="text-[8px] font-black text-accent/60 uppercase hover:text-accent font-sans">Lunch Preset</button>
                                            <button type="button" onClick={() => applyPreset('dinner')} className="text-[8px] font-black text-accent/60 uppercase hover:text-accent font-sans">Dinner Preset</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 bg-black/40 border border-white/10 rounded-3xl p-6 flex flex-col justify-center">
                                            <span className="text-[7px] font-black text-white/20 uppercase mb-2">Engage (HH:mm)</span>
                                            <input type="time" value={newSchedule.startTime} onChange={e => setNewSchedule({...newSchedule, startTime: e.target.value})} className="bg-transparent text-2xl text-white font-serif italic focus:outline-none w-full" />
                                        </div>
                                        <div className="flex-1 bg-black/40 border border-white/10 rounded-3xl p-6 flex flex-col justify-center">
                                            <span className="text-[7px] font-black text-white/20 uppercase mb-2">Release (HH:mm)</span>
                                            <input type="time" value={newSchedule.endTime} onChange={e => setNewSchedule({...newSchedule, endTime: e.target.value})} className="bg-transparent text-2xl text-white font-serif italic focus:outline-none w-full" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {newSchedule.type === 'weekly' ? (
                                        <>
                                            <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Day Selection</label>
                                            <div className="flex gap-2 justify-between">
                                                {['S','M','T','W','T','F','S'].map((day, i) => (
                                                    <button 
                                                        key={i}
                                                        type="button"
                                                        onClick={() => toggleDay(i.toString())}
                                                        className={`w-10 h-10 rounded-full text-[10px] font-black transition-all ${newSchedule.daysOfWeek.includes(i.toString()) ? 'bg-accent text-black scale-110' : 'bg-black/40 text-white/20 border border-white/5'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : newSchedule.type === 'one-time' ? (
                                        <>
                                            <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Calendar Date</label>
                                            <input 
                                                type="date"
                                                value={newSchedule.startDate}
                                                onChange={e => setNewSchedule({...newSchedule, startDate: e.target.value})}
                                                className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-accent/50 transition-all font-bold"
                                            />
                                        </>
                                    ) : (
                                        <div className="h-full flex items-center justify-center bg-black/10 border border-white/5 rounded-3xl border-dashed">
                                            <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">Daily Repeat Active</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Line 3: Scope Selection */}
                            <div className="space-y-6">
                                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Target Selection (Choose Category OR Specific Items)</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    <div className="space-y-4">
                                        <label className="block text-[9px] font-bold text-accent/60 uppercase tracking-widest">By Category</label>
                                        <select 
                                            value={newSchedule.category}
                                            onChange={e => setNewSchedule({...newSchedule, category: e.target.value, itemIds: []})}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-lg text-white font-serif italic focus:outline-none focus:border-accent/50 transition-all appearance-none"
                                        >
                                            <option value="">No category (use specific items)</option>
                                            {categories.filter(c => c !== 'All').map(c => (
                                                <option key={c} value={c} className="bg-black text-white">{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="block text-[9px] font-bold text-accent uppercase tracking-widest glow-gold">Specific Items ({newSchedule.itemIds.length} selected)</label>
                                        <div className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-4 overflow-y-auto no-scrollbar grid grid-cols-2 gap-2 shadow-inner">
                                            {menuItems.filter(item => !newSchedule.category || item.category === newSchedule.category).map(item => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => toggleItemSelection(item.id)}
                                                    className={`px-4 py-2 rounded-xl text-left text-[10px] font-black uppercase tracking-tight transition-all truncate flex items-center gap-3 ${newSchedule.itemIds.includes(item.id) ? 'bg-accent/10 border border-accent/40 text-accent glow-gold' : 'bg-white/5 border border-white/5 text-white/40 hover:text-white'}`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${newSchedule.itemIds.includes(item.id) ? 'bg-accent' : 'bg-white/10'}`}></div>
                                                    {item.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full h-24 bg-accent text-black text-[13px] font-black uppercase tracking-[0.5em] rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(255,215,0,0.3)] hover:bg-[#FFC300] active:scale-[0.98] transition-all glow-gold">
                                Commit Temporal Lock
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
