import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

const BrainIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const UserIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const PillIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;

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
    queryFn: () => api.get<{ appointment: Appointment }>(`/api/doctor/appointments/${id}`).then((r: any) => r.data),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/api/doctor/appointments/${id}/complete`, {
      doctor_notes: notes,
      prescription: prescription.filter(p => p.medicine_name.trim() !== ''),
    }),
    onSuccess: () => {
      toast.success('Appointment completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
    onError: () => toast.error('Failed to complete appointment'),
  });

  if (isLoading) return <div className="text-center py-12 text-slate-500 font-bold">Loading Patient Chart...</div>;
  const appt = data?.appointment;
  if (!appt) return <div className="text-center py-12 text-slate-500 font-bold">Appointment not found</div>;

  const addMed = () => setPrescription(p => [...p, { medicine_name: '', dosage: '', frequency: '', duration: '' }]);
  const removeMed = (i: number) => setPrescription(p => p.filter((_, idx) => idx !== i));
  const updateMed = (i: number, field: keyof PrescriptionItem, value: string) =>
    setPrescription(p => p.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans pb-12">
      
      {/* Header Bar */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg> Back
        </button>
        <h1 className="text-2xl font-extrabold text-brand-dark">Patient Chart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Patient Info & AI Pre-Visit Summary */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Patient Card */}
          <div className="card bg-slate-900 text-white border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10 flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
                <UserIcon />
              </div>
              <div>
                <h2 className="text-xl font-bold">{appt.patient?.name}</h2>
                <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-lg font-bold ${
                  appt.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                }`}>{appt.status}</span>
              </div>
            </div>
            <div className="space-y-3 text-sm relative z-10">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Email</span>
                <span className="font-medium truncate ml-4">{appt.patient?.email}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Time</span>
                <span className="font-medium text-right">{format(new Date(appt.slot.start_time), 'PPp')}</span>
              </div>
            </div>
          </div>

          {/* AI Pre-Visit Summary */}
          {appt.ai_pre_summary && (
            <div className={`card border-l-4 ${
              appt.ai_pre_summary.urgency_level === 'High' ? 'border-rose-500' : 
              appt.ai_pre_summary.urgency_level === 'Medium' ? 'border-amber-500' : 'border-emerald-500'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-brand-dark">
                  <BrainIcon />
                  <h2 className="font-bold">AI Pre-Visit Summary</h2>
                </div>
                {!appt.ai_pre_summary.error && (
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                    appt.ai_pre_summary.urgency_level === 'High' ? 'bg-rose-100 text-rose-700' :
                    appt.ai_pre_summary.urgency_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>{appt.ai_pre_summary.urgency_level.toUpperCase()} PRIORITY</span>
                )}
              </div>
              
              {appt.ai_pre_summary.error ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 mb-1">RAW SYMPTOMS</p>
                  <p className="text-sm text-slate-700">{appt.symptoms_text}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 mb-1">CHIEF COMPLAINT</p>
                    <p className="text-sm font-medium text-brand-dark">{appt.ai_pre_summary.chief_complaint}</p>
                  </div>
                  
                  {appt.ai_pre_summary.suggested_questions && appt.ai_pre_summary.suggested_questions.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-2">SUGGESTED QUESTIONS</p>
                      <ul className="space-y-2">
                        {appt.ai_pre_summary.suggested_questions.map((q: any, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-700 font-medium">
                            <span className="text-brand-primary font-bold">•</span> {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Doctor Notes & Prescription (or Completed State) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Appointment Form */}
          {appt.status === 'CONFIRMED' && (
            <div className="card shadow-lg border-brand-primary/20">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-brand-dark">Clinical Notes & Prescription</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Submit notes to automatically generate a patient-friendly summary via AI.</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Doctor's Clinical Notes (Required)</label>
                  <textarea 
                    className="input h-40 resize-none font-mono text-sm leading-relaxed" 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Enter diagnosis, clinical observations, and treatment plan. CareSync AI will translate this for the patient..." 
                    required 
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <PillIcon /> Prescriptions
                    </label>
                  </div>
                  
                  <div className="space-y-3">
                    {prescription.map((med: any, i: number) => (
                      <div key={i} className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl relative">
                        <div className="w-full sm:w-auto flex-1"><input className="input py-2 text-sm" placeholder="Medicine Name" value={med.medicine_name} onChange={e => updateMed(i, 'medicine_name', e.target.value)} /></div>
                        <div className="w-full sm:w-auto flex-1"><input className="input py-2 text-sm" placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} /></div>
                        <div className="w-full sm:w-auto flex-1"><input className="input py-2 text-sm" placeholder="Frequency" value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} /></div>
                        <div className="w-full sm:w-auto flex-1 flex gap-2">
                          <input className="input py-2 text-sm w-full" placeholder="Duration" value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)} />
                          {prescription.length > 1 && (
                            <button onClick={() => removeMed(i)} className="bg-rose-100 text-rose-600 px-3 rounded-xl hover:bg-rose-200 font-bold transition-colors">X</button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button onClick={addMed} className="btn-secondary w-full border-dashed border-2 py-3 text-brand-primary hover:bg-blue-50">+ Add another medicine</button>
                  </div>
                </div>
                
                <button 
                  className="btn-primary w-full text-lg py-4 mt-4" 
                  onClick={() => completeMutation.mutate()}
                  disabled={!notes.trim() || completeMutation.isPending}
                >
                  {completeMutation.isPending ? 'Processing via AI...' : 'Complete & Generate Patient Summary'}
                </button>
              </div>
            </div>
          )}

          {/* Completed State View */}
          {appt.status === 'COMPLETED' && (
            <div className="space-y-6">
              
              <div className="card border-slate-200 bg-slate-50">
                <h2 className="font-bold text-brand-dark mb-4 text-lg">Your Clinical Notes</h2>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 font-mono text-sm text-slate-700 whitespace-pre-wrap">
                  {appt.doctor_notes || 'No notes provided.'}
                </div>
              </div>

              {appt.ai_post_summary && !appt.ai_post_summary.error && (
                <div className="card border-emerald-500 shadow-md">
                  <div className="flex items-center gap-2 mb-4 text-emerald-700">
                    <BrainIcon />
                    <h2 className="font-bold text-lg">AI Generated Patient Summary</h2>
                  </div>
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                    <p className="text-emerald-900 font-medium leading-relaxed">
                      {appt.ai_post_summary.patient_summary}
                    </p>
                  </div>
                  {appt.ai_post_summary.follow_up_steps && appt.ai_post_summary.follow_up_steps.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-slate-500 mb-2">RECOMMENDED FOLLOW-UP</p>
                      <ul className="space-y-2">
                        {appt.ai_post_summary.follow_up_steps.map((step: any, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-700 font-medium">
                            <span className="text-emerald-500 font-bold">→</span> {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



