import React from 'react';
import { Hourglass, AlertTriangle, CheckCircle, X, Layers } from 'lucide-react';

export default function AdminActiveRequests({ assistanceRequests = [], updateAssistance, deleteAssistance }) {
    // Process real requests
    const activeRequests = assistanceRequests.map(r => {
        const isAttended = r.status === 'attended';
        const createdTime = new Date(r.createdAt);
        const diffMins = Math.floor((new Date() - createdTime) / 60000);
        
        let state = isAttended ? 'attended' : 'new';
        let label = 'NEW REQUEST';
        if (!isAttended) {
            if (diffMins > 10) { state = 'critical'; label = 'CRITICAL DELAY'; }
            else if (diffMins > 3) { state = 'urgent'; label = 'URGENT CALL'; }
        }

        return {
            id: r.id,
            table: r.tableId,
            state: state,
            label: label,
            timeLabel: isAttended ? 'ATTENDED AT' : 'REQUEST TIME',
            time: createdTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            pending: isAttended ? 'Assisted by Floor Mgr' : `Pending for ${diffMins}m`,
            buttonLeft: isAttended ? 'Marked Attended' : 'Mark as Attended',
            buttonRight: 'Clear Request'
        };
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-serif text-white mb-2 tracking-wide">Active Requests</h2>
                    <p className="text-nizam-textMuted max-w-lg leading-relaxed">Immediate digital concierge calls from guest tables requiring floor attention.</p>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-mono text-emerald-400 tracking-wider">
                        14:02
                    </h2>
                    <p className="text-[10px] font-bold text-nizam-textMuted tracking-widest uppercase mt-1">CURRENT SERVER TIME</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeRequests.length === 0 && (
                    <div className="bg-nizam-card/50 border border-nizam-border rounded-xl flex flex-col justify-center items-center min-h-[320px] text-nizam-textMuted p-6 text-center">
                        <CheckCircle className="w-10 h-10 mb-4 opacity-30 text-emerald-500" />
                        <p className="font-serif text-xl text-white mb-2">No Active Requests</p>
                        <p className="text-sm">The floor is quiet and all tables are satisfied.</p>
                    </div>
                )}
                
                {activeRequests.map((req) => (
                    <RequestCard 
                        key={req.id} 
                        req={req} 
                        onAttend={() => updateAssistance(req.id, 'attended')}
                        onClear={() => deleteAssistance(req.id)}
                    />
                ))}

                {/* Empty State / Standby Slot */}
                <div className="bg-transparent border border-dashed border-white/5 rounded-xl flex flex-col justify-center items-center min-h-[320px] text-nizam-textMuted hover:border-white/10 transition-colors">
                    <Layers className="w-8 h-8 mb-4 opacity-20" />
                    <p className="font-serif italic text-lg opacity-50 mb-1">Next Available Slot</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">STANDBY MODE</p>
                </div>

                {/* Concierge Pulse Widget */}
                <div className="bg-nizam-card border border-nizam-border rounded-xl p-8 flex flex-col xl:col-span-1">
                    <h3 className="text-xl font-serif text-white mb-8 tracking-wide">Concierge Pulse</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-sm text-nizam-textMuted font-medium">Avg. Response Time</span>
                                <span className="text-white font-bold">2m 45s</span>
                            </div>
                            <div className="h-1 w-full bg-[#111312] border border-nizam-border rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-sm text-nizam-textMuted font-medium">Success Rate</span>
                                <span className="text-white font-bold">98.2%</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#a8b8b2]">SYSTEM ONLINE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RequestCard({ req, onAttend, onClear }) {
    const isAttended = req.state === 'attended';
    return (
        <div className={`bg-nizam-card rounded-xl border relative flex flex-col p-6 transition-all shadow-xl shadow-black/20 ${
            req.state === 'critical' ? 'border-red-900/50 shadow-red-900/10' :
            req.state === 'urgent' ? 'border-nizam-gold/50 shadow-nizam-gold/10' :
            isAttended ? 'border-nizam-green/30 opacity-80' : 'border-nizam-gold/30'
        }`}>
            {/* Left Colored Accent Bar */}
            <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${
                req.state === 'critical' ? 'bg-[#991b1b]' :
                req.state === 'urgent' || req.state === 'new' ? 'bg-[#c6a87c]' :
                'bg-[#059669]'
            }`} />

            <div className="flex justify-between items-start mb-6">
                <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded shadow-sm ${
                    req.state === 'critical' ? 'bg-[#7f1d1d] text-white shadow-red-900/20' :
                    req.state === 'urgent' || req.state === 'new' ? 'bg-[#7a5c29] text-white shadow-nizam-gold/10' :
                    'bg-[#064e3b] text-[#34d399] shadow-nizam-green/10'
                }`}>
                    {req.label}
                </span>
                <div className="text-right">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#a8b8b2] mb-0.5">
                        {req.timeLabel}
                    </p>
                    <p className="font-mono text-sm text-white">{req.time}</p>
                </div>
            </div>

            <h3 className="text-4xl font-serif text-white mb-6">Table {req.table}</h3>

            <div className={`py-4 px-4 rounded flex items-center gap-4 mb-6 ${
                req.state === 'critical' ? 'bg-[#2a1313] border border-[#5c1c1c] text-[#fca5a5]' :
                isAttended ? 'bg-[#0f2a20] border border-[#14402e] text-[#6ee7b7]' :
                'bg-[#1a1813] border border-[#3d321c] text-nizam-gold'
            }`}>
                {req.state === 'critical' ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> :
                 isAttended ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> :
                 <Hourglass className="w-5 h-5 flex-shrink-0" />}
                 
                <span className="font-medium text-sm">
                    {req.pending}
                </span>
            </div>

            <div className="mt-auto flex gap-3">
                {!isAttended ? (
                    <>
                        <button 
                            onClick={onAttend}
                            className={`flex-1 py-3 px-4 rounded font-bold text-sm tracking-wide transition-colors ${
                            req.state === 'critical' 
                                ? 'bg-[#991b1b] hover:bg-red-700 text-white shadow-lg shadow-red-900/30' 
                                : 'bg-gradient-to-r from-[#173a2f] to-[#122e25] border border-[#1f4a38] text-[#a8b8b2] hover:text-white transition-all'
                        }`}>
                            {req.buttonLeft}
                        </button>
                        <button onClick={onClear} className="w-12 flex justify-center items-center bg-white/5 hover:bg-white/10 text-[#a8b8b2] hover:text-white rounded border border-white/10 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <>
                        <button disabled className="flex-1 py-3 px-4 rounded font-bold text-sm tracking-wide bg-white/5 text-[#a8b8b2] border border-white/5 cursor-not-allowed">
                            {req.buttonLeft}
                        </button>
                        <button onClick={onClear} className="flex-1 py-3 px-4 rounded font-bold text-sm tracking-wide bg-[#0a1f18] border border-[#14402e] text-[#34d399] hover:bg-[#0f2a20] transition-all shadow-inner">
                            {req.buttonRight}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
