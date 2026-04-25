import React from 'react';
import { 
    LayoutGrid, ShoppingBag, FileText, ListOrdered, 
    CheckCircle, CreditCard, UserPlus, Bell, Clock, 
    Plus, User, SquareCheck as CheckSquare 
} from 'lucide-react';

const SidebarV2 = ({ 
    activeTab, 
    setActiveTab, 
    setView, 
    badgeCounts, 
    onNewTable 
}) => {
    const navItems = [
        { id: 'all-in-one', label: 'Quick Access', icon: LayoutGrid, count: 0 },
        { id: 'tables', label: 'Floor Map', icon: LayoutGrid, count: badgeCounts.tables },
        { id: 'new_orders', label: 'New Requests', icon: FileText, count: badgeCounts.new_orders },
        { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag, count: badgeCounts.takeaway },
        { id: 'orders', label: 'Ready to Serve', icon: ListOrdered, count: badgeCounts.ready },
        { id: 'confirmed', label: 'In Progress', icon: CheckCircle, count: badgeCounts.confirmed },
        { id: 'billing', label: 'Settlement', icon: CreditCard, count: badgeCounts.billing },
        { id: 'alerts', label: 'Urgent Alerts', icon: Bell, count: badgeCounts.alerts },
        { id: 'completed', label: 'History', icon: CheckSquare, count: badgeCounts.completed },
        { id: 'scheduler', label: 'Scheduler', icon: Clock, count: 0 }
    ];

    return (
        <aside className="w-72 bg-[#0a261f] border-r border-white/5 flex flex-col hidden md:flex shrink-0 z-50 h-full overflow-hidden">
            {/* Brand Header */}
            <div className="p-8 pb-12">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FFD700] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
                        <img src="/logo-icon.png" className="w-8 h-8 object-contain brightness-0" alt="Logo" />
                    </div>
                    <div>
                        <h2 className="text-white font-serif font-black text-xl leading-tight italic tracking-tight">The Nizam</h2>
                        <span className="text-[#FFD700] text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Waiter Terminal</span>
                    </div>
                </div>
            </div>

            {/* Navigation - Stable Scroll Area */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto overscroll-contain no-scrollbar">
                {navItems.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                        <button 
                            key={item.id}
                            onClick={() => { 
                                setActiveTab(item.id); 
                                setView('dashboard'); 
                                if("vibrate" in navigator) navigator.vibrate(25); 
                            }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[2rem] transition-all duration-300 group relative ${
                                isActive 
                                    ? 'bg-[#FFD700] text-[#0a261f] shadow-xl shadow-[#FFD700]/10' 
                                    : 'text-[#86a69d] hover:bg-white/5 active:bg-white/10'
                            }`}
                        >
                            <item.icon size={22} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-[#0a261f]' : 'group-hover:text-white transition-colors'} />
                            <span className={`font-black text-sm tracking-tight ${isActive ? 'translate-x-1' : ''} transition-transform`}>
                                {item.label}
                            </span>
                            {item.count > 0 && (
                                <span className={`ml-auto min-w-[24px] h-6 flex items-center justify-center text-[10px] font-black rounded-full shadow-lg ${
                                    isActive ? 'bg-[#0a261f] text-[#FFD700]' : 'bg-red-500 text-white animate-pulse'
                                }`}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-6 mt-auto border-t border-white/5 bg-black/10">
                <button 
                    onClick={onNewTable} 
                    className="w-full bg-[#FFD700] text-[#0a261f] py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-[#FFD700]/20 active:scale-95 transition-all flex items-center justify-center gap-3 mb-6"
                >
                    <Plus size={20} strokeWidth={4} /> New Order
                </button>
                
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#FFD700]">
                        <User size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-black truncate">Waiter #402</p>
                        <p className="text-[#86a69d] text-[9px] font-bold uppercase tracking-widest">Shift Active</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default React.memo(SidebarV2);
