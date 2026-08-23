import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome, {user?.name}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/doctors" className="card hover:shadow-md transition-shadow block">
          <div className="text-3xl mb-2">👨⚕️</div>
          <h3 className="font-semibold text-lg">Doctor Management</h3>
          <p className="text-gray-500 text-sm mt-1">Add, edit, and manage doctor profiles and working hours</p>
        </Link>
        <Link to="/admin/leave" className="card hover:shadow-md transition-shadow block">
          <div className="text-3xl mb-2">📅</div>
          <h3 className="font-semibold text-lg">Leave Management</h3>
          <p className="text-gray-500 text-sm mt-1">Mark doctor leaves and handle appointment cancellations</p>
        </Link>
        <Link to="/admin/notifications" className="card hover:shadow-md transition-shadow block">
          <div className="text-3xl mb-2">🔔</div>
          <h3 className="font-semibold text-lg">Failed Notifications</h3>
          <p className="text-gray-500 text-sm mt-1">Monitor and retry failed email and calendar notifications</p>
        </Link>
      </div>
    </div>
  );
}
