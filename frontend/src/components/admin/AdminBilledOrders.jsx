import React, { useState } from 'react';
import { User, ReceiptText, MapPin, Printer, RotateCcw, X, CreditCard, Banknote, SplitSquareHorizontal, CheckCircle, Copy, Calculator, ArrowLeft, Wallet } from 'lucide-react';

export default function AdminBilledOrders({ orders: sessions, updateStatus, printReceipt }) {
    // Filter sessions that are 'billed' or 'billing_pending'
    const activeBilledSessions = (sessions || []).filter(s => 
        (s.status === 'billed' || s.status === 'billing_pending')
    );

    // Group multiple sessions for the same table into one UI card
    const groupedSessions = activeBilledSessions.reduce((acc, current) => {
        // Use Table ID for dine-in, but unique ID for takeaways to prevent mixing
        const groupKey = current.tableId === 'TAKEAWAY' ? `TAKEAWAY-${current.id}` : current.tableId;
        
        if (!acc[groupKey]) {
            acc[groupKey] = { ...current, items: [...current.items], ids: [current.id] };
        } else {
            const existing = acc[groupKey];
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

    const handleProcessPayment = () => {
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
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-700 pb-20">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5 shadow-inner">
                    <ReceiptText className="w-12 h-12 text-nizam-gold opacity-10" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-3 italic">No Pending Settlements</h3>
                <p className="text-white/40 max-w-sm text-sm font-medium">Tables awaiting final payment will appear here once their bill is requested.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-700 font-sans pb-24">
            <div className="px-10 py-12">
                <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Settlement Terminal</h2>
                <p className="text-white/60 max-w-xl text-sm leading-relaxed">
                    Process final payments and close table sessions for {displaySessions.length} active bills.
                </p>
            </div>

            <div className="flex-1 px-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {displaySessions.map((session) => (
                        <div key={session.tableId} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl relative h-[480px]">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-accent text-black px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                                            {session.tableId === 'TAKEAWAY' ? `ID #${session.id}` : `TABLE ${session.tableId}`}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            BILLED
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-serif font-bold italic text-white">
                                        {session.customerName || (session.tableId === 'TAKEAWAY' ? 'Takeaway Guest' : 'Dine-in Guest')}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar mb-8">
                                {session.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-white/80 font-serif italic">{item.name}</span>
                                        <span className="text-accent font-bold">x{item.qty}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto border-t border-white/10 pt-6 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Final Total</span>
                                    <span className="text-2xl font-serif font-bold text-accent">£{Number(session.finalTotal).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => printReceipt(session)} className="py-3 rounded-xl font-bold text-xs bg-white/5 text-white/60 uppercase border border-white/10 hover:bg-white hover:text-black transition-all">
                                    Reprint
                                </button>
                                <button 
                                    onClick={() => handleOpenPayment(session)}
                                    className="py-3 rounded-xl font-bold text-xs bg-accent text-black uppercase shadow-lg hover:bg-white transition-all"
                                >
                                    Checkout
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* POS Checkout Terminal Modal */}
            {paymentModal.isOpen && paymentModal.session && (() => {
                const total = parseFloat(paymentModal.session.finalTotal) || 0;
                const totalInPounds = total;
                const cashRecvd = parseFloat(paymentModal.cashReceived) || 0;
                const changeDue = Math.max(0, cashRecvd - totalInPounds);

                return (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-12">
                        <div className="bg-[#111311] border border-white/10 rounded-[3rem] w-full max-w-7xl h-full max-h-[900px] flex shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-500">
                            
                            {/* LEFT: Audit Summary */}
                            <div className="w-1/2 p-16 border-r border-white/5 bg-black/40 overflow-y-auto no-scrollbar">
                                <h3 className="text-5xl font-serif text-white font-bold mb-16 tracking-tight italic opacity-80">Audit Summary</h3>
                                
                                <div className="space-y-12">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="bg-nizam-gold text-black px-4 py-2 rounded-xl text-2xl font-black uppercase tracking-tighter">
                                                {paymentModal.session.tableId === 'TAKEAWAY' ? `ID #${paymentModal.session.id}` : `TABLE ${paymentModal.session.tableId}`}
                                            </span>
                                            {paymentModal.session.phone && (
                                                <span className="text-white/40 text-lg font-bold">
                                                    {paymentModal.session.phone}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-7xl font-serif font-bold text-white tracking-tighter italic">
                                            {paymentModal.session.customerName || (paymentModal.session.tableId === 'TAKEAWAY' ? 'Takeaway Guest' : 'Dine-in Guest')}
                                        </h4>
                                    </div>

                                    <div className="pt-12 border-t border-white/5">
                                        <p className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase mb-8">ITEMIZED CONSUMPTION</p>
                                        <div className="space-y-6">
                                            {paymentModal.session.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xl">
                                                    <span className="text-white/60 font-serif italic">{item.name}</span>
                                                    <span className="text-white font-bold">x{item.qty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-12 border-t border-white/5 mt-auto">
                                        <div className="flex justify-between items-end bg-black/20 p-10 rounded-[2rem] border border-nizam-gold/20 shadow-2xl">
                                            <div>
                                                <p className="text-[10px] font-black text-nizam-gold/60 tracking-[0.4em] uppercase mb-2">SETTLEMENT AMOUNT</p>
                                                <span className="text-2xl font-serif font-bold text-nizam-gold mr-3">£</span>
                                                <span className="text-7xl font-serif font-bold text-nizam-gold tracking-tight">{Number(totalInPounds).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Transaction Controls */}
                            <div className="w-1/2 p-16 relative flex flex-col justify-center items-center bg-[#111311]">
                                {paymentModal.status === 'idle' && (
                                    <button onClick={() => setPaymentModal({ isOpen: false })} className="absolute right-12 top-12 text-white/10 hover:text-white transition-colors">
                                        <X size={48} strokeWidth={1.5} />
                                    </button>
                                )}

                                {paymentModal.status === 'success' ? (
                                    <div className="text-center animate-in zoom-in duration-700">
                                        <div className="w-40 h-40 mx-auto rounded-full bg-nizam-gold/10 border-2 border-nizam-gold/40 flex items-center justify-center mb-12 shadow-[0_0_80px_rgba(198,168,124,0.1)]">
                                            <CheckCircle className="w-20 h-20 text-nizam-gold" />
                                        </div>
                                        <h2 className="text-6xl font-serif text-white font-bold mb-6 tracking-tight">Session Closed</h2>
                                        <p className="text-[10px] font-black text-white/20 tracking-[0.5em] uppercase">JOURNAL ENTRY RECORDED</p>
                                    </div>
                                ) : paymentModal.status === 'processing' ? (
                                    <div className="text-center">
                                        <div className="w-24 h-24 mx-auto border-2 border-white/5 border-t-nizam-gold rounded-full animate-spin mb-12 shadow-[0_0_50px_rgba(198,168,124,0.1)]"></div>
                                        <h2 className="text-4xl font-serif text-white font-bold mb-4 tracking-wider uppercase italic">Verifying...</h2>
                                        <p className="text-white/20 text-[10px] font-black tracking-[0.4em] uppercase">CONNECTING TO SECURE LEDGER</p>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-md space-y-12">
                                        <div className="text-center mb-16">
                                            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-[0.4em] text-white/40 mb-10">
                                                <CreditCard size={14} /> SECURE TRANSACTION PORT
                                            </div>
                                            <h2 className="text-5xl font-serif text-white font-bold tracking-tight mb-4">Complete Payment</h2>
                                            <p className="text-white/20 text-xs font-bold leading-relaxed">Select tender method to resolve the outstanding balance for this table session.</p>
                                        </div>

                                        <div className="space-y-6">
                                            <button 
                                                onClick={() => setPaymentModal(p => ({ ...p, step: 'cash_entry' }))}
                                                className={`w-full p-8 rounded-[2rem] border transition-all flex items-center justify-between group ${paymentModal.step === 'cash_entry' ? 'bg-nizam-gold text-black border-transparent' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <Banknote className={paymentModal.step === 'cash_entry' ? 'text-black/40' : 'text-nizam-gold'} size={32} />
                                                    <div className="text-left font-black tracking-tight uppercase text-xl">Physcial Tender</div>
                                                </div>
                                                <ArrowLeft size={24} className={paymentModal.step === 'cash_entry' ? 'rotate-180 transition-transform' : 'opacity-10'} />
                                            </button>

                                            {paymentModal.step === 'cash_entry' && (
                                                <div className="animate-in slide-in-from-top-4 duration-500 py-6">
                                                    <div className="bg-black/40 rounded-[2rem] p-10 border border-white/5 shadow-inner mb-8">
                                                        <p className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase mb-6">PHYSICAL AMOUNT RECEIVED</p>
                                                        <div className="flex items-center">
                                                            <span className="text-3xl font-serif font-bold text-nizam-gold mr-4">£</span>
                                                            <input 
                                                                type="number"
                                                                autoFocus
                                                                value={paymentModal.cashReceived}
                                                                onChange={e => setPaymentModal(p => ({ ...p, cashReceived: e.target.value }))}
                                                                className="bg-transparent text-6xl font-serif font-bold text-white outline-none w-full placeholder:text-white/5"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center px-10 mb-12">
                                                        <span className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase">CHANGE TO BE RETURNED</span>
                                                        <span className="text-4xl font-serif font-bold text-nizam-gold">£{Number(changeDue).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>

                                                    <button 
                                                        onClick={() => handleProcessPayment('cash')}
                                                        disabled={!paymentModal.cashReceived || changeDue < 0}
                                                        className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#2c5b4d] to-[#1a3d34] text-white font-black text-sm tracking-[0.2em] uppercase shadow-2xl hover:brightness-125 disabled:opacity-30 disabled:hover:brightness-100 transition-all font-bold"
                                                    >
                                                        AUTHORIZE SETTLEMENT
                                                    </button>
                                                </div>
                                            )}

                                            <button 
                                                onClick={() => handleProcessPayment('card')}
                                                className="w-full p-8 rounded-[2rem] border bg-white/5 border-white/5 hover:border-white/10 transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <CreditCard className="text-nizam-gold" size={32} />
                                                    <div className="text-left font-black tracking-tight uppercase text-xl text-white">Digital Processor</div>
                                                </div>
                                                <ArrowLeft size={24} className="opacity-10" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
