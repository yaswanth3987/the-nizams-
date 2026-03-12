import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerMenu from './pages/CustomerMenu';
import AdminDashboard from './pages/AdminDashboard';
import KitchenDisplay from './pages/KitchenDisplay';
import { socket } from './utils/socket';

function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    return () => {
      socket.off('connect');
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-text text-primary font-sans">
        <Routes>
          <Route path="/menu" element={<CustomerMenu />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/kitchen" element={<KitchenDisplay />} />
          <Route path="*" element={<Navigate to="/menu?table=T01" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
