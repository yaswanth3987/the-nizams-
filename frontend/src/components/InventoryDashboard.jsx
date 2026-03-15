import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Package, PoundSterling, FileText, Printer, Calendar as CalendarIcon, Filter, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const API_URL = import.meta.env.DEV 
    ? `http://${window.location.hostname}:3001/api` 
    : '/api';

export default function InventoryDashboard() {
    const [analyticsDaily, setAnalyticsDaily] = useState(null);
    const [itemAnalytics, setItemAnalytics] = useState([]);
    const [salesList, setSalesList] = useState([]);
    const [loading, setLoading] = useState(true);

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
            const dailyRes = await fetch(`${API_URL}/analytics/daily`);
            const dailyData = await dailyRes.json();
            
            const itemsRes = await fetch(`${API_URL}/analytics/items`);
            const itemsData = await itemsRes.json();
            
            // Getting all historical sales to construct charts and reports locally
            const salesRes = await fetch(`${API_URL}/orders?statuses=completed,billed,archived`);
            const salesData = await salesRes.json();

            setAnalyticsDaily(dailyData || { totalOrders: 0, grossRevenue: 0, subtotal: 0, serviceCharge: 0 });
            setItemAnalytics(itemsData || []);
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
            if (datePreset === 'week') return tsOrder >= new Date(Date.now() - 7 * 86400000).getTime();
            if (datePreset === 'month') return tsOrder >= new Date(Date.now() - 30 * 86400000).getTime();
            return true;
        });
    }, [salesList, datePreset, startDate, endDate]);

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

    // Derived Statistics from Filtered Data
    const displayTotalOrders = filteredSalesList.length;
    const displayRevenue = filteredSalesList.reduce((sum, o) => sum + parseFloat(o.finalTotal || 0), 0);
    const displayServiceCharge = filteredSalesList.reduce((sum, o) => sum + parseFloat(o.serviceCharge || 0), 0);
    const displaySubtotal = filteredSalesList.reduce((sum, o) => sum + parseFloat(o.subtotal || 0), 0);

    const handlePresetChange = (mode) => {
        setDatePreset(mode);
        const today = new Date().toISOString().split('T')[0];
        setEndDate(today);
        if (mode === 'today') setStartDate(today);
        else if (mode === 'week') setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
        else if (mode === 'month') setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading comprehensive analytics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Calendar / Filter Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-emerald-700" />
                    <span className="font-bold text-gray-700 uppercase tracking-widest text-xs">Report Filters</span>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['today', 'week', 'month', 'custom', 'all'].map(mode => (
                        <button 
                            key={mode} 
                            onClick={() => handlePresetChange(mode)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors ${datePreset === mode ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
                
                {datePreset === 'custom' && (
                    <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs" />
                        <span className="text-gray-400">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs" />
                    </div>
                )}
            </div>

            {/* A. Daily/Filtered Sales Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-primary text-emerald-700">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Filtered Orders</p>
                        <h3 className="text-2xl font-bold text-gray-900">{displayTotalOrders}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-primary text-emerald-700">
                        <PoundSterling size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Filtered Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900">£{displayRevenue.toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-primary text-emerald-700">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Service Charge</p>
                        <h3 className="text-2xl font-bold text-gray-900">£{displayServiceCharge.toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-primary text-emerald-700">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">All-time Items</p>
                        <h3 className="text-xl font-bold text-gray-900">
                            {itemAnalytics.reduce((sum, item) => sum + item.quantitySold, 0)} Sold
                        </h3>
                    </div>
                </div>
            </div>

            {/* B. Graphical Analytics (Recharts) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-700"/> Revenue & Order Analytics Graph ({datePreset.toUpperCase()})
                </h3>
                {generatedChartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">No data available for this range.</div>
                ) : (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={generatedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={v => `£${v}`} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip 
                                    cursor={{fill: '#F3F4F6'}} 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar yAxisId="left" dataKey="revenue" name="Revenue (£)" fill="#047857" radius={[4, 4, 0, 0]} barSize={40} />
                                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders Count" stroke="#D97706" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* C. Sales List (Detailed Orders Filtered) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Layers size={18} className="text-emerald-700"/> Filtered Sales List
                        </h3>
                    </div>
                    <div className="flex-1 overflow-x-auto p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                                    <th className="pb-2 font-semibold font-mono">Order ID</th>
                                    <th className="pb-2 font-semibold">Table</th>
                                    <th className="pb-2 font-semibold w-1/3">Items</th>
                                    <th className="pb-2 font-semibold">Subtotal</th>
                                    <th className="pb-2 font-semibold">Srv. Chg</th>
                                    <th className="pb-2 font-semibold">Total</th>
                                    <th className="pb-2 font-semibold text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredSalesList.map(order => (
                                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 font-mono text-gray-600">#{order.id}</td>
                                        <td className="py-3 font-semibold text-gray-800">{order.tableId}</td>
                                        <td className="py-3 text-gray-600 text-xs">
                                            {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                        </td>
                                        <td className="py-3">£{order.subtotal.toFixed(2)}</td>
                                        <td className="py-3 text-gray-500">£{order.serviceCharge.toFixed(2)}</td>
                                        <td className="py-3 font-bold text-emerald-700">£{order.finalTotal.toFixed(2)}</td>
                                        <td className="py-3 text-right text-gray-500 text-xs text-nowrap">
                                            {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                    </tr>
                                ))}
                                {filteredSalesList.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-6 text-gray-400">No sales recorded in this timeframe.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side Column */}
                <div className="space-y-6">
                    {/* D. End of Day Report Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                            <Printer size={18} className="text-emerald-700"/> Print Actions
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Generates a full comprehensive summary of the filtered performance for external reporting or filing.
                        </p>
                        <button 
                            onClick={handlePrintEndOfDay}
                            className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-lg hover:bg-emerald-800 flex justify-center items-center gap-2 shadow-sm transition-colors"
                        >
                            <Printer size={18} /> Generate Z-Report
                        </button>
                    </div>

                    {/* E. Item-wise Sales Tracking (All-time or today based on itemAnalytics) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[230px]">
                         <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Package size={18} className="text-emerald-700"/> Top Performers
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                                        <th className="pb-2 font-semibold">Item Name</th>
                                        <th className="pb-2 font-semibold text-center">Qty</th>
                                        <th className="pb-2 font-semibold text-right">Rev</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {itemAnalytics.map((item, idx) => (
                                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-2.5 text-gray-800 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={item.itemName}>
                                                {idx < 3 && <span className="text-amber-500 mr-1 text-xs">★</span>}
                                                {item.itemName}
                                            </td>
                                            <td className="py-2.5 text-center font-bold text-gray-600">{item.quantitySold}</td>
                                            <td className="py-2.5 text-right font-bold text-emerald-700">£{item.totalRevenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {itemAnalytics.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center py-6 text-gray-400">No items sold yet.</td>
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
                            {itemAnalytics.slice(0, 15).map(item => (
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
