const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { getOrdersByStatus, createOrder, updateOrderStatus, deleteOrder, clearTableOrders, getAnalyticsDaily, getItemAnalytics, getAssistanceRequests, createAssistanceRequest, updateAssistanceStatus, deleteAssistanceRequest } = require('./database');

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

// Menu items API (Mocked array)
const mockMenu = [
    { id: 'm1', name: 'Nizam Special Biryani', price: 12.50, category: 'Mains', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop' },
    { id: 'm2', name: 'Chicken Tikka Masala', price: 10.95, category: 'Mains', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop' },
    { id: 'm3', name: 'Garlic Naan', price: 2.95, category: 'Sides', image: 'https://images.unsplash.com/photo-1626200419188-f1523a661fbc?q=80&w=600&auto=format&fit=crop' },
    { id: 'm4', name: 'Paneer Butter Masala', price: 9.50, category: 'Mains', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?q=80&w=600&auto=format&fit=crop' },
    { id: 'm5', name: 'Samosa (2pcs)', price: 4.50, category: 'Starters', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop' },
    { id: 'm6', name: 'Mango Lassi', price: 3.50, category: 'Drinks', image: 'https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=600&auto=format&fit=crop' }
];

app.get('/api/menu', (req, res) => {
    res.json(mockMenu);
});

// Orders API
app.get('/api/orders', async (req, res) => {
    try {
        const statuses = req.query.statuses ? req.query.statuses.split(',') : ['new', 'confirmed', 'billed', 'completed'];
        const orders = await getOrdersByStatus(statuses);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const order = await createOrder(req.body);
        io.emit('orderCreated', order);
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const updatedOrder = await updateOrderStatus(req.params.id, req.body.status);
        io.emit('orderUpdated', updatedOrder);
        res.json(updatedOrder);
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

app.delete('/api/tables/:tableId/orders', async (req, res) => {
    try {
        await clearTableOrders(req.params.tableId);
        io.emit('tableReset', { tableId: req.params.tableId });
        res.json({ success: true });
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
        const { tableId } = req.body;
        if (!tableId) return res.status(400).json({ error: 'tableId is required' });
        
        const request = await createAssistanceRequest(tableId);
        io.emit('assistanceRequested', request);
        res.status(201).json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/assistance/:id/status', async (req, res) => {
    try {
        const request = await updateAssistanceStatus(req.params.id, req.body.status);
        if (request) io.emit('assistanceUpdated', request);
        res.json(request);
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

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all to serve the React app (compatible with Express 5)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
