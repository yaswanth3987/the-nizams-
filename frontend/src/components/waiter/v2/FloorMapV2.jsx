import React from 'react';

const FloorMapV2 = ({ 
    tables, 
    activeOrders, 
    assistanceRequests, 
    onTableSelect 
}) => {
    const tTables = Array.from({length: 4}, (_, i) => `T${String(i+1).padStart(2, '0')}`);
    const bTables = Array.from({length: 6}, (_, i) => `B${String(i+1).padStart(2, '0')}`);
    const cTables = Array.from({length: 13}, (_, i) => `C${String(i+1).padStart(2, '0')}`);

    const getTableColor = (tableId) => {
        const normalizedId = tableId.toString().toUpperCase();
        
        const needsHelp = (assistanceRequests || []).some(r => {
            const rId = (r.tableId || '').toString().toUpperCase();
            return rId === normalizedId && r.status === 'pending';
        });
        if (needsHelp) return 'bg-blue-600 border-blue-400 text-white animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.4)]';
        
        const hasReadyOrder = (activeOrders || []).some(o => {
            const oId = (o.tableId || '').toString().toUpperCase();
            return oId === normalizedId && o.status === 'ready';
        });
        if (hasReadyOrder) return 'bg-[#FFD700] border-[#FFD700] text-[#0a261f] animate-pulse shadow-[0_0_25px_rgba(255,215,0,0.6)]';

        const status = (tables[normalizedId] || 'free').toLowerCase();
        switch (status) {
            case 'free': return 'bg-white/5 border-white/10 text-[#86a69d] hover:bg-white/10';
            case 'ordering': return 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]';
            case 'occupied': return 'bg-red-500/10 border-red-500/30 text-red-400';
            case 'billing': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
            default: return 'bg-white/5 border-white/10 text-[#86a69d]';
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-black/10">
            <header className="px-8 py-8 border-b border-white/5 bg-[#0F3A2F]/40 backdrop-blur-md shrink-0">
                <h1 className="text-4xl font-serif font-black text-white italic tracking-tighter uppercase">Floor Mapping</h1>
                <p className="text-[#86a69d] text-[10px] font-black uppercase tracking-[0.3em] mt-2">Real-time table occupancy</p>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain p-8 no-scrollbar pb-32">
                {[{ title: 'Royal Tables', data: tTables }, { title: 'Private Boxes', data: bTables }, { title: 'Heritage Chowkies', data: cTables }].map(section => {
                    const sectionAlerts = section.data.filter(tableId => {
                        const normalizedId = tableId.toUpperCase();
                        return (assistanceRequests || []).some(r => (r.tableId || '').toString().toUpperCase() === normalizedId && r.status === 'pending') || 
                               (activeOrders || []).some(o => (o.tableId || '').toString().toUpperCase() === normalizedId && o.status === 'ready');
                    }).length;

                    return (
                        <div key={section.title} className="mb-16">
                            <h2 className="text-[#FFD700] text-xs font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-6">
                                <span className="flex items-center gap-4 shrink-0">
                                    {section.title}
                                    {sectionAlerts > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse tracking-normal">
                                            {sectionAlerts} ALERT
                                        </span>
                                    )}
                                </span>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                                {section.data.map(t => {
                                    const tableOrders = (activeOrders || []).filter(o => (o.tableId || '').toString().toUpperCase() === t.toUpperCase() && o.status !== 'completed' && o.status !== 'rejected');
                                    const tableTotal = tableOrders.reduce((sum, o) => sum + Number(o.finalTotal || 0), 0);
                                    
                                    return (
                                        <button 
                                            key={t}
                                            onClick={() => onTableSelect(t)}
                                            className={`aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all active:scale-90 shadow-xl ${getTableColor(t)}`}
                                        >
                                            <span className="text-4xl font-serif font-black italic">{t}</span>
                                            {tableTotal > 0 ? (
                                                <span className="text-[10px] font-black text-white/90 mt-2 bg-black/40 px-3 py-1 rounded-xl">£{tableTotal.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase opacity-40 mt-2 tracking-widest">{tables[t.toUpperCase()] || 'Free'}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(FloorMapV2);
