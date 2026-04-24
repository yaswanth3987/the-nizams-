import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Package, PoundSterling, FileText, Printer, Calendar as CalendarIcon, Filter, Layers, Lock, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const API_URL = import.meta.env.DEV 
    ? `http://${window.location.hostname}:3001/api` 
    : '/api';

export default function InventoryDashboard() {
    const [salesList, setSalesList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Authentication State
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem('inventory_auth') === 'true';
    });
    const [authInput, setAuthInput] = useState({ username: '', password: '' });
    const [authError, setAuthError] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        if (authInput.username === 'admin5005' && authInput.password === 'nizam0304') {
            setIsAuthenticated(true);
            sessionStorage.setItem('inventory_auth', 'true');
            setAuthError(false);
        } else {
            setAuthError(true);
            setAuthInput({ username: '', password: '' });
        }
    };

    const [datePreset, setDatePreset] = useState('week'); // 'today', 'week', 'month', 'custom'
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Using the existing endpoints for top-level stats
            
            // Getting all historical sales to construct charts and reports locally
            const salesRes = await fetch(`${API_URL}/orders?statuses=completed,billed,archived`);
            const salesData = await salesRes.json();

            setSalesList(salesData || []);
        } catch (err) {
            console.error("Failed to load inventory data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintEndOfDay = () => {
        window.print();
    };

    const handleDownloadInventory = async () => {
        try {
            const response = await fetch(`${API_URL}/download-inventory`);
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Export Error:", err);
            alert("Failed to export inventory. Please check server connection.");
        }
    };

    const [now] = useState(() => Date.now());

    // Filter Logic
    const filteredSalesList = useMemo(() => {
        return salesList.filter(order => {
            if (!order.createdAt) return false;
            const orderDateStr = order.createdAt.split('T')[0];
            const tsOrder = new Date(orderDateStr).getTime();
            const tsStart = new Date(startDate).getTime();
            const tsEnd = new Date(endDate).getTime();
            
            if (datePreset === 'all') return true;
            if (datePreset === 'today') return orderDateStr === endDate;
            if (datePreset === 'custom') return tsOrder >= tsStart && tsOrder <= tsEnd;
            if (datePreset === 'week') return tsOrder >= new Date(now - 7 * 86400000).getTime();
            if (datePreset === 'month') return tsOrder >= new Date(now - 30 * 86400000).getTime();
            return true;
        });
    }, [salesList, datePreset, startDate, endDate, now]);

    const generatedChartData = useMemo(() => {
        const grouped = {};
        filteredSalesList.forEach(o => {
            const d = o.createdAt.split('T')[0];
            if (!grouped[d]) grouped[d] = { date: d, revenue: 0, orders: 0 };
            grouped[d].revenue += parseFloat(o.finalTotal || 0);
            grouped[d].orders += 1;
        });
        return Object.values(grouped).sort((a,b) => a.date.localeCompare(b.date));
    }, [filteredSalesList]);

    const computedItemAnalytics = useMemo(() => {
        const itemMap = {};
        filteredSalesList.forEach(order => {
            if (Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const name = item.name;
                    if (!itemMap[name]) {
                        itemMap[name] = { id: item.id || name, itemName: name, quantitySold: 0, totalRevenue: 0 };
                    }
                    itemMap[name].quantitySold += item.qty;
                    itemMap[name].totalRevenue += (item.qty * item.price);
                });
            }
        });
        return Object.values(itemMap).sort((a, b) => b.quantitySold - a.quantitySold);
    }, [filteredSalesList]);

    // Derived Statistics from Filtered Data
    const displayTotalOrders = filteredSalesList.length;
    const displayRevenue = filteredSalesList.reduce((sum, o) => sum + parseFloat(o.finalTotal || 0), 0);
    const displayServiceCharge = filteredSalesList.reduce((sum, o) => sum + parseFloat(o.serviceCharge || 0), 0);
    const displaySubtotal = filteredSalesList.reduce((sum, o) => sum + parseFloat(o.subtotal || 0), 0);

    const handlePresetChange = (mode) => {
        setDatePreset(mode);
        const today = new Date(now).toISOString().split('T')[0];
        setEndDate(today);
        if (mode === 'today') setStartDate(today);
        else if (mode === 'week') setStartDate(new Date(now - 7 * 86400000).toISOString().split('T')[0]);
        else if (mode === 'month') setStartDate(new Date(now - 30 * 86400000).toISOString().split('T')[0]);
    };

    if (loading) {
        return <div className="text-center py-12 text-white/40 uppercase text-[10px] font-black tracking-widest animate-pulse">Loading comprehensive analytics...</div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-[#111311] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-sm w-full">
                    <div className="flex justify-center mb-6">
                        <div className="bg-accent/10 p-4 rounded-xl text-accent border border-accent/20 glow-gold">
                            <Lock size={32} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-serif text-accent text-center mb-2">Inventory Security</h2>
                    <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em] text-center mb-8">
                        Management Access Required
                    </p>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <div className="bg-black/30 border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-accent/40 transition-colors">
                                <User size={16} className="text-white/40 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={authInput.username}
                                    onChange={(e) => setAuthInput({...authInput, username: e.target.value})}
                                    className="bg-transparent border-none text-white focus:outline-none w-full placeholder:text-white/20"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="bg-black/30 border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-accent/40 transition-colors">
                                <Lock size={16} className="text-white/40 mr-3" />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={authInput.password}
                                    onChange={(e) => setAuthInput({...authInput, password: e.target.value})}
                                    className="bg-transparent border-none text-white focus:outline-none w-full placeholder:text-white/20"
                                />
                            </div>
                        </div>
                        
                        {authError && (
                            <p className="text-red-400 text-xs text-center font-black uppercase tracking-widest mt-2 animate-pulse">
                                Access Denied
                            </p>
                        )}
                        
                        <button
                            type="submit"
                            className="w-full bg-accent hover:bg-accent/90 text-black font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-lg mt-6 shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all"
                        >
                            Unlock Database
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Calendar / Filter Controls */}
            <div className="bg-[#111311] p-6 rounded-2xl shadow-sm border border-white/10 flex flex-wrap gap-6 items-center justify-between">
                <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-accent glow-gold" />
                    <span className="font-black text-white/60 uppercase tracking-[0.2em] text-xs">Report Filters</span>
                </div>
                <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {['today', 'week', 'month', 'custom', 'all'].map(mode => (
                        <button 
                            key={mode} 
                            onClick={() => handlePresetChange(mode)}
                            className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${datePreset === mode ? 'bg-accent text-black shadow-[0_0_15px_rgba(255,215,0,0.4)] glow-gold' : 'text-white/40 hover:text-white'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
                
                {datePreset === 'custom' && (
                    <div className="flex items-center gap-3 text-sm bg-black/40 p-2 rounded-xl border border-white/10">
                        <CalendarIcon className="w-4 h-4 text-accent" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none text-white focus:outline-none focus:ring-0 rounded px-2 py-1 text-xs font-bold uppercase" />
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none text-white focus:outline-none focus:ring-0 rounded px-2 py-1 text-xs font-bold uppercase" />
                    </div>
                )}
            </div>

            {/* A. Daily/Filtered Sales Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#111311] p-6 rounded-2xl border border-white/10 flex items-center gap-5 hover:border-accent/40 transition-colors">
                    <div className="bg-emerald-500/10 p-4 rounded-xl text-emerald-400 border border-emerald-500/20">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">Filtered Orders</p>
                        <h3 className="text-3xl font-serif italic text-white font-bold">{displayTotalOrders}</h3>
                    </div>
                </div>
                <div className="bg-[#111311] p-6 rounded-2xl border border-white/10 flex items-center gap-5 hover:border-accent/40 transition-colors">
                    <div className="bg-accent/10 p-4 rounded-xl text-accent border border-accent/20 glow-gold">
                        <PoundSterling size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">Filtered Revenue</p>
                        <h3 className="text-3xl font-serif italic text-white font-bold tracking-tighter">£{displayRevenue.toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-[#111311] p-6 rounded-2xl border border-white/10 flex items-center gap-5 hover:border-accent/40 transition-colors">
                    <div className="bg-blue-500/10 p-4 rounded-xl text-blue-400 border border-blue-500/20">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">Service Charge</p>
                        <h3 className="text-3xl font-serif italic text-white font-bold tracking-tighter">£{displayServiceCharge.toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-[#111311] p-6 rounded-2xl border border-white/10 flex items-center gap-5 hover:border-accent/40 transition-colors">
                    <div className="bg-orange-500/10 p-4 rounded-xl text-orange-400 border border-orange-500/20">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">All-time Items</p>
                        <h3 className="text-2xl font-serif italic text-white font-bold tracking-tighter">
                            {computedItemAnalytics.reduce((sum, item) => sum + item.quantitySold, 0)} Sold
                        </h3>
                    </div>
                </div>
            </div>

            {/* B. Graphical Analytics (Recharts) */}
            <div className="bg-[#111311] border border-white/10 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-sm font-black text-white/60 mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                    <TrendingUp size={18} className="text-accent glow-gold"/> Revenue Analytics Graph ({datePreset.toUpperCase()})
                </h3>
                {generatedChartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-white/20 font-serif italic">No data available for this range.</div>
                ) : (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={generatedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff', opacity: 0.4 }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff', opacity: 0.4 }} tickFormatter={v => `£${v}`} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff', opacity: 0.4 }} />
                                <Tooltip 
                                    cursor={{fill: '#ffffff', opacity: 0.05}} 
                                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0c0d0c', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', color: '#fff' }}
                                    itemStyle={{ color: '#FFD700' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Bar yAxisId="left" dataKey="revenue" name="Revenue (£)" fill="#0F3A2F" stroke="#10B981" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={40} />
                                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders Count" stroke="#FFD700" strokeWidth={3} dot={{ r: 4, fill: '#0c0d0c', stroke: '#FFD700' }} activeDot={{ r: 6, fill: '#FFD700' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* C. Sales List (Detailed Orders Filtered) */}
                <div className="lg:col-span-2 bg-[#111311] rounded-2xl border border-white/10 flex flex-col h-[400px] overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h3 className="text-[12px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Layers size={18} className="text-accent glow-gold"/> Filtered Sales List
                        </h3>
                    </div>
                    <div className="flex-1 overflow-x-auto p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase font-bold text-white/20 border-b border-white/5 bg-black/20">
                                    <th className="px-6 py-4 tracking-[0.2em]">Order ID</th>
                                    <th className="px-6 py-4 tracking-[0.2em]">Table</th>
                                    <th className="px-6 py-4 tracking-[0.2em] w-1/3">Items</th>
                                    <th className="px-6 py-4 tracking-[0.2em]">Subtotal</th>
                                    <th className="px-6 py-4 tracking-[0.2em]">Srv. Chg</th>
                                    <th className="px-6 py-4 tracking-[0.2em]">Total</th>
                                    <th className="px-6 py-4 tracking-[0.2em] text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredSalesList.map(order => (
                                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-mono text-white/40 text-xs">#{order.id}</td>
                                        <td className="px-6 py-4 font-serif italic text-white">{order.tableId}</td>
                                        <td className="px-6 py-4 text-white/40 text-[11px] uppercase tracking-wide">
                                            {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                        </td>
                                        <td className="px-6 py-4 text-white/60">£{order.subtotal.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-white/40">£{order.serviceCharge.toFixed(2)}</td>
                                        <td className="px-6 py-4 font-bold text-accent glow-gold">£{order.finalTotal.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-white/40 text-[10px] font-black uppercase tracking-widest text-nowrap">
                                            {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                    </tr>
                                ))}
                                {filteredSalesList.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-12 text-white/20 font-serif italic">No sales recorded in this timeframe.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side Column */}
                <div className="space-y-6">
                    {/* D. End of Day Report Summary */}
                    <div className="bg-[#111311] rounded-2xl border border-white/10 p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-[12px] font-black text-white/60 mb-4 pb-4 border-b border-white/5 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Printer size={18} className="text-accent glow-gold"/> Print Actions
                            </h3>
                            <p className="text-[10px] text-white/40 mb-6 uppercase tracking-widest leading-relaxed">
                                Generates a full comprehensive summary of the filtered performance for external reporting or filing.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={handlePrintEndOfDay}
                                className="flex-1 bg-white text-black font-black uppercase tracking-[0.3em] py-4 rounded-xl hover:bg-gray-200 flex justify-center items-center gap-3 transition-all active:scale-95"
                            >
                                <Printer size={16} /> Z-Report
                            </button>
                            <button 
                                onClick={handleDownloadInventory}
                                className="flex-1 bg-accent text-black font-black uppercase tracking-[0.3em] py-4 rounded-xl hover:bg-[#FFC300] flex justify-center items-center gap-3 shadow-[0_10px_20px_rgba(255,215,0,0.2)] transition-all glow-gold active:scale-95"
                            >
                                <Package size={16} /> Export XLS
                            </button>
                        </div>
                    </div>

                    {/* E. Item-wise Sales Tracking (All-time or today based on itemAnalytics) */}
                    <div className="bg-[#111311] rounded-2xl border border-white/10 flex flex-col h-[230px] overflow-hidden">
                         <div className="p-6 border-b border-white/5 bg-white/5">
                            <h3 className="text-[12px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Package size={18} className="text-accent glow-gold"/> Top Performers
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0 no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[9px] uppercase font-black text-white/20 border-b border-white/5 bg-black/40">
                                        <th className="px-6 py-3 tracking-widest">Item Name</th>
                                        <th className="px-6 py-3 tracking-widest text-center">Qty</th>
                                        <th className="px-6 py-3 tracking-widest text-right">Rev</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {computedItemAnalytics.map((item, idx) => (
                                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="px-6 py-3 text-white/80 font-serif italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={item.itemName}>
                                                {idx < 3 && <span className="text-accent mr-2 text-xs glow-gold">★</span>}
                                                {item.itemName}
                                            </td>
                                            <td className="px-6 py-3 text-center font-bold text-white/40">{item.quantitySold}</td>
                                            <td className="px-6 py-3 text-right font-bold text-accent glow-gold">£{item.totalRevenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {computedItemAnalytics.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center py-6 text-white/20 font-serif italic">No items sold yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Print Container for Z-Report */}
            <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-50 p-8">
                <div className="text-center mb-6">
                    <img src="/logo-with-name.png" alt="The Great Nizam" className="w-20 mx-auto mb-2 grayscale" />
                    <h1 className="text-2xl font-bold">END OF DAY REPORT (Z-READ)</h1>
                    <p className="text-gray-500">{new Date().toLocaleString()}</p>
                    <p className="text-gray-500 mt-1">Range: {startDate} to {endDate}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-8 border-t border-b border-black py-4">
                    <div>
                        <p className="font-bold text-lg mb-2">Metrics Summary</p>
                        <p>Total Orders Closed: {displayTotalOrders}</p>
                        <p>Items Sold Info Below</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg mb-2">Financials</p>
                        <p className="flex justify-between w-48"><span>Gross Revenue:</span> <span>£{displayRevenue.toFixed(2)}</span></p>
                        <p className="flex justify-between w-48 text-gray-600"><span>Subtotal:</span> <span>£{displaySubtotal.toFixed(2)}</span></p>
                        <p className="flex justify-between w-48 text-gray-600"><span>Service Charge:</span> <span>£{displayServiceCharge.toFixed(2)}</span></p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2 border-b border-black pb-1">Top Performing Items</h3>
                    <table className="w-full text-left font-mono text-sm">
                        <thead>
                            <tr>
                                <th className="pb-2">Item Name</th>
                                <th className="pb-2">Qty Sold</th>
                                <th className="pb-2">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {computedItemAnalytics.slice(0, 15).map(item => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="py-1">{item.itemName}</td>
                                    <td className="py-1">{item.quantitySold}</td>
                                    <td className="py-1">£{item.totalRevenue.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
