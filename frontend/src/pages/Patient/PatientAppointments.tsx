import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

function UrgencyBadge({ level }: { level?: string }) {
  if (!level) return null;
  const cls = level === 'High' ? 'badge-high' : level === 'Medium' ? 'badge-medium' : 'badge-low';
  return <span className={cls}>{level} Urgency</span>;
}

export default function PatientAppointments() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/patient/appointments').then((r: any) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/patient/appointments/${id}/cancel`),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
    onError: () => toast.error('Failed to cancel appointment'),
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
      <h1 className="text-2xl font-bold">My Appointments</h1>
      {(!data?.appointments || data.appointments.length === 0) && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No appointments yet</p>
          <p className="text-gray-400 text-sm mt-1">Book your first appointment with a doctor</p>
        </div>
      )}
      <div className="space-y-4">
        {data?.appointments?.map((appt: any) => (
          <div key={appt.id} className="card">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Dr. {appt.doctor?.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[appt.status]}`}>
                    {appt.status}
                  </span>
                  {appt.ai_pre_summary && !appt.ai_pre_summary.error && (
                    <UrgencyBadge level={appt.ai_pre_summary.urgency_level} />
                  )}
                </div>
                <p className="text-sm text-gray-500">{format(new Date(appt.slot.start_time), 'PPp')}</p>
              </div>
              {appt.status === 'CONFIRMED' && (
                <button
                  onClick={() => {
                    if (confirm('Cancel this appointment?')) cancelMutation.mutate(appt.id);
                  }}
                  className="btn-danger text-xs py-1 px-3">
                  Cancel
                </button>
              )}
            </div>

            {/* AI Pre-summary */}
            {appt.ai_pre_summary && !appt.ai_pre_summary.error && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">AI Pre-Visit Summary</p>
                <p className="text-sm"><strong>Chief Complaint:</strong> {appt.ai_pre_summary.chief_complaint}</p>
                {appt.ai_pre_summary.suggested_questions && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-blue-700">Questions to ask your doctor:</p>
                    <ul className="text-sm text-blue-700 list-disc list-inside mt-1">
                      {appt.ai_pre_summary.suggested_questions.map((q: any, i: number) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Post-visit summary */}
            {appt.ai_post_summary && !appt.ai_post_summary.error && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">Post-Visit Summary</p>
                <p className="text-sm">{appt.ai_post_summary.patient_summary}</p>
                {appt.ai_post_summary.medication_schedule && (
                  <p className="text-sm mt-2"><strong>Medication:</strong> {appt.ai_post_summary.medication_schedule}</p>
                )}
                {appt.ai_post_summary.follow_up_steps && (
                  <ul className="text-sm text-green-700 list-disc list-inside mt-2">
                    {appt.ai_post_summary.follow_up_steps.map((s: any, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                )}
              </div>
            )}

            {/* Prescription */}
            {appt.prescription && appt.prescription.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Prescription</p>
                <div className="grid grid-cols-2 gap-2">
                  {appt.prescription.map((med: any, i: number) => (
                    <div key={i} className="p-2 bg-purple-50 rounded text-sm">
                      <p className="font-medium">{med.medicine_name}</p>
                      <p className="text-gray-500">{med.dosage} · {med.frequency} · {med.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


