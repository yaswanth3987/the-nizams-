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
    assistanceRequests = [],
    activeOrders = [],
    onNewTable,
    onClearAssistance
}) => {
    const navItems = [
        { id: 'alerts', label: 'Urgent Alerts', icon: Bell, count: badgeCounts.alerts },
        { id: 'all-in-one', label: 'Quick Access', icon: LayoutGrid, count: 0 },
        { id: 'tables', label: 'Floor Map', icon: LayoutGrid, count: badgeCounts.tables },
        { id: 'new_orders', label: 'New Requests', icon: FileText, count: badgeCounts.new_orders },
        { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag, count: badgeCounts.takeaway },
        { id: 'orders', label: 'Ready to Serve', icon: ListOrdered, count: badgeCounts.ready },
        { id: 'confirmed', label: 'In Progress', icon: CheckCircle, count: badgeCounts.confirmed },
        { id: 'billing', label: 'Settlement', icon: CreditCard, count: badgeCounts.billing },
        { id: 'completed', label: 'History', icon: CheckSquare, count: badgeCounts.completed },
        { id: 'scheduler', label: 'Scheduler', icon: Clock, count: 0 }
    ];

    const urgentAlerts = [
        ...assistanceRequests.filter(r => r.status === 'pending').map(r => ({ ...r, type: 'assistance', priority: 1 })),
        ...activeOrders.filter(o => o.status === 'ready').map(o => ({ ...o, type: 'ready', priority: 2 }))
    ].sort((a, b) => a.priority - b.priority);

    return (
        <aside className="w-80 bg-[#0a261f] border-r border-white/5 flex flex-col hidden md:flex shrink-0 z-50 h-full overflow-hidden">
            {/* Brand Header */}
            <div className="p-6 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
                        <img src="/logo-icon.png" className="w-6 h-6 object-contain brightness-0" alt="Logo" />
                    </div>
                    <div>
                        <h2 className="text-white font-serif font-black text-lg leading-tight italic tracking-tight">The Nizam</h2>
                        <span className="text-[#FFD700] text-[8px] font-black uppercase tracking-[0.3em] opacity-80">Waiter Terminal</span>
                    </div>
                </div>
            </div>

            {/* Pinned Alerts Section - PRIORITY 2 */}
            <div className="px-4 mb-4 space-y-2 shrink-0">
                <div className="px-4 mb-2 flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Urgent Alerts</span>
                    {urgentAlerts.length > 0 && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                </div>
                <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-2">
                    {urgentAlerts.length > 0 ? (
                        urgentAlerts.map((alert, idx) => (
                            <div 
                                key={alert.id || idx}
                                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all animate-in slide-in-from-top-4 duration-300 ${
                                    alert.type === 'assistance' 
                                        ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                        : 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    alert.type === 'assistance' ? 'bg-red-500 text-white' : 'bg-[#FFD700] text-[#0a261f]'
                                }`}>
                                    {alert.type === 'assistance' ? <Bell size={14} strokeWidth={3} /> : <CheckCircle size={14} strokeWidth={3} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black leading-none truncate">
                                        Table {alert.tableId}
                                    </p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-70">
                                        {alert.type === 'assistance' ? 'Assistance' : 'Ready to Serve'}
                                    </p>
                                </div>
                                {alert.type === 'assistance' && (
                                    <button 
                                        onClick={() => onClearAssistance(alert.id)}
                                        className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <Plus size={12} className="rotate-45" />
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-4 rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center opacity-20">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">No Pending Alerts</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 py-3 border-t border-white/5 shrink-0">
                <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em]">Navigation Menu</span>
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
                            className={`w-full flex items-center gap-4 px-6 py-3 rounded-[1.5rem] transition-all duration-300 group relative ${
                                isActive 
                                    ? 'bg-[#FFD700] text-[#0a261f] shadow-xl shadow-[#FFD700]/10' 
                                    : 'text-[#86a69d] hover:bg-white/5 active:bg-white/10'
                            }`}
                        >
                            <item.icon size={18} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-[#0a261f]' : 'group-hover:text-white transition-colors'} />
                            <span className={`font-black text-[12px] tracking-tight ${isActive ? 'translate-x-1' : ''} transition-transform`}>
                                {item.label}
                            </span>
                            {item.count > 0 && (
                                <span className={`ml-auto min-w-[20px] h-5 flex items-center justify-center text-[8px] font-black rounded-full shadow-lg ${
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
                    className="w-full bg-[#FFD700] text-[#0a261f] py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-[#FFD700]/20 active:scale-95 transition-all flex items-center justify-center gap-3 mb-6"
                >
                    <Plus size={16} strokeWidth={4} /> New Order
                </button>
                
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#FFD700]">
                        <User size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-[10px] font-black truncate">Waiter #402</p>
                        <p className="text-[#86a69d] text-[8px] font-bold uppercase tracking-widest">Shift Active</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default React.memo(SidebarV2);
