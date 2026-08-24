import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const CalendarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const PillIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;
const HeartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
const SunIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const CareSyncLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#5EEAD4]">
    <rect x="2" y="6" width="5" height="12" rx="2.5" fill="currentColor"/>
    <rect x="9" y="3" width="5" height="18" rx="2.5" fill="currentColor"/>
    <rect x="16" y="8" width="5" height="8" rx="2.5" fill="currentColor"/>
  </svg>
);

export default function PatientLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';

  const navItems = [
    { name: 'Overview', path: '/patient', icon: <HomeIcon /> },
    { name: 'Appointments', path: '/patient/appointments', icon: <CalendarIcon /> },
    { name: 'Medications', path: '/patient/medications', icon: <PillIcon />, badge: '2' },
    { name: 'Care plan', path: '/patient/plan', icon: <HeartIcon /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#0B1514] text-white font-sans selection:bg-[#5EEAD4] selection:text-[#0B1514]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F1C1A] border-r border-[#1B2D2A] flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="h-20 flex items-center px-6 gap-3">
          <CareSyncLogo />
          <span className="font-extrabold text-xl tracking-tight">CareSync</span>
        </div>

        {/* Profile Snippet */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1B2D2A] cursor-pointer transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-bold text-sm truncate text-slate-100">{user?.name || 'Jordan Davis'}</h3>
              <p className="text-xs text-[#7A9791] truncate">Patient account</p>
            </div>
            <div className="text-[#7A9791] group-hover:text-white">•••</div>
          </div>
        </div>

        <div className="px-6 py-2">
          <div className="h-px bg-[#1B2D2A] w-full"></div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <p className="px-2 text-xs font-bold text-[#5B7B75] mb-4 tracking-wider">YOUR CARE</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/patient' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-[#18302B] text-[#5EEAD4]' 
                    : 'text-[#82A09A] hover:bg-[#1B2D2A] hover:text-white'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="bg-[#FDA4AF] text-[#881337] text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-[#1B2D2A] bg-[#0B1514]">
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A9791]">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search your care"
                className="w-64 bg-[#10201D] border border-[#1B2D2A] text-white text-sm rounded-full pl-10 pr-12 py-2 focus:outline-none focus:border-[#5EEAD4] transition-colors placeholder-[#5B7B75]"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[#5B7B75] text-[10px] font-bold border border-[#1B2D2A] px-1.5 py-0.5 rounded">⌘K</span>
              </div>
            </div>

            <button className="flex items-center gap-2 text-[#82A09A] hover:text-white text-sm font-bold transition-colors">
              <SunIcon /> Light
            </button>

            <button className="text-[#82A09A] hover:text-white relative">
              <BellIcon />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#FDA4AF] rounded-full border border-[#0B1514]"></span>
            </button>

            <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer">
              {initials}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
