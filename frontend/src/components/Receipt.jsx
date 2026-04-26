import React from 'react';

const Receipt = React.forwardRef(({ order: session }, ref) => {
    if (!session) return null;

    // session now contains { tableId, items, finalTotal, subtotal, serviceCharge, createdAt, id }
    const items = session.items || [];

    return (
        <div ref={ref} id="receipt-print-area" className="hidden print:block bg-white text-black p-[2mm] mx-auto text-[12px] leading-tight w-full max-w-[80mm] min-w-[58mm] font-mono">
            <div className="text-center mb-3 flex flex-col items-center">
                <img src="/logo-with-name.png" alt="The Great Nizam" className="w-32 mb-1 grayscale contrast-200" />
                <div className="text-[12px] space-y-0.5 mb-2 font-bold">
                    <p>41-43 HIGH ST, HOUNSLOW TW3 1RH</p>
                </div>
                
                <div className="mt-2 pt-2 border-t-[1.5px] border-dashed border-black text-left">
                    {session.orderType === 'takeaway' || session.tableId === 'TAKEAWAY' ? (
                        <>
                            <p className="font-black text-[12px] uppercase">Order ID: {session.id}</p>
                            <p className="text-[12px] uppercase font-bold mt-1">Name: {session.customerName || 'Takeaway Guest'}</p>
                            <p className="text-[12px] uppercase font-bold mb-1">Mobile: {session.phone || 'N/A'}</p>
                        </>
                    ) : (
                        <>
                            <p className="font-black text-[12px] uppercase">Table ID: {session.tableId}</p>
                            <p className="font-black text-[12px] uppercase mt-0.5">Order ID: {session.ids && session.ids.length > 1 ? `Unified (${session.ids.join(',')})` : session.id}</p>
                            <p className="text-[12px] uppercase font-bold mt-1">Name: {session.customerName || 'Dine-in Guest'}</p>
                        </>
                    )}
                    <p className="text-[10px] uppercase mt-1 opacity-70">Date: {new Date(session.createdAt).toLocaleDateString('en-GB')} {new Date(session.createdAt).toLocaleTimeString('en-GB')}</p>
                </div>
            </div>

            <div className="border-t-[1.5px] border-b-[1.5px] border-dashed border-black py-2 mb-2">
                <div className="grid grid-cols-12 font-black text-[12px] mb-3 uppercase border-b-2 border-black pb-2">
                    <span className="col-span-5 text-left">ITEM</span>
                    <span className="col-span-2 text-center">QTY</span>
                    <span className="col-span-2 text-center">PRICE</span>
                    <span className="col-span-3 text-right">AMOUNT</span>
                </div>
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 text-[12px] items-start py-1 border-b border-black/5 last:border-0">
                            <span className="col-span-5 text-left pr-2 uppercase break-words leading-tight font-medium">
                                {item.name}
                            </span>
                            <span className="col-span-2 text-center font-black">
                                {item.qty}
                            </span>
                            <span className="col-span-2 text-center">
                                {Number(item.price).toFixed(2)}
                            </span>
                            <span className="col-span-3 text-right font-black">
                                {(item.price * item.qty).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2 pt-2 text-[12px] font-bold uppercase w-full">
                <div className="flex justify-between w-full">
                    <span>Ordered Items Total</span>
                    <span>{(session.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full">
                    <span>Service Charge (10%)</span>
                    <span>{(session.serviceCharge || 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="flex justify-between items-center font-black text-sm border-t-2 border-black pt-3 mt-3 w-full uppercase">
                <span className="text-[14px]">Grand Total (Items + Service Charge)</span>
                <span className="text-[18px]">£ {(session.finalTotal || 0).toFixed(2)}</span>
            </div>

            <div className="text-center mt-6 text-[11px] border-t-[1.5px] border-dashed border-black pt-3 pb-8">
                <p className="font-bold mb-1 uppercase text-[12px]">*** Thank You ***</p>
                <p className="uppercase">Please visit us again</p>
            </div>
        </div>
    );
});

export default Receipt;
