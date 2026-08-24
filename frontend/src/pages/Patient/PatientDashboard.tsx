import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { format, isToday, isTomorrow, formatDistanceToNowStrict } from 'date-fns';
import type { Appointment } from '../../types';

// --- Icons ---
const StethoscopeIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>;
const CalendarIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const CalendarPlusIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><line x1="10" x2="14" y1="14" y2="14"/><line x1="12" x2="12" y1="12" y2="16"/></svg>;
const SparklesIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
const PillIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;
const ActivityIcon = ({ className }: { className?: string }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const ArrowRightIcon = ({ className }: { className?: string }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
const ClockIcon = ({ className }: { className?: string }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const AlertCircleIcon = ({ className }: { className?: string }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

// --- Skeletons ---
const DashboardSkeleton = () => (
  <div className="space-y-10 animate-pulse p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#F8FAFC]">
    <div className="h-12 bg-slate-200 rounded-xl w-64 mb-2"></div>
    <div className="h-6 bg-slate-200 rounded-lg w-96 mb-10"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="h-80 bg-slate-200 rounded-[2rem]"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-slate-200 rounded-[2rem]"></div>
          <div className="h-40 bg-slate-200 rounded-[2rem]"></div>
          <div className="h-40 bg-slate-200 rounded-[2rem]"></div>
          <div className="h-40 bg-slate-200 rounded-[2rem]"></div>
        </div>
      </div>
      <div className="space-y-8">
        <div className="h-96 bg-slate-200 rounded-[2rem]"></div>
        <div className="h-64 bg-slate-200 rounded-[2rem]"></div>
      </div>
    </div>
  </div>
);

// --- Component ---
export default function PatientDashboard() {
  const { user } = useAuth();

  // Fetch Appointments
  const { data: apptData, isLoading: apptsLoading, isError: apptsError } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/patient/appointments').then((r: any) => r.data),
  });

  // Fetch Doctors for Specialties Preview
  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get<{ doctors: any[] }>('/api/patient/doctors').then((r: any) => r.data),
  });

  if (apptsLoading || docsLoading) return <DashboardSkeleton />;

  if (apptsError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircleIcon />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
        <p className="text-slate-500 mb-8">We couldn't load your healthcare data right now. Your appointments are safe, but our servers are experiencing a hiccup.</p>
        <button onClick={() => window.location.reload()} className="btn-primary shadow-lg">Try Again</button>
      </div>
    );
  }

  // --- Data Processing ---
  const allAppts = apptData?.appointments || [];
  const now = new Date();
  
  const upcomingAppts = allAppts
    .filter((a: any) => new Date(a.slot.start_time) > now && a.status !== 'CANCELLED')
    .sort((a: any, b: any) => new Date(a.slot.start_time).getTime() - new Date(b.slot.start_time).getTime());
  
  const nextAppt = upcomingAppts[0];
  const completedAppts = allAppts.filter((a: any) => a.status === 'COMPLETED');
  
  // Extract Medications
  const activeMedications = completedAppts
    .filter((a: any) => Array.isArray(a.prescription) && a.prescription.length > 0)
    .flatMap((a: any) => (a.prescription as any[]).map((med: any) => ({ ...med })))
    .slice(0, 4);

  // Extract Specialties
  const specialties = [...new Set(docsData?.doctors?.map((d: any) => d.specialisation) || [])].slice(0, 6);

  // Helper for formatting relative time
  const formatNextApptTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`;
    if (isTomorrow(d)) return `Tomorrow at ${format(d, 'h:mm a')}`;
    return format(d, 'EEEE, MMM d · h:mm a');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        
        {/* 1. HERO / WELCOME SECTION */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              Good morning, {user?.name?.split(' ')[0] || 'User'} <span className="inline-block origin-bottom-right hover:rotate-12 transition-transform duration-300">👋</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              {nextAppt 
                ? `Your next appointment is ${formatNextApptTime(nextAppt.slot.start_time)}.` 
                : "You're all caught up with your healthcare."}
            </p>
          </div>
          <Link to="/patient/search" className="group inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_8px_20px_rgb(37,99,235,0.24)] hover:shadow-[0_12px_24px_rgb(37,99,235,0.32)] hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0">
            <CalendarPlusIcon /> Book an Appointment
          </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN (8 cols) --- */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 2. NEXT APPOINTMENT HERO CARD */}
            {nextAppt ? (
              <div className="bg-white rounded-[2rem] p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-colors group-hover:bg-blue-500/10" />
                
                <div className="p-8 md:p-10 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-extrabold uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      Next Appointment
                    </div>
                    <span className="text-sm font-bold text-slate-400">Starts in {formatDistanceToNowStrict(new Date(nextAppt.slot.start_time))}</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-extrabold text-[#0F172A] mb-1">{formatNextApptTime(nextAppt.slot.start_time)}</h2>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center border border-blue-200/50 shadow-inner">
                          <span className="text-blue-600 font-bold text-lg">Dr</span>
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-800">{nextAppt.doctor?.name}</p>
                          <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                            <StethoscopeIcon /> Specialist
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to={`/patient/appointments`} className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl transition-colors text-center">
                        View Details
                      </Link>
                      <button className="px-6 py-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-xl transition-colors text-center">
                        Reschedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 text-center flex flex-col items-center justify-center border-dashed">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                  <CalendarIcon />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No upcoming appointments</h3>
                <p className="text-slate-500 font-medium mb-8 max-w-sm">Your health schedule is clear. Book a new consultation whenever you're ready.</p>
                <Link to="/patient/search" className="group inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all duration-300">Find a Doctor</Link>
              </div>
            )}

            {/* 3. QUICK ACTIONS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/patient/search" className="group bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><StethoscopeIcon /></div>
                <h3 className="font-bold text-lg text-slate-800 mb-1">Find a Doctor</h3>
                <p className="text-sm text-slate-500 font-medium">Search specialists and book slots.</p>
                <div className="absolute bottom-6 right-6 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300"><ArrowRightIcon /></div>
              </Link>
              
              <Link to="/patient/appointments" className="group bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><CalendarIcon /></div>
                <h3 className="font-bold text-lg text-slate-800 mb-1">My Appointments</h3>
                <p className="text-sm text-slate-500 font-medium">View upcoming visits and history.</p>
                <div className="absolute bottom-6 right-6 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300"><ArrowRightIcon /></div>
              </Link>

              <Link to="/patient/appointments" className="group bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden sm:col-span-2 md:col-span-1">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><PillIcon /></div>
                <h3 className="font-bold text-lg text-slate-800 mb-1">Prescriptions</h3>
                <p className="text-sm text-slate-500 font-medium">Access active medications.</p>
                <div className="absolute bottom-6 right-6 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300"><ArrowRightIcon /></div>
              </Link>

              <Link to="/patient/appointments" className="group bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl border border-indigo-800 shadow-sm hover:shadow-[0_20px_40px_rgba(49,46,129,0.3)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden sm:col-span-2 md:col-span-1">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl transition-all group-hover:bg-indigo-400/30"></div>
                <div className="w-12 h-12 bg-white/10 text-indigo-300 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10"><SparklesIcon /></div>
                <h3 className="font-bold text-lg text-white mb-1">CareSync AI</h3>
                <p className="text-sm text-indigo-200 font-medium">Smart medical summaries.</p>
                <div className="absolute bottom-6 right-6 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-indigo-300 backdrop-blur-sm border border-white/10"><ArrowRightIcon /></div>
              </Link>
            </div>

            {/* 4. HEALTHCARE JOURNEY (AI TIMELINE) */}
            {nextAppt && (
              <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
                <h3 className="font-bold text-xl text-slate-800 mb-8">Your Care Journey</h3>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative">
                  {/* Line behind steps */}
                  <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-100 hidden sm:block -z-10"></div>
                  <div className={`absolute top-5 left-8 h-0.5 bg-emerald-500 hidden sm:block -z-10 transition-all duration-1000 ${nextAppt.ai_pre_summary ? 'w-[50%]' : 'w-0'}`}></div>

                  <div className="flex flex-col items-center gap-3 w-full sm:w-1/3 text-center">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">✓</div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Booked</p>
                      <p className="text-xs text-slate-500 mt-1">Confirmed</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 w-full sm:w-1/3 text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md transition-colors ${nextAppt.ai_pre_summary && !nextAppt.ai_pre_summary.error ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-slate-100 text-slate-400'}`}>
                      <SparklesIcon />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${nextAppt.ai_pre_summary ? 'text-slate-800' : 'text-slate-400'}`}>AI Triage</p>
                      <p className="text-xs text-slate-500 mt-1">{nextAppt.ai_pre_summary ? 'Summary Ready' : 'Pending details'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 w-full sm:w-1/3 text-center">
                    <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center font-bold shadow-sm">
                      <StethoscopeIcon />
                    </div>
                    <div>
                      <p className="font-bold text-slate-400 text-sm">Consultation</p>
                      <p className="text-xs text-slate-500 mt-1">{format(new Date(nextAppt.slot.start_time), 'MMM d')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. DOCTOR DISCOVERY PREVIEW */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-800">Find Your Specialist</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialties.length > 0 ? specialties.map((s: any) => (
                  <Link key={s} to={`/patient/search?specialty=${s}`} className="px-5 py-2.5 bg-white border border-slate-200/80 rounded-full text-sm font-bold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm">
                    {s}
                  </Link>
                )) : (
                  <p className="text-sm text-slate-500">No specialties available right now.</p>
                )}
                <Link to="/patient/search" className="px-5 py-2.5 bg-slate-100 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                  View All &rarr;
                </Link>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN (4 cols) --- */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* 6. CARESYNC AI SECTION */}
            <div className="bg-[#0F172A] rounded-[2rem] p-8 shadow-xl relative overflow-hidden text-white border border-slate-800">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2 text-indigo-400">
                  <SparklesIcon />
                  <span className="font-bold tracking-widest text-xs uppercase">CareSync AI</span>
                </div>
                <h3 className="text-2xl font-extrabold mb-2">Your Intelligent Companion</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">CareSync uses advanced AI to summarize symptoms before visits and translate clinical notes into plain English afterwards.</p>

                {nextAppt?.ai_pre_summary && !nextAppt.ai_pre_summary.error && (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm text-white">Pre-Visit Summary Ready</h4>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                    </div>
                    <p className="text-xs text-indigo-200 mb-4 line-clamp-2">{nextAppt.ai_pre_summary.chief_complaint}</p>
                    <Link to={`/patient/appointments`} className="block w-full py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-center text-sm font-bold transition-colors">
                      View AI Analysis
                    </Link>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 text-slate-400"><ClockIcon /></div>
                    <div>
                      <p className="font-bold text-sm text-slate-200">Before your visit</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">AI triages symptoms and prepares doctor questions.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 text-slate-400"><ActivityIcon /></div>
                    <div>
                      <p className="font-bold text-sm text-slate-200">After your visit</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Converts medical jargon into a simple recovery plan.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. MEDICATION REMINDERS (MEDICATION TODAY) */}
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-800">Medication Today</h3>
                <PillIcon />
              </div>
              
              {activeMedications.length > 0 ? (
                <div className="space-y-4">
                  {activeMedications.map((med: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5"></div>
                      <div>
                        <p className="font-bold text-slate-800">{med.medicine_name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{med.dosage} · {med.frequency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm font-bold text-slate-500 mb-1">No active medications</p>
                  <p className="text-xs text-slate-400">Your prescriptions will appear here.</p>
                </div>
              )}
            </div>

            {/* 8. HEALTHCARE INSIGHTS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 text-center flex flex-col justify-center">
                <span className="text-3xl font-extrabold text-blue-600 mb-1">{completedAppts.length}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Completed<br/>Visits</span>
              </div>
              <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 text-center flex flex-col justify-center">
                <span className="text-3xl font-extrabold text-emerald-600 mb-1">{upcomingAppts.length}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Upcoming<br/>Appts</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
