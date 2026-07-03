import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import Products from '@/pages/Products';
import Invoices from '@/pages/Invoices';
import Locations from '@/pages/Locations';
import KYB from '@/pages/KYB';
import Settings from '@/pages/Settings';
import Notifications from '@/pages/Notifications';
import Onboarding from '@/pages/Onboarding';
import TransitTrips from '@/pages/TransitTrips';
import Reservations from '@/pages/Reservations';
import CheckIn from '@/pages/CheckIn';
import Reviews from '@/pages/Reviews';

import DineIn from '@/pages/DineIn';
import Guests from '@/pages/Guests';
import Marketing from '@/pages/Marketing';
import Finance from '@/pages/Finance';
import Showcase from '@/pages/Showcase';
import SeatMapEditor from '@/pages/SeatMapEditor';


const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRoutes() {
  const { authed, loading, bizProfile } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--az-black)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#1e1e2e] border-t-[#00d97e] rounded-full animate-spin" />
          <p className="text-sm text-[#4a4a6a]">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated but no business profile yet → onboarding
  if (!bizProfile) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*"           element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"               element={<Dashboard />} />
        <Route path="/orders"         element={<Orders />} />
        <Route path="/orders/:id"     element={<OrderDetail />} />
        <Route path="/products"       element={<Products />} />
        <Route path="/invoices"       element={<Invoices />} />
        <Route path="/locations"      element={<Locations />} />
        <Route path="/kyb"            element={<KYB />} />
        <Route path="/notifications"  element={<Notifications />} />
        <Route path="/settings"       element={<Settings />} />
        
        {/* Marketplace Routes */}
        <Route path="/transit"        element={<TransitTrips />} />
        <Route path="/reservations"   element={<Reservations />} />
        <Route path="/checkin"        element={<CheckIn />} />
        <Route path="/reviews"        element={<Reviews />} />
      </Route>
      <Route path="/login"      element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={qc}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              background: '#13131e',
              border: '1px solid #2a2a3e',
              color: '#e8e8f0',
            },
          }}
        />
      </QueryClientProvider>
    </AuthProvider>
  );
}
