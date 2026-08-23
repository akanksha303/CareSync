import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

interface PrescriptionItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([
    { medicine_name: '', dosage: '', frequency: '', duration: '' },
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => api.get<{ appointment: Appointment }>(`/api/doctor/appointments/${id}`).then(r => r.data),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/api/doctor/appointments/${id}/complete`, {
      doctor_notes: notes,
      prescription: prescription.filter(p => p.medicine_name),
    }),
    onSuccess: () => {
      toast.success('Appointment completed!');
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      navigate('/doctor/appointments');
    },
    onError: () => toast.error('Failed to complete appointment'),
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  const appt = data?.appointment;
  if (!appt) return <div className="text-center py-8 text-gray-500">Appointment not found</div>;

  const addMed = () => setPrescription(p => [...p, { medicine_name: '', dosage: '', frequency: '', duration: '' }]);
  const removeMed = (i: number) => setPrescription(p => p.filter((_, idx) => idx !== i));
  const updateMed = (i: number, field: keyof PrescriptionItem, value: string) =>
    setPrescription(p => p.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">← Back</button>
        <h1 className="text-xl font-bold">Appointment Detail</h1>
      </div>

      {/* Patient info */}
      <div className="card">
        <h2 className="font-semibold mb-3">Patient Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Name</span><p className="font-medium">{appt.patient?.name}</p></div>
          <div><span className="text-gray-500">Email</span><p className="font-medium">{appt.patient?.email}</p></div>
          <div><span className="text-gray-500">Date</span><p className="font-medium">{format(new Date(appt.slot.start_time), 'PPp')}</p></div>
          <div><span className="text-gray-500">Status</span><p className="font-medium">{appt.status}</p></div>
        </div>
      </div>

      {/* AI Pre-visit summary */}
      {appt.ai_pre_summary && (
        <div className="card">
          <h2 className="font-semibold mb-3">AI Pre-Visit Summary</h2>
          {appt.ai_pre_summary.error ? (
            <p className="text-gray-500 text-sm">AI summary unavailable. Symptoms: {appt.symptoms_text}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Urgency:</span>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  appt.ai_pre_summary.urgency_level === 'High' ? 'bg-red-100 text-red-700' :
                  appt.ai_pre_summary.urgency_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>{appt.ai_pre_summary.urgency_level}</span>
              </div>
              <p className="text-sm"><strong>Chief Complaint:</strong> {appt.ai_pre_summary.chief_complaint}</p>
              {appt.ai_pre_summary.suggested_questions && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Suggested Questions:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                    {appt.ai_pre_summary.suggested_questions.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!appt.ai_pre_summary && appt.symptoms_text && (
        <div className="card">
          <h2 className="font-semibold mb-2">Reported Symptoms</h2>
          <p className="text-sm text-gray-700">{appt.symptoms_text}</p>
        </div>
      )}

      {/* Post-visit form */}
      {appt.status === 'CONFIRMED' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Complete Appointment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes *</label>
              <textarea className="input h-32 resize-none" value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Diagnosis, observations, treatment plan..." required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Prescription</label>
                <button onClick={addMed} className="text-sm text-primary-600 hover:underline">+ Add medicine</button>
              </div>
              {prescription.map((med, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                  <input className="input" placeholder="Medicine name" value={med.medicine_name}
                    onChange={e => updateMed(i, 'medicine_name', e.target.value)} />
                  <input className="input" placeholder="Dosage (e.g. 500mg)" value={med.dosage}
                    onChange={e => updateMed(i, 'dosage', e.target.value)} />
                  <input className="input" placeholder="Frequency (e.g. Twice daily)" value={med.frequency}
                    onChange={e => updateMed(i, 'frequency', e.target.value)} />
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Duration (e.g. 7 days)" value={med.duration}
                      onChange={e => updateMed(i, 'duration', e.target.value)} />
                    {prescription.length > 1 && (
                      <button onClick={() => removeMed(i)} className="text-red-500 hover:text-red-700 text-xl">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full" onClick={() => completeMutation.mutate()}
              disabled={!notes.trim() || completeMutation.isPending}>
              {completeMutation.isPending ? 'Saving...' : 'Complete Appointment'}
            </button>
          </div>
        </div>
      )}

      {/* Completed state */}
      {appt.status === 'COMPLETED' && appt.doctor_notes && (
        <div className="card">
          <h2 className="font-semibold mb-3">Doctor's Notes</h2>
          <p className="text-sm text-gray-700">{appt.doctor_notes}</p>
          {appt.ai_post_summary && !appt.ai_post_summary.error && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-xs font-semibold text-green-800 mb-2">AI POST-VISIT SUMMARY</p>
              <p className="text-sm">{appt.ai_post_summary.patient_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
