import React from 'react';
import { Clock, User, Bell } from 'lucide-react';

export default function AdminTopHeader({ title, tabs = [], activeTab, onTabChange, unreadAlerts = 0, onClearAlerts }) {
    return (
        <header className="bg-[#0B3A2E] text-[#F9F6F0] px-10 py-5 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 z-10 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-8 mb-4 md:mb-0">
                <h1 className="text-2xl font-serif text-white shadow-sm italic">{title}</h1>
                {tabs.length > 0 && (
                    <div className="flex space-x-6 text-xs font-bold tracking-widest text-[#a8b8b2] uppercase">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`pb-1 transition-colors hover:text-white ${
                                    activeTab === tab.id 
                                        ? 'text-nizam-gold border-b-2 border-nizam-gold' 
                                        : 'opacity-80'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-6 ml-auto">
                <button 
                    onClick={onClearAlerts}
                    className={`flex items-center gap-2 transition px-3 py-1.5 rounded-full text-sm font-semibold border ${
                        unreadAlerts > 0 ? 'bg-red-900/40 border-red-500/50 text-red-100 animate-pulse' : 'bg-white/10 border-white/10 hover:bg-white/20'
                    }`}
                >
                    <Bell className={`w-4 h-4 ${unreadAlerts > 0 ? 'text-red-400' : 'text-white'}`} />
                    <span>{unreadAlerts} ALERTS</span>
                </button>
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full">
                    <Clock className="w-5 h-5 text-[#a8b8b2]" />
                </div>
                
                <div className="flex items-center gap-3 ml-2 hidden sm:flex">
                    <div className="text-right">
                        <p className="text-[10px] font-bold tracking-widest text-[#a8b8b2] uppercase">Admin</p>
                        <p className="text-sm font-semibold text-white">Nizam Master</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                </div>
            </div>
        </header>
    );
}
