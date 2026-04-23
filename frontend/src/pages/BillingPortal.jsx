import React, { useState, useEffect, useCallback } from 'react';
import { socket } from '../utils/socket';
import { PoundSterling, CheckCircle, Search, User, FileText, Printer, CreditCard, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export default function BillingPortal() {
    const [sessions, setSessions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        document.title = "Billing - The Great Nizam";
    }, []);

    const fetchBillingSessions = useCallback(() => {
        // Fetch sessions in 'billed' or 'active' status that might need payment
        fetch(`${API_URL}/orders?statuses=billed,active,ready,served`)
            .then(res => res.json())
            .then(data => setSessions(data))
            .catch(err => console.error("Error fetching billing orders:", err));
    }, []);

    useEffect(() => {
        fetchBillingSessions();
        socket.on('sessionUpdated', fetchBillingSessions);
        socket.on('tableReset', fetchBillingSessions);
        return () => {
            socket.off('sessionUpdated', fetchBillingSessions);
            socket.off('tableReset', fetchBillingSessions);
        };
    }, [fetchBillingSessions]);

    const completePayment = async (id) => {
        if (!window.confirm('Mark this order as PAID and COMPLETE?')) return;
        try {
            await fetch(`${API_URL}/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });
            fetchBillingSessions();
        } catch (err) {
            console.error('Failed to complete payment', err);
        }
    };

    const handlePrint = (session) => {
        const printWindow = window.open('', '_blank', 'width=450,height=600');
        const itemsHtml = session.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span style="flex: 1; padding-right: 10px;">${item.qty}x ${item.name}</span>
                <span style="font-weight: bold; white-space: nowrap;">£${(item.price * item.qty).toFixed(2)}</span>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Order #${session.id}</title>
                    <style>
                        @page { margin: 0; }
                        body { 
                            font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; 
                            padding: 30px; 
                            color: #0B3A2E; 
                            line-height: 1.4;
                            max-width: 400px;
                            margin: auto;
                        }
                        .header { text-align: center; border-bottom: 2px solid #0B3A2E; padding-bottom: 15px; margin-bottom: 20px; }
                        .footer { text-align: center; border-top: 1px dashed #0B3A2E; padding-top: 15px; margin-top: 20px; font-size: 11px; color: #6D5D4B; }
                        .total { font-size: 20px; font-weight: 900; display: flex; justify-content: space-between; margin-top: 15px; padding-top: 10px; border-top: 1px solid #0B3A2E; }
                        .meta { font-size: 12px; margin-bottom: 5px; font-weight: 600; color: #6D5D4B; text-transform: uppercase; letter-spacing: 0.1em; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.02em;">THE GREAT NIZAM</h1>
                        <p style="margin: 5px 0; font-size: 10px; font-weight: 800; letter-spacing: 0.3em; color: #C29958;">ROYAL DINING SINCE 1954</p>
                    </div>
                    <div style="margin-bottom: 25px; text-align: center; background: #0B3A2E; color: white; padding: 15px; border-radius: 10px;">
                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 4px; opacity: 0.8;">Order ID</div>
                        <div style="font-size: 32px; font-weight: 900; letter-spacing: -0.02em;">#${session.id}</div>
                    </div>
                    <div style="margin-bottom: 20px; border-bottom: 1px solid #0B3A2E; padding-bottom: 15px;">
                        <div class="meta">Target: ${session.tableId === 'TAKEAWAY' ? 'TAKEAWAY' : `TABLE ${session.tableId}`}</div>
                        ${session.customerName ? `<div class="meta">Guest: ${session.customerName}</div>` : `<div class="meta">Guest: VALUED PATRON</div>`}
                        <div class="meta" style="font-size: 10px; opacity: 0.6;">Date: ${new Date().toLocaleString('en-GB')}</div>
                    </div>
                    <div class="items">
                        ${itemsHtml}
                    </div>
                    <div class="total">
                        <span>TOTAL</span>
                        <span>£${Number(session.finalTotal).toFixed(2)}</span>
                    </div>
                    <div class="footer">
                        <p style="font-weight: bold; margin-bottom: 5px;">Thank you for your patronage!</p>
                        <p>123 Royal Street, Nizam Estate<br/>www.thegreatnizam.com</p>
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            setTimeout(() => window.close(), 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filtered = sessions.filter(s => 
        s.tableId?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F6EFE6] text-[#0B3A2E] font-sans flex flex-col">
            <header className="h-20 bg-[#0B3A2E] flex items-center justify-between px-10 shadow-xl shrink-0">
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

            <main className="flex-1 p-10 overflow-y-auto no-scrollbar">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-serif font-black italic">Active Settlements</h2>
                        <div className="flex gap-4">
                            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-[#0B3A2E]/5">
                                <p className="text-[10px] font-black text-[#6D5D4B]/40 uppercase tracking-widest">Pending Payment</p>
                                <p className="text-2xl font-serif font-black">{sessions.filter(s=>s.status==='billed' || (s.tableId === 'TAKEAWAY' && s.status === 'ready')).length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map(session => (
                            <div key={session.id} className="bg-white rounded-[40px] p-8 shadow-2xl border border-[#0B3A2E]/5 flex flex-col relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
                                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest ${session.status === 'billed' || (session.tableId === 'TAKEAWAY' && session.status === 'ready') ? 'bg-[#C29958] text-white' : 'bg-[#0B3A2E]/5 text-[#0B3A2E]/40'}`}>
                                    {session.status === 'billed' || (session.tableId === 'TAKEAWAY' && session.status === 'ready') ? 'READY TO PAY' : 'ACTIVE'}
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-3xl font-serif font-black italic mb-1">{session.tableId === 'TAKEAWAY' ? 'Takeaway' : `Table ${session.tableId}`}</h3>
                                    <p className="text-[10px] font-black text-[#6D5D4B]/40 uppercase tracking-widest">Order ID: #{session.id}</p>
                                </div>

                                <div className="flex-1 space-y-3 mb-8">
                                    {session.items?.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm italic font-medium text-[#6D5D4B]">
                                            <span>{item.qty}x {item.name}</span>
                                            <span className="font-bold">£{(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto border-t border-[#0B3A2E]/5 pt-6 mb-8">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-[#6D5D4B]/40 uppercase tracking-widest">Grand Total</span>
                                        <span className="text-3xl font-serif font-black text-[#0B3A2E]">£{Number(session.finalTotal).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handlePrint(session)}
                                        className="flex-1 bg-[#F6EFE6] text-[#0B3A2E] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#C29958] hover:text-white transition-all"
                                    >
                                        <Printer size={16} /> Print Bill
                                    </button>
                                    <button 
                                        onClick={() => completePayment(session.id)}
                                        className="flex-[2] bg-[#0B3A2E] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-[#C29958] transition-all"
                                    >
                                        <CreditCard size={16} /> Complete Payment
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
