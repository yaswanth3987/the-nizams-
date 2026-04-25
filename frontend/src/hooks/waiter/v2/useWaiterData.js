import { useState, useEffect, useCallback, useMemo } from 'react';
import { socket } from '../../../utils/socket';

const API_URL = import.meta.env.DEV ? `http://${window.location.hostname}:3001/api` : '/api';

export const useWaiterData = () => {
    const [tables, setTables] = useState({});
    const [activeOrders, setActiveOrders] = useState([]);
    const [assistanceRequests, setAssistanceRequests] = useState([]);
    const [menu, setMenu] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [tablesRes, ordersRes, helpRes, menuRes, sessionsRes] = await Promise.all([
                fetch(`${API_URL}/table-status`),
                fetch(`${API_URL}/new-orders`),
                fetch(`${API_URL}/assistance`),
                fetch(`${API_URL}/menu`),
                fetch(`${API_URL}/orders?statuses=confirmed,active,ready,served,billed,billing_pending`)
            ]);
            
            const [tablesData, ordersData, helpData, menuData, sessionsData] = await Promise.all([
                tablesRes.json(), ordersRes.json(), helpRes.json(), menuRes.json(), sessionsRes.json()
            ]);

            const statusMap = {};
            if (Array.isArray(tablesData)) {
                tablesData.forEach(t => {
                    if (t.tableId) statusMap[t.tableId.toUpperCase()] = t.status;
                });
            }
            setTables(statusMap);
            setAssistanceRequests(helpData.filter(r => r.status === 'pending' || r.status === 'attended'));
            setMenu(menuData);
            
            const allOrders = [
                ...(Array.isArray(ordersData) ? ordersData.map(o => ({...o, _source: 'new'})) : []), 
                ...(Array.isArray(sessionsData) ? sessionsData.map(o => ({...o, _source: 'session'})) : [])
            ].sort((a, b) => b.id - a.id);
            
            setActiveOrders(allOrders);
            setIsLoading(false);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch waiter data:', err);
            setError('Connection failed. Retrying...');
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        
        let debounceTimer;
        const refresh = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchData, 300);
        };

        const handleDelete = (data) => {
            const deleteId = typeof data === 'object' ? data.id : data;
            setActiveOrders(prev => prev.filter(o => parseInt(o.id) !== parseInt(deleteId)));
        };

        socket.on('tableStatusUpdated', refresh);
        socket.on('orderCreated', refresh);
        socket.on('orderUpdated', refresh);
        socket.on('sessionUpdated', refresh);
        socket.on('tableReset', refresh);
        socket.on('assistanceRequested', refresh);
        socket.on('assistanceUpdated', refresh);
        socket.on('orderDeleted', handleDelete);
        socket.on('sessionDeleted', handleDelete);

        return () => {
            socket.off('tableStatusUpdated', refresh);
            socket.off('orderCreated', refresh);
            socket.off('orderUpdated', refresh);
            socket.off('sessionUpdated', refresh);
            socket.off('tableReset', refresh);
            socket.off('assistanceRequested', refresh);
            socket.off('assistanceUpdated', refresh);
            socket.off('orderDeleted', handleDelete);
            socket.off('sessionDeleted', handleDelete);
        };
    }, [fetchData]);

    const deleteOrder = async (id, isRawOrder = false) => {
        const orderId = parseInt(id);
        setActiveOrders(prev => prev.filter(o => parseInt(o.id) !== orderId));
        
        try {
            const endpoint = isRawOrder ? 'new-orders' : 'sessions';
            const res = await fetch(`${API_URL}/${endpoint}/${orderId}`, { method: 'DELETE' });
            
            // If it's a session order that failed to delete on the session endpoint, try the generic orders endpoint
            if (!isRawOrder && !res.ok) {
                await fetch(`${API_URL}/orders/${orderId}`, { method: 'DELETE' });
            }
        } catch (err) {
            console.error('Delete failed:', err);
            fetchData();
        }
    };

    const updateOrderStatus = async (orderId, newStatus, source = 'session') => {
        setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        try {
            const endpoint = source === 'new' ? 'new-orders' : 'orders';
            await fetch(`${API_URL}/${endpoint}/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            console.error('Update failed:', err);
            fetchData();
        }
    };

    const updateAssistance = async (id, status) => {
        try {
            await fetch(`${API_URL}/assistance/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (err) { console.error(err); fetchData(); }
    };

    const deleteAssistance = async (id) => {
        setAssistanceRequests(prev => prev.filter(r => r.id.toString() !== id.toString()));
        try {
            await fetch(`${API_URL}/assistance/${id}`, { method: 'DELETE' });
        } catch (err) { console.error(err); fetchData(); }
    };

    const clearAssistance = async (id) => {
        setAssistanceRequests(prev => prev.filter(r => r.id.toString() !== id.toString()));
        try {
            await fetch(`${API_URL}/assistance/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });
        } catch (err) { console.error(err); fetchData(); }
    };

    const badgeCounts = useMemo(() => ({
        tables: [...new Set([...(assistanceRequests || []).map(r => (r?.tableId || '').toString().toUpperCase()), ...(activeOrders || []).filter(o => o?.status === 'ready').map(o => (o?.tableId || '').toString().toUpperCase())])].filter(Boolean).length,
        takeaway: activeOrders.filter(o => o.orderType === 'takeaway' && o.status !== 'completed').length,
        new_orders: activeOrders.filter(o => o._source === 'new' && (o.status === 'new' || o.status === 'pending')).length,
        ready: activeOrders.filter(o => o.status === 'ready').length,
        confirmed: activeOrders.filter(o => ['confirmed', 'active', 'ready', 'served'].includes(o.status) && o.orderType !== 'takeaway').length,
        billing: activeOrders.filter(o => ['billed', 'billing_pending'].includes(o.status)).length,
        alerts: assistanceRequests.filter(r => r.status === 'pending').length,
        completed: activeOrders.filter(o => o.status === 'completed' && o.orderType !== 'takeaway').length
    }), [activeOrders, assistanceRequests]);

    return {
        tables,
        activeOrders,
        assistanceRequests,
        menu,
        isLoading,
        error,
        badgeCounts,
        deleteOrder,
        updateOrderStatus,
        updateAssistance,
        deleteAssistance,
        clearAssistance,
        refreshData: fetchData
    };
};
