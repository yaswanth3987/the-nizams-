const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const ExcelJS = require('exceljs');
const multer = require('multer');
const fs = require('fs');
const { 
    getOrdersByStatus, createOrder, addOrderToSession, updateOrderStatus, deleteOrder, deleteNewOrder, clearTableOrders,
    getAnalyticsDaily, getItemAnalytics, getAssistanceRequests, createAssistanceRequest, 
    updateAssistanceStatus, deleteAssistanceRequest, getEmployees, createEmployee, 
    updateEmployee, deleteEmployee, markAttendance, getAttendanceToday, checkoutAttendance,
    getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, seedMenu, finalizePayment,
    updateMenuItemStatus, checkMenuAvailabilityReset, getSessionsByStatus, updateSessionStatus, updateCategoryItemStatus,
    getTableStatuses, updateTableStatus, allocateSession, getActiveSession, clearSession,
    getSessionsByTable, getOrdersByTable, updatePrepTime, updateOrderItems, resetAllSalesAndSessions,
    getUnavailabilitySchedules, createUnavailabilitySchedule, updateUnavailabilitySchedule, deleteUnavailabilitySchedule, processSchedulesTask,
    getInventory, updateSessionServiceCharge, deleteSession, deleteItemSale, transferTableSession
} = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Image Upload Configuration
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(uploadDir));

app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

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
            const tStatus = await updateTableStatus(updatedSession.tableId, 'billing');
            io.emit('tableStatusUpdated', tStatus);
        } else if (status === 'completed') {
            await clearSession(updatedSession.tableId);
            const tStatus = await updateTableStatus(updatedSession.tableId, 'free');
            io.emit('tableStatusUpdated', tStatus);
        }

        // Real-time notification for billing portal
        if (status === 'billing_pending' || status === 'billed') {
            console.log("Order moved to billing:", req.params.id);
            if (updatedSession.tableId !== 'TAKEAWAY') {
                await updateTableStatus(updatedSession.tableId, 'billing');
            }
            io.emit('NEW_BILLING_ORDER', updatedSession);
            if (updatedSession.tableId !== 'TAKEAWAY') {
                io.emit('tableStatusUpdated', { tableId: updatedSession.tableId, status: 'billing' });
            }
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

app.delete('/api/new-orders/:id', async (req, res) => {
    try {
        await deleteNewOrder(req.params.id);
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

app.post('/api/tables/:tableId/transfer', async (req, res) => {
    try {
        const oldTableId = req.params.tableId;
        const { destinationTableId } = req.body;
        
        if (!destinationTableId) {
            return res.status(400).json({ error: 'destinationTableId is required' });
        }

        const result = await transferTableSession(oldTableId, destinationTableId);
        
        // Notify clients about the table updates
        io.emit('tableStatusUpdated', { tableId: oldTableId, status: 'free' });
        io.emit('tableStatusUpdated', result.newStatus);
        
        // Emit a general event so clients can refresh their data
        io.emit('tableTransferred', { oldTableId, newTableId: destinationTableId });
        // Force refresh for other clients
        io.emit('forceRefresh');

        res.json({ success: true, newTableId: destinationTableId });
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
        const statusesStr = req.query.statuses;
        const statuses = statusesStr ? statusesStr.split(',') : ['new', 'pending'];
        const orders = await getOrdersByStatus(statuses);
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
 
        // Trigger billing event if moved to settlement
        if (status === 'billing_pending' || status === 'billed') {
            io.emit('NEW_BILLING_ORDER', row);
            if (row.tableId && row.tableId !== 'TAKEAWAY') {
                await updateTableStatus(row.tableId, 'billing');
            }
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
app.put('/api/orders/:id/service-charge', async (req, res) => {
    try {
        const order = await updateSessionServiceCharge(req.params.id, req.body.enabled);
        io.emit('sessionUpdated', order);
        res.json(order);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/inventory', async (req, res) => {
    try {
        const inventory = await getInventory();
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/download-inventory', async (req, res) => {
    try {
        const inventory = await getInventory();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventory');

        worksheet.columns = [
            { header: 'Item Name', key: 'name', width: 25 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Quantity', key: 'stock', width: 12 },
            { header: 'Unit', key: 'unit', width: 10 },
            { header: 'Cost Price', key: 'price', width: 15 },
            { header: 'Total Value', key: 'total', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { horizontal: 'center' };

        inventory.forEach(item => {
            const stock = parseFloat(item.stock || 0);
            const price = parseFloat(item.price || 0);
            const minStock = parseFloat(item.minStock || 10);
            const total = stock * price;
            const status = stock <= minStock ? 'LOW STOCK' : 'IN STOCK';

            const row = worksheet.addRow({
                name: item.name,
                category: item.category,
                stock: stock,
                unit: item.unit,
                price: price,
                total: total,
                status: status
            });

            if (status === 'LOW STOCK') {
                row.getCell('status').font = { color: { argb: 'FFFF0000' }, bold: true };
            }
        });

        const totalInventoryValue = inventory.reduce((sum, item) => sum + (parseFloat(item.stock || 0) * parseFloat(item.price || 0)), 0);
        worksheet.addRow({});
        worksheet.addRow({ name: 'TOTAL INVENTORY VALUE', total: totalInventoryValue }).font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Inventory_Report_' + new Date().toISOString().split('T')[0] + '.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Inventory Download Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/download-detailed-report', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // New attendance report endpoint added below
        // Fetch all settled orders within range or all if not specified
        let query = 'SELECT * FROM table_sessions WHERE settled = true';
        let params = [];
        if (startDate && endDate) {
            query += ' AND createdAt >= ? AND createdAt <= ?';
            params = [startDate, endDate];
        }
        const orders = await runQuery(query, params);

        const workbook = new ExcelJS.Workbook();
        
        // 1. Table-wise Breakdown
        const tableSheet = workbook.addWorksheet('Table-wise Breakdown');
        tableSheet.columns = [
            { header: 'Table ID', key: 'tableId', width: 15 },
            { header: 'Total Orders', key: 'orders', width: 12 },
            { header: 'Total Revenue', key: 'revenue', width: 15 },
            { header: 'Service Charge', key: 'sc', width: 15 },
            { header: 'Avg Bill', key: 'avg', width: 15 }
        ];

        const tableMetrics = {};
        orders.forEach(o => {
            if (!tableMetrics[o.tableId]) {
                tableMetrics[o.tableId] = { orders: 0, revenue: 0, sc: 0 };
            }
            tableMetrics[o.tableId].orders += 1;
            tableMetrics[o.tableId].revenue += parseFloat(o.finalTotal || 0);
            tableMetrics[o.tableId].sc += parseFloat(o.serviceCharge || 0);
        });

        Object.keys(tableMetrics).forEach(tid => {
            const m = tableMetrics[tid];
            tableSheet.addRow({
                tableId: tid,
                orders: m.orders,
                revenue: m.revenue,
                sc: m.sc,
                avg: m.revenue / m.orders
            });
        });

        // 2. Section Breakdown
        const sectionSheet = workbook.addWorksheet('Section Breakdown');
        sectionSheet.columns = [
            { header: 'Section', key: 'section', width: 20 },
            { header: 'Total Revenue', key: 'revenue', width: 20 }
        ];

        const getSection = (tid) => {
            const t = tid.toUpperCase();
            if (t.includes('BOX') || t.startsWith('B')) return 'Boxes';
            if (t.includes('CH') || t.startsWith('C')) return 'Chowkie';
            if (t === 'TAKEAWAY') return 'Takeaway';
            return 'Main Dining';
        };

        const sectionMetrics = { Boxes: 0, Chowkie: 0, Takeaway: 0, 'Main Dining': 0 };
        orders.forEach(o => {
            const section = getSection(o.tableId);
            sectionMetrics[section] += parseFloat(o.finalTotal || 0);
        });

        Object.keys(sectionMetrics).forEach(s => {
            sectionSheet.addRow({ section: s, revenue: sectionMetrics[s] });
        });

        // 3. Raw Orders Data
        const rawSheet = workbook.addWorksheet('Daily Sales List');
        rawSheet.columns = [
            { header: 'Order ID', key: 'id', width: 10 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Table', key: 'tableId', width: 15 },
            { header: 'Final Total', key: 'total', width: 15 },
            { header: 'Service Charge', key: 'sc', width: 15 }
        ];

        orders.forEach(o => {
            rawSheet.addRow({
                id: o.id,
                date: o.createdAt,
                tableId: o.tableId,
                total: o.finalTotal,
                sc: o.serviceCharge
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Detailed_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Report Download Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Attendance Report Download Endpoint
app.get('/api/download-attendance-report', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = 'SELECT * FROM attendance';
        const params = [];
        if (startDate && endDate) {
            query += ' WHERE date >= ? AND date <= ?';
            params.push(startDate, endDate);
        }
        const result = await runQuery(query, params);
        const rows = result.rows;

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Attendance Report');
        sheet.columns = [
            { header: 'Employee ID', key: 'employeeId', width: 15 },
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Check In', key: 'checkInTime', width: 22 },
            { header: 'Check Out', key: 'checkOutTime', width: 22 },
            { header: 'Verified', key: 'verified', width: 10 }
        ];
        sheet.getRow(1).font = { bold: true };
        rows.forEach(row => {
            sheet.addRow({
                employeeId: row.employeeId,
                date: row.date,
                checkInTime: row.checkInTime,
                checkOutTime: row.checkOutTime,
                verified: row.verified ? 'Yes' : 'No'
            });
        });
        const filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Attendance Report Download Error:', err);
        res.status(500).json({ error: err.message });
    }
});

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
        await runQuery('DELETE FROM daily_sales');
        await runQuery('DELETE FROM inventory');
        res.json({ success: true, message: 'Inventory and Sales data reset successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/item-sales/:id', async (req, res) => {
    try {
        await deleteItemSale(req.params.id);
        res.json({ success: true });
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
        const { name, phone, shiftTimings, designation, pin } = req.body;
        const emp = await createEmployee(name, phone, shiftTimings, designation, pin);
        res.status(201).json(emp);
    } catch (err) { 
        console.error('API Error /api/employees (POST):', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const { name, phone, shiftTimings, designation, pin } = req.body;
        const emp = await updateEmployee(req.params.id, name, phone, shiftTimings, designation, pin);
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
        const { employeeId, pin } = req.body;
        if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
        
        const log = await markAttendance(employeeId, pin);
        res.status(201).json(log);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/attendance/checkout', async (req, res) => {
    try {
        const { employeeId, pin } = req.body;
        if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
        
        const log = await checkoutAttendance(employeeId, pin);
        res.json(log);
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
    console.log(`Ã°Å¸â€ºÂ¡Ã¯Â¸Â  ATTENDANCE OTP FOR EMPLOYEE #${employeeId}: ${otp}`);
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
    console.log(`\n=== 🧪 BIOMETRIC MATCH: ${biometricType} for Emp #${employeeId} ===\n`);
    
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

    // ANTI-SLEEP KEEP-ALIVE: Prevent Render Free Tier from spinning down and causing intermittent 1034/502 errors
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://the-nizams.onrender.com';
    setInterval(() => {
        const https = require('https');
        console.log(`[Keep-Alive] Pinging ${RENDER_EXTERNAL_URL} to prevent sleep cycle...`);
        https.get(`${RENDER_EXTERNAL_URL}/api/menu`, (res) => {
            if (res.statusCode === 200) {
                console.log('[Keep-Alive] Server is awake.');
            }
        }).on('error', (err) => {
            console.error('[Keep-Alive] Error:', err.message);
        });
    }, 14 * 60 * 1000); // Ping every 14 minutes (Render sleeps after 15)
});
