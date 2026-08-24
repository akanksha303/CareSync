import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

// Icons
const StethoscopeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>;
const CalendarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const PillIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;
const SparklesIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M20.5 3.5 22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5L20 2z"/></svg>;

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/patient/appointments').then(r => r.data),
  });

  const upcoming = data?.appointments?.filter(a => a.status === 'CONFIRMED' && new Date(a.slot.start_time) > new Date()) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="z-10">
          <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-slate-500 font-medium text-lg">Here is your healthcare overview for today.</p>
        </div>
        <Link to="/patient/search" className="btn-primary z-10 whitespace-nowrap flex items-center gap-2">
          <StethoscopeIcon /> Book Appointment
        </Link>
      </div>

      {/* Main Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Nav Card 1 */}
        <Link to="/patient/search" className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#2563EB]/30 hover:shadow-[0_8px_30px_rgb(37,99,235,0.08)] transition-all flex flex-col items-start gap-4">
          <div className="p-4 bg-[#2563EB]/10 text-[#2563EB] rounded-2xl group-hover:scale-110 transition-transform">
            <StethoscopeIcon />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">Find a Doctor</h3>
            <p className="text-slate-500 text-sm font-medium">Search for specialists and book your next appointment instantly.</p>
          </div>
        </Link>

        {/* Nav Card 2 */}
        <Link to="/patient/appointments" className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgb(16,185,129,0.08)] transition-all flex flex-col items-start gap-4">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <CalendarIcon />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">My Appointments</h3>
            <p className="text-slate-500 text-sm font-medium">View your upcoming schedule and past appointment history.</p>
          </div>
        </Link>

        {/* Nav Card 3 */}
        <Link to="/patient/appointments" className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-purple-500/30 hover:shadow-[0_8px_30px_rgb(168,85,247,0.08)] transition-all flex flex-col items-start gap-4 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-purple-200 animate-pulse">
            <SparklesIcon />
          </div>
          <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
            <PillIcon />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">Prescriptions & AI</h3>
            <p className="text-slate-500 text-sm font-medium">Access your medicines and AI-generated appointment summaries.</p>
          </div>
        </Link>
      </div>

      {/* Quick Dashboard Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming appointments */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#0F172A]">Upcoming Schedule</h2>
            <Link to="/patient/appointments" className="text-sm font-bold text-[#2563EB] hover:underline">View all</Link>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 font-medium">Loading...</div>
          ) : upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map(appt => (
                <div key={appt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-[#2563EB] border border-slate-100">
                      <StethoscopeIcon />
                    </div>
                    <div>
                      <p className="font-bold text-[#0F172A]">Dr. {appt.doctor?.name}</p>
                      <p className="text-sm font-medium text-slate-500">{format(new Date(appt.slot.start_time), 'PPp')}</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-full">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CalendarIcon />
              </div>
              <p className="text-slate-500 font-medium">No upcoming appointments.</p>
              <Link to="/patient/search" className="text-[#2563EB] font-bold mt-2 inline-block hover:underline">Book one now</Link>
            </div>
          )}
        </div>

        {/* AI Health Insights Preview */}
        <div className="bg-gradient-to-br from-[#0F172A] to-slate-800 rounded-3xl p-8 border border-slate-700 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm text-[#38BDF8]">
              <SparklesIcon />
            </div>
            <h2 className="text-xl font-bold">CareSync AI</h2>
          </div>
          
          <div className="relative z-10 space-y-4">
            <p className="text-slate-300 font-medium leading-relaxed">
              Your AI healthcare assistant works perfectly in the background to keep you healthy!
            </p>
            <ul className="space-y-4 mt-6">
              <li className="flex items-start gap-3 text-sm font-medium text-slate-300">
                <div className="mt-0.5 text-emerald-400">✓</div>
                <p><strong className="text-white">Pre-Visit:</strong> Generates a Smart Summary of your symptoms for the doctor.</p>
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-slate-300">
                <div className="mt-0.5 text-emerald-400">✓</div>
                <p><strong className="text-white">Post-Visit:</strong> Translates confusing doctor notes into simple language.</p>
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-slate-300">
                <div className="mt-0.5 text-emerald-400">✓</div>
                <p><strong className="text-white">Medications:</strong> Extracts your prescriptions automatically.</p>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
