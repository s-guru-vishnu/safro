import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import { Toaster } from 'react-hot-toast';
import SafronChatbot from './components/SafronChatbot';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import GoogleCallback from './pages/auth/GoogleCallback';

// Rider
import RiderHome from './pages/rider/Home';
import RiderTracking from './pages/rider/Tracking';
import RiderHistory from './pages/rider/History';
import RiderProfile from './pages/rider/Profile';
import RiderSOS from './pages/rider/SOS';

// Driver
import DriverDashboard from './pages/driver/Dashboard';
import DriverRequests from './pages/driver/Requests';
import DriverNavigation from './pages/driver/Navigation';
import DriverEarnings from './pages/driver/Earnings';
import DriverProfile from './pages/driver/Profile';

// Driver Registration
import DriverRegister from './pages/driver-register/DriverRegister';
import DriverSubmitted from './pages/driver-register/DriverSubmitted';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminRides from './pages/admin/Rides';
import AdminUsers from './pages/admin/Users';
import AdminAlerts from './pages/admin/Alerts';
import AdminCreateDriver from './pages/admin/CreateDriver';
import AdminProfile from './pages/admin/Profile';



const HIDE_NAVBAR_PATHS = ['/driver/register', '/driver/submitted'];

function AppContent() {
  const location = useLocation();
  const showNavbar = !HIDE_NAVBAR_PATHS.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/auth/google/callback" element={<GuestRoute><GoogleCallback /></GuestRoute>} />

        {/* Driver Registration (rider applies) */}
        <Route path="/driver/register" element={<ProtectedRoute allowedRoles={['rider']}><DriverRegister /></ProtectedRoute>} />
        <Route path="/driver/submitted" element={<ProtectedRoute allowedRoles={['rider']}><DriverSubmitted /></ProtectedRoute>} />

        {/* Rider Routes */}
        <Route path="/rider/home" element={<ProtectedRoute allowedRoles={['rider']}><RiderHome /></ProtectedRoute>} />
        <Route path="/rider/tracking" element={<ProtectedRoute allowedRoles={['rider']}><RiderTracking /></ProtectedRoute>} />
        <Route path="/rider/history" element={<ProtectedRoute allowedRoles={['rider']}><RiderHistory /></ProtectedRoute>} />
        <Route path="/rider/profile" element={<ProtectedRoute allowedRoles={['rider']}><RiderProfile /></ProtectedRoute>} />
        <Route path="/rider/sos" element={<ProtectedRoute allowedRoles={['rider']}><RiderSOS /></ProtectedRoute>} />

        {/* Driver Routes */}
        <Route path="/driver/dashboard" element={<ProtectedRoute allowedRoles={['driver']}><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/requests" element={<ProtectedRoute allowedRoles={['driver']}><DriverRequests /></ProtectedRoute>} />
        <Route path="/driver/navigation" element={<ProtectedRoute allowedRoles={['driver']}><DriverNavigation /></ProtectedRoute>} />
        <Route path="/driver/earnings" element={<ProtectedRoute allowedRoles={['driver']}><DriverEarnings /></ProtectedRoute>} />
        <Route path="/driver/profile" element={<ProtectedRoute allowedRoles={['driver']}><DriverProfile /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/create-driver" element={<ProtectedRoute allowedRoles={['admin']}><AdminCreateDriver /></ProtectedRoute>} />
        <Route path="/admin/rides" element={<ProtectedRoute allowedRoles={['admin']}><AdminRides /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['admin']}><AdminAlerts /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><AdminProfile /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
      <SafronChatbot />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
