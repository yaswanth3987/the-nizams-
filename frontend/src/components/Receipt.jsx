import React from 'react';

const Receipt = React.forwardRef(({ order: session }, ref) => {
    if (!session) return null;

    // session now contains { tableId, items, finalTotal, subtotal, serviceCharge, createdAt, id }
    const items = session.items || [];

    return (
        <div ref={ref} id="receipt-print-area" className="hidden print:block bg-white text-black p-[2mm] mx-auto text-[12px] leading-tight w-full max-w-[80mm] min-w-[58mm] font-mono">
            <div className="text-center mb-3">
                <h1 className="text-xl font-bold mb-1 uppercase tracking-widest">The Nizam's</h1>
                <div className="text-[10px] space-y-0.5 mb-2">
                    <p>123 Fake Street, London</p>
                </div>
                
                <div className="mt-2 pt-2 border-t-[1.5px] border-dashed border-black text-left">
                    {session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY' ? (
                        <>
                            <p className="font-bold text-[11px] uppercase">Order ID: {session.id}</p>
                            <p className="text-[11px] uppercase font-bold mt-1">Name: {session.customerName || 'N/A'}</p>
                            <p className="text-[11px] uppercase font-bold mb-1">Mobile: {session.phone || 'N/A'}</p>
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-[11px] uppercase">Table ID: {session.tableId}</p>
                            <p className="font-bold text-[11px] uppercase mt-0.5">Order ID: {session.ids && session.ids.length > 1 ? `Unified (${session.ids.join(',')})` : session.id}</p>
                        </>
                    )}
                    <p className="text-[11px] uppercase mt-0.5">Date: {new Date(session.createdAt).toLocaleDateString('en-GB')} {new Date(session.createdAt).toLocaleTimeString('en-GB')}</p>
                </div>
            </div>

            <div className="border-t-[1.5px] border-b-[1.5px] border-dashed border-black py-2 mb-2">
                <div className="grid grid-cols-12 font-bold text-[11px] mb-2 uppercase">
                    <span className="col-span-6 text-left">Item</span>
                    <span className="col-span-3 text-center">Qty</span>
                    <span className="col-span-3 text-right">Price</span>
                </div>
                <div className="space-y-1">
                    {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 text-[11px] items-start">
                            <span className="col-span-6 text-left pr-2 uppercase break-words leading-tight">
                                {item.name}
                            </span>
                            <span className="col-span-3 text-center font-bold">
                                {item.qty}
                            </span>
                            <span className="col-span-3 text-right whitespace-nowrap">
                                {(item.price * item.qty).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-1 pt-1 text-[11px] font-bold uppercase w-full">
                <div className="flex justify-between w-full">
                    <span>Subtotal</span>
                    <span>{(session.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full">
                    <span>Service Charge (10%)</span>
                    <span>{(session.serviceCharge || 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="flex justify-between items-center font-black text-sm border-t-[1.5px] border-dashed border-black pt-2 mt-2 w-full uppercase">
                <span>Final Total</span>
                <span className="text-[15px]">£ {(session.finalTotal || 0).toFixed(2)}</span>
            </div>

            <div className="text-center mt-6 text-[11px] border-t-[1.5px] border-dashed border-black pt-3 pb-8">
                <p className="font-bold mb-1 uppercase text-[12px]">*** Thank You ***</p>
                <p className="uppercase">Please visit us again</p>
            </div>
        </div>
    );
});

export default Receipt;
