import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { format } from 'date-fns';
import type { Appointment } from '../../types';

const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const ClockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const ArrowRightIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;

export default function PatientDashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Jordan';

  const { data: apptData, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/patient/appointments').then((r: any) => r.data),
  });

  const now = new Date();
  const upcomingAppts = apptData?.appointments?.filter((a: any) => new Date(a.slot.start_time) > now && a.status !== 'CANCELLED')
    .sort((a: any, b: any) => new Date(a.slot.start_time).getTime() - new Date(b.slot.start_time).getTime()) || [];
  
  const nextAppt = upcomingAppts[0];

  if (isLoading) {
    return <div className="p-10 text-white animate-pulse">Loading your care journey...</div>;
  }

  // Fallback data matching the screenshot exactly if the user has no real appointments
  const displayAppt = nextAppt || {
    isMock: true,
    title: "Annual wellness visit",
    date: new Date(new Date().setHours(24 * 3)), // 3 days from now
    timeString: "10:30 AM — 11:15 AM",
    doctorName: "Dr. Maya Chen",
    type: "Video visit"
  };

  const isReal = !displayAppt.isMock;
  const apptDate = isReal ? new Date(nextAppt.slot.start_time) : displayAppt.date;
  const doctorName = isReal ? nextAppt.doctor?.name : displayAppt.doctorName;
  const apptType = "Video visit"; // Simplified for UI
  const apptTime = isReal ? `${format(apptDate, 'h:mm a')} — ${format(new Date(new Date(apptDate).getTime() + 45*60000), 'h:mm a')}` : displayAppt.timeString;
  const title = isReal ? "Specialist Consultation" : displayAppt.title;

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-[#82A09A] text-xs font-bold tracking-widest uppercase mb-3">
            {format(now, 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-2">
            Good morning, {firstName} <span className="text-rose-400">✨</span>
          </h1>
          <p className="text-[#82A09A] text-lg">Here's your care journey at a glance.</p>
        </div>
        
        <Link to="/patient/doctors" className="bg-[#5EEAD4] hover:bg-[#4ADE80] text-[#0B1514] font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors">
          <span className="text-xl leading-none">+</span> Book an appointment
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        
        {/* Next Appointment Card (Dark Green) */}
        <div className="lg:col-span-2 bg-[#10201D] border border-[#1B2D2A] rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#5EEAD4] text-xs font-bold tracking-widest uppercase">Next Appointment</h2>
              <span className="bg-[#18302B] text-[#5EEAD4] text-xs font-bold px-3 py-1.5 rounded-full border border-[#1B2D2A]">Confirmed</span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-8">{title}</h3>
            
            <div className="flex items-start gap-4 mb-8">
              <div className="bg-[#5B3E3D] text-[#FDA4AF] rounded-xl w-14 h-14 flex flex-col items-center justify-center shrink-0 border border-[#7C4A48]/50 shadow-inner">
                <span className="font-bold text-sm leading-tight">{format(apptDate, 'dd')}</span>
                <span className="text-[10px] font-extrabold uppercase">{format(apptDate, 'MMM')}</span>
              </div>
              
              <div className="space-y-2.5">
                <p className="text-white font-bold">{format(apptDate, 'EEEE, MMMM d')}</p>
                <p className="text-[#82A09A] text-sm flex items-center gap-2">
                  <ClockIcon /> {apptTime}
                </p>
                <p className="text-[#82A09A] text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5EEAD4]"></span> {apptType} with {doctorName}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-6 border-t border-[#1B2D2A]">
            <Link to={isReal ? `/patient/appointments/${nextAppt.id}` : '#'} className="text-[#5EEAD4] hover:text-white font-bold text-sm flex items-center gap-1.5 transition-colors">
              View details <ArrowRightIcon />
            </Link>
            
            <button className="bg-white text-[#0B1514] hover:bg-slate-200 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors text-sm">
              <CalendarIcon /> Add to calendar
            </button>
          </div>
        </div>

        {/* Care Score Card (Light Mode Theme) */}
        <div className="bg-[#F4FBF9] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
          <div>
            <h2 className="text-[#0D9488] text-xs font-bold tracking-widest uppercase mb-6">Your Care Score</h2>
            
            <h3 className="text-3xl font-extrabold text-[#0B1514] mb-4">Looking good</h3>
            <p className="text-[#334155] text-sm leading-relaxed max-w-[80%]">
              You're keeping up with your care plan. Keep going!
            </p>
          </div>

          <div className="absolute top-8 right-8 w-16 h-16 rounded-full border-4 border-[#CCFBF1] flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full text-[#14B8A6]" viewBox="0 0 36 36">
              <path className="stroke-current" strokeWidth="4" strokeDasharray="82, 100" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="text-center">
              <span className="font-extrabold text-xl text-[#0F766E] leading-none">82</span>
              <span className="text-[9px] font-bold text-[#0F766E] block">/100</span>
            </div>
          </div>

          <div className="mt-8">
            <div className="h-1.5 w-full bg-[#CCFBF1] rounded-full mb-6">
              <div className="h-1.5 bg-[#14B8A6] rounded-full w-[82%]"></div>
            </div>
            
            <button className="text-[#0D9488] hover:text-[#0F766E] font-bold text-sm flex items-center gap-1.5 transition-colors">
              View care plan <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Stay on track Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#82A09A] text-xs font-bold tracking-widest uppercase mb-1">Stay on track</p>
            <h2 className="text-2xl font-bold text-white">Today's care</h2>
          </div>
          <button className="text-[#5EEAD4] hover:text-white font-bold text-sm flex items-center gap-1.5 transition-colors">
            See all <ArrowRightIcon />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mock Task 1 */}
          <div className="bg-[#10201D] border border-[#1B2D2A] rounded-2xl p-6 hover:border-[#5EEAD4]/30 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-[#5B3E3D] text-[#FDA4AF] flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
            </div>
            <h3 className="text-white font-bold mb-1 group-hover:text-[#5EEAD4] transition-colors">Morning Medication</h3>
            <p className="text-[#82A09A] text-sm">Take 1 tablet of Vitamin D</p>
          </div>

          {/* Mock Task 2 */}
          <div className="bg-[#10201D] border border-[#1B2D2A] rounded-2xl p-6 hover:border-[#5EEAD4]/30 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-[#18302B] text-[#5EEAD4] flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="text-white font-bold mb-1 group-hover:text-[#5EEAD4] transition-colors">Complete Check-in</h3>
            <p className="text-[#82A09A] text-sm">Update your symptom log</p>
          </div>
        </div>
      </div>

    </div>
  );
}
