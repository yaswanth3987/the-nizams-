import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerMenu from './pages/CustomerMenu';
import AdminDashboard from './pages/AdminDashboard';
import KitchenDisplay from './pages/KitchenDisplay';
import WaitersPortal from './pages/WaitersPortal';
import BillingPortal from './pages/BillingPortal';
import ErrorBoundary from './components/ErrorBoundary';
import { SoundProvider } from './context/SoundContext';

function App() {
  return (
    <ErrorBoundary>
      <SoundProvider>
        <Router>
          <Routes>
            <Route path="/" element={<CustomerMenu />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/kitchen" element={<KitchenDisplay />} />
            <Route path="/waiter" element={<WaitersPortal />} />
            <Route path="/billing" element={<BillingPortal />} />
            {/* Default catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SoundProvider>
    </ErrorBoundary>
  );
}

export default App;
