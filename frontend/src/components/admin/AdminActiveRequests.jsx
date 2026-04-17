import React from 'react';
import { Hourglass, AlertTriangle, CheckCircle, X, Layers, BellRing } from 'lucide-react';

export default function AdminActiveRequests({ assistanceRequests = [], updateAssistance, deleteAssistance }) {
    // Process real requests
    const activeRequests = (assistanceRequests || []).map(r => {
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

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-serif text-white mb-2 tracking-wide uppercase">Active Requests</h2>
                    <p className="text-nizam-textMuted max-w-lg leading-relaxed text-sm italic">
                        Immediate digital concierge calls from guest tables requiring floor attention.
                    </p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="bg-nizam-card/50 border border-nizam-border/30 px-6 py-2 rounded-xl shadow-lg">
                        <h2 className="text-4xl font-mono text-nizam-gold tracking-widest">
                            {currentTime}
                        </h2>
                        <p className="text-[9px] font-bold text-nizam-textMuted tracking-widest uppercase mt-1 text-center">FLOOR CLOCK</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeRequests.length === 0 && (
                    <div className="bg-nizam-card/30 border-2 border-dashed border-nizam-border/30 rounded-2xl flex flex-col justify-center items-center min-h-[320px] text-nizam-textMuted p-12 text-center shadow-inner">
                        <div className="w-20 h-20 bg-nizam-card rounded-full flex items-center justify-center mb-6 border border-nizam-border/50">
                            <CheckCircle className="w-10 h-10 opacity-10 text-emerald-500" />
                        </div>
                        <p className="font-serif text-2xl text-white/50 mb-2 italic">Peaceful Floor</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-nizam-gold/20">All guests are satisfied</p>
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

                {/* Concierge Pulse Widget */}
                {activeRequests.length > 0 && (
                    <div className="bg-nizam-card border border-nizam-border rounded-2xl p-8 flex flex-col shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-nizam-gold/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-nizam-gold/10 transition-all"></div>
                        <h3 className="text-xs font-bold text-nizam-gold uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                            <BellRing className="w-4 h-4" /> Concierge Pulse
                        </h3>
                        
                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-[10px] text-nizam-textMuted font-bold uppercase tracking-widest">Avg. Response Time</span>
                                    <span className="text-white font-mono font-bold">2m 45s</span>
                                </div>
                                <div className="h-1.5 w-full bg-nizam-dark border border-nizam-border/30 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: '85%' }}></div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-[10px] text-nizam-textMuted font-bold uppercase tracking-widest">Success Rate</span>
                                    <span className="text-emerald-500 font-mono font-bold">98.2%</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                                        <div key={i} className={`h-1 flex-1 rounded-full ${i < 10 ? 'bg-emerald-500/40' : 'bg-nizam-border/20'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.6)]"></span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-nizam-textMuted">Nizam Real-time Relay Active</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function RequestCard({ req, onAttend, onClear }) {
    const isAttended = req.state === 'attended';
    return (
        <div className={`bg-nizam-card rounded-2xl border-2 relative flex flex-col p-8 transition-all shadow-2xl group ${
            req.state === 'critical' ? 'border-red-900/40 bg-gradient-to-br from-nizam-card to-red-950/20' :
            req.state === 'urgent' ? 'border-nizam-gold/40 bg-gradient-to-br from-nizam-card to-nizam-gold/5' :
            isAttended ? 'border-emerald-900/40 opacity-80' : 'border-nizam-border/30'
        }`}>
            {/* Top Indicator */}
            <div className={`absolute top-4 right-8 flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full ${
                    req.state === 'critical' ? 'bg-red-500 animate-ping' :
                    req.state === 'urgent' ? 'bg-nizam-gold animate-pulse' :
                    isAttended ? 'bg-emerald-500' : 'bg-nizam-gold/50'
                }`}></span>
            </div>

            <div className="flex justify-between items-start mb-8">
                <span className={`text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border shadow-lg ${
                    req.state === 'critical' ? 'bg-red-900/30 text-red-100 border-red-500/30' :
                    req.state === 'urgent' || req.state === 'new' ? 'bg-nizam-gold/10 text-nizam-gold border-nizam-gold/20' :
                    'bg-emerald-900/30 text-emerald-100 border-emerald-500/20'
                }`}>
                    {req.label}
                </span>
                <div className="text-right">
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-nizam-textMuted mb-1">
                        {req.timeLabel}
                    </p>
                    <p className="font-mono text-sm text-white/80">{req.time}</p>
                </div>
            </div>

            <h3 className="text-5xl font-serif text-white mb-8 tracking-tight">Table {req.table}</h3>

            <div className={`py-5 px-6 rounded-xl flex items-center gap-4 mb-8 shadow-inner ${
                req.state === 'critical' ? 'bg-red-950/40 border border-red-900/30 text-red-200' :
                isAttended ? 'bg-emerald-950/40 border border-emerald-900/30 text-emerald-200' :
                'bg-nizam-dark/50 border border-nizam-border/30 text-nizam-gold'
            }`}>
                {req.state === 'critical' ? <AlertTriangle className="w-6 h-6 flex-shrink-0" /> :
                 isAttended ? <CheckCircle className="w-6 h-6 flex-shrink-0" /> :
                 <Hourglass className="w-6 h-6 flex-shrink-0" />}
                 
                <span className="font-bold text-[11px] uppercase tracking-widest">
                    {req.pending}
                </span>
            </div>

            <div className="mt-auto flex gap-3">
                {!isAttended ? (
                    <>
                        <button 
                            onClick={onAttend}
                            className={`flex-1 py-4 px-6 rounded-xl font-black text-[11px] tracking-[0.2em] transition-all uppercase shadow-xl ${
                            req.state === 'critical' 
                                ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/20' 
                                : 'bg-nizam-gold text-black hover:bg-white transition-all shadow-nizam-gold/20'
                        }`}>
                            {req.buttonLeft}
                        </button>
                        <button onClick={onClear} className="w-14 flex justify-center items-center bg-nizam-dark border border-nizam-border/30 hover:border-nizam-gold/50 text-nizam-textMuted hover:text-white rounded-xl transition-all group/clear">
                            <X className="w-5 h-5 group-hover/clear:rotate-90 transition-transform" />
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex-1 py-4 px-6 rounded-xl font-bold text-[11px] tracking-[0.2em] bg-nizam-dark/50 text-nizam-textMuted border border-nizam-border/20 text-center uppercase">
                            Attended
                        </div>
                        <button onClick={onClear} className="flex-1 py-4 px-6 rounded-xl font-black text-[11px] tracking-[0.2em] bg-emerald-600 text-white hover:bg-emerald-500 transition-all uppercase shadow-xl shadow-emerald-900/20">
                            Clear Call
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
