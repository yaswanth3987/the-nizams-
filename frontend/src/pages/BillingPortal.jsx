import React, { useState, useEffect, useCallback } from 'react';
import { socket } from '../utils/socket';
import { PoundSterling, CheckCircle, Search, User, FileText, Printer, CreditCard, ArrowLeft, X, Wallet, Calculator, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

function PaymentModal({ session, onClose, onComplete }) {
    const [cash, setCash] = useState('');
    const [card, setCard] = useState('');
    const [custom, setCustom] = useState('');
    const [error, setError] = useState('');
    
    const total = Number(session.finalTotal);
    const paidTotal = Number(cash || 0) + Number(card || 0) + Number(custom || 0);
    const remaining = Math.max(0, total - paidTotal);
    const change = Math.max(0, paidTotal - total);

    const handleQuickPay = (method) => {
        const currentPaid = Number(cash || 0) + Number(custom || 0);
        if (method === 'exact') {
            setCash((total - currentPaid).toFixed(2));
        } else if (method === 'card') {
            setCard((total - currentPaid).toFixed(2));
        }
    };

    const handleSettle = () => {
        if (remaining > 0) {
            setError(`Insufficient amount. Still need £${(remaining || 0).toFixed(2)}`);
            return;
        }
        onComplete(session.id, {
            cash: Number(cash || 0),
            card: Number(card || 0),
            custom: Number(custom || 0),
            total: total,
            status: 'completed'
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B3A2E]/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="bg-[#0B3A2E] p-8 text-white flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-[#C29958] text-[#0B3A2E] px-4 py-1.5 rounded-xl text-lg font-black uppercase tracking-tighter shadow-lg">
                                {session.tableId === 'TAKEAWAY' ? `ID #${session.id}` : `TABLE ${session.tableId}`}
                            </span>
                            {session.phone && (
                                <span className="text-white/60 text-xs font-bold tracking-widest bg-white/10 px-3 py-1.5 rounded-xl">
                                    {session.phone}
                                </span>
                            )}
                        </div>
                        <h2 className="text-4xl font-serif font-black italic">{session.customerName || (session.tableId === 'TAKEAWAY' ? 'Takeaway Guest' : 'Dine-in Guest')}</h2>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-10 space-y-10">
                    <div className="flex items-center justify-between bg-[#F6EFE6] p-8 rounded-3xl border border-[#0B3A2E]/5">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-[#86a69d] uppercase tracking-widest mb-1">Grand Total Due</p>
                            <p className="text-5xl font-serif font-black text-[#0B3A2E]">£{(total || 0).toFixed(2)}</p>
                        </div>
                        <Wallet className="w-12 h-12 text-[#C29958]" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#6D5D4B]/60 uppercase tracking-widest ml-2">Cash Received (£)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={cash}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val >= 0 || val === '') setCash(val);
                                        setError('');
                                    }}
                                    className="w-full bg-[#F6EFE6] border-2 border-transparent focus:border-[#C29958] rounded-2xl py-4 pl-6 pr-4 font-black text-xl outline-none transition-all"
                                />
                                <PoundSterling className="absolute right-6 top-1/2 -translate-y-1/2 text-[#0B3A2E]/20" size={20} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center ml-2">
                                <label className="text-[10px] font-black text-[#6D5D4B]/60 uppercase tracking-widest">Card (£)</label>
                                <button 
                                    onClick={() => handleQuickPay('card')}
                                    className="text-[9px] font-black text-[#C29958] uppercase tracking-widest hover:underline"
                                >
                                    Auto
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={card}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val >= 0 || val === '') setCard(val);
                                        setError('');
                                    }}
                                    className="w-full bg-[#F6EFE6] border-2 border-transparent focus:border-[#C29958] rounded-2xl py-4 pl-6 pr-4 font-black text-xl outline-none transition-all"
                                />
                                <CreditCard className="absolute right-6 top-1/2 -translate-y-1/2 text-[#0B3A2E]/20" size={20} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#6D5D4B]/60 uppercase tracking-widest ml-2">Other/Custom (£)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={custom}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val >= 0 || val === '') setCustom(val);
                                        setError('');
                                    }}
                                    className="w-full bg-[#F6EFE6] border-2 border-transparent focus:border-[#C29958] rounded-2xl py-4 pl-6 pr-4 font-black text-xl outline-none transition-all"
                                />
                                <Calculator className="absolute right-6 top-1/2 -translate-y-1/2 text-[#0B3A2E]/20" size={20} />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100 animate-shake">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#0B3A2E]/5 pt-8">
                        <div>
                            <p className="text-[10px] font-black text-[#6D5D4B]/40 uppercase tracking-widest mb-1">Change Due</p>
                            <p className={`text-3xl font-serif font-black ${change > 0 ? 'text-emerald-600' : 'text-[#0B3A2E]/20'}`}>
                                £{change.toFixed(2)}
                            </p>
                        </div>
                        <button 
                            onClick={handleSettle}
                            className="bg-[#0B3A2E] text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#0B3A2E]/20 hover:bg-[#C29958] transition-all flex items-center gap-3 active:scale-95"
                        >
                            <CheckCircle size={20} /> Confirm Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BillingPortal() {
    const [sessions, setSessions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        document.title = "Billing - The Great Nizam";
    }, []);

    const fetchBillingSessions = useCallback(() => {
        Promise.all([
            fetch(`${API_URL}/orders?statuses=confirmed,active,ready,served,billed,billing_pending,accepted`).then(res => res.json()),
            fetch(`${API_URL}/new-orders?statuses=new,pending,ready,billing_pending,accepted`).then(res => res.json())
        ])
            .then(([sessionsData, newOrdersData]) => {
                const combined = [
                    ...(Array.isArray(sessionsData) ? sessionsData : []),
                    ...(Array.isArray(newOrdersData) ? newOrdersData : [])
                ];
                const activeOnes = combined.filter(s => s.status !== 'completed' && s.status !== 'cancelled');
                
                const uniqueMap = new Map();
                activeOnes.forEach(item => uniqueMap.set(item.id + '-' + (item.orderType || 'session'), item));
                
                setSessions(Array.from(uniqueMap.values()));
            })
            .catch(err => console.error("Error fetching billing orders:", err));
    }, []);

    useEffect(() => {
        fetchBillingSessions();
        
        const handleSessionUpdate = () => fetchBillingSessions();
        const handleNewBilling = (order) => {
            fetchBillingSessions();
            setNotifications(prev => [...prev, { id: Date.now(), message: `New Billing Request: ${order.tableId === 'TAKEAWAY' ? 'Takeaway' : 'Table ' + order.tableId}` }]);
            setTimeout(() => {
                setNotifications(prev => prev.slice(1));
            }, 5000);
        };

        socket.on('sessionUpdated', handleSessionUpdate);
        socket.on('tableReset', handleSessionUpdate);
        socket.on('orderUpdated', handleSessionUpdate);
        socket.on('NEW_BILLING_ORDER', handleNewBilling);
        
        return () => {
            socket.off('sessionUpdated', handleSessionUpdate);
            socket.off('tableReset', handleSessionUpdate);
            socket.off('orderUpdated', handleSessionUpdate);
            socket.off('NEW_BILLING_ORDER', handleNewBilling);
        };
    }, [fetchBillingSessions]);

    const finalizeOrder = async (id, paymentData) => {
        try {
            await fetch(`${API_URL}/orders/${id}/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            setSelectedSession(null);
            fetchBillingSessions();
        } catch (err) {
            console.error('Failed to finalize payment', err);
        }
    };

    const handlePrint = (session) => {
        const printWindow = window.open('', '_blank', 'width=450,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Bill #${session.id}</title>
                    <style>
                        body { font-family: monospace; padding: 20px; color: black; max-width: 300px; margin: auto; text-transform: uppercase; }
                        .header { text-align: center; margin-bottom: 15px; }
                        .dashed { border-top: 1.5px dashed black; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="/logo-with-name.png" style="width: 120px; filter: grayscale(1); margin-bottom: 5px;" />
                        <div style="font-size: 11px; margin-bottom: 5px;">41-43 HIGH ST, HOUNSLOW TW3 1RH</div>
                        <div class="dashed"></div>
                        <p style="font-weight: bold; margin: 5px 0;">Order ID: ${session.id}</p>
                        <p style="font-weight: bold; margin: 5px 0;">Table: ${session.tableId === 'TAKEAWAY' ? 'TAKEAWAY' : session.tableId}</p>
                        <p style="font-size: 10px; margin: 5px 0;">Date: ${new Date().toLocaleString('en-GB')}</p>
                        <div class="dashed"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(12, 1fr); font-weight: bold; font-size: 13px; margin-bottom: 12px; border-bottom: 2px solid black; padding-bottom: 8px;">
                        <span style="grid-column: span 5;">ITEM</span>
                        <span style="grid-column: span 2; text-align: center;">QTY</span>
                        <span style="grid-column: span 2; text-align: center;">PRICE</span>
                        <span style="grid-column: span 3; text-align: right;">AMOUNT</span>
                    </div>
                    <div class="items">
                        ${(session.items || []).map(item => `
                            <div style="display: grid; grid-template-columns: repeat(12, 1fr); font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                                <span style="grid-column: span 5; font-weight: 500;">${item.name.toUpperCase()}</span>
                                <span style="grid-column: span 2; text-align: center; font-weight: bold;">${item.qty}</span>
                                <span style="grid-column: span 2; text-align: center;">${Number(item.price || 0).toFixed(2)}</span>
                                <span style="grid-column: span 3; text-align: right; font-weight: bold;">${((item.price || 0) * (item.qty || 0)).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem; border-top: 2px solid #000; padding-top: 10px;">
                        <span>TOTAL</span>
                        <span>£ ${Number(session.finalTotal || 0).toFixed(2)}</span>
                    </div>
                    <div class="dashed"></div>
                    <div style="text-align: center; margin-top: 20px; font-size: 11px;">
                        *** Thank You ***<br/>Please visit us again
                    </div>
                    <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filtered = sessions.filter(s => 
        s.tableId?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isPending = (s) => 
        s.status === 'billed' || 
        s.status === 'billing_pending' || 
        s.status === 'ready' || 
        s.status === 'served';

    return (
        <div className="min-h-screen bg-[#F6EFE6] text-[#0B3A2E] font-sans flex flex-col relative overflow-hidden">
            {/* Real-time Notifications */}
            <div className="fixed top-24 right-10 z-[100] space-y-4">
                {notifications.map(n => (
                    <div key={n.id} className="bg-[#0B3A2E] text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 border border-white/10">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                            <AlertCircle className="text-[#C29958]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Real-time Alert</p>
                            <p className="font-serif font-black italic">{n.message}</p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedSession && (
                <PaymentModal 
                    session={selectedSession} 
                    onClose={() => setSelectedSession(null)} 
                    onComplete={finalizeOrder}
                />
            )}

            <header className="h-20 bg-[#0B3A2E] flex items-center justify-between px-10 shadow-xl shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 brightness-150" />
                    <div>
                        <h1 className="text-white font-serif text-xl font-black">BILLING</h1>
                        <p className="text-[#C29958] text-[8px] font-black tracking-[0.3em] uppercase">The Great Nizam</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input 
                            type="text"
                            placeholder="Search table/name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/10 border border-white/10 text-white rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:border-[#C29958] transition-all w-64"
                        />
                    </div>
                    <button className="text-[#C29958] flex items-center gap-2 font-bold text-xs">
                        <User size={18} className="border border-[#C29958] rounded-full p-0.5" />
                        CASHIER 01
                    </button>
                </div>
            </header>

            <main className="flex-1 p-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-serif font-black italic">Active Settlements</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(filtered || []).map(session => (
                            <div key={session.id} className="bg-white rounded-[40px] p-8 shadow-2xl border border-[#0B3A2E]/5 flex flex-col relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
                                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest ${isPending(session) ? 'bg-[#C29958] text-white' : 'bg-[#0B3A2E]/5 text-[#0B3A2E]/40'}`}>
                                    {isPending(session) ? 'READY TO PAY' : (session.status === 'confirmed' ? 'CONFIRMED' : 'ACTIVE')}
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="bg-[#0B3A2E] text-white px-4 py-2 rounded-xl text-lg font-black uppercase tracking-tighter">
                                                    {session.tableId === 'TAKEAWAY' ? `ID #${session.id}` : `TABLE ${session.tableId}`}
                                                </div>
                                            </div>
                                            <h3 className="text-4xl font-serif font-black text-[#0B3A2E] italic">
                                                {session.customerName || (session.tableId === 'TAKEAWAY' || session.orderType === 'takeaway' ? 'Takeaway Guest' : 'Dine-in Guest')}
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3 mb-8">
                                    {session.items?.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm italic font-medium text-[#6D5D4B]">
                                            <span className="text-xs italic font-medium">{item.qty}x {item.name}</span>
                                            <span className="font-bold">£{((item.price || 0) * (item.qty || 0)).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto border-t border-[#0B3A2E]/5 pt-6 mb-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-[#86a69d] uppercase tracking-widest">Total Bill</span>
                                        <span className="text-3xl font-serif font-black text-[#0B3A2E]">£{Number(session.finalTotal || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handlePrint(session)}
                                        className="flex-1 bg-[#F6EFE6] text-[#0B3A2E] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#C29958] hover:text-white transition-all"
                                    >
                                        <Printer size={16} /> Print
                                    </button>
                                    <button 
                                        onClick={() => setSelectedSession(session)}
                                        className="flex-[2] bg-[#0B3A2E] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-[#C29958] transition-all"
                                    >
                                        <CreditCard size={16} /> Settlement
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="py-40 text-center">
                            <PoundSterling size={64} className="mx-auto mb-6 text-[#0B3A2E]/10" />
                            <p className="text-xl font-serif font-black italic text-[#0B3A2E]/30 uppercase tracking-widest">No pending bills found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
