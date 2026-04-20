import React from 'react';
import { FileText, CheckCircle, PoundSterling, CheckSquare, Package, HelpCircle, CalendarDays, LogOut, Utensils, LayoutGrid, ShoppingBag, Columns, Activity, Clock } from 'lucide-react';

export default function AdminSidebar({ activeView, onViewChange, onRefresh, counts = {} }) {
    const navItems = [
        { id: 'pos', label: 'TAKEAWAY POS', icon: ShoppingBag },
        { id: 'all-in-one', label: 'QUICK ACCESS', icon: LayoutGrid },
        { id: 'takeaway-manager', label: 'TAKEAWAY ORDERS', icon: Columns },
        { id: 'assistance', label: 'ASSISTANCE', icon: HelpCircle },
        { id: 'orders', label: 'ORDERS', icon: FileText },
        { id: 'confirmed', label: 'CONFIRMED', icon: CheckCircle },
        { id: 'billed', label: 'PAYMENT', icon: PoundSterling },
        { id: 'completed', label: 'COMPLETED', icon: CheckSquare },
        { id: 'tables', label: 'TABLES', icon: LayoutGrid },
        { id: 'menu', label: 'MENU', icon: Utensils },
        { id: 'scheduler', label: 'SCHEDULER', icon: Clock },
        { id: 'inventory', label: 'INVENTORY', icon: Package },
        { id: 'attendance', label: 'ATTENDANCE', icon: CalendarDays }
    ];

    return (
        <aside className="w-72 bg-primary hidden md:flex flex-col border-r border-white/10 pb-10 h-screen overflow-y-auto relative shadow-2xl">
            <div className="p-8 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-xl">
                        <img src="/logo-icon.png" alt="Logo" className="w-8 h-8 object-contain brightness-150" />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif text-white leading-tight font-bold">The Great Nizam</h2>
                        <p className="text-[10px] font-black tracking-[0.3em] text-accent uppercase glow-gold">Admin Suite</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 py-8">
                {navItems.map((item) => {
                    const count = counts[item.id] || 0;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative ${
                                activeView === item.id 
                                ? 'bg-accent/10 text-accent ring-1 ring-accent' 
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className={`transition-transform duration-300 ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                                <Icon size={20} />
                            </span>
                            <span className="text-xs font-bold uppercase tracking-widest leading-none">
                                {item.label}
                            </span>
                            
                            {activeView === item.id && (
                                <div className="absolute right-0 w-1 h-6 bg-accent rounded-l-full shadow-[0_0_15px_rgba(255,215,0,0.8)] glow-gold"></div>
                            )}

                            {count > 0 && (
                                <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    activeView === item.id 
                                    ? 'bg-accent text-black' 
                                    : 'bg-accent/20 text-accent border border-accent/30'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="px-4 mt-auto">
                <div className="p-4 flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-accent font-serif text-lg border border-white/10 shadow-inner">
                        N
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">System Admin</p>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Online
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
