import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

const ClockIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const AlertCircleIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const CheckCircleIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const BrainIcon = ({ className }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/doctor/appointments').then((r: any) => r.data),
  });

  const today = new Date();
  const todayAppts = data?.appointments?.filter((a: any) => {
    const d = new Date(a.slot.start_time);
    return d.toDateString() === today.toDateString() && a.status === 'CONFIRMED';
  }) || [];

  const highUrgency = data?.appointments?.filter((a: any) =>
    a.ai_pre_summary && !a.ai_pre_summary.error && a.ai_pre_summary.urgency_level === 'High' && a.status === 'CONFIRMED'
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F172A] to-slate-800 rounded-[2rem] p-8 shadow-sm border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="z-10">
          <h1 className="text-3xl font-extrabold mb-2">Welcome, Dr. {user?.name}!</h1>
          <p className="text-slate-300 font-medium text-lg">Manage your schedule and view AI pre-visit summaries.</p>
        </div>
        <Link to="/doctor/appointments" className="btn-primary z-10 whitespace-nowrap bg-white text-brand-dark hover:bg-slate-100 shadow-none border border-transparent">
          View All Appointments
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><ClockIcon /></div>
          <div className="text-4xl font-extrabold text-brand-dark">{todayAppts.length}</div>
          <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wide">Today's Appointments</div>
        </div>
        <div className="card text-center flex flex-col items-center justify-center p-8 border border-rose-200 shadow-[0_8px_30px_rgb(225,29,72,0.06)] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-500/10 rounded-full blur-xl" />
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4 z-10"><AlertCircleIcon /></div>
          <div className="text-4xl font-extrabold text-rose-600 z-10">{highUrgency.length}</div>
          <div className="text-sm font-bold text-rose-500 mt-2 uppercase tracking-wide z-10">High Urgency</div>
        </div>
        <div className="card text-center flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><CheckCircleIcon /></div>
          <div className="text-4xl font-extrabold text-brand-dark">
            {data?.appointments?.filter((a: any) => a.status === 'COMPLETED').length || 0}
          </div>
          <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wide">Completed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Urgency List */}
        {highUrgency.length > 0 && (
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircleIcon className="text-rose-600" />
                <h2 className="text-xl font-bold text-rose-700">Triage Priority</h2>
              </div>
              <div className="space-y-4">
                {highUrgency.slice(0, 5).map((appt: any) => (
                  <Link key={appt.id} to={`/doctor/appointments/${appt.id}`}
                    className="block p-4 bg-white rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{appt.patient?.name}</p>
                      <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-lg font-bold">HIGH</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <BrainIcon className="shrink-0 mt-0.5 text-brand-primary" />
                      <p className="line-clamp-2">{appt.ai_pre_summary?.chief_complaint}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        <div className={`card ${highUrgency.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-brand-dark">Today's Schedule</h2>
            <Link to="/doctor/appointments" className="text-sm font-bold text-brand-primary hover:underline">View all</Link>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 font-medium">Loading schedule...</div>
          ) : todayAppts.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
              <ClockIcon className="mx-auto text-slate-300 mb-3 w-10 h-10" />
              <p className="text-slate-500 font-medium">No appointments scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppts.map((appt: any) => (
                <Link key={appt.id} to={`/doctor/appointments/${appt.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-brand-primary/30 hover:shadow-md transition-all group">
                  
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-lg text-brand-dark group-hover:text-brand-primary transition-colors">{appt.patient?.name}</p>
                      {appt.ai_pre_summary?.urgency_level && (
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                          appt.ai_pre_summary.urgency_level === 'High' ? 'bg-rose-100 text-rose-700' :
                          appt.ai_pre_summary.urgency_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{appt.ai_pre_summary.urgency_level.toUpperCase()}</span>
                      )}
                    </div>
                    {appt.ai_pre_summary?.chief_complaint && (
                      <p className="text-sm font-medium text-slate-500 line-clamp-1 flex items-center gap-1.5">
                        <BrainIcon className="text-brand-primary/70 w-4 h-4" /> 
                        {appt.ai_pre_summary.chief_complaint}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-brand-dark font-bold">{format(new Date(appt.slot.start_time), 'p')}</p>
                    </div>
                    <div className="text-brand-primary">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



