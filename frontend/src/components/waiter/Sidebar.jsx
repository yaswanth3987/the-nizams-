import React from 'react';
import { LayoutGrid, ShoppingBag, FileText, ListOrdered, CheckCircle, CreditCard, UserPlus, Bell, Clock, Plus, User, SquareCheck as CheckSquare } from 'lucide-react';

const Sidebar = ({ 
    activeTab, 
    setActiveTab, 
    setView, 
    badgeCounts, 
    setSelectedTable, 
    setCart 
}) => {
    const navItems = [
        { id: 'all-in-one', label: 'Quick Access', icon: LayoutGrid, count: 0 },
        { id: 'tables', label: 'Tables', icon: LayoutGrid, count: badgeCounts.tables },
        { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag, count: badgeCounts.takeaway },
        { id: 'new_orders', label: 'New Orders', icon: FileText, count: badgeCounts.new_orders },
        { id: 'orders', label: 'Ready Orders', icon: ListOrdered, count: badgeCounts.ready },
        { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, count: badgeCounts.confirmed },
        { id: 'billing', label: 'Billing', icon: CreditCard, count: badgeCounts.billing },
        { id: 'attendance', label: 'Attendance', icon: UserPlus, count: 0 },
        { id: 'alerts', label: 'Alerts', icon: Bell, count: badgeCounts.alerts },
        { id: 'completed', label: 'Completed', icon: CheckSquare, count: badgeCounts.completed },
        { id: 'scheduler', label: 'Scheduler', icon: Clock, count: 0 }
    ];

    return (
        <aside className="w-64 bg-[#0a261f] border-r border-white/5 flex flex-col p-6 hidden md:flex shrink-0 z-50 h-full">
            <div className="flex items-center gap-3 mb-12">
                <img src="/logo-icon.png" className="w-12 h-12 object-contain" alt="Logo" />
                <div>
                    <h2 className="text-white font-serif font-black text-xl leading-none italic tracking-tight">The Nizam</h2>
                    <span className="text-[#86a69d] text-[10px] font-black uppercase tracking-widest opacity-60">Waiter</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto overscroll-contain py-4 no-scrollbar">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => { 
                            setActiveTab(item.id); 
                            setView('dashboard'); 
                            if("vibrate" in navigator) navigator.vibrate(20); 
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                            activeTab === item.id 
                                ? 'bg-[#FFD700]/10 text-[#FFD700]' 
                                : 'text-[#86a69d] active:bg-white/5 hover:bg-white/5'
                        }`}
                    >
                        <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        {item.count > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                {item.count}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="mt-auto pt-6 space-y-4 border-t border-white/5">
                <button 
                    onClick={() => {
                        setSelectedTable(null);
                        setCart([]);
                        setView('order_entry');
                    }} 
                    className="w-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:bg-[#FFD700]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Plus size={18} strokeWidth={3} /> New Table
                </button>
                <div className="flex items-center gap-3 p-4 bg-black/20 rounded-2xl">
                    <div className="w-10 h-10 bg-[#FFD700]/20 rounded-full flex items-center justify-center text-[#FFD700]">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-white text-xs font-black">Staff #402</p>
                        <p className="text-[#86a69d] text-[10px] font-bold">Shift: Dinner</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default React.memo(Sidebar);
