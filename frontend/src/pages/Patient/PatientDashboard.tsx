import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/patient/appointments').then(r => r.data),
  });

  const upcoming = data?.appointments?.filter(a => a.status === 'CONFIRMED' && new Date(a.slot.start_time) > new Date()) || [];
  const recent = data?.appointments?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-500">Manage your healthcare appointments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{data?.appointments?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Appointments</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{upcoming.length}</div>
          <div className="text-sm text-gray-500 mt-1">Upcoming</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">
            {data?.appointments?.filter(a => a.status === 'COMPLETED').length || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Completed</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/patient/search" className="btn-primary">Book New Appointment</Link>
          <Link to="/patient/appointments" className="btn-secondary">View All Appointments</Link>
        </div>
      </div>

      {/* Upcoming appointments */}
      {upcoming.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
          <div className="space-y-3">
            {upcoming.map(appt => (
              <div key={appt.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="font-medium">Dr. {appt.doctor?.name}</p>
                  <p className="text-sm text-gray-500">{format(new Date(appt.slot.start_time), 'PPp')}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">{appt.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="text-center py-8 text-gray-500">Loading...</div>}
    </div>
  );
}
