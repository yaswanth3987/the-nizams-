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
            type: r.type || 'staff',
            state: state,
            label: r.type === 'bill' ? 'BILL REQUEST' : label,
            timeLabel: isAttended ? 'ATTENDED AT' : 'REQUEST TIME',
            time: createdTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            pending: isAttended ? 'Assisted by Floor Mgr' : `Pending for ${diffMins}m`,
            buttonLeft: isAttended ? 'Marked Attended' : 'Mark as Attended',
            buttonRight: 'Clear Request'
        };
    });

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-5xl font-serif text-white mb-2 font-bold italic">Assistance Hub</h2>
                    <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                        Instant concierge calls from table sessions requiring floor attention.
                    </p>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-serif text-white/90 font-bold italic">
                        {currentTime}
                    </h2>
                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">Global Server Time</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8">
                {activeRequests.length === 0 && (
                    <div className="bg-nizam-card/30 border border-white/5 rounded-3xl flex flex-col justify-center items-center h-[420px] text-nizam-textMuted p-12 text-center shadow-inner">
                        <div className="w-20 h-20 bg-nizam-card rounded-full flex items-center justify-center mb-6 border border-nizam-gold/10">
                            <CheckCircle className="w-10 h-10 opacity-10 text-nizam-gold" />
                        </div>
                        <p className="font-serif text-3xl text-white/50 mb-2 font-bold tracking-tight">Peaceful Floor</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 uppercase">All guests are satisfied</p>
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
                <div className="bg-[#111311] border border-white/5 rounded-[2rem] p-10 flex flex-col shadow-2xl relative overflow-hidden">
                    <h3 className="text-2xl font-serif text-[#9ab0a8] mb-10 flex items-center gap-2 font-bold tracking-tight">
                        Concierge Pulse
                    </h3>
                    
                    <div className="space-y-10">
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">Avg. Response Time</span>
                                <span className="text-white font-mono font-bold text-lg">2m 45s</span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-[#9ab0a8] rounded-full shadow-[0_0_15px_rgba(154,176,168,0.3)]" style={{ width: '85%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">Success Rate</span>
                                <span className="text-white font-mono font-bold text-lg">98.2%</span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-[#9ab0a8] rounded-full" style={{ width: '98%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-10 flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#9ab0a8] animate-pulse"></span>
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 font-bold">SYSTEM ONLINE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RequestCard({ req, onAttend, onClear }) {
    const isAttended = req.state === 'attended';
    const isCritical = req.state === 'critical';
    const isUrgent = req.state === 'urgent';

    return (
        <div className={`bg-[#111311] rounded-[2rem] border relative flex flex-col p-10 transition-all shadow-2xl overflow-hidden group ${
            isCritical ? 'border-[#7f1d1d]/40 animate-pulse-gold' : 
            isUrgent ? 'border-nizam-gold/40 shadow-[inset_0_0_40px_rgba(198,168,124,0.05)] animate-pulse-gold' : 
            !isAttended ? 'border-accent/30 animate-pulse-gold' :
            'border-white/5'
        }`}>
            {/* Left accent bar for critical/urgent */}
            {(isCritical || isUrgent) && (
                <div className={`absolute top-10 bottom-10 left-0 w-1.5 rounded-r-full ${isCritical ? 'bg-[#7f1d1d]' : 'bg-nizam-gold'}`}></div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                        req.type === 'bill' ? 'bg-nizam-gold text-black border-transparent shadow-[0_0_15px_rgba(198,168,124,0.3)]' :
                        isCritical ? 'bg-red-500 text-white border-transparent' :
                        isUrgent ? 'bg-accent text-black border-transparent' :
                        isAttended ? 'bg-white/5 text-white/40 border-white/10' :
                        'bg-accent text-black border-transparent'
                    }`}>
                        {req.label}
                    </span>
                    {!isAttended && (
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent animate-bell-ring">
                            <BellRing size={14} />
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-white/20 mb-1">
                        {req.timeLabel}
                    </p>
                    <p className="font-serif text-lg text-white font-bold italic">{req.time}</p>
                </div>
            </div>

            <h3 className="text-4xl font-serif text-white mb-8 font-bold italic">Table {req.table}</h3>

            <div className="bg-white/5 rounded-2xl py-4 px-6 flex items-center gap-4 mb-8 border border-white/10">
                {req.type === 'bill' ? <CheckCircle className="w-5 h-5 text-nizam-gold" /> : isAttended ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : isCritical ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Hourglass className="w-5 h-5 text-accent" />}
                <span className="font-bold text-xs text-white/70 uppercase tracking-wide">
                    {req.type === 'bill' ? 'Customer requesting bill' : req.pending}
                </span>
            </div>

            <div className="mt-auto flex gap-4">
                {!isAttended ? (
                    <>
                        <button 
                            onClick={onAttend}
                            className={`flex-1 py-5 px-8 rounded-xl font-black text-[13px] tracking-[0.1em] transition-all uppercase shadow-2xl flex items-center justify-center ${
                            isCritical ? 'bg-[#7f1d1d] text-white hover:bg-[#991b1b]' :
                            'bg-gradient-to-r from-[#2c5b4d] to-[#1a3d34] text-white hover:brightness-125'
                        }`}>
                            Mark as Attended
                        </button>
                        <button onClick={onClear} className="w-16 h-16 flex justify-center items-center bg-white/5 border border-white/10 hover:border-white/20 text-white/40 hover:text-white rounded-xl transition-all">
                            <X size={24} />
                        </button>
                    </>
                ) : (
                    <>
                        <button className="flex-1 py-5 px-8 rounded-xl font-black text-[13px] tracking-[0.1em] bg-white/5 text-white/20 border border-white/10 text-center uppercase cursor-default">
                            Marked Attended
                        </button>
                        <button onClick={onClear} className="flex-1 py-5 px-8 rounded-xl font-black text-[13px] tracking-[0.1em] border-2 border-[#2c5b4d]/40 text-[#9ab0a8] hover:bg-[#2c5b4d]/10 transition-all uppercase">
                            Clear Request
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
