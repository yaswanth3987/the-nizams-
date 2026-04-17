import React, { useState } from 'react';
import { User, ReceiptText, MapPin, Printer, RotateCcw, X, CreditCard, Banknote, SplitSquareHorizontal, CheckCircle, Copy, Calculator, ArrowLeft, Wallet } from 'lucide-react';

export default function AdminBilledOrders({ orders: sessions, updateStatus, printReceipt }) {
    // Filter only standard dine-in sessions that are 'billed'
    const activeBilledSessions = (sessions || []).filter(s => s.status === 'billed' && s.orderType !== 'takeaway');

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
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-700 pb-20">
                <div className="w-24 h-24 bg-nizam-card rounded-full flex items-center justify-center mb-8 border border-nizam-border/50 shadow-inner">
                    <ReceiptText className="w-12 h-12 text-nizam-gold opacity-10" />
                </div>
                <h3 className="text-3xl font-serif text-white mb-3 italic">No Pending Settlements</h3>
                <p className="text-nizam-textMuted max-w-sm text-[11px] font-bold uppercase tracking-[0.2em] leading-loose">Tables awaiting final payment will appear here once their bill is requested.</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 pb-12">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-serif text-white tracking-wide mb-2 uppercase">Pending Payments</h2>
                    <p className="text-nizam-textMuted text-sm italic">Collect payment and mathematically verify settlements to close sessions.</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black tracking-[0.3em] text-nizam-gold uppercase">Settlement Queue</span>
                    <div className="text-3xl font-serif text-white tracking-tighter mt-1">{displaySessions.length} TABLES</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displaySessions.map(session => {
                    return (
                        <div key={session.tableId} className="bg-nizam-card border-2 border-nizam-border/30 rounded-2xl p-8 relative group shadow-2xl flex flex-col justify-between hover:border-nizam-gold/20 transition-all hover:-translate-y-1">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-nizam-gold opacity-30 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-nizam-dark text-nizam-gold flex items-center justify-center font-bold text-lg border border-nizam-gold/20 shadow-inner">
                                        {session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY' ? 'TK' : session.tableId}
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-nizam-textMuted font-black mb-1">
                                            {session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY' ? 'Takeaway Order' : 'Dining Session'}
                                        </p>
                                        {session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY' ? (
                                            <p className="text-[11px] font-bold text-white tracking-tight">{session.customerName} • {session.phone}</p>
                                        ) : (
                                            <p className="text-sm font-mono text-white/80">#TBL-{session.tableId}</p>
                                        )}
                                    </div>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-black tracking-widest px-3 py-1.5 rounded shadow-sm animate-pulse">
                                    PAY NOW
                                </span>
                            </div>

                            <div className="bg-nizam-dark/40 border border-nizam-border/20 rounded-xl p-5 mb-8 shadow-inner flex-grow">
                                <div className="space-y-3 mb-6 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-nizam-border/50">
                                    {session.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-[11px] text-nizam-textMuted items-center border-b border-white/5 pb-2 last:border-0 mb-1">
                                            <span className="flex items-center gap-3">
                                                <span className="text-white font-bold bg-white/5 px-1.5 py-0.5 rounded text-[9px]">{item.qty}x</span>
                                                <span className="truncate max-w-[140px] group-hover:text-white transition-colors">{item.name}</span>
                                            </span>
                                            <span className="font-mono text-[10px]">£{Number(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2 border-t border-nizam-border/20 pt-4">
                                    <div className="flex justify-between items-center text-[10px] text-nizam-textMuted font-bold uppercase tracking-widest">
                                        <span>Service Charge</span>
                                        <span className="font-mono text-white/40">£{Number(session.serviceCharge || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-2xl pt-2 text-nizam-gold">
                                        <span className="font-bold font-serif uppercase tracking-tighter">Total</span>
                                        <span className="font-bold font-mono tracking-tighter">£{Number(session.finalTotal || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button onClick={() => printReceipt(session)} className="py-3.5 px-2 rounded-xl font-black text-[10px] tracking-[0.2em] border border-nizam-border/30 text-nizam-textMuted hover:text-white hover:bg-nizam-dark transition-all uppercase flex flex-col items-center gap-1 group/btn">
                                    <Printer className="w-4 h-4 opacity-50 group-hover/btn:text-nizam-gold transition-colors" /> Reprint
                                </button>
                                <button onClick={() => session.ids.forEach(id => updateStatus(id, 'active'))} className="py-3.5 px-2 rounded-xl font-black text-[10px] tracking-[0.2em] border border-nizam-border/30 text-nizam-textMuted hover:text-white hover:bg-nizam-dark transition-all uppercase flex flex-col items-center gap-1 group/btn">
                                    <RotateCcw className="w-4 h-4 opacity-50 group-hover/btn:text-nizam-gold transition-colors" /> Reopen
                                </button>
                            </div>
                            <button onClick={() => handleOpenPayment(session)} className="w-full py-4.5 rounded-xl font-black text-[11px] tracking-[0.3em] bg-emerald-600 text-white hover:bg-emerald-500 transition-all uppercase text-center shadow-xl shadow-emerald-900/20 group/chk">
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
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                        <div className="bg-nizam-card border-2 border-nizam-border rounded-3xl w-full max-w-6xl h-full max-h-[800px] flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300">

                            {/* LEFT PANE: Digital Receipt */}
                            <div className="w-full md:w-5/12 bg-nizam-dark/50 border-r border-nizam-border/50 p-10 flex flex-col relative overflow-y-auto">
                                <h3 className="text-2xl font-serif text-white tracking-[0.2em] mb-12 text-center uppercase border-b border-nizam-border/30 pb-6 italic">
                                    Audit Detail
                                </h3>

                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black text-nizam-textMuted uppercase tracking-[0.3em]">Table Identity</span>
                                    <span className="font-bold text-nizam-gold text-2xl bg-nizam-dark px-5 py-2 rounded-xl border border-nizam-gold/20 shadow-inner">
                                        {paymentModal.session.orderType === 'takeaway' || paymentModal.session.tableId === 'TAKEAWAY' ? 'TK' : paymentModal.session.tableId}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-12">
                                    <span className="text-[10px] font-black text-nizam-textMuted uppercase tracking-[0.3em]">Journal Entry</span>
                                    <span className="font-mono text-white/50 text-xs">#SN-{paymentModal.session.id.toString().padStart(4, '0')}</span>
                                </div>

                                <div className="space-y-5 mb-12 flex-grow">
                                    {paymentModal.session.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm items-center group/item">
                                            <span className="flex gap-4 text-white/80 items-center">
                                                <span className="text-nizam-gold font-mono text-[10px] bg-nizam-gold/10 w-8 h-8 rounded-full flex items-center justify-center border border-nizam-gold/10">{item.qty}x</span>
                                                <span className="font-bold tracking-tight text-xs uppercase group-hover/item:text-white transition-colors">{item.name}</span>
                                            </span>
                                            <span className="font-mono text-nizam-textMuted text-xs font-bold">£{Number(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto border-t border-dashed border-nizam-border/50 pt-10">
                                    <div className="flex justify-between items-center mb-3 text-[10px] text-nizam-textMuted font-bold uppercase tracking-[0.2em]">
                                        <span>Subtotal</span>
                                        <span className="font-mono text-white/60">£{Number(paymentModal.session.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-8 text-[10px] text-nizam-textMuted font-bold uppercase tracking-[0.2em]">
                                        <span>Service Charge</span>
                                        <span className="font-mono text-white/60">£{Number(paymentModal.session.serviceCharge || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-end bg-nizam-dark p-8 rounded-2xl border-2 border-nizam-gold/20 shadow-2xl relative group/total">
                                        <div className="absolute inset-0 bg-nizam-gold/5 opacity-0 group-hover/total:opacity-100 transition-opacity"></div>
                                        <span className="text-[11px] font-black tracking-[0.4em] text-nizam-textMuted uppercase relative z-10 mb-1">SETTLEMENT AMOUNT</span>
                                        <span className="text-5xl font-serif text-nizam-gold tracking-tighter relative z-10 font-bold">£{Number(total || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANE: Payment Controls */}
                            <div className="w-full md:w-7/12 p-12 lg:p-16 relative flex flex-col justify-center bg-nizam-card">
                                {paymentModal.status === 'idle' && (
                                    <button onClick={() => setPaymentModal({ isOpen: false })} className="absolute right-8 top-8 text-nizam-textMuted hover:text-white p-3 rounded-full hover:bg-white/5 transition-all group">
                                        <X className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                                    </button>
                                )}

                                {paymentModal.step !== 'method' && paymentModal.status === 'idle' && (
                                    <button onClick={() => setPaymentModal(p => ({ ...p, step: 'method' }))} className="absolute left-8 top-8 text-nizam-gold hover:text-white flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] transition-all">
                                        <ArrowLeft className="w-5 h-5" /> Back to methods
                                    </button>
                                )}

                                <div className="w-full max-md mx-auto">
                                    {/* Success Screen */}
                                    {paymentModal.status === 'success' && (
                                        <div className="text-center animate-in zoom-in duration-500">
                                            <div className="w-32 h-32 mx-auto rounded-full bg-emerald-500/10 border-4 border-emerald-500 flex items-center justify-center mb-10 shadow-[0_0_60px_rgba(16,185,129,0.3)] animate-pulse">
                                                <CheckCircle className="w-16 h-16 text-emerald-400" />
                                            </div>
                                            <h2 className="text-4xl font-serif text-white mb-4 tracking-tight">Session Settled</h2>
                                            <p className="text-nizam-textMuted text-[10px] font-black uppercase tracking-[0.4em] italic mb-2">Vault Entry Recorded Successfully</p>
                                            <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mt-4">Table session is now closed.</p>
                                        </div>
                                    )}

                                    {/* Processing Screen */}
                                    {paymentModal.status === 'processing' && (
                                        <div className="text-center">
                                            <div className="w-24 h-24 mx-auto border-4 border-t-nizam-gold border-r-nizam-gold border-b-nizam-border/10 border-l-nizam-border/10 rounded-full animate-spin mb-10 shadow-[0_0_30px_rgba(198,168,124,0.1)]"></div>
                                            <h2 className="text-3xl font-serif text-white mb-4 tracking-[0.3em] uppercase italic">Verifying...</h2>
                                            <p className="text-nizam-gold/40 text-[10px] font-bold tracking-widest uppercase">Connecting to Secure Ledger</p>
                                        </div>
                                    )}

                                    {/* Select Payment Method */}
                                    {paymentModal.status === 'idle' && paymentModal.step === 'method' && (
                                        <div className="space-y-5 animate-in fade-in duration-500">
                                            <h2 className="text-3xl font-serif text-white mb-12 text-center uppercase tracking-widest italic border-b border-nizam-border/30 pb-8">Settlement Engine</h2>

                                            <button onClick={() => setPaymentModal(p => ({ ...p, step: 'cash_flow' }))} className="w-full flex items-center p-6 bg-nizam-dark/30 hover:bg-nizam-dark border-2 border-nizam-border/30 hover:border-nizam-gold/50 rounded-2xl transition-all group active:scale-95 shadow-xl">
                                                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform border border-emerald-500/20">
                                                    <Banknote className="w-7 h-7 text-emerald-500" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-nizam-gold transition-colors">Physical Tender</h3>
                                                    <p className="text-[9px] text-nizam-textMuted uppercase tracking-[0.3em] font-black mt-1">Accept Cash & Calculate Change</p>
                                                </div>
                                                <Wallet className="w-5 h-5 text-nizam-gold/20 group-hover:text-nizam-gold transition-colors" />
                                            </button>

                                            <button onClick={() => setPaymentModal(p => ({ ...p, step: 'card_flow' }))} className="w-full flex items-center p-6 bg-nizam-dark/30 hover:bg-nizam-dark border-2 border-nizam-border/30 hover:border-blue-500/50 rounded-2xl transition-all group active:scale-95 shadow-xl">
                                                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform border border-blue-500/20">
                                                    <CreditCard className="w-7 h-7 text-blue-400" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">Digital Processor</h3>
                                                    <p className="text-[9px] text-nizam-textMuted uppercase tracking-[0.3em] font-black mt-1">Charge via Network Terminal</p>
                                                </div>
                                            </button>

                                            <button onClick={() => setPaymentModal(p => ({ ...p, step: 'split_flow' }))} className="w-full flex items-center p-6 bg-nizam-dark/30 hover:bg-nizam-dark border-2 border-nizam-border/30 hover:border-nizam-gold/50 rounded-2xl transition-all group active:scale-95 shadow-xl">
                                                <div className="w-14 h-14 rounded-xl bg-nizam-gold/10 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform border border-nizam-gold/20">
                                                    <SplitSquareHorizontal className="w-7 h-7 text-nizam-gold" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-nizam-gold transition-colors">Split Portfolio</h3>
                                                    <p className="text-[9px] text-nizam-textMuted uppercase tracking-[0.3em] font-black mt-1">Mixed Multi-Tender Settlement</p>
                                                </div>
                                            </button>
                                        </div>
                                    )}

                                    {/* Cash Flow */}
                                    {paymentModal.status === 'idle' && paymentModal.step === 'cash_flow' && (
                                        <div className="animate-in slide-in-from-bottom-12 duration-500">
                                            <div className="bg-nizam-dark/50 p-8 rounded-3xl border-2 border-nizam-border/30 mb-8 shadow-inner">
                                                <div className="flex justify-between items-center mb-6">
                                                    <label className="text-[10px] text-nizam-gold uppercase tracking-[0.4em] font-black block">Tender Received</label>
                                                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] font-bold">Base: £{total.toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-4xl font-serif text-nizam-gold mr-4 opacity-50">£</span>
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        value={paymentModal.cashReceived}
                                                        onChange={e => setPaymentModal(p => ({ ...p, cashReceived: e.target.value }))}
                                                        className="w-full bg-transparent text-6xl font-mono text-white outline-none placeholder:text-white/5"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-emerald-500/5 p-8 rounded-3xl border-2 border-emerald-500/20 flex justify-between items-center mb-10 shadow-2xl relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="relative z-10">
                                                    <span className="text-emerald-500/60 font-black uppercase tracking-[0.4em] text-[10px] block mb-1">Surplus / Change</span>
                                                    <span className="text-4xl font-mono font-bold text-emerald-400 tracking-tighter">£{Number(changeDue || 0).toFixed(2)}</span>
                                                </div>
                                                <Calculator className="w-10 h-10 text-emerald-500/10 group-hover:scale-110 transition-transform relative z-10" />
                                            </div>

                                            <button
                                                onClick={() => handleProcessPayment('cash')}
                                                disabled={cashRecvd < total}
                                                className="w-full py-6 rounded-2xl font-black tracking-[0.4em] uppercase bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-20 disabled:cursor-not-allowed shadow-2xl shadow-emerald-900/30 active:scale-[0.98] transition-all"
                                            >
                                                Authorize Vault Entry
                                            </button>
                                        </div>
                                    )}

                                    {/* Card Flow */}
                                    {paymentModal.status === 'idle' && paymentModal.step === 'card_flow' && (
                                        <div className="text-center animate-in slide-in-from-bottom-12 duration-500">
                                            <div className="w-32 h-32 bg-blue-500/10 mx-auto rounded-3xl flex items-center justify-center mb-10 border-2 border-blue-500/20 shadow-2xl">
                                                <CreditCard className="w-12 h-12 text-blue-400" />
                                            </div>
                                            <h3 className="text-6xl font-serif text-white mb-4 tracking-tighter font-bold">£{total.toFixed(2)}</h3>
                                            <p className="text-[10px] font-black text-nizam-textMuted uppercase tracking-[0.4em] mb-12 italic">Waiting for Processor Response</p>
                                            
                                            <div className="bg-blue-600/5 border-2 border-blue-500/20 text-blue-300 px-8 py-6 rounded-2xl mb-12 flex items-center gap-6 text-left">
                                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">Active Connection</p>
                                                    <p className="font-bold text-xs uppercase tracking-widest leading-relaxed">Secure Handshake Established with Terminal #01</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleProcessPayment('card')}
                                                className="w-full py-6 rounded-2xl font-black bg-blue-600 hover:bg-blue-500 text-white uppercase tracking-[0.4em] shadow-2xl shadow-blue-900/30 transition-all active:scale-[0.98]"
                                            >
                                                Verify Settlement
                                            </button>
                                        </div>
                                    )}

                                    {/* Split Flow logic remains mostly same but using session total */}
                                    {paymentModal.status === 'idle' && paymentModal.step === 'split_flow' && (
                                        <div className="animate-in slide-in-from-bottom-12 duration-500 space-y-6">
                                            <h3 className="text-xl font-serif text-white mb-8 text-center uppercase tracking-[0.2em] italic">Dual-Tender Allocation</h3>
                                            
                                            <div className="bg-nizam-dark/50 p-6 rounded-2xl border-2 border-nizam-border/30 flex justify-between items-center group/split">
                                                <div>
                                                    <span className="text-nizam-textMuted text-[10px] font-black uppercase tracking-[0.3em] block mb-1">Cash Allocation</span>
                                                    <p className="text-[8px] text-nizam-gold/40 uppercase font-bold tracking-widest">Physical Bank Deposit</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-xl font-serif text-nizam-gold mr-3 opacity-30">£</span>
                                                    <input
                                                        type="number"
                                                        value={paymentModal.cashAmount}
                                                        onChange={e => setPaymentModal(p => ({ ...p, cashAmount: e.target.value }))}
                                                        className="bg-transparent text-right text-3xl font-mono text-white outline-none w-40 font-bold"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-blue-950/20 p-6 rounded-2xl border-2 border-blue-900/20 flex justify-between items-center relative overflow-hidden group/split">
                                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/split:opacity-100 transition-opacity"></div>
                                                <div className="relative z-10">
                                                    <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] block mb-1">Digital Residual</span>
                                                    <p className="text-[8px] text-blue-400/40 uppercase font-bold tracking-widest">Remaining Card Balance</p>
                                                </div>
                                                <span className="text-3xl font-mono font-bold text-blue-400 relative z-10 tabular-nums">£{Number(splitCard || 0).toFixed(2)}</span>
                                            </div>

                                            <button
                                                onClick={() => handleProcessPayment('split')}
                                                className="w-full py-6 rounded-2xl font-black uppercase bg-nizam-gold text-black mt-8 tracking-[0.4em] shadow-2xl shadow-nizam-gold/20 hover:bg-white transition-all active:scale-[0.98]"
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
