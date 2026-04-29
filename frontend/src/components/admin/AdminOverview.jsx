import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Package, FileText, Filter, Printer, Trash2, Search, ChevronRight, ChevronDown, Table, LayoutGrid, Lock, Download, BarChart3, PieChart, Info } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function AdminOverview({ itemAnalytics = [], salesList = [], onDeleteOrder }) {
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'reports', 'inventory'
    const [isReportsUnlocked, setIsReportsUnlocked] = useState(false);
    
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);

    useEffect(() => {
        if (activeTab === 'inventory') {
            fetchInventory();
        }
    }, [activeTab]);

    const fetchInventory = async () => {
        setLoadingInventory(true);
        try {
            const res = await fetch(`${API_URL}/inventory`);
            const data = await res.json();
            setInventory(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Inventory load error:", err);
        } finally {
            setLoadingInventory(false);
        }
    };
    
    const [searchQuery, setSearchQuery] = useState('');
    const [datePreset, setDatePreset] = useState('today');
    const [now] = useState(() => Date.now());
    const todayStr = useMemo(() => new Date(now).toISOString().split('T')[0], [now]);
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);

    const [expandedTables, setExpandedTables] = useState({});

    const handlePresetChange = (mode) => {
        setDatePreset(mode);
        const t = new Date().toISOString().split('T')[0];
        setEndDate(t);
        if (mode === 'today') setStartDate(t);
        else if (mode === 'week') setStartDate(new Date(now - 7 * 86400000).toISOString().split('T')[0]);
        else if (mode === 'month') setStartDate(new Date(now - 30 * 86400000).toISOString().split('T')[0]);
        else if (mode === 'all') setStartDate('2020-01-01');
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
            alert("Failed to export inventory.");
        }
    };

    const handleDownloadDetailedReport = async () => {
        try {
            const url = `${API_URL}/download-detailed-report?startDate=${startDate}&endDate=${endDate}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const urlObj = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlObj;
            a.download = `Detailed_Report_${startDate}_to_${endDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlObj);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Export Error:", err);
            alert("Failed to export detailed report.");
        }
    };

    const filteredSalesList = useMemo(() => {
        const weekMs = 7 * 86400000;
        const monthMs = 30 * 86400000;
        return (salesList || []).filter(order => {
            if (!order.createdAt) return false;
            const orderDateStr = order.createdAt.split('T')[0].split(' ')[0];
            const tsOrder = new Date(orderDateStr).getTime();
            const tsStart = new Date(startDate).getTime();
            const tsEnd = new Date(endDate).getTime();
            if (datePreset === 'all') return true;
            if (datePreset === 'today') return orderDateStr === endDate;
            if (datePreset === 'custom') return tsOrder >= tsStart && tsOrder <= tsEnd;
            if (datePreset === 'week') return tsOrder >= (now - weekMs);
            if (datePreset === 'month') return tsOrder >= (now - monthMs);
            return true;
        });
    }, [salesList, datePreset, startDate, endDate, now]);

    // --- Table & Section Analytics ---
    const getSection = (tid) => {
        const t = (tid || '').toUpperCase();
        if (t.includes('BOX') || t.startsWith('B')) return 'Boxes';
        if (t.includes('CH') || t.startsWith('C')) return 'Chowkie';
        if (t === 'TAKEAWAY') return 'Takeaway';
        return 'Main Dining';
    };

    const tablePerformance = useMemo(() => {
        const stats = {};
        filteredSalesList.forEach(order => {
            const tid = order.tableId || 'UNKNOWN';
            if (!stats[tid]) {
                stats[tid] = {
                    tableId: tid,
                    section: getSection(tid),
                    orders: 0,
                    revenue: 0,
                    sc: 0,
                    itemCounts: {},
                    lastOrder: null,
                    orderHistory: []
                };
            }
            stats[tid].orders += 1;
            stats[tid].revenue += (order.finalTotal || 0);
            stats[tid].sc += (order.serviceCharge || 0);
            stats[tid].orderHistory.push(order);
            
            if (Array.isArray(order.items)) {
                order.items.forEach(item => {
                    stats[tid].itemCounts[item.name] = (stats[tid].itemCounts[item.name] || 0) + item.qty;
                });
            }
        });

        return Object.values(stats).map(s => {
            const mostOrdered = Object.entries(s.itemCounts)
                .sort((a,b) => b[1] - a[1])[0];
            return {
                ...s,
                avgBill: s.orders > 0 ? s.revenue / s.orders : 0,
                mostOrderedItem: mostOrdered ? mostOrdered[0] : 'N/A'
            };
        }).sort((a,b) => b.revenue - a.revenue);
    }, [filteredSalesList]);

    const sectionPerformance = useMemo(() => {
        const sections = { 'Boxes': 0, 'Main Dining': 0, 'Chowkie': 0, 'Takeaway': 0 };
        tablePerformance.forEach(t => {
            if (sections[t.section] !== undefined) {
                sections[t.section] += t.revenue;
            }
        });
        return Object.entries(sections).map(([name, value]) => ({ name, value }));
    }, [tablePerformance]);

    const analyticsHeader = useMemo(() => {
        if (tablePerformance.length === 0) return null;
        const highestRev = [...tablePerformance].sort((a,b) => b.revenue - a.revenue)[0];
        const highestVol = [...tablePerformance].sort((a,b) => b.orders - a.orders)[0];
        const peakSection = [...sectionPerformance].sort((a,b) => b.value - a.value)[0];
        
        return { highestRev, highestVol, peakSection };
    }, [tablePerformance, sectionPerformance]);

    const handleUnlock = () => {
        const pin = window.prompt("ENTER SECURITY PIN TO ACCESS REPORTS:");
        if (pin === '1819219') {
            setIsReportsUnlocked(true);
        } else if (pin !== null) {
            alert("Invalid PIN.");
        }
    };

    const toggleTableExpand = (tid) => {
        setExpandedTables(prev => ({ ...prev, [tid]: !prev[tid] }));
    };

    // --- Existing Metrics ---
    const totalOrders = filteredSalesList.length;
    const totalRevenue = filteredSalesList.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const serviceChargeCollected = filteredSalesList.reduce((sum, o) => sum + (o.serviceCharge || 0), 0);
    const totalItems = itemAnalytics.reduce((sum, item) => sum + (item.quantitySold || 0), 0);
    const avgTicket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    const generatedChartData = useMemo(() => {
        const grouped = {};
        (filteredSalesList || []).forEach(o => {
            const d = o.createdAt.split('T')[0].split(' ')[0];
            if (!grouped[d]) grouped[d] = { date: d, revenue: 0, orders: 0 };
            grouped[d].revenue += parseFloat(o.finalTotal || 0);
            grouped[d].orders += 1;
        });
        return Object.values(grouped).sort((a,b) => a.date.localeCompare(b.date));
    }, [filteredSalesList]);

    const COLORS = ['#FFD700', '#10B981', '#3B82F6', '#F59E0B'];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans">
            {/* Top Navigation Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
                    { id: 'reports', label: 'Reports', icon: FileText },
                    { id: 'inventory', label: 'Inventory', icon: Package }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-8 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 font-bold uppercase tracking-widest text-[10px] border ${
                            activeTab === tab.id 
                            ? 'bg-accent text-black border-accent shadow-[0_10px_20px_rgba(255,215,0,0.2)]' 
                            : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filter Controls Bar (Visible on all tabs) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-wrap gap-8 items-center shadow-2xl">
                <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-accent/60" />
                    <span className="font-bold text-white/40 uppercase tracking-widest text-xs">Timeframe</span>
                </div>
                
                <div className="flex bg-black/20 border border-white/10 p-1 rounded-xl">
                    {['today', 'week', 'month', 'all', 'custom'].map(mode => (
                        <button 
                            key={mode} 
                            onClick={() => handlePresetChange(mode)}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${datePreset === mode ? 'bg-accent text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {datePreset === 'custom' && (
                    <div className="flex items-center gap-4 animate-in slide-in-from-left duration-300">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-2">From</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-accent/50 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-2">To</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-accent/50 transition-all"
                            />
                        </div>
                    </div>
                )}

                <div className="flex-1 flex justify-end gap-4">
                    <button 
                        onClick={() => window.print()}
                        className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs flex items-center gap-2 hover:bg-white/10 transition-all"
                    >
                        <Printer size={16} /> Z-Report
                    </button>
                    <button 
                        onClick={handleDownloadDetailedReport}
                        className="h-12 px-6 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-2 hover:bg-emerald-500/30 transition-all shadow-lg"
                    >
                        <Download size={16} /> Detailed Report XLS
                    </button>
                </div>
            </div>

            {/* DASHBOARD TAB CONTENT */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <MetricCard title="Orders" value={totalOrders.toString()} subvalue="Total Sessions" subIcon={<TrendingUp className="w-4 h-4 text-emerald-400" />} />
                        <MetricCard title="TOTAL REVENUE" currency="£" value={Number(totalRevenue).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} subvalue={`Ticket: £${Number(avgTicket).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subIcon={<TrendingUp className="w-4 h-4 text-accent" />} golden />
                        <MetricCard title="Service Fee" currency="£" value={Number(serviceChargeCollected).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} subvalue="Net S.C." subIcon={<FileText className="w-4 h-4 text-emerald-400" />} />
                        <MetricCard title="Items Sold" value={totalItems.toString()} subvalue="Total Unit Flow" subIcon={<Package className="w-4 h-4 text-accent" />} />
                    </div>

                    <div className="bg-[#111311] border border-white/5 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-nizam-gold/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h3 className="text-3xl font-serif text-white font-bold italic">Financial Index</h3>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Net Performance</p>
                            </div>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={generatedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff40', fontWeight: 'bold' }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#FFD700', fontWeight: 'bold' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0c0d0c', borderColor: '#ffffff10', borderRadius: '16px', color: '#fff' }} />
                                    <Bar yAxisId="left" dataKey="revenue" fill="#FFD70020" radius={[10, 10, 0, 0]} />
                                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={4} dot={{ r: 6, fill: '#0c0d0c', stroke: '#FFD700', strokeWidth: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            <div className="flex justify-between items-end mb-8">
                                <h3 className="text-3xl font-serif text-white font-bold tracking-tight">Recent Historical Context</h3>
                                <div className="relative w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                    <input type="text" placeholder="Search by ID or Table..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent transition-all" />
                                </div>
                            </div>
                            <div className="bg-[#111311] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                                <div className="grid grid-cols-5 text-xs font-bold uppercase tracking-widest text-white/20 border-b border-white/10 px-8 py-5 bg-white/5">
                                    <div>Order ID</div><div>Time</div><div>Table</div><div>Revenue</div><div className="text-right">Action</div>
                                </div>
                                <div className="flex flex-col max-h-[500px] overflow-y-auto divide-y divide-white/10">
                                    {filteredSalesList.filter(row => {
                                        const q = searchQuery.toLowerCase();
                                        return (row.id || '').toString().toLowerCase().includes(q) || (row.tableId || '').toString().toLowerCase().includes(q);
                                    }).map((row, idx) => (
                                        <div key={row.id || idx} className="grid grid-cols-5 px-8 py-6 hover:bg-white/5 transition-colors items-center">
                                            <div className="font-serif text-white font-bold text-lg">#{row.id.toString().slice(-4)}</div>
                                            <div className="text-xs font-bold text-white/40">{new Date(row.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                            <div className="text-white/60 font-bold text-xs uppercase">{row.tableId}</div>
                                            <div className="text-accent font-serif font-bold text-xl">£{Number(row.finalTotal).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            <div className="text-right flex items-center justify-end gap-3">
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 border border-emerald-400/20 px-3 py-1 rounded bg-emerald-400/10">SETTLED</span>
                                                <button onClick={() => {
                                                    const pwd = window.prompt("ENTER MASTER PASSWORD TO DELETE ORDER:");
                                                    if (pwd === '1819219') {
                                                        if (window.confirm("Are you sure?")) onDeleteOrder(row.id);
                                                    }
                                                }} className="p-2 hover:bg-red-500/20 rounded-lg text-white/20 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-serif text-white font-bold tracking-tight mb-8">Top Revenue Items</h3>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
                                {(itemAnalytics || []).slice(0, 6).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white/40 font-serif font-bold italic group-hover:text-accent transition-colors">{idx + 1}</div>
                                            <div>
                                                <h4 className="text-white font-serif font-bold text-lg italic">{item.itemName}</h4>
                                                <p className="text-[10px] uppercase font-bold text-white/20 mt-0.5">{item.quantitySold} SOLD</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-accent font-serif font-bold text-xl">£{Number(item.totalRevenue).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORTS TAB CONTENT (PIN PROTECTED) */}
            {activeTab === 'reports' && (
                <div className="animate-in slide-in-from-bottom duration-500">
                    {!isReportsUnlocked ? (
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center shadow-2xl min-h-[400px]">
                            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-8 border border-accent/20 glow-gold">
                                <Lock size={40} />
                            </div>
                            <h3 className="text-3xl font-serif text-white font-bold mb-4">Security Access Required</h3>
                            <p className="text-white/40 text-sm max-w-md mb-12">Detailed operational intelligence is restricted. Please enter your security PIN to view table-wise breakdowns and financial performance.</p>
                            <button 
                                onClick={handleUnlock}
                                className="px-12 py-5 bg-accent text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl hover:scale-105 transition-all"
                            >
                                Unlock Reports
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Performance Overview Analytics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-[#111311] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingUp size={48} className="text-accent" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Highest Revenue Table</p>
                                    <h4 className="text-3xl font-serif font-bold text-accent italic">{analyticsHeader?.highestRev?.tableId || 'N/A'}</h4>
                                    <p className="text-white/20 text-[10px] mt-4 font-bold uppercase">Contribution: £{analyticsHeader?.highestRev?.revenue.toFixed(2)}</p>
                                </div>
                                <div className="bg-[#111311] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Table size={48} className="text-emerald-400" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Highest Order Volume</p>
                                    <h4 className="text-3xl font-serif font-bold text-emerald-400 italic">{analyticsHeader?.highestVol?.tableId || 'N/A'}</h4>
                                    <p className="text-white/20 text-[10px] mt-4 font-bold uppercase">Sessions: {analyticsHeader?.highestVol?.orders}</p>
                                </div>
                                <div className="bg-[#111311] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <LayoutGrid size={48} className="text-blue-400" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Peak Performing Section</p>
                                    <h4 className="text-3xl font-serif font-bold text-blue-400 italic">{analyticsHeader?.peakSection?.name || 'N/A'}</h4>
                                    <p className="text-white/20 text-[10px] mt-4 font-bold uppercase">Share: £{analyticsHeader?.peakSection?.value.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Section Revenue Breakdown Chart */}
                            <div className="bg-[#111311] border border-white/5 rounded-[2.5rem] p-12 shadow-2xl flex flex-col md:flex-row items-center gap-12">
                                <div className="flex-1 w-full h-[300px]">
                                    <h3 className="text-2xl font-serif text-white font-bold mb-8 italic">Section Contribution</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={sectionPerformance}
                                                cx="50%" cy="50%"
                                                innerRadius={60} outerRadius={100}
                                                paddingAngle={5} dataKey="value"
                                            >
                                                {sectionPerformance.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#0c0d0c', border: 'none', borderRadius: '12px' }} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-6 w-full md:w-auto shrink-0">
                                    {sectionPerformance.map((s, idx) => (
                                        <div key={s.name} className="p-6 bg-white/5 border border-white/10 rounded-2xl min-w-[160px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{s.name}</span>
                                            </div>
                                            <p className="text-xl font-serif font-bold text-white italic">£{s.value.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Table Drill-Downs */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <h3 className="text-3xl font-serif text-white font-bold italic">Table Performance Drill-Down</h3>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Granular Operational Intelligence</p>
                                    </div>
                                    <button 
                                        onClick={handleDownloadDetailedReport}
                                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-bold flex items-center gap-2 hover:bg-white/10 transition-all"
                                    >
                                        <Download size={14} /> Export Table Breakdown
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {tablePerformance.map((table) => (
                                        <div key={table.tableId} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300">
                                            <div 
                                                onClick={() => toggleTableExpand(table.tableId)}
                                                className="p-6 flex flex-wrap items-center justify-between cursor-pointer hover:bg-white/5"
                                            >
                                                <div className="flex items-center gap-6 min-w-[200px]">
                                                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent border border-accent/20">
                                                        <Table size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-serif font-bold text-white italic">{table.tableId}</h4>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{table.section}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-12">
                                                    <div className="text-center">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Revenue</p>
                                                        <p className="text-lg font-serif font-bold text-accent italic">£{table.revenue.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-center hidden sm:block">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Orders</p>
                                                        <p className="text-lg font-serif font-bold text-white italic">{table.orders}</p>
                                                    </div>
                                                    <div className="text-center hidden md:block">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Avg Bill</p>
                                                        <p className="text-lg font-serif font-bold text-emerald-400 italic">£{table.avgBill.toFixed(2)}</p>
                                                    </div>
                                                    <div className="ml-4">
                                                        {expandedTables[table.tableId] ? <ChevronDown className="text-white/20" /> : <ChevronRight className="text-white/20" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedTables[table.tableId] && (
                                                <div className="px-6 pb-6 pt-2 border-t border-white/5 animate-in slide-in-from-top duration-300">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Service Charges</p>
                                                            <p className="text-xl font-serif font-bold text-accent">£{table.sc.toFixed(2)}</p>
                                                        </div>
                                                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Most Ordered</p>
                                                            <p className="text-sm font-bold text-white uppercase tracking-tight">{table.mostOrderedItem}</p>
                                                        </div>
                                                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Billing Count</p>
                                                            <p className="text-xl font-serif font-bold text-white">{table.orders}</p>
                                                        </div>
                                                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Utilization Insight</p>
                                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">High Flow Seating</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-8">
                                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 ml-2">Recent Session History</h5>
                                                        <div className="space-y-2">
                                                            {table.orderHistory.slice(-5).map(o => (
                                                                <div key={o.id} className="p-3 bg-white/5 rounded-xl flex justify-between items-center px-6">
                                                                    <div className="flex gap-4 items-center">
                                                                        <span className="text-xs font-bold text-white/40">#{o.id.toString().slice(-4)}</span>
                                                                        <span className="text-xs font-bold text-white/60">{new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                                    </div>
                                                                    <span className="font-serif font-bold text-accent italic">£{o.finalTotal.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* INVENTORY TAB CONTENT */}
            {activeTab === 'inventory' && (
                <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h3 className="text-3xl font-serif text-white font-bold italic">Stock Management</h3>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time Inventory Tracking</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleDownloadInventory} className="px-6 py-3 bg-accent text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-lg active:scale-95">
                                <Package size={14} /> Export Stock XLS
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#111311] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 border-b border-white/10 px-10 py-6 bg-white/5">
                            <div>Item Name</div>
                            <div>Category</div>
                            <div className="text-center">Current Stock</div>
                            <div className="text-center">Min Stock</div>
                            <div className="text-center">Unit</div>
                            <div className="text-right">Status</div>
                        </div>
                        <div className="flex flex-col divide-y divide-white/5 min-h-[400px]">
                            {loadingInventory ? (
                                <div className="flex-1 flex items-center justify-center text-white/20 font-black uppercase tracking-[0.3em] text-xs animate-pulse">
                                    Accessing Datasets...
                                </div>
                            ) : inventory.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-white/20 font-serif italic gap-4">
                                    <Info size={40} className="opacity-10" />
                                    <span>No inventory records found.</span>
                                </div>
                            ) : (
                                inventory.map((item) => (
                                    <div key={item.id} className="grid grid-cols-6 px-10 py-6 hover:bg-white/[0.02] transition-colors items-center">
                                        <div className="font-serif text-white font-bold text-lg italic">{item.name}</div>
                                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.category || 'GENERAL'}</div>
                                        <div className="text-center text-white font-bold">{item.stock}</div>
                                        <div className="text-center text-white/20 font-bold">{item.minStock || 10}</div>
                                        <div className="text-center text-white/40 text-[10px] font-black uppercase tracking-widest">{item.unit || 'PCS'}</div>
                                        <div className="text-right">
                                            {item.stock <= (item.minStock || 10) ? (
                                                <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg animate-pulse">LOW STOCK</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">IN STOCK</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* System Management Section */}
            <div className="pt-12 border-t border-white/10">
                <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                    <div className="max-w-xl text-center md:text-left">
                        <h3 className="text-3xl font-serif text-white font-bold italic mb-3">System Management</h3>
                        <p className="text-white/40 text-sm leading-relaxed">
                            Perform a complete factory reset to clear all active sessions, historical orders, sales analytics, and inventory data. <span className="text-red-400/60 font-bold uppercase tracking-tighter ml-1">Warning: This action is irreversible.</span>
                        </p>
                    </div>
                    <button 
                        onClick={async () => {
                            const pwd = window.prompt("ENTER MASTER PASSWORD FOR FACTORY RESET:");
                            if (pwd === '1819219') {
                                if (window.confirm("CRITICAL WARNING: Are you absolutely sure?")) {
                                    try {
                                        const res = await fetch(`${API_URL}/factory-reset`, { method: 'DELETE' });
                                        if ((await res.json()).success) window.location.reload();
                                    } catch (err) { alert("Reset failed: " + err.message); }
                                }
                            }
                        }}
                        className="px-10 py-5 rounded-2xl bg-red-500 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-all active:scale-95 flex items-center gap-3 shrink-0"
                    >
                        <TrendingUp className="rotate-180" size={16} /> Force Factory Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subvalue, subIcon, golden = false, currency }) {
    return (
        <div className={`p-8 rounded-3xl border relative overflow-hidden transition-all shadow-2xl group ${golden ? 'bg-secondary/40 border-accent/40 shadow-[0_15px_40px_rgba(255,215,0,0.1)]' : 'bg-white/5 border-white/10'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 group-hover:text-accent transition-colors glow-gold">{title}</p>
            <div className="flex items-baseline gap-2 mb-8">
                {currency && <span className={`text-xl font-serif font-bold ${golden ? 'text-accent/60' : 'text-white/20'}`}>{currency}</span>}
                <h3 className={`text-4xl font-serif font-bold italic ${golden ? 'text-accent glow-gold-lg' : 'text-white'}`}>{value}</h3>
            </div>
            <div className="flex items-center gap-2">
                {subIcon}
                <span className={`text-[10px] font-bold tracking-wider uppercase ${golden ? 'text-accent/40' : 'text-white/20'}`}>{subvalue}</span>
            </div>
        </div>
    );
}
