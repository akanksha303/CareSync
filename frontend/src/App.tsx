import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Patient
import PatientLayout from './pages/Patient/PatientLayout';
import PatientDashboard from './pages/Patient/PatientDashboard';
import DoctorSearch from './pages/Patient/DoctorSearch';
import BookAppointment from './pages/Patient/BookAppointment';
import PatientAppointments from './pages/Patient/PatientAppointments';

// Doctor
import DoctorLayout from './pages/Doctor/DoctorLayout';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import AppointmentDetail from './pages/Doctor/AppointmentDetail';

// Admin
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import DoctorManager from './pages/Admin/DoctorManager';
import LeaveManager from './pages/Admin/LeaveManager';
import FailedNotifications from './pages/Admin/FailedNotifications';

import CalendarCallback from './pages/CalendarCallback';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
  if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/calendar/connected" element={<CalendarCallback success />} />
        <Route path="/calendar/error" element={<CalendarCallback success={false} />} />

        {/* Patient */}
        <Route path="/patient" element={<ProtectedRoute role="PATIENT"><PatientLayout /></ProtectedRoute>}>
          <Route index element={<PatientDashboard />} />
          <Route path="search" element={<DoctorSearch />} />
          <Route path="book/:doctorId" element={<BookAppointment />} />
          <Route path="appointments" element={<PatientAppointments />} />
        </Route>

        {/* Doctor */}
        <Route path="/doctor" element={<ProtectedRoute role="DOCTOR"><DoctorLayout /></ProtectedRoute>}>
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="doctors" element={<DoctorManager />} />
          <Route path="leave" element={<LeaveManager />} />
          <Route path="notifications" element={<FailedNotifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
