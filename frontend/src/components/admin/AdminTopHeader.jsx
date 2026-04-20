import React from 'react';
import { Clock, Bell, Volume2, VolumeX } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

export default function AdminTopHeader({ activeTab, onTabChange, unreadAlerts = 0, onClearAlerts }) {
    const { soundEnabled, toggleSound } = useSound();

    return (
        <header className="bg-secondary text-white px-12 py-6 flex flex-col md:flex-row justify-between items-start md:items-center z-20 shadow-xl border-b border-white/10 relative">
            <div className="flex items-center gap-12 mb-6 md:mb-0 relative z-10 w-full overflow-x-auto no-scrollbar">
                <h1 className="text-2xl font-serif text-white/90 italic tracking-tight font-bold whitespace-nowrap">Admin Terminal</h1>
                <div className="flex gap-12 h-full">
                    {Object.entries({ dashboard: 'Dashboard', inventory: 'Inventory', reports: 'Reports' }).map(([val, label]) => (
                        <button
                           key={val}
                           onClick={() => onTabChange(val)}
                           className={`relative h-full px-4 text-sm font-sans font-bold uppercase tracking-widest transition-all duration-300 ${
                               activeTab === val ? 'text-accent' : 'text-white/40 hover:text-white'
                           }`}
                        >
                            {label}
                            {activeTab === val && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full shadow-[0_0_15px_rgba(255,215,0,0.6)] animate-in slide-in-from-bottom-1 duration-300"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center gap-6 ml-auto relative z-10">
                <button 
                    onClick={toggleSound}
                    className={`flex items-center gap-3 transition-all px-4 py-2 rounded-lg text-xs font-bold border uppercase ${
                        soundEnabled ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10' : 'bg-red-500/20 border-red-500/50 text-red-500 hover:bg-red-500/30'
                    }`}
                >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-accent" /> : <VolumeX className="w-4 h-4 text-red-500" />}
                    <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                </button>

                <button 
                    onClick={onClearAlerts}
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-all px-4 py-2 rounded-lg text-xs font-bold border border-white/10 uppercase"
                >
                    <Bell className="w-3.5 h-3.5 text-accent" />
                    <span className="text-white/80">{unreadAlerts} Notifications</span>
                </button>
                
                <button className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/10">
                    <Clock size={18} />
                </button>
            </div>
        </header>
    );
}
