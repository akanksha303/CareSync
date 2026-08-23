import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

const navLinks = {
  PATIENT: [
    { label: 'Dashboard', to: '/patient' },
    { label: 'Find Doctors', to: '/patient/search' },
    { label: 'My Appointments', to: '/patient/appointments' },
  ],
  DOCTOR: [
    { label: 'Dashboard', to: '/doctor' },
    { label: 'Appointments', to: '/doctor/appointments' },
  ],
  ADMIN: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Doctors', to: '/admin/doctors' },
    { label: 'Leave', to: '/admin/leave' },
    { label: 'Notifications', to: '/admin/notifications' },
  ],
};

export default function Navbar({ role }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">Care</span>
              <span className="text-2xl font-bold text-gray-900">Sync</span>
            </Link>
            <div className="hidden md:flex space-x-4">
              {navLinks[role].map(link => (
                <Link key={link.to} to={link.to} className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full font-medium">{role}</span>
            <button onClick={handleLogout} className="btn-secondary text-sm">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
