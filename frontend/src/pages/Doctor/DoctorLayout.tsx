import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { Appointment } from '../../types';

// --- Icons ---
const HomeIcon = ({ className }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const CalendarIcon = ({ className }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const UsersIcon = ({ className }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ClockIcon = ({ className }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const MoreHorizontalIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
const CareSyncLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-600">
    <rect x="2" y="6" width="5" height="12" rx="2.5" fill="currentColor"/>
    <rect x="9" y="3" width="5" height="18" rx="2.5" fill="currentColor"/>
    <rect x="16" y="8" width="5" height="8" rx="2.5" fill="currentColor"/>
  </svg>
);

export default function DoctorLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'D';

  // Fetch real appointments to calculate dynamic badges
  const { data: apptData } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/api/doctor/appointments').then((r: any) => r.data),
  });

  const today = new Date().toDateString();
  const todayAppts = apptData?.appointments?.filter((a: any) => new Date(a.slot.start_time).toDateString() === today && a.status !== 'CANCELLED') || [];
  
  const navItems = [
    { name: 'Overview', path: '/doctor', icon: HomeIcon },
    { name: 'Appointments', path: '/doctor/appointments', icon: CalendarIcon, badge: todayAppts.length > 0 ? todayAppts.length : undefined },
    { name: 'Patients', path: '/doctor/patients', icon: UsersIcon },
    { name: 'Schedule', path: '/doctor/schedule', icon: ClockIcon },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 hidden md:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 sticky top-0 h-screen">
        
        {/* Logo Section */}
        <div className="h-24 flex items-center px-8 gap-3">
          <CareSyncLogo />
          <span className="font-extrabold text-2xl tracking-tight text-slate-800">CareSync</span>
        </div>

        {/* Doctor Profile Menu */}
        <div className="px-6 py-2 mb-4">
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 font-extrabold text-lg flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-bold text-sm truncate text-slate-800">{user?.name || 'Doctor'}</h3>
              <p className="text-xs font-medium text-slate-500 truncate">Medical Provider</p>
            </div>
            <div className="text-slate-400 group-hover:text-emerald-600 transition-colors">
              <MoreHorizontalIcon />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="px-8 py-2">
          <div className="h-px bg-slate-100 w-full"></div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-4 text-[11px] font-extrabold text-slate-400 mb-4 tracking-widest uppercase">Your Practice</p>
          
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/doctor' && location.pathname.startsWith(item.path) && item.path !== '/doctor/patients' && item.path !== '/doctor/schedule');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all relative group ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-600 rounded-r-full shadow-[0_0_8px_rgb(16,185,129,0.6)]"></div>
                )}
                
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                
                <span className="flex-1">{item.name}</span>
                
                {item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-colors ${
                    isActive ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="w-full py-3 text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT OUTLET --- */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
}
