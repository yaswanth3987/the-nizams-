import React from 'react';
import { FileText, CheckCircle, PoundSterling, CheckSquare, Package, HelpCircle, CalendarDays, LogOut, Utensils, LayoutGrid } from 'lucide-react';

export default function AdminSidebar({ activeView, onViewChange, onRefresh, counts = {} }) {
    const navItems = [
        { id: 'assistance', label: 'ASSISTANCE', icon: HelpCircle },
        { id: 'orders', label: 'ORDERS', icon: FileText },
        { id: 'confirmed', label: 'CONFIRMED', icon: CheckCircle },
        { id: 'billed', label: 'PAYMENT', icon: PoundSterling },
        { id: 'completed', label: 'COMPLETED', icon: CheckSquare },
        { id: 'tables', label: 'TABLES', icon: LayoutGrid },
        { id: 'menu', label: 'MENU', icon: Utensils },
        { id: 'attendance', label: 'ATTENDANCE', icon: CalendarDays },
        { id: 'inventory', label: 'INVENTORY', icon: Package }
    ];

    return (
        <aside className="w-64 bg-nizam-sidebar hidden md:flex flex-col border-r border-nizam-border pb-6 h-screen overflow-y-auto">
            <div className="p-8 pb-4 mb-4 border-b border-nizam-border/30">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-nizam-gold/20 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
                        <img src="/logo-icon.png" alt="Logo" className="w-16 h-16 object-contain relative drop-shadow-2xl brightness-110" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-nizam-gold mt-2 uppercase leading-none opacity-80">Royal Admin</p>
                        <p className="text-[8px] font-bold tracking-[0.2em] text-nizam-textMuted mt-2 uppercase opacity-40">Digital Concierge</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const count = counts[item.id] || 0;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold tracking-wider text-sm transition-all ${isActive
                                    ? 'bg-nizam-card text-nizam-gold border-l-4 border-nizam-gold shadow-sm'
                                    : 'text-nizam-textMuted hover:bg-nizam-card/50 hover:text-nizam-text border-l-4 border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <Icon size={18} className={isActive ? 'text-nizam-gold' : 'opacity-60'} />
                                {item.label}
                            </div>
                            {count > 0 && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse ${
                                    isActive 
                                    ? 'bg-nizam-gold text-black' 
                                    : 'bg-red-500/90 text-white'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="mt-auto px-6 mb-4 pt-6 text-[10px] font-bold tracking-widest text-nizam-textMuted/40 uppercase">
                {/* Admin Management Section */}
            </div>

            <div className="px-6 py-4 flex items-center gap-3 border-t border-nizam-border/50">
                <div className="w-10 h-10 rounded-full bg-nizam-green flex items-center justify-center text-nizam-gold font-serif text-lg border border-nizam-gold/20 shadow-sm">
                    A
                </div>
                <div>
                    <p className="text-sm font-bold text-nizam-text">Admin Profile</p>
                    <p className="text-[10px] text-nizam-textMuted uppercase tracking-wider">System Manager</p>
                </div>
            </div>
        </aside>
    );
}
