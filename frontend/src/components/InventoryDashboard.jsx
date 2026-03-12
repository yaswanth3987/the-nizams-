import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, PoundSterling, FileText, Printer, Calendar } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : '/api';

export default function InventoryDashboard() {
    const [analyticsDaily, setAnalyticsDaily] = useState(null);
    const [itemAnalytics, setItemAnalytics] = useState([]);
    const [salesList, setSalesList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch daily summary
            const dailyRes = await fetch(`${API_URL}/analytics/daily`);
            const dailyData = await dailyRes.json();
            
            // Fetch item analytics
            const itemsRes = await fetch(`${API_URL}/analytics/items`);
            const itemsData = await itemsRes.json();
            
            // Fetch sales list (completed and archived orders)
            // Using the existing orders endpoint with status query
            const salesRes = await fetch(`${API_URL}/orders?statuses=completed,billed,archived`);
            const salesData = await salesRes.json();

            setAnalyticsDaily(dailyData || { totalOrders: 0, grossRevenue: 0, netRevenue: 0, totalVat: 0 });
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

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading comprehensive analytics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* A. Daily Sales Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-primary text-emerald-700">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Orders</p>
                        <h3 className="text-2xl font-bold text-gray-900">{analyticsDaily.totalOrders || 0}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-primary text-emerald-700">
                        <PoundSterling size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900">£{(analyticsDaily.grossRevenue || 0).toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-primary text-emerald-700">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total VAT</p>
                        <h3 className="text-2xl font-bold text-gray-900">£{(analyticsDaily.totalVat || 0).toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-primary text-emerald-700">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Items Sold</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {itemAnalytics.reduce((sum, item) => sum + item.quantitySold, 0)}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* B. Sales List (Detailed Orders) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[400px]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-700"/> Detailed Sales Run
                        </h3>
                    </div>
                    <div className="flex-1 overflow-x-auto p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                                    <th className="pb-2 font-semibold font-mono">Order ID</th>
                                    <th className="pb-2 font-semibold">Table</th>
                                    <th className="pb-2 font-semibold w-1/3">Items</th>
                                    <th className="pb-2 font-semibold">Net</th>
                                    <th className="pb-2 font-semibold">VAT</th>
                                    <th className="pb-2 font-semibold">Total</th>
                                    <th className="pb-2 font-semibold text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {salesList.map(order => (
                                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 font-mono text-gray-600">#{order.id}</td>
                                        <td className="py-3 font-semibold text-gray-800">{order.tableId}</td>
                                        <td className="py-3 text-gray-600 text-xs">
                                            {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                        </td>
                                        <td className="py-3">£{order.net.toFixed(2)}</td>
                                        <td className="py-3 text-gray-500">£{order.vat.toFixed(2)}</td>
                                        <td className="py-3 font-bold text-emerald-700">£{order.total.toFixed(2)}</td>
                                        <td className="py-3 text-right text-gray-500 text-xs text-nowrap">
                                            {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                    </tr>
                                ))}
                                {salesList.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-6 text-gray-400">No completed sales recorded yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side Column */}
                <div className="space-y-6">
                    {/* C. End of Day Report Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                            <Calendar size={18} className="text-emerald-700"/> End of Day Actions
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Generates a full comprehensive summary of today's aggregate performance for external reporting or filing.
                        </p>
                        <button 
                            onClick={handlePrintEndOfDay}
                            className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-lg hover:bg-emerald-800 flex justify-center items-center gap-2 shadow-sm transition-colors"
                        >
                            <Printer size={18} /> Generate Z-Report (Print)
                        </button>
                    </div>

                    {/* D. Item-wise Sales Tracking */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
                         <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Package size={18} className="text-emerald-700"/> Item Performance
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                                        <th className="pb-2 font-semibold">Item Name</th>
                                        <th className="pb-2 font-semibold text-center">Qty</th>
                                        <th className="pb-2 font-semibold text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {itemAnalytics.map((item, idx) => (
                                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-2.5 text-gray-800 font-medium">
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
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-8 border-t border-b border-black py-4">
                    <div>
                        <p className="font-bold text-lg mb-2">Metrics Summary</p>
                        <p>Total Orders Closed: {analyticsDaily.totalOrders || 0}</p>
                        <p>Total Items Sold: {itemAnalytics.reduce((sum, item) => sum + item.quantitySold, 0)}</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg mb-2">Financials</p>
                        <p className="flex justify-between w-48"><span>Gross Revenue:</span> <span>£{(analyticsDaily.grossRevenue || 0).toFixed(2)}</span></p>
                        <p className="flex justify-between w-48 text-gray-600"><span>Net Sales:</span> <span>£{(analyticsDaily.netRevenue || 0).toFixed(2)}</span></p>
                        <p className="flex justify-between w-48 text-gray-600"><span>VAT Collected:</span> <span>£{(analyticsDaily.totalVat || 0).toFixed(2)}</span></p>
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
