import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopHeader from './AdminTopHeader';

export default function AdminLayout({ 
    activeView, onViewChange, onRefresh,
    title, tabs, activeTab, onTabChange,
    unreadAlerts, onClearAlerts,
    counts,
    children 
}) {
    return (
        <div className="flex h-screen bg-nizam-dark text-nizam-text overflow-hidden selection:bg-nizam-gold/20 antialiased font-sans">
            <AdminSidebar 
                activeView={activeView} 
                onViewChange={onViewChange} 
                onRefresh={onRefresh} 
                counts={counts}
            />
            <div className="flex-1 flex flex-col min-w-0 bg-nizam-dark">
                <AdminTopHeader 
                    title={title}
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    unreadAlerts={unreadAlerts}
                    onClearAlerts={onClearAlerts}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-[1600px] mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
