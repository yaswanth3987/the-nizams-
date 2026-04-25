import React, { useState, useEffect } from 'react';
import { Search, Clock, X, UserPlus, Trash2, CheckCircle, AlertTriangle, User, Edit2 } from 'lucide-react';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function AdminAttendance() {
    const [staffList, setStaffList] = useState([]);
    const [attendanceToday, setAttendanceToday] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: '', phone: '', shiftTimings: '', designation: 'waiter', pin: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [editingStaff, setEditingStaff] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [empRes, attRes] = await Promise.all([
                fetch(`${API_URL}/employees`),
                fetch(`${API_URL}/attendance/today`)
            ]);
            const emps = await empRes.json();
            const atts = await attRes.json();
            setStaffList(Array.isArray(emps) ? emps : []);
            setAttendanceToday(Array.isArray(atts) ? atts : []);
        } catch (err) {
            console.error(err);
        } finally { setLoading(false); }
    };

    const registerEmployeeAPI = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });
            if (res.ok) {
                setShowAddModal(false);
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const updateEmployeeAPI = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/employees/${editingStaff.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingStaff)
            });
            if (res.ok) {
                setEditingStaff(null);
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteStaff = async (id) => {
        if (!confirm("Remove this staff member permanently?")) return;
        try {
            await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleMarkAttendance = async (staff) => {
        const pin = prompt(`Enter Security PIN for ${staff.name}:`);
        if (pin === null) return; // Cancelled
        
        try {
            const res = await fetch(`${API_URL}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: staff.id, pin })
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to mark attendance");
            }
        } catch (err) { console.error(err); }
    };

    const handleCheckOut = async (staff) => {
        const pin = prompt(`Enter Security PIN for ${staff.name} to Check-out:`);
        if (pin === null) return;

        try {
            const res = await fetch(`${API_URL}/attendance/checkout`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: staff.id, pin })
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to check-out");
            }
        } catch (err) { console.error(err); }
    };

    const filteredStaff = staffList.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery)
    );

    const totalPresent = attendanceToday.length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nizam-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 font-sans">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Staff Attendance</h2>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                        Personnel registry and daily attendance tracking.
                    </p>
                </div>
                <button 
                    onClick={() => { setShowAddModal(true); setNewStaff({name:'', phone:'', shiftTimings:'', designation: 'waiter', pin: ''}); }}
                    className="h-14 px-8 rounded-xl bg-accent text-black font-bold text-sm flex items-center gap-3 transition-all hover:bg-white shadow-xl"
                >
                    <UserPlus size={20} /> 
                    New Enrollment
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <StatCard title="Active Today" value={totalPresent.toString()} subvalue="Verified Personnel" highlight="text-emerald-400" />
                <StatCard title="Total Registry" value={staffList.length.toString()} subvalue="Enrolled Staff" highlight="text-accent" />
            </div>

            <div className="bg-[#0a120a] border border-emerald-900/30 rounded-[3rem] flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="p-10 border-b border-emerald-900/30 flex justify-between items-center bg-emerald-950/20">
                    <span className="font-black tracking-[0.4em] text-emerald-500/40 uppercase text-xs">Registry Ledger</span>
                    <div className="relative w-96">
                        <Search className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500/40" />
                        <input 
                            type="text" 
                            placeholder="Identify staff..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0c0d0c] border border-emerald-900/30 rounded-2xl px-6 pl-16 py-5 text-sm text-white focus:outline-none focus:border-emerald-500/30 transition-all font-sans" 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs font-bold uppercase tracking-wider text-white/40 border-b border-white/10 bg-white/5">
                                <th className="py-6 px-10">Registry ID</th>
                                <th className="py-6 px-10">Personnel Name</th>
                                <th className="py-6 px-10">Shift Timings</th>
                                <th className="py-6 px-10">UK Number</th>
                                <th className="py-6 px-10">Verification Status</th>
                                <th className="py-6 px-10 text-right">Access Point</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-20 text-white/20 font-serif italic text-xl">No matching personnel detected.</td></tr>
                            ) : filteredStaff.map(staff => {
                                const attended = attendanceToday.find(a => Number(a.employeeId || a.employeeid) === Number(staff.id));
                                const isCheckedOut = attended && (attended.checkOutTime || attended.checkouttime);
                                return (
                                    <tr key={staff.id} className="border-b border-white/10 hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-6 px-10 text-white/20 font-serif italic text-sm">#{String(staff.id).padStart(4, '0')}</td>
                                        <td className="py-6 px-10">
                                            <p className="font-serif font-bold text-xl text-white italic">{staff.name}</p>
                                            <p className="text-[10px] text-accent uppercase font-bold tracking-widest mt-1">{staff.designation || 'Authorized Staff'}</p>
                                        </td>
                                        <td className="py-6 px-10 text-white/80 font-bold">{staff.shiftTimings || 'N/A'}</td>
                                        <td className="py-6 px-10 text-white/60 font-medium">{staff.phone}</td>
                                        <td className="py-6 px-10">
                                            {attended ? (
                                                <span className={`inline-flex items-center gap-2 text-xs font-bold ${isCheckedOut ? 'text-white/40' : 'text-emerald-400'} ${isCheckedOut ? 'bg-white/5' : 'bg-emerald-400/10'} px-4 py-1.5 rounded-full border ${isCheckedOut ? 'border-white/10' : 'border-emerald-400/20'}`}>
                                                    {isCheckedOut ? 'Completed' : 'Present'}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-white/10 uppercase tracking-widest">Off Duty</span>
                                            )}
                                        </td>
                                        <td className="py-6 px-10 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                 {!attended && (
                                                    <button 
                                                        onClick={() => handleMarkAttendance(staff)}
                                                        className="px-6 py-2.5 rounded-xl bg-secondary text-accent border border-white/10 hover:bg-white hover:text-black transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                                                    >
                                                        <Clock size={16} /> Check-in
                                                    </button>
                                                )}
                                                {attended && !isCheckedOut && (
                                                    <button 
                                                        onClick={() => handleCheckOut(staff)}
                                                        className="px-6 py-2.5 rounded-xl bg-red-900/20 text-red-400 border border-red-900/30 hover:bg-red-900/40 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                                                    >
                                                        <Clock size={16} /> Check-out
                                                    </button>
                                                )}
                                                {isCheckedOut && (
                                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                                                        Logged {new Date(attended.checkOutTime || attended.checkouttime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                )}
                                                 <button onClick={() => setEditingStaff(staff)} className="p-3 text-white/10 hover:text-nizam-gold transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteStaff(staff.id)} className="p-3 text-white/10 hover:text-red-500 transition-colors">
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
            </div>

            {/* Registration Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-[#0c0d0c]/98 backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-[#111311] border border-white/5 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                        <div className="p-12 border-b border-white/5 text-center relative bg-black/40">
                            <h3 className="text-5xl font-serif text-white font-bold tracking-tight mb-2 italic">Enrollment</h3>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Personnel Database Integration</p>
                            <button onClick={() => setShowAddModal(false)} className="absolute right-10 top-12 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={registerEmployeeAPI} className="p-12 space-y-10">
                            <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] text-[13px] text-blue-400 leading-loose italic font-medium flex gap-6">
                                <AlertTriangle size={24} className="text-nizam-gold shrink-0"/>
                                <p>Registering new authorized personnel. Ensure details match legal identification for registry synchronization.</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Full Designation</label>
                                <input required type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="Staff Name..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">UK Communication Line</label>
                                <input required type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="+44 ..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Personnel Designation</label>
                                <select 
                                    value={newStaff.designation} 
                                    onChange={e => setNewStaff({...newStaff, designation: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium appearance-none"
                                >
                                    <option value="waiter">Waiter</option>
                                    <option value="chef">Chef</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                    <option value="super admin">Super Admin</option>
                                    <option value="cleaner">Cleaner</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Shift Timings</label>
                                <input required type="text" value={newStaff.shiftTimings} onChange={e => setNewStaff({...newStaff, shiftTimings: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="09:00 - 17:00" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Security PIN (Numeric)</label>
                                <input required type="password" maxLength={6} value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g,'')})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="4-6 Digit PIN" />
                            </div>
                            <button type="submit" className="w-full h-24 bg-gradient-to-r from-[#2c5b4d] to-[#1a3d34] text-white py-4 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:brightness-125 transition-all mt-4 flex justify-center items-center gap-4">
                                <User size={20}/> Complete Enrollment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingStaff && (
                <div className="fixed inset-0 bg-[#0c0d0c]/98 backdrop-blur-2xl z-[100] flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-[#111311] border border-white/5 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                        <div className="p-12 border-b border-white/5 text-center relative bg-black/40">
                            <h3 className="text-5xl font-serif text-white font-bold tracking-tight mb-2 italic">Update Profile</h3>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Personnel Record Adjustment</p>
                            <button onClick={() => setEditingStaff(null)} className="absolute right-10 top-12 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={updateEmployeeAPI} className="p-12 space-y-10">
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Full Designation</label>
                                <input required type="text" value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="Staff Name..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">UK Communication Line</label>
                                <input required type="tel" value={editingStaff.phone} onChange={e => setEditingStaff({...editingStaff, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="+44 ..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Personnel Designation</label>
                                <select 
                                    value={editingStaff.designation} 
                                    onChange={e => setEditingStaff({...editingStaff, designation: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium appearance-none"
                                >
                                    <option value="waiter">Waiter</option>
                                    <option value="chef">Chef</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                    <option value="super admin">Super Admin</option>
                                    <option value="cleaner">Cleaner</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Shift Timings</label>
                                <input required type="text" value={editingStaff.shiftTimings} onChange={e => setEditingStaff({...editingStaff, shiftTimings: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="09:00 - 17:00" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/20 tracking-[0.5em] uppercase mb-4 ml-4">Security PIN (Leave blank to keep current)</label>
                                <input type="password" maxLength={6} value={editingStaff.pin || ''} onChange={e => setEditingStaff({...editingStaff, pin: e.target.value.replace(/\D/g,'')})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white font-serif italic focus:outline-none focus:border-nizam-gold/50 transition-all font-medium" placeholder="New PIN..." />
                            </div>
                            <button type="submit" className="w-full h-24 bg-gradient-to-r from-nizam-gold to-[#a68c64] text-black py-4 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:brightness-125 transition-all mt-4 flex justify-center items-center gap-4">
                                <CheckCircle size={20}/> Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, subvalue, highlight = 'text-white' }) {
    return (
        <div className="bg-[#111311] border border-white/5 p-10 rounded-[2rem] relative shadow-2xl group hover:border-nizam-gold/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-nizam-gold/5 blur-3xl -mr-12 -mt-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4 relative z-10">{title}</h4>
            <div className="flex items-baseline gap-3 relative z-10">
                <span className={`text-5xl font-serif tracking-tight font-bold ${highlight}`}>{value}</span>
                <span className="text-[10px] font-black text-nizam-gold/40 tracking-[0.2em] uppercase italic">{subvalue}</span>
            </div>
        </div>
    );
}
