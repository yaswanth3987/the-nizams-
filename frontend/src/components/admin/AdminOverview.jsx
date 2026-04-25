import React, { useState, useMemo } from 'react';
import { TrendingUp, Package, FileText, Filter, Printer } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function AdminOverview({ itemAnalytics = [], salesList = [] }) {
    // --- Date Filtering State ---
    const [datePreset, setDatePreset] = useState('today'); // 'today', 'week', 'month', 'custom', 'all'
    const [now] = useState(() => Date.now());
    const todayStr = useMemo(() => new Date(now).toISOString().split('T')[0], [now]);
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);

    const handlePresetChange = (mode) => {
        setDatePreset(mode);
        const t = new Date().toISOString().split('T')[0];
        setEndDate(t);
        if (mode === 'today') setStartDate(t);
        else if (mode === 'week') setStartDate(new Date(now - 7 * 86400000).toISOString().split('T')[0]);
        else if (mode === 'month') setStartDate(new Date(now - 30 * 86400000).toISOString().split('T')[0]);
        else if (mode === 'all') {
            setStartDate('2020-01-01');
        }
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

    // --- Filter Logic ---
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

    // --- Chart Data Generation ---
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

    // --- Dynamic Calculations (Filtered) ---
    const totalOrders = filteredSalesList.length;
    const totalRevenue = filteredSalesList.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const serviceChargeCollected = filteredSalesList.reduce((sum, o) => sum + (o.serviceCharge || 0), 0);
    const totalItems = itemAnalytics.reduce((sum, item) => sum + (item.quantitySold || 0), 0);
    const avgTicket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans">
            {/* Filter Controls Bar */}
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
                        onClick={handleDownloadInventory}
                        className="h-12 px-6 rounded-xl bg-accent text-black font-bold text-xs flex items-center gap-2 hover:bg-white shadow-xl transition-all"
                    >
                        <Package size={16} /> Export Inventory XLS
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <MetricCard 
                    title="Orders" 
                    value={totalOrders.toString()} 
                    subvalue="Total Sessions"
                    subIcon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                />
                <MetricCard 
                    title="TOTAL REVENUE" 
                    currency="£"
                    value={Number(totalRevenue).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    subvalue={`Ticket: £${Number(avgTicket).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subIcon={<TrendingUp className="w-4 h-4 text-accent" />}
                    golden
                />
                <MetricCard 
                    title="Service Fee" 
                    currency="£"
                    value={Number(serviceChargeCollected).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    subvalue="Net S.C."
                    subIcon={<FileText className="w-4 h-4 text-emerald-400" />}
                />
                <MetricCard 
                    title="Items Sold" 
                    value={totalItems.toString()}
                    subvalue="Total Unit Flow"
                    subIcon={<Package className="w-4 h-4 text-accent" />}
                />
            </div>

            {/* Graphical Analytics Component */}
            <div className="bg-[#111311] border border-white/5 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-nizam-gold/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h3 className="text-3xl font-serif text-white font-bold italic">Financial Index</h3>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Net Performance</p>
                    </div>
                </div>
                
                {generatedChartData.length === 0 ? (
                    <div className="h-80 flex flex-col items-center justify-center text-white/20 border border-white/10 rounded-3xl bg-white/5">
                        <TrendingUp size={32} className="mb-4 opacity-20" />
                        <span className="text-xs font-bold uppercase tracking-widest">No matching records</span>
                    </div>
                ) : (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={generatedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff40', fontWeight: 'bold' }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#FFD700', fontWeight: 'bold' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0c0d0c', borderColor: '#ffffff10', borderRadius: '16px', color: '#fff' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Bar yAxisId="left" dataKey="revenue" fill="#FFD70020" radius={[10, 10, 0, 0]} />
                                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={4} dot={{ r: 6, fill: '#0c0d0c', stroke: '#FFD700', strokeWidth: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <h3 className="text-3xl font-serif text-white font-bold tracking-tight mb-8">Recent Historical Context</h3>
                    <div className="bg-[#111311] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-5 text-xs font-bold uppercase tracking-widest text-white/20 border-b border-white/10 px-8 py-5 bg-white/5">
                            <div>Order ID</div>
                            <div>Time</div>
                            <div>Table</div>
                            <div>Revenue</div>
                            <div className="text-right">Action</div>
                        </div>
                        <div className="flex flex-col max-h-[500px] overflow-y-auto divide-y divide-white/10">
                            {filteredSalesList.map((row, idx) => (
                                <div key={row.id || idx} className="grid grid-cols-5 px-8 py-6 hover:bg-white/5 transition-colors items-center">
                                    <div className="font-serif text-white font-bold text-lg">#{row.id.toString().slice(-4)}</div>
                                    <div className="text-xs font-bold text-white/40">
                                        {new Date(row.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="text-white/60 font-bold text-xs uppercase">{row.tableId}</div>
                                    <div className="text-accent font-serif font-bold text-xl">£{Number(row.finalTotal).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 border border-emerald-400/20 px-3 py-1 rounded bg-emerald-400/10">
                                            SETTLED
                                        </span>
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
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white/40 font-serif font-bold italic group-hover:text-accent transition-colors">
                                        {idx + 1}
                                    </div>
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
    );
}

function MetricCard({ title, value, subvalue, subIcon, golden = false, currency }) {
    return (
        <div 
            className={`p-8 rounded-3xl border relative overflow-hidden transition-all shadow-2xl group ${
                golden ? 'bg-secondary/40 border-accent/40 shadow-[0_15px_40px_rgba(255,215,0,0.1)]' : 'bg-white/5 border-white/10'
            }`}
        >
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
