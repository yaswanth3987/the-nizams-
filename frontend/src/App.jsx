import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerMenu from './pages/CustomerMenu';
import AdminDashboard from './pages/AdminDashboard';
import KitchenDisplay from './pages/KitchenDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import { socket } from './utils/socket';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/menu" element={<CustomerMenu />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/kitchen" element={<KitchenDisplay />} />
          {/* Default catch-all */}
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
