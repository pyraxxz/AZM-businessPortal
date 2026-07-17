import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
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
import FinanceV2 from '@/pages/FinanceV2';
import Showcase from '@/pages/Showcase';
import Employees from '@/pages/employees/Employees';
import Scheduling from '@/pages/employees/Scheduling';
import Payroll from '@/pages/employees/Payroll';
import TimeOff from '@/pages/employees/TimeOff';
import HotelRooms from '@/pages/HotelRooms';
import HotelHousekeeping from '@/pages/HotelHousekeeping';
import HotelFrontDesk from '@/pages/HotelFrontDesk';
import RestaurantKitchen from '@/pages/RestaurantKitchen';
import RestaurantTables from '@/pages/RestaurantTables';
import TransitFleet from '@/pages/TransitFleet';
import TransitDrivers from '@/pages/TransitDrivers';
import TransitManifests from '@/pages/TransitManifests';
import TransitCargo from '@/pages/TransitCargo';
import RestaurantInventory from '@/pages/RestaurantInventory';
import Messages from '@/pages/Messages';
import { AppBackground } from '@/components/AppBackground';
import Analytics from '@/pages/Analytics';
import Developer from '@/pages/settings/Developer';
import BusinessGroups from '@/pages/BusinessGroups';
import POS from '@/pages/POS';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRoutes() {
  const { authed, loading, bizProfile, isAdmin } = useAuth();

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

  if (!isAdmin && !bizProfile) {
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
        <Route path="/messages"       element={<Messages />} />
        <Route path="/settings"       element={<Settings />} />
        <Route path="/transit"              element={<TransitTrips />} />
        <Route path="/reservations"         element={<Reservations />} />
        <Route path="/checkin"              element={<CheckIn />} />
        <Route path="/reviews"              element={<Reviews />} />
        <Route path="/dine-in"              element={<DineIn />} />
        <Route path="/guests"               element={<Guests />} />
        <Route path="/marketing"            element={<Marketing />} />
        <Route path="/finance"              element={<FinanceV2 />} />
        <Route path="/seat-map"             element={<Navigate to="/transit" replace />} />
        <Route path="/showcase"             element={<Showcase />} />
        <Route path="/employees"            element={<Employees />} />
        <Route path="/scheduling"         element={<Scheduling />} />
        <Route path="/payroll"            element={<Payroll />} />
        <Route path="/time-off"           element={<TimeOff />} />
        <Route path="/hotel-rooms"          element={<HotelRooms />} />
        <Route path="/hotel-housekeeping"   element={<HotelHousekeeping />} />
        <Route path="/hotel-front-desk"     element={<HotelFrontDesk />} />
        <Route path="/restaurant-kitchen"   element={<RestaurantKitchen />} />
        <Route path="/restaurant-tables"    element={<RestaurantTables />} />
        <Route path="/transit-fleet"        element={<TransitFleet />} />
        <Route path="/transit-drivers"      element={<TransitDrivers />} />
        <Route path="/transit-manifests"    element={<TransitManifests />} />
        <Route path="/transit-cargo"         element={<TransitCargo />} />
        <Route path="/restaurant-inventory" element={<RestaurantInventory />} />
        <Route path="/analytics"            element={<Analytics />} />
        <Route path="/pos"                   element={<POS />} />
        <Route path="/settings/developer"   element={<Developer />} />
        <Route path="/groups"               element={<BusinessGroups />} />
      </Route>
      <Route path="/login"      element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppBackground />
      <AuthProvider>
        <QueryClientProvider client={qc}>
          <ToastProvider>
            <Router>
              <AppRoutes />
            </Router>
            <Toaster 
              richColors 
              position="top-center" 
              expand={true}
              toastOptions={{
                className: 'sentry-toast',
                style: {
                  background: 'var(--sn-card)',
                  border: '1px solid var(--sn-border)',
                  color: 'var(--sn-text-primary)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'var(--sn-shadow)',
                },
              }}
            />
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
