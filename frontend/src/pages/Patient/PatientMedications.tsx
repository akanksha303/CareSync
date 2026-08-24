import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

const PillIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;
const ClockIcon = ({ className }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

export default function PatientMedications() {
  const { data: apptData, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/patient/appointments').then((r: any) => r.data),
  });

  if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold">Loading medications...</div>;

  const completedAppts = apptData?.appointments?.filter((a: any) => a.status === 'COMPLETED') || [];
  
  // Extract all medications from all prescriptions
  const allMedications = completedAppts.flatMap((appt: any) => {
    if (!Array.isArray(appt.prescription)) return [];
    return appt.prescription.map((med: any) => ({
      ...med,
      prescribed_by: appt.doctor?.name,
      date: appt.slot.start_time
    }));
  });

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <PillIcon className="text-blue-600 w-8 h-8" /> Active Medications
        </h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">Your current prescriptions and dosage schedules.</p>
      </div>

      {allMedications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allMedications.map((med: any, i: number) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-blue-100/50 transition-colors" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                    <PillIcon className="w-6 h-6" />
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-emerald-100">Active</span>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-800 mb-1">{med.medicine_name}</h3>
                <p className="text-blue-600 font-bold text-sm mb-6">{med.dosage}</p>
                
                <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Schedule</span>
                    <span className="text-slate-800 font-bold flex items-center gap-1.5"><ClockIcon className="w-4 h-4 text-slate-400" /> {med.frequency}</span>
                  </div>
                  {med.duration && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">Duration</span>
                      <span className="text-slate-800 font-bold">{med.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Prescribed By</span>
                    <span className="text-slate-800 font-bold">{med.prescribed_by}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Date</span>
                    <span className="text-slate-800 font-bold">{format(new Date(med.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <PillIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Active Medications</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">You do not have any active prescriptions on file. When a doctor prescribes medication after a visit, it will appear here.</p>
        </div>
      )}
    </div>
  );
}
