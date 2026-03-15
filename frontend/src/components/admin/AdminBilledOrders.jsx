import React, { useState } from 'react';
import { User, ReceiptText, MapPin, Printer, RotateCcw, X, CreditCard, Banknote, SplitSquareHorizontal, CheckCircle, Copy, Calculator, ArrowLeft } from 'lucide-react';

export default function AdminBilledOrders({ orders: sessions, updateStatus, printReceipt }) {
    // Only show sessions that are 'billed'
    const activeBilledSessions = sessions.filter(s => s.status === 'billed');

    // Group multiple sessions for the same table into one UI card
    const groupedSessions = activeBilledSessions.reduce((acc, current) => {
        const tableId = current.tableId;
        if (!acc[tableId]) {
            acc[tableId] = { ...current, items: [...current.items], ids: [current.id] };
        } else {
            const existing = acc[tableId];
            existing.subtotal += (current.subtotal || 0);
            existing.serviceCharge += (current.serviceCharge || 0);
            existing.finalTotal += (current.finalTotal || 0);
            existing.ids.push(current.id);

            current.items.forEach(newItem => {
                const found = existing.items.find(i => i.name === newItem.name);
                if (found) {
                    found.qty += newItem.qty;
                } else {
                    existing.items.push({ ...newItem });
                }
            });
        }
        return acc;
    }, {});

    const displaySessions = Object.values(groupedSessions);

    const [paymentModal, setPaymentModal] = useState({
        isOpen: false,
        session: null,
        status: 'idle',
        step: 'method',
        cardAmount: '',
        cashAmount: '',
        cashReceived: ''
    });

    const handleOpenPayment = (session) => {
        setPaymentModal({
            isOpen: true,
            session,
            status: 'idle',
            step: 'method',
            cardAmount: '',
            cashAmount: '',
            cashReceived: ''
        });
    };

    const handleCopyAmount = async (amount) => {
        try {
            await navigator.clipboard.writeText(amount.toString());
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleProcessPayment = (method) => {
        setPaymentModal(p => ({ ...p, status: 'processing' }));

        // Simulate hardware / network delay
        setTimeout(() => {
            // Update ALL session shards for this table to completed
            paymentModal.session.ids.forEach(id => updateStatus(id, 'completed'));
            setPaymentModal(p => ({ ...p, status: 'success' }));

            setTimeout(() => {
                setPaymentModal({ isOpen: false, session: null, status: 'idle', step: 'method', cardAmount: '', cashAmount: '', cashReceived: '' });
            }, 2000);
        }, 1500);
    };

    if (activeBilledSessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in duration-700">
                <ReceiptText className="w-16 h-16 text-[#303633] mb-4" />
                <h3 className="text-2xl font-serif text-white mb-2">No Pending Payments</h3>
                <p className="text-[#a8b8b2] max-w-md text-sm">Tables awaiting final payment will appear here once their bill is requested.</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-serif text-white tracking-wide mb-2">Pending Payments</h2>
                    <p className="text-[#a8b8b2] text-sm italic">Collect payment and close table sessions.</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">Settlement Queue</span>
                    <div className="text-2xl font-serif text-white">{displaySessions.length} TABLES</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displaySessions.map(session => {
                    return (
                        <div key={session.tableId} className="bg-gradient-to-b from-[#1c1e1c] to-[#141614] border border-[#303633] rounded-xl p-6 relative group shadow-lg flex flex-col justify-between">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-700 rounded-t-xl opacity-50"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0a1f18] text-emerald-500 flex items-center justify-center font-bold text-lg border border-[#14402e]">
                                        {session.tableId}
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-[#a8b8b2] font-bold mb-0.5">Unified Session</p>
                                        <p className="text-sm font-mono text-white">#TBL-{session.tableId}</p>
                                    </div>
                                </div>
                                <span className="bg-[#1c2e26] text-emerald-400 border border-[#173a2f] text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded">
                                    PAYMENT DUE
                                </span>
                            </div>

                            <div className="bg-[#111312] border border-[#202422] rounded-lg p-4 mb-6 shadow-inner flex-grow">
                                <div className="space-y-3 mb-4 max-h-[140px] overflow-y-auto pr-1 scrollbar-hide">
                                    {session.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-[11px] text-[#a8b8b2] items-center border-b border-white/5 pb-1">
                                            <span className="flex items-center gap-2">
                                                <span className="text-white font-bold">{item.qty}x</span>
                                                <span className="truncate max-w-[120px]">{item.name}</span>
                                            </span>
                                            <span>£{(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center text-xs border-b border-[#303633] pb-3 text-[#a8b8b2] mt-4">
                                    <span>Service Charge</span>
                                    <span className="font-medium text-white/50 font-mono">£{session.serviceCharge.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xl pt-2 text-nizam-gold">
                                    <span className="font-bold font-serif">Final Total</span>
                                    <span className="font-bold font-mono">£{session.finalTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button onClick={() => printReceipt(session)} className="py-3 px-2 rounded font-bold text-[10px] xl:text-xs tracking-wider border border-[#303633] text-[#a8b8b2] hover:text-white hover:bg-white/5 transition-colors uppercase flex justify-center items-center gap-2">
                                    <Printer className="w-4 h-4" /> Reprint
                                </button>
                                <button onClick={() => session.ids.forEach(id => updateStatus(id, 'active'))} className="py-3 px-2 rounded font-bold text-[10px] xl:text-xs tracking-wider border border-[#303633] text-[#a8b8b2] hover:text-white hover:bg-white/5 transition-colors uppercase flex justify-center items-center gap-2">
                                    <RotateCcw className="w-4 h-4" /> Reopen
                                </button>
                            </div>
                            <button onClick={() => handleOpenPayment(session)} className="w-full py-4 rounded font-bold text-[11px] sm:text-xs tracking-widest bg-emerald-900 border border-emerald-600 text-white hover:bg-emerald-800 transition-all uppercase text-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                Checkout POS
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* POS Checkout Terminal Modal */}
            {paymentModal.isOpen && paymentModal.session && (() => {
                const total = parseFloat(paymentModal.session.finalTotal) || 0;

                // Calculations for Cash
                const cashRecvd = parseFloat(paymentModal.cashReceived) || 0;
                const changeDue = Math.max(0, cashRecvd - total);

                // Calculations for Split
                const splitCash = parseFloat(paymentModal.cashAmount) || 0;
                const splitCard = Math.max(0, total - splitCash);

                return (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-[#111312] border border-nizam-border rounded-2xl w-full max-w-5xl h-full max-h-[700px] flex flex-col md:flex-row shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                            {/* LEFT PANE: Digital Receipt */}
                            <div className="w-full md:w-5/12 bg-[#0a0b0a] border-r border-nizam-border/50 p-6 flex flex-col relative overflow-y-auto">
                                <h3 className="text-xl font-serif text-white tracking-wider mb-8 text-center uppercase border-b border-white/10 pb-4">
                                    Session Details
                                </h3>

                                <div className="flex justify-between items-center mb-4 text-sm">
                                    <span className="text-[#a8b8b2]">Table</span>
                                    <span className="font-bold text-white text-lg bg-[#1c1e1c] px-3 py-1 rounded">{paymentModal.session.tableId}</span>
                                </div>
                                <div className="flex justify-between items-center mb-8 text-sm">
                                    <span className="text-[#a8b8b2]">Session ID</span>
                                    <span className="font-mono text-white">#SN-{paymentModal.session.id.toString().padStart(4, '0')}</span>
                                </div>

                                <div className="space-y-4 mb-8 flex-grow">
                                    {paymentModal.session.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm items-center">
                                            <span className="flex gap-3 text-white">
                                                <span className="text-[#a8b8b2] w-6 text-right font-mono">{item.qty}x</span>
                                                <span className="font-medium text-xs">{item.name}</span>
                                            </span>
                                            <span className="font-mono text-[#a8b8b2] text-xs">£{(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto border-t border-dashed border-white/20 pt-6">
                                    <div className="flex justify-between items-center mb-2 text-xs text-[#a8b8b2]">
                                        <span>Subtotal</span>
                                        <span className="font-mono">£{paymentModal.session.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-6 text-xs text-[#a8b8b2]">
                                        <span>Service Charge</span>
                                        <span className="font-mono">£{paymentModal.session.serviceCharge.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-end bg-[#1a1c1a] p-5 rounded-xl border border-nizam-gold/20 shadow-inner">
                                        <span className="text-sm font-bold tracking-widest text-[#a8b8b2] uppercase">Final Total</span>
                                        <span className="text-4xl font-serif text-nizam-gold tracking-tight">£{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANE: Payment Controls */}
                            <div className="w-full md:w-7/12 p-8 lg:p-12 relative flex flex-col justify-center bg-[#0d0f0e]">
                                {paymentModal.status === 'idle' && (
                                    <button onClick={() => setPaymentModal({ isOpen: false })} className="absolute right-6 top-6 text-[#a8b8b2] hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                )}

                                {paymentModal.step !== 'method' && paymentModal.status === 'idle' && (
                                    <button onClick={() => setPaymentModal(p => ({ ...p, step: 'method' }))} className="absolute left-6 top-6 text-[#a8b8b2] hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors">
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                )}

                                <div className="w-full max-w-sm mx-auto">
                                    {/* Success Screen */}
                                    {paymentModal.status === 'success' && (
                                        <div className="text-center animate-in zoom-in duration-300">
                                            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-900/30 border-4 border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                                                <CheckCircle className="w-12 h-12 text-emerald-400" />
                                            </div>
                                            <h2 className="text-3xl font-serif text-emerald-400 mb-2">Settled</h2>
                                            <p className="text-[#a8b8b2] text-sm uppercase tracking-widest">Table {paymentModal.session.tableId} Cleared</p>
                                        </div>
                                    )}

                                    {/* Processing Screen */}
                                    {paymentModal.status === 'processing' && (
                                        <div className="text-center animate-pulse">
                                            <div className="w-20 h-20 mx-auto border-4 border-t-nizam-gold border-r-nizam-gold border-b-transparent border-l-transparent rounded-full animate-spin mb-6"></div>
                                            <h2 className="text-2xl font-serif text-white mb-2 tracking-widest uppercase">Processing...</h2>
                                        </div>
                                    )}

                                    {/* Select Payment Method */}
                                    {paymentModal.status === 'idle' && paymentModal.step === 'method' && (
                                        <div className="space-y-4">
                                            <h2 className="text-2xl font-serif text-white mb-8 text-center">Settlement Method</h2>

                                            <button onClick={() => setPaymentModal(p => ({ ...p, step: 'cash_flow' }))} className="w-full flex items-center p-5 bg-[#181a17] hover:bg-black border border-[#2a302a] hover:border-emerald-500/50 rounded-xl transition-all group">
                                                <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                                                    <Banknote className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-base font-bold text-white uppercase tracking-tight">Exact Cash</h3>
                                                    <p className="text-[10px] text-[#a8b8b2] uppercase tracking-widest">Mark as Paid</p>
                                                </div>
                                            </button>

                                            <button onClick={() => setPaymentModal(p => ({ ...p, step: 'card_flow' }))} className="w-full flex items-center p-5 bg-[#181a17] hover:bg-black border border-[#2a302a] hover:border-blue-500/50 rounded-xl transition-all group">
                                                <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                                                    <CreditCard className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-base font-bold text-white uppercase tracking-tight">Card / Terminal</h3>
                                                    <p className="text-[10px] text-[#a8b8b2] uppercase tracking-widest">Charge via Terminal</p>
                                                </div>
                                            </button>

                                            <button onClick={() => setPaymentModal(p => ({ ...p, step: 'split_flow' }))} className="w-full flex items-center p-5 bg-[#181a17] hover:bg-black border border-[#2a302a] hover:border-nizam-gold/50 rounded-xl transition-all group">
                                                <div className="w-10 h-10 rounded-full bg-nizam-gold/10 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                                                    <SplitSquareHorizontal className="w-5 h-5 text-nizam-gold" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-base font-bold text-white uppercase tracking-tight">Split Tender</h3>
                                                    <p className="text-[10px] text-[#a8b8b2] uppercase tracking-widest">Mixed Cash & Card</p>
                                                </div>
                                            </button>
                                        </div>
                                    )}

                                    {/* Cash Flow */}
                                    {paymentModal.status === 'idle' && paymentModal.step === 'cash_flow' && (
                                        <div className="animate-in slide-in-from-right-8 duration-300">
                                            <div className="bg-[#181a17] p-5 rounded-xl border border-[#2a302a] mb-6">
                                                <label className="text-[10px] text-[#a8b8b2] uppercase tracking-widest font-bold mb-3 block">Received Amount (£)</label>
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    value={paymentModal.cashReceived}
                                                    onChange={e => setPaymentModal(p => ({ ...p, cashReceived: e.target.value }))}
                                                    className="w-full bg-transparent text-4xl font-mono text-white outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div className="bg-emerald-900/10 p-5 rounded-xl border border-emerald-900/30 flex justify-between items-center mb-8">
                                                <span className="text-emerald-500 font-bold uppercase tracking-widest text-[11px]">Change:</span>
                                                <span className="text-2xl font-mono font-bold text-emerald-400">£{changeDue.toFixed(2)}</span>
                                            </div>

                                            <button
                                                onClick={() => handleProcessPayment('cash')}
                                                disabled={cashRecvd < total}
                                                className="w-full py-5 rounded-xl font-bold tracking-widest uppercase bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                                            >
                                                Finalize Settlement
                                            </button>
                                        </div>
                                    )}

                                    {/* Card Flow */}
                                    {paymentModal.status === 'idle' && paymentModal.step === 'card_flow' && (
                                        <div className="text-center animate-in slide-in-from-right-8 duration-300">
                                            <h3 className="text-5xl font-serif text-white mb-8 tracking-tight">£{total.toFixed(2)}</h3>
                                            <div className="bg-blue-900/10 border border-blue-900/30 text-blue-400 px-6 py-4 rounded-lg mb-10 text-xs font-bold uppercase tracking-widest">
                                                Terminal Transaction Required
                                            </div>
                                            <button
                                                onClick={() => handleProcessPayment('card')}
                                                className="w-full py-5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white uppercase tracking-widest"
                                            >
                                                Payment Completed
                                            </button>
                                        </div>
                                    )}

                                    {/* Split Flow logic remains mostly same but using session total */}
                                    {paymentModal.status === 'idle' && paymentModal.step === 'split_flow' && (
                                        <div className="animate-in slide-in-from-right-8 duration-300 space-y-4">
                                            <div className="bg-[#181a17] p-4 rounded-xl border border-[#2a302a] flex justify-between items-center">
                                                <span className="text-[#a8b8b2] text-[10px] font-bold uppercase">Cash (£)</span>
                                                <input
                                                    type="number"
                                                    value={paymentModal.cashAmount}
                                                    onChange={e => setPaymentModal(p => ({ ...p, cashAmount: e.target.value }))}
                                                    className="bg-transparent text-right text-2xl font-mono text-white outline-none w-32"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-900/30 flex justify-between items-center">
                                                <span className="text-blue-400 text-[10px] font-bold uppercase">Card (£)</span>
                                                <span className="text-2xl font-mono font-bold text-blue-400">£{splitCard.toFixed(2)}</span>
                                            </div>
                                            <button
                                                onClick={() => handleProcessPayment('split')}
                                                className="w-full py-5 rounded-xl font-bold uppercase bg-nizam-gold text-black mt-4"
                                            >
                                                Confirm Split
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
