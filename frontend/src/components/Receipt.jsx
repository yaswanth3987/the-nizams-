import React from 'react';

export default function Receipt({ order }) {
    if (!order) return null;

    return (
        <div id="receipt-print-area" className="hidden print:block bg-white text-black p-4 mx-auto text-sm leading-tight border border-gray-300 print:border-none">
            <div className="text-center mb-4">
                <img src="/logo-with-name.png" alt="The Great Nizam" className="w-[50px] mx-auto mb-2 grayscale contrast-200" />
                <p>123 Fake Street, London</p>
                <p>Tel: 020 7123 4567</p>
                <p>VAT Reg: GB 123 4567 89</p>
                <p className="mt-2 text-xs">Table: <span className="font-bold text-lg">{order.tableId}</span></p>
                <p className="text-xs">{new Date(order.createdAt).toLocaleString('en-GB')}</p>
                <p className="text-xs">Order #{order.id}</p>
            </div>

            <div className="border-t border-b border-dashed border-black py-2 mb-2">
                <div className="flex justify-between font-bold mb-1">
                    <span>Item</span>
                    <span>Total</span>
                </div>
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between mb-1">
                        <span className="flex-1 pr-2">
                            {item.qty}x {item.name}
                        </span>
                        <span>£{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="flex justify-between mb-1">
                <span>Net Amount</span>
                <span>£{order.net.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
                <span>VAT (20%)</span>
                <span>£{order.vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-dashed border-black pt-2 mt-1">
                <span>TOTAL</span>
                <span>£{order.total.toFixed(2)}</span>
            </div>

            <div className="text-center mt-6 text-xs">
                <p>*** THANK YOU ***</p>
                <p>For dining with us</p>
            </div>
        </div>
    );
}
