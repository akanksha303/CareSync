import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Inline SVGs replacing Lucide icons to avoid any installations
const HeartPulseIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 13h2l2 3 3-6 2 3h2"/></svg>;
const ShieldIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const StethoscopeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>;
const CalendarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>;
const MailIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const LockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'DOCTOR' | 'ADMIN'>('PATIENT');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Login failed'
        : 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-brand-cream text-brand-teal font-sans">
      {/* LEFT SIDE - Brand & Mascot */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-mint/60 via-brand-cream to-brand-mint/30 p-12 flex-col justify-between">
        {/* Floating background elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-brand-mint rounded-full blur-3xl opacity-50 animate-float" />
        <div className="absolute bottom-40 left-10 w-48 h-48 bg-brand-orange/10 rounded-full blur-2xl animate-float-delayed" />
        
        {/* Top Logo */}
        <div className="flex items-center gap-2 z-10">
          <div className="bg-brand-teal text-white p-2 rounded-xl">
            <HeartPulseIcon />
          </div>
          <span className="text-2xl font-bold tracking-tight">CareSync</span>
        </div>

        {/* Center Content */}
        <div className="z-10 mt-16 max-w-lg">
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight mb-6 text-brand-teal">
            Care that connects.<br/>Care that counts.
          </h1>
          <p className="text-lg text-brand-teal/80 mb-12">
            Everything in place. Everyone in sync. Manage patients, appointments, records, and care coordination seamlessly.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-brand-orange">
                <ShieldIcon />
              </div>
              <span className="font-medium">Secure & Private</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-brand-orange">
                <UsersIcon />
              </div>
              <span className="font-medium">Smart Coordination</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-brand-orange">
                <StethoscopeIcon />
              </div>
              <span className="font-medium">Actionable Insights</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-brand-orange">
                <CalendarIcon />
              </div>
              <span className="font-medium">Real-time Updates</span>
            </div>
          </div>
        </div>

        {/* Abstract Mascot Illustration Area */}
        <div className="relative h-64 mt-8 flex items-center justify-center z-10 animate-float">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm border border-white/50 rounded-3xl shadow-xl flex items-center justify-center overflow-hidden">
             {/* Simple stylized layout to represent the requested elements */}
             <div className="text-center p-6">
               <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-teal/10 rounded-full mb-4 shadow-inner">
                 <span className="text-5xl">🐬</span>
               </div>
               <div className="absolute top-6 right-6 bg-white p-2.5 rounded-xl shadow-md animate-float-delayed text-brand-teal border border-brand-teal/5">
                 <UsersIcon />
               </div>
               <div className="absolute bottom-6 left-6 bg-white p-2.5 rounded-xl shadow-md animate-float text-brand-orange border border-brand-teal/5">
                 <CalendarIcon />
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-brand-cream lg:bg-transparent">
        
        {/* Mobile subtle background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-mint/40 to-brand-cream/10 lg:hidden" />

        <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-10 z-10 relative">
          
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="bg-brand-teal text-white p-2 rounded-xl">
              <HeartPulseIcon />
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-teal">CareSync</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-brand-teal mb-2">Welcome back 👋</h2>
            <p className="text-brand-teal/60 font-medium">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selector Tabs */}
            <div className="bg-white/50 p-1.5 rounded-xl flex gap-1 border border-white/60 shadow-sm">
              {['PATIENT', 'DOCTOR', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role as any)}
                  className={`flex-1 text-xs sm:text-sm font-bold py-2.5 rounded-lg transition-all duration-300 ${
                    selectedRole === role 
                      ? 'bg-brand-orange text-white shadow-md scale-[1.02]' 
                      : 'text-brand-teal/60 hover:bg-white/60'
                  }`}
                >
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-bold text-brand-teal mb-1.5 ml-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-teal/40">
                    <MailIcon />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-white/70 border border-brand-teal/10 rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange outline-none transition-all placeholder:text-brand-teal/30 font-semibold text-brand-teal"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-teal mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-teal/40">
                    <LockIcon />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-white/70 border border-brand-teal/10 rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange outline-none transition-all placeholder:text-brand-teal/30 font-semibold text-brand-teal"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange border-brand-teal/20" />
                <span className="text-sm font-bold text-brand-teal/70">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-brand-orange hover:text-brand-orangeHover transition-colors">
                Forgot password?
              </a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orangeHover text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgb(242,133,98,0.39)] hover:shadow-[0_6px_20px_rgba(242,133,98,0.23)] hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-brand-teal/10"></div>
              <span className="flex-shrink-0 mx-4 text-brand-teal/40 text-sm font-bold">Or continue with</span>
              <div className="flex-grow border-t border-brand-teal/10"></div>
            </div>

            <button type="button" className="w-full bg-white hover:bg-brand-mint/20 border border-brand-teal/10 text-brand-teal font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.7 17.57V20.34H19.27C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.27 20.34L15.7 17.57C14.72 18.23 13.47 18.63 12 18.63C9.16 18.63 6.76 16.71 5.9 14.14H2.23V16.99C4.03 20.56 7.71 23 12 23Z" fill="#34A853"/>
                <path d="M5.9 14.14C5.68 13.49 5.56 12.77 5.56 12C5.56 11.23 5.68 10.51 5.9 9.86V7.01H2.23C1.49 8.48 1.06 10.18 1.06 12C1.06 13.82 1.49 15.52 2.23 16.99L5.9 14.14Z" fill="#FBBC05"/>
                <path d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.34 3.88C17.45 2.12 14.97 1 12 1C7.71 1 4.03 3.44 2.23 7.01L5.9 9.86C6.76 7.29 9.16 5.38 12 5.38Z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            <p className="text-center text-sm font-bold text-brand-teal/70">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-orange hover:text-brand-orangeHover transition-colors">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
