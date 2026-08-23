import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

export default function DoctorAppointments() {
  const { data, isLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/doctor/appointments').then(r => r.data),
  });

  const statusColors: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Appointments</h1>
      {(!data?.appointments || data.appointments.length === 0) && (
        <div className="card text-center py-12 text-gray-500">No appointments found</div>
      )}
      <div className="space-y-3">
        {data?.appointments?.map(appt => (
          <Link key={appt.id} to={`/doctor/appointments/${appt.id}`}
            className="card block hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{appt.patient?.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[appt.status]}`}>
                    {appt.status}
                  </span>
                  {appt.ai_pre_summary?.urgency_level && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      appt.ai_pre_summary.urgency_level === 'High' ? 'bg-red-100 text-red-700' :
                      appt.ai_pre_summary.urgency_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{appt.ai_pre_summary.urgency_level} Urgency</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{format(new Date(appt.slot.start_time), 'PPp')}</p>
                {appt.ai_pre_summary?.chief_complaint && (
                  <p className="text-sm text-gray-600">Chief complaint: {appt.ai_pre_summary.chief_complaint}</p>
                )}
              </div>
              <span className="text-primary-600 text-sm">View →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
