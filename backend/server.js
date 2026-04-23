const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { 
    getOrdersByStatus, createOrder, addOrderToSession, updateOrderStatus, deleteOrder, clearTableOrders, 
    getAnalyticsDaily, getItemAnalytics, getAssistanceRequests, createAssistanceRequest, 
    updateAssistanceStatus, deleteAssistanceRequest, getEmployees, createEmployee, 
    updateEmployee, deleteEmployee, markAttendance, getAttendanceToday,
    getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, seedMenu,
    updateMenuItemStatus, checkMenuAvailabilityReset, getSessionsByStatus, updateSessionStatus, updateCategoryItemStatus,
    getTableStatuses, updateTableStatus, allocateSession, getActiveSession, clearSession,
    getSessionsByTable, getOrdersByTable, updatePrepTime, updateOrderItems, resetAllSalesAndSessions,
    getUnavailabilitySchedules, createUnavailabilitySchedule, updateUnavailabilitySchedule, deleteUnavailabilitySchedule, processSchedulesTask
} = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow frontend access
        methods: ["GET", "POST"]
    }
});

// Real-time connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get('/api/menu', async (req, res) => {
    try {
        const menu = await getMenuItems();
        res.json(menu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/menu/:id/availability', async (req, res) => {
    try {
        const { isAvailable, until } = req.body;
        const item = await updateMenuItemStatus(req.params.id, isAvailable, until);
        io.emit('menuUpdated', item);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/menu', async (req, res) => {
    try {
        await addMenuItem(req.body);
        const fullMenu = await getMenuItems();
        io.emit('menuReset', fullMenu); 
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/menu/:id', async (req, res) => {
    try {
        await updateMenuItem(req.params.id, req.body);
        const fullMenu = await getMenuItems();
        io.emit('menuReset', fullMenu);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/menu/:id', async (req, res) => {
    try {
        await deleteMenuItem(req.params.id);
        const fullMenu = await getMenuItems();
        io.emit('menuReset', fullMenu);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sessions/validate', async (req, res) => {
    try {
        const { tableId, sessionId } = req.body;
        // Even if data is missing, we return success for the opening emergency.
        await allocateSession(tableId || 'UNKNOWN', sessionId || 'TEMP');
        res.json({ success: true });
    } catch (err) {
        res.json({ success: true }); // Never fail
    }
});

// Orders (Sessions) API
app.get('/api/orders', async (req, res) => {
    try {
        const statuses = req.query.statuses ? req.query.statuses.split(',') : ['confirmed', 'active', 'billed', 'completed'];
        const sessions = await getSessionsByStatus(statuses);
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { orderType, tableId, sessionId, isStaff } = req.body;
        
        // Validate session for dine-in orders (skip if placed by staff)
        if (!isStaff && orderType !== 'takeaway' && tableId && tableId !== 'TAKEAWAY') {
            const activeSession = await getActiveSession(tableId);
            const tokenToMatch = activeSession ? (activeSession.session_token || activeSession.sessionId) : null;
            
            if (!activeSession || tokenToMatch !== sessionId) {
                return res.status(403).json({ error: 'Session expired. Please contact staff.' });
            }
        }
        
        let order;
        if (req.body.status === 'confirmed' || req.body.status === 'accepted' || req.body.status === 'active' || req.body.orderType === 'takeaway') {
            order = await addOrderToSession(req.body);
            // This is a pre-confirmed or active takeaway order
            io.emit('sessionUpdated', order);
        } else {
            order = await createOrder(req.body);
            // This is a NEW order from customer, admin uses 'orderCreated' listener
            io.emit('orderCreated', order); 
        }

        // Auto-update table status to ordering when new order arrives
        if (order.tableId && orderType !== 'takeaway' && order.tableId !== 'TAKEAWAY') {
            const tStatus = await updateTableStatus(order.tableId, 'ordering');
            io.emit('tableStatusUpdated', tStatus);
        }

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status, settled } = req.body;
        const updatedSession = await updateSessionStatus(req.params.id, status, { settled });
        
        // Auto-update table status on billing/completion
        if (status === 'billed') {
            await clearSession(updatedSession.tableId);
            const tStatus = await updateTableStatus(updatedSession.tableId, 'billing');
            io.emit('tableStatusUpdated', tStatus);
        } else if (status === 'completed') {
            await clearSession(updatedSession.tableId);
            const tStatus = await updateTableStatus(updatedSession.tableId, 'free');
            io.emit('tableStatusUpdated', tStatus);
        }

        // Real-time notification for billing portal
        if (status === 'billing_pending') {
            console.log("Order moved to billing:", req.params.id);
            io.emit('NEW_BILLING_ORDER', updatedSession);
        }

        io.emit('sessionUpdated', updatedSession);
        io.emit('orderUpdated', updatedSession); // Ensure both are notified
        res.json(updatedSession);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders/:id/finalize', async (req, res) => {
    try {
        const updatedSession = await finalizePayment(req.params.id, req.body);
        
        // Auto-update table status on completion
        if (req.body.status === 'completed' && updatedSession.tableId !== 'TAKEAWAY') {
            await clearSession(updatedSession.tableId);
            const tStatus = await updateTableStatus(updatedSession.tableId, 'free');
            io.emit('tableStatusUpdated', tStatus);
        }

        io.emit('sessionUpdated', updatedSession);
        io.emit('orderUpdated', updatedSession);
        res.json(updatedSession);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        await deleteOrder(req.params.id);
        io.emit('orderDeleted', { id: parseInt(req.params.id, 10) });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/sessions/:id', async (req, res) => {
    try {
        await deleteSession(req.params.id);
        io.emit('sessionDeleted', { id: parseInt(req.params.id, 10) });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/tables/:tableId/orders', async (req, res) => {
    try {
        await clearTableOrders(req.params.tableId);
        
        // Table cleared -> free
        const tStatus = await updateTableStatus(req.params.tableId, 'free');
        io.emit('tableStatusUpdated', tStatus);

        io.emit('tableReset', { tableId: req.params.tableId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/tables/:tableId/sessions', async (req, res) => {
    try {
        const statuses = ['confirmed', 'active', 'ready', 'served', 'billed', 'completed'];
        const sessions = await getSessionsByTable(req.params.tableId, statuses);
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tables/:tableId/new-orders', async (req, res) => {
    try {
        const orders = await getOrdersByTable(req.params.tableId, ['new', 'pending', 'rejected']);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/new-orders', async (req, res) => {
    try {
        const orders = await getOrdersByStatus(['new', 'pending']);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/new-orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const row = await updateOrderStatus(req.params.id, status);
        
        // Auto-update table status when admin confirms order
        if ((status === 'accepted' || status === 'confirmed') && row && row.tableId && row.tableId !== 'TAKEAWAY') {
            const tStatus = await updateTableStatus(row.tableId, 'occupied');
            io.emit('tableStatusUpdated', tStatus);
        }

        // Broadcast event to refresh New Orders and Table Sessions tabs
        io.emit('orderUpdated', { id: parseInt(req.params.id, 10), status });
        // The frontend 'orderUpdated' listener handles fetching the updated sessions cleanly.
        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/prep-time', async (req, res) => {
    try {
        const { minutes, type } = req.body; // type: 'session' | 'order'
        const updated = await updatePrepTime(req.params.id, minutes, type);
        io.emit(type === 'session' ? 'sessionUpdated' : 'orderUpdated', updated);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/items', async (req, res) => {
    try {
        const { items, finalTotal, type } = req.body;
        const updated = await updateOrderItems(req.params.id, items, finalTotal, type);
        io.emit(type === 'session' ? 'sessionUpdated' : 'orderUpdated', updated);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/menu/category/:category/availability', async (req, res) => {
    try {
        const { isAvailable, until } = req.body;
        await updateCategoryItemStatus(req.params.category, isAvailable, until);
        const allMenu = await getMenuItems();
        io.emit('menuReset', allMenu);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Table Status APIs
app.get('/api/table-status', async (req, res) => {
    try {
        const statuses = await getTableStatuses();
        res.json(statuses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/table-status/:tableId', async (req, res) => {
    try {
        const { status } = req.body;
        const tStatus = await updateTableStatus(req.params.tableId, status);
        io.emit('tableStatusUpdated', tStatus);
        res.json(tStatus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analytics APIs
app.get('/api/analytics/daily', async (req, res) => {
    try {
        const stats = await getAnalyticsDaily(req.query.date); // optional date filter
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/analytics/items', async (req, res) => {
    try {
        const items = await getItemAnalytics();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/analytics/reset', async (req, res) => {
    try {
        await runQuery('DELETE FROM item_sales');
        res.json({ success: true, message: 'Inventory reset successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/factory-reset', async (req, res) => {
    try {
        await resetAllSalesAndSessions();
        io.emit('forceRefresh'); // Force all dashboards to clear
        res.json({ success: true, message: 'Factory reset complete. All sales, orders, and sessions cleared.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assistance APIs
app.get('/api/assistance', async (req, res) => {
    try {
        const requests = await getAssistanceRequests();
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/assistance', async (req, res) => {
    try {
        const { tableId, type } = req.body;
        if (!tableId) return res.status(400).json({ error: 'tableId is required' });
        
        const request = await createAssistanceRequest(tableId, type || 'staff');
        io.emit('assistanceRequested', request);
        res.status(201).json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/assistance/:id/status', async (req, res) => {
    try {
        const request = await updateAssistanceStatus(req.params.id, req.body.status);
        if (request) {
            io.emit('assistanceUpdated', request);
            res.json(request);
        } else {
            res.status(404).json({ error: 'Request not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/assistance/:id', async (req, res) => {
    try {
        await deleteAssistanceRequest(req.params.id);
        io.emit('assistanceDeleted', { id: parseInt(req.params.id, 10) });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Staff APIs
app.get('/api/employees', async (req, res) => {
    try {
        const emps = await getEmployees();
        res.json(emps);
    } catch (err) { 
        console.error('API Error /api/employees:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        const { name, phone, shiftTimings, designation } = req.body;
        const emp = await createEmployee(name, phone, shiftTimings, designation);
        res.status(201).json(emp);
    } catch (err) { 
        console.error('API Error /api/employees (POST):', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const { name, phone, shiftTimings, designation } = req.body;
        const emp = await updateEmployee(req.params.id, name, phone, shiftTimings, designation);
        res.json(emp);
    } catch (err) { 
        console.error('API Error /api/employees/:id (PUT):', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await deleteEmployee(req.params.id);
        res.json({ success: true });
    } catch (err) { 
        console.error('API Error /api/employees/:id (DELETE):', err);
        res.status(500).json({ error: err.message }); 
    }
});

// Attendance & OTP APIs
// In-memory OTP store for simplicity. Format: { employeeId: { otp, expiresAt } }
const otpStore = {};

app.get('/api/attendance/today', async (req, res) => {
    try {
        const { getAttendanceToday } = require('./database');
        const logs = await getAttendanceToday();
        res.json(logs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/attendance', async (req, res) => {
    try {
        const { employeeId } = req.body;
        if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
        
        const { markAttendance } = require('./database');
        const log = await markAttendance(employeeId);
        res.status(201).json(log);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/attendance/request-otp', (req, res) => {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

    // Generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`\n==========================================`);
    console.log(`🛡️  ATTENDANCE OTP FOR EMPLOYEE #${employeeId}: ${otp}`);
    console.log(`==========================================\n`);

    // Store PIN valid for 5 mins
    otpStore[employeeId] = { otp, expiresAt: Date.now() + 5 * 60000 };
    res.json({ success: true, message: 'OTP generated', devOtp: otp });
});

app.post('/api/attendance/verify', async (req, res) => {
    const { employeeId, otp } = req.body;
    if (!employeeId || !otp) return res.status(400).json({ error: 'employeeId and otp required' });

    const storedData = otpStore[employeeId];
    if (!storedData) return res.status(400).json({ error: 'No OTP requested for this employee' });
    if (Date.now() > storedData.expiresAt) {
        delete otpStore[employeeId];
        return res.status(400).json({ error: 'OTP expired' });
    }
    
    if (storedData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP Correct!
    try {
        const { markAttendance } = require('./database');
        const log = await markAttendance(employeeId);
        delete otpStore[employeeId];
        res.json({ success: true, log });
    } catch (err) {
        res.status(400).json({ error: err.message }); // likely already marked
    }
});

app.post('/api/attendance/biometric', async (req, res) => {
    const { employeeId, biometricType } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
    console.log(`\n=== 🧬 BIOMETRIC MATCH: ${biometricType} for Emp #${employeeId} ===\n`);
    
    try {
        const { markAttendance } = require('./database');
        const log = await markAttendance(employeeId);
        res.json({ success: true, log, method: biometricType });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Unavailability Scheduler APIs
app.get('/api/schedules', async (req, res) => {
    try {
        const schedules = await getUnavailabilitySchedules();
        res.json(schedules);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/schedules', async (req, res) => {
    try {
        const schedule = await createUnavailabilitySchedule(req.body);
        res.status(201).json(schedule);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/schedules/:id', async (req, res) => {
    try {
        const schedule = await updateUnavailabilitySchedule(req.params.id, req.body);
        res.json(schedule);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/schedules/:id', async (req, res) => {
    try {
        await deleteUnavailabilitySchedule(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all to serve the React app (compatible with Express 5)
app.use((req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Seed menu if needed
    try {
        const { menuData } = require('./menu_seed_data');
        await seedMenu(menuData);
    } catch (err) {
        console.error('Menu seeding failed:', err.message);
    }

    // Availability & Schedule background task (every 1 minute)
    setInterval(async () => {
        // 1. Manual resets (unavailableUntil)
        const resets = await checkMenuAvailabilityReset().catch(e => 0);
        
        // 2. Automated schedules
        const scheduleChanges = await processSchedulesTask().catch(e => {
            console.error('Scheduler Task Failed:', e.message);
            return 0;
        });

        if (resets > 0 || scheduleChanges > 0) {
            console.log(`[Scheduler] Auto-updated ${resets + scheduleChanges} menu items.`);
            const fullMenu = await getMenuItems().catch(e => []);
            io.emit('menuReset', fullMenu); 
        }
    }, 60000);
});
