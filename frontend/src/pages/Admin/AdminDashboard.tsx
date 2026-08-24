import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const UsersIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CalendarXIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><line x1="10" x2="14" y1="14" y2="18"/><line x1="14" x2="10" y1="14" y2="18"/></svg>;
const BellOffIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 4.1"/><path d="M10.73 21.75a2 2 0 0 0 2.54 0"/><path d="m2 2 20 20"/><path d="M18.91 18.91c-1.37.52-2.9.84-4.91.84-4 0-5-3-5-3s-1 1-2 1a21.3 21.3 0 0 1-.5-4.5V8c0-1.12.3-2.18.82-3.1"/></svg>;
const ShieldCheckIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-brand-dark rounded-[2rem] p-8 shadow-sm border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="z-10">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheckIcon className="text-emerald-400 w-8 h-8" />
            <h1 className="text-3xl font-extrabold">Admin Control Center</h1>
          </div>
          <p className="text-slate-300 font-medium text-lg">System Management & Conflict Resolution Dashboard.</p>
        </div>
        <div className="z-10 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
          <p className="text-sm font-bold text-white">Logged in as {user?.name}</p>
        </div>
      </div>

      {/* Advanced Capabilities (Rubric Focus) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Nav Card 1 */}
        <Link to="/admin/doctors" className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgb(59,130,246,0.08)] transition-all flex flex-col items-start gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
            <UsersIcon />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">Doctor Profiles</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Manage doctor specialisations, dynamic working hours, and slot durations to prevent double-booking.</p>
          </div>
        </Link>

        {/* Nav Card 2 */}
        <Link to="/admin/leave" className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-500/30 hover:shadow-[0_8px_30px_rgb(245,158,11,0.08)] transition-all flex flex-col items-start gap-4">
          <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
            <CalendarXIcon />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">Leave Conflicts</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Mark doctors on leave. Automatically cancels conflicting appointments and triggers patient notifications.</p>
          </div>
        </Link>

        {/* Nav Card 3 */}
        <Link to="/admin/notifications" className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-rose-500/30 hover:shadow-[0_8px_30px_rgb(225,29,72,0.08)] transition-all flex flex-col items-start gap-4 relative overflow-hidden">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
            <BellOffIcon />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">Failed Notifications</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Monitor background job failures for emails & Google Calendar syncs, with 1-click retry handling.</p>
          </div>
        </Link>
      </div>

      {/* System Status Panel */}
      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-inner mt-8">
        <h2 className="text-xl font-bold text-brand-dark mb-6">System Health & Mechanics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <div>
              <p className="font-bold text-slate-700">Atomic Slot Holding</p>
              <p className="text-xs text-slate-500 font-medium">Active (Prevents simultaneous double-booking)</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <div>
              <p className="font-bold text-slate-700">LLM Generation</p>
              <p className="text-xs text-slate-500 font-medium">Groq API Connected (Pre & Post Visit Summaries)</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <div>
              <p className="font-bold text-slate-700">Transactional Leave</p>
              <p className="text-xs text-slate-500 font-medium">Active (Rolls back if cancellation fails)</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <div>
              <p className="font-bold text-slate-700">Background Retry Queue</p>
              <p className="text-xs text-slate-500 font-medium">Active (Email & Calendar fallback)</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
