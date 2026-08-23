import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/doctor/appointments').then(r => r.data),
  });

  const today = new Date();
  const todayAppts = data?.appointments?.filter(a => {
    const d = new Date(a.slot.start_time);
    return d.toDateString() === today.toDateString() && a.status === 'CONFIRMED';
  }) || [];

  const highUrgency = data?.appointments?.filter(a =>
    a.ai_pre_summary && !a.ai_pre_summary.error && a.ai_pre_summary.urgency_level === 'High' && a.status === 'CONFIRMED'
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, Dr. {user?.name}!</h1>
        <p className="text-gray-500">Here's your schedule overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{todayAppts.length}</div>
          <div className="text-sm text-gray-500 mt-1">Today's Appointments</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{highUrgency.length}</div>
          <div className="text-sm text-gray-500 mt-1">High Urgency</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">
            {data?.appointments?.filter(a => a.status === 'COMPLETED').length || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Completed</div>
        </div>
      </div>

      {highUrgency.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <h2 className="font-semibold text-red-700 mb-3">⚠️ High Urgency Appointments</h2>
          <div className="space-y-2">
            {highUrgency.slice(0, 5).map(appt => (
              <Link key={appt.id} to={`/doctor/appointments/${appt.id}`}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <div>
                  <p className="font-medium">{appt.patient?.name}</p>
                  <p className="text-sm text-gray-500">{appt.ai_pre_summary?.chief_complaint}</p>
                </div>
                <span className="text-sm text-gray-500">{format(new Date(appt.slot.start_time), 'PPp')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Today's Schedule</h2>
          <Link to="/doctor/appointments" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        {isLoading && <div className="text-gray-500 text-sm">Loading...</div>}
        {todayAppts.length === 0 && !isLoading && (
          <p className="text-gray-500 text-sm">No appointments today</p>
        )}
        <div className="space-y-2">
          {todayAppts.map(appt => (
            <Link key={appt.id} to={`/doctor/appointments/${appt.id}`}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-medium">{appt.patient?.name}</p>
                {appt.ai_pre_summary?.chief_complaint && (
                  <p className="text-sm text-gray-500">{appt.ai_pre_summary.chief_complaint}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{format(new Date(appt.slot.start_time), 'p')}</p>
                {appt.ai_pre_summary?.urgency_level && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    appt.ai_pre_summary.urgency_level === 'High' ? 'bg-red-100 text-red-700' :
                    appt.ai_pre_summary.urgency_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>{appt.ai_pre_summary.urgency_level}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
