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
        <div className="flex h-screen bg-primary text-white overflow-hidden selection:bg-accent/20 antialiased font-sans">
            <AdminSidebar 
                activeView={activeView} 
                onViewChange={onViewChange} 
                onRefresh={onRefresh} 
                counts={counts}
            />
            <div className="flex-1 flex flex-col min-w-0 bg-primary">
                <AdminTopHeader 
                    title={title}
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    unreadAlerts={unreadAlerts}
                    onClearAlerts={onClearAlerts}
                />
                <main className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
                    <div className="max-w-[1800px] mx-auto space-y-12">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
