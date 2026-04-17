import React from 'react';
import { Clock, User, Bell } from 'lucide-react';

export default function AdminTopHeader({ title, tabs = [], activeTab, onTabChange, unreadAlerts = 0, onClearAlerts }) {
    return (
        <header className="bg-nizam-sidebar text-nizam-text px-10 py-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-nizam-border/30 z-10 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-8 mb-4 md:mb-0 relative z-10">
                <h1 className="text-2xl font-serif text-nizam-gold shadow-sm italic tracking-wide">{title}</h1>
                {tabs.length > 0 && (
                    <div className="flex space-x-8 text-[11px] font-black tracking-[0.2em] text-nizam-textMuted uppercase ml-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`pb-2 transition-all duration-300 hover:text-white relative group ${
                                    activeTab === tab.id 
                                        ? 'text-nizam-gold' 
                                        : 'opacity-60'
                                }`}
                            >
                                {tab.label}
                                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-nizam-gold transition-transform duration-300 transform ${activeTab === tab.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`}></span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-8 ml-auto relative z-10">
                <button 
                    onClick={onClearAlerts}
                    className={`flex items-center gap-3 transition-all duration-300 px-4 py-2 rounded-full text-[10px] font-black tracking-widest border border-nizam-border/50 shadow-lg ${
                        unreadAlerts > 0 
                        ? 'bg-red-950/20 border-red-500/30 text-red-400 animate-pulse ring-2 ring-red-500/10' 
                        : 'bg-nizam-card/40 hover:bg-nizam-card text-nizam-textMuted hover:text-white'
                    }`}
                >
                    <Bell className={`w-4 h-4 ${unreadAlerts > 0 ? 'text-red-500' : 'text-nizam-gold'}`} />
                    <span>{unreadAlerts} ALERTS</span>
                </button>
                
                <div className="hidden lg:flex items-center gap-4 bg-nizam-card/30 px-5 py-2 rounded-full border border-nizam-border/30">
                    <div className="text-right">
                        <p className="text-[9px] font-black tracking-widest text-nizam-gold/60 uppercase leading-none">Status</p>
                        <p className="text-[11px] font-bold text-emerald-400 mt-1 flex items-center gap-1.5 ring-green-400/20">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            SYSTEM LIVE
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 ml-4 pl-8 border-l border-nizam-border/30">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black tracking-widest text-nizam-gold uppercase opacity-80 decoration-nizam-gold/30">Master Admin</p>
                        <p className="text-xs font-bold text-white mt-0.5">The Great Nizam</p>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-nizam-gold/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-11 h-11 rounded-full bg-nizam-card border border-nizam-gold/30 flex items-center justify-center relative shadow-xl overflow-hidden">
                            <User className="w-6 h-6 text-nizam-gold" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
