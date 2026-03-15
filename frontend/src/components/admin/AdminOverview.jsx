import React, { useState, useMemo } from 'react';
import { TrendingUp, Package, PoundSterling, FileText, Utensils, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminOverview({ analyticsDaily, itemAnalytics = [], salesList = [] }) {
    // --- Date Filtering State ---
    const [datePreset, setDatePreset] = useState('today'); // 'today', 'week', 'month', 'custom', 'all'
    const todayStr = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);

    const handlePresetChange = (mode) => {
        setDatePreset(mode);
        const t = new Date().toISOString().split('T')[0];
        setEndDate(t);
        if (mode === 'today') setStartDate(t);
        else if (mode === 'week') setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
        else if (mode === 'month') setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
        else if (mode === 'all') {
            setStartDate('2020-01-01'); // Arbitrary far past
        }
    };

    // --- Filter Logic ---
    const filteredSalesList = useMemo(() => {
        return salesList.filter(order => {
            if (!order.createdAt) return false;
            const orderDateStr = order.createdAt.split('T')[0].split(' ')[0];
            const tsOrder = new Date(orderDateStr).getTime();
            const tsStart = new Date(startDate).getTime();
            const tsEnd = new Date(endDate).getTime();
            
            if (datePreset === 'all') return true;
            if (datePreset === 'today') return orderDateStr === endDate;
            if (datePreset === 'custom') return tsOrder >= tsStart && tsOrder <= tsEnd;
            if (datePreset === 'week') return tsOrder >= new Date(Date.now() - 7 * 86400000).getTime();
            if (datePreset === 'month') return tsOrder >= new Date(Date.now() - 30 * 86400000).getTime();
            return true;
        });
    }, [salesList, datePreset, startDate, endDate]);

    // --- Chart Data Generation ---
    const generatedChartData = useMemo(() => {
        const grouped = {};
        filteredSalesList.forEach(o => {
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
    const subtotalCollected = filteredSalesList.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalItems = itemAnalytics.reduce((sum, item) => sum + (item.quantitySold || 0), 0);
    const avgTicket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            
            {/* Filter Controls Bar */}
            <div className="bg-nizam-card border border-nizam-border rounded-xl p-4 flex flex-wrap gap-6 items-center shadow-xl shadow-black/20">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-nizam-gold" />
                    <span className="font-bold text-[#a8b8b2] uppercase tracking-widest text-[10px]">Timeframe</span>
                </div>
                
                <div className="flex bg-[#111312] border border-nizam-border/50 p-1 rounded-lg">
                    {['today', 'week', 'month', 'all', 'custom'].map(mode => (
                        <button 
                            key={mode} 
                            onClick={() => handlePresetChange(mode)}
                            className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${datePreset === mode ? 'bg-[#181a17] text-nizam-gold border border-nizam-gold/30 shadow-sm' : 'text-[#a8b8b2] hover:text-white border border-transparent'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
                
                {datePreset === 'custom' && (
                    <div className="flex items-center gap-2 text-sm bg-[#111312] p-1.5 px-3 rounded-lg border border-nizam-border/50">
                        <CalendarIcon className="w-4 h-4 text-nizam-gold" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-white text-xs border-none focus:outline-none" />
                        <span className="text-[#a8b8b2] text-[10px] uppercase font-bold">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-white text-xs border-none focus:outline-none" />
                    </div>
                )}
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                <MetricCard 
                    title={`ORDERS (${datePreset})`} 
                    value={totalOrders.toString()} 
                    subvalue={totalOrders > 0 ? "Tracking live..." : "No orders yet"}
                    subIcon={<TrendingUp className="w-3 h-3" />}
                    delay={100}
                    accentClass="bg-blue-500/30"
                />
                <MetricCard 
                    title={`REVENUE (${datePreset})`} 
                    value={`£${totalRevenue.toFixed(2)}`}
                    subvalue={`Average ticket: £${avgTicket.toFixed(2)}`}
                    subIcon={<PoundSterling className="w-3 h-3 text-nizam-gold" />}
                    golden
                    delay={200}
                />
                <MetricCard 
                    title="SERVICE CHARGE" 
                    value={`£${serviceChargeCollected.toFixed(2)}`}
                    subvalue="Service charge total"
                    subIcon={<FileText className="w-3 h-3" />}
                    delay={300}
                    accentClass="bg-emerald-500/30"
                />
                <MetricCard 
                    title="TOTAL ITEMS SOLD" 
                    value={totalItems.toString()}
                    subvalue={`${itemAnalytics.length} unique SKUs moving`}
                    subIcon={<Package className="w-3 h-3" />}
                    delay={400}
                    accentClass="bg-purple-500/30"
                />
            </div>

            {/* Graphical Analytics Component */}
            <div className="bg-nizam-card border border-nizam-border rounded-xl p-6 shadow-xl shadow-black/20">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif text-white tracking-wide flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-nizam-gold" /> 
                        Sales & Order Analytics
                    </h3>
                    <span className="text-[10px] font-bold text-[#a8b8b2] uppercase tracking-widest border border-nizam-border/50 px-3 py-1 bg-[#111312] rounded">
                        {datePreset === 'all' ? 'LIFETIME OVERVIEW' : `FILTERED: ${datePreset.toUpperCase()}`}
                    </span>
                </div>
                
                {generatedChartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-[#a8b8b2] text-sm">No analytics data available for this range.</div>
                ) : (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={generatedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => `£${v}`} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                                    contentStyle={{ backgroundColor: '#111312', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                    itemStyle={{ color: '#d4af37' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', color: '#a8b8b2' }} />
                                <Bar yAxisId="left" dataKey="revenue" name="Total Revenue (£)" fill="#d4af37" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Line yAxisId="right" type="monotone" dataKey="orders" name="Order Volumes" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Completed Orders (Filtered) */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-xl font-serif text-white tracking-wide">Filtered Orders Data</h3>
                        <button onClick={() => window.print()} className="text-[10px] font-bold tracking-widest text-nizam-gold border border-nizam-gold/30 px-3 py-1.5 rounded hover:bg-nizam-gold/10 transition-colors uppercase">
                            PRINT Z-REPORT
                        </button>
                    </div>
                    
                    <div className="bg-nizam-card border border-nizam-border rounded-xl flex flex-col overflow-hidden shadow-xl shadow-black/20 max-h-[400px]">
                        <div className="grid grid-cols-5 text-[10px] font-bold uppercase tracking-widest text-[#a8b8b2] border-b border-nizam-border/50 px-6 py-4 bg-black/20 sticky top-0">
                            <div>ORDER ID</div>
                            <div>DATE & TIME</div>
                            <div>TABLE</div>
                            <div>AMOUNT</div>
                            <div className="text-right">STATUS</div>
                        </div>
                        <div className="flex flex-col overflow-y-auto">
                            {filteredSalesList.length === 0 && (
                                <div className="p-8 text-center text-[#a8b8b2] text-sm">No orders found for this timeframe.</div>
                            )}
                            {filteredSalesList.map((row, idx) => (
                                <div key={row.id || idx} className="grid grid-cols-5 px-6 py-5 border-b border-nizam-border/30 hover:bg-nizam-border/10 transition-colors items-center">
                                    <div className="font-bold text-nizam-gold text-sm">#NZ-{row.id.toString().padStart(4, '0')}</div>
                                    <div className="text-[#a8b8b2] text-[11px] font-mono">
                                        {new Date(row.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} <br/>
                                        <span className="text-white/50">{new Date(row.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div className="text-white text-sm font-medium">{row.tableId}</div>
                                    <div className="text-emerald-400 font-bold text-sm tracking-wide">£{(row.finalTotal || 0).toFixed(2)}</div>
                                    <div className="text-right">
                                        <span className="inline-block bg-[#112a20] border border-[#1f4a38] text-[#4ade80] text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                                            {row.status === 'completed' ? 'SETTLED' : row.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Top Performing Items */}
                    <div className="bg-nizam-card border border-nizam-border rounded-xl p-6 shadow-xl shadow-black/20">
                        <h3 className="text-[10px] font-bold tracking-widest text-[#a8b8b2] uppercase mb-6 flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-nizam-gold" /> TOP PERFORMING ITEMS
                        </h3>
                        <div className="space-y-4">
                            {itemAnalytics.length === 0 && (
                                <div className="p-4 text-center text-[#a8b8b2] text-sm border border-nizam-border/50 rounded border-dashed">No item data yet.</div>
                            )}
                            {itemAnalytics.slice(0, 5).map((item, idx) => (
                                <TopItem 
                                    key={idx}
                                    icon={<UTENSIL_ICON idx={idx} />}
                                    name={item.itemName}
                                    stats={`${item.quantitySold} units sold`}
                                    revenue={`£${item.totalRevenue.toFixed(2)}`}
                                    badge={idx === 0 ? "BEST SELLER" : idx === 1 ? "POPULAR" : "STEADY"}
                                    rank={idx + 1}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Hidden Print Container for Z-Report */}
            <div className="hidden print:block absolute top-0 left-0 w-full bg-white text-black z-[9999] p-8 font-sans">
                <div className="text-center mb-6 border-b-2 border-dashed border-gray-400 pb-4">
                    <h1 className="text-3xl font-bold uppercase tracking-widest mb-1">THE GREAT NIZAM - ADMIN REPORT</h1>
                    <p className="text-gray-600 font-mono text-sm">Generated: {new Date().toLocaleString()}</p>
                    <p className="text-gray-800 font-bold mt-2">Timeframe: {datePreset.toUpperCase()} ({startDate} to {endDate})</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-8 border-b-2 border-black pb-6">
                    <div>
                        <p className="font-bold text-xl uppercase mb-4 underline">Financials</p>
                        <p className="flex justify-between text-lg mb-1"><span>Gross Revenue:</span> <span>£{totalRevenue.toFixed(2)}</span></p>
                        <p className="flex justify-between text-lg mb-1 text-gray-600"><span>Subtotal:</span> <span>£{subtotalCollected.toFixed(2)}</span></p>
                        <p className="flex justify-between text-lg mb-1 font-bold"><span>Service Charge:</span> <span>£{serviceChargeCollected.toFixed(2)}</span></p>
                    </div>
                    <div>
                        <p className="font-bold text-xl uppercase mb-4 underline">Metrics Summary</p>
                        <p className="flex justify-between text-lg mb-1"><span>Orders Settled:</span> <span>{totalOrders}</span></p>
                        <p className="flex justify-between text-lg mb-1"><span>Average Ticket:</span> <span>£{avgTicket.toFixed(2)}</span></p>
                        <p className="flex justify-between text-lg mb-1 text-gray-600"><span>Total SKUs Moved:</span> <span>{totalItems}</span></p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-xl uppercase mb-4 underline">Top Selling Inventory</h3>
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="py-2">Rank</th>
                                <th className="py-2">Item Name</th>
                                <th className="py-2 text-center">Qty Sold</th>
                                <th className="py-2 text-right">Revenue Generation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemAnalytics.map((item, idx) => (
                                <tr key={item.id} className="border-b border-gray-300">
                                    <td className="py-2 font-bold">{idx + 1}</td>
                                    <td className="py-2 font-medium">{item.itemName}</td>
                                    <td className="py-2 text-center">{item.quantitySold}</td>
                                    <td className="py-2 text-right">£{item.totalRevenue.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
        </div>
    );
}

function MetricCard({ title, value, subvalue, subIcon, delay = 0, golden = false, accentClass }) {
    return (
        <div 
            className={`p-6 rounded-xl border relative overflow-hidden transition-all duration-300 shadow-lg ${
                golden 
                    ? 'bg-[#181a17] border-nizam-gold/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                    : 'bg-[#141614] border-nizam-border shadow-black/20'
            }`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8b8b2] mb-3 relative z-10">{title}</p>
            <h3 className={`text-3xl font-serif tracking-wide mb-6 relative z-10 ${golden ? 'text-nizam-gold' : 'text-white'}`}>{value}</h3>
            
            <div className={`flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase relative z-10 ${golden ? 'text-nizam-gold' : 'text-[#a8b8b2]'}`}>
                {subIcon}
                <span>{subvalue}</span>
            </div>
            
            {golden && <div className="absolute top-0 left-0 w-1 h-full bg-nizam-gold"></div>}
            {!golden && <div className={`absolute top-0 left-0 w-1 h-full ${accentClass}`}></div>}
        </div>
    );
}

function UTENSIL_ICON({ idx }) {
    if (idx === 0) return <TrendingUp size={16} className="text-amber-500" />;
    if (idx === 1) return <Package size={16} className="text-blue-400" />;
    return <FileText size={16} className="text-emerald-500" />;
}

function TopItem({ icon, name, stats, revenue, badge, rank }) {
    return (
        <div className="bg-[#111312] border border-nizam-border/50 p-3 rounded-lg flex items-center justify-between hover:border-nizam-gold/30 transition-colors relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-nizam-border group-hover:bg-nizam-gold/50 transition-colors"></div>
            <div className="flex items-center gap-4 pl-3">
                <div className="w-8 h-8 rounded bg-[#1c1e1c] border border-white/5 flex justify-center items-center shadow-inner">
                    <span className="text-[10px] font-bold text-white/50">{rank}</span>
                </div>
                <div>
                    <h4 className="text-[13px] font-bold text-white whitespace-nowrap overflow-hidden max-w-[140px] text-ellipsis" title={name}>{name}</h4>
                    <p className="text-[10px] text-[#a8b8b2] mt-0.5">{stats}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-emerald-400 tracking-wide">{revenue}</p>
                <p className={`text-[8px] uppercase font-bold tracking-widest mt-1 ${rank === 1 ? 'text-nizam-gold' : 'text-[#a8b8b2]'}`}>
                    {badge}
                </p>
            </div>
        </div>
    );
}
