import React from 'react';

export default function Receipt({ order: session }) {
    if (!session) return null;

    // session now contains { tableId, items, finalTotal, subtotal, serviceCharge, createdAt, id }
    const items = session.items || [];

    return (
        <div id="receipt-print-area" className="hidden print:block bg-white text-black p-[1mm] mx-auto text-[12px] leading-tight w-[80mm] font-mono">
            <div className="text-center mb-2">
                <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 mx-auto mb-1 grayscale" />
                <div className="text-lg font-bold mb-1 uppercase tracking-wider">The Great Nizam</div>
                <div className="text-[10px] space-y-0.5 mb-1">
                    <p>123 Fake Street, London, E1 6AN</p>
                    <p>Tel: 020 7123 4567</p>
                </div>
                
                <div className="mt-1 pt-1 border-t border-dashed border-black">
                    {session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY' ? (
                        <>
                            <p className="font-bold text-sm">TAKEAWAY</p>
                            <p className="text-[10px] uppercase font-bold mt-0.5">Name: {session.customerName || 'N/A'}</p>
                            <p className="text-[10px] uppercase font-bold mb-0.5">Mobile: {session.phone || 'N/A'}</p>
                        </>
                    ) : (
                        <p className="font-bold text-sm">TABLE: {session.tableId}</p>
                    )}
                    <p className="text-[10px]">{new Date(session.createdAt).toLocaleString('en-GB')}</p>
                    <p className="text-[10px] italic">{session.ids && session.ids.length > 1 ? 'Unified Bill' : `Receipt #${session.id}`}</p>
                </div>
            </div>

            <div className="border-t border-b border-dashed border-black py-1 mb-1">
                <div className="flex justify-between font-bold text-[11px] mb-1 uppercase">
                    <span>Item</span>
                    <span>Amt</span>
                </div>
                <div className="space-y-0.5">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-[11px]">
                            <span className="flex-1 pr-1 break-words uppercase max-w-[70%]">
                                {item.qty}x{item.name}
                            </span>
                            <span className="whitespace-nowrap flex-shrink-0">£{(item.price * item.qty).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-0.5 pt-1 text-[11px]">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>£{(session.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span>£{(session.serviceCharge || 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="flex justify-between font-bold text-sm border-t border-dashed border-black pt-2 mt-2">
                <span>TOTAL</span>
                <span>£{(session.finalTotal || 0).toFixed(2)}</span>
            </div>

            <div className="text-center mt-6 text-[10px] border-t border-dashed border-black pt-4">
                <p className="font-bold mb-1 uppercase">*** THANK YOU ***</p>
                <p>Follow us @thegreatnizam</p>
            </div>
        </div>
    );
}
