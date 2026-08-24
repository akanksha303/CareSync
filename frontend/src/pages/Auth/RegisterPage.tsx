import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Inline SVGs for clean, professional icons
const HeartPulseIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 13h2l2 3 3-6 2 3h2"/></svg>;
const MailIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const LockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'PATIENT' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Registration failed'
        : 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-brand-bg text-brand-dark">
      
      {/* LEFT SIDE - Brand & Messaging (Premium Dark Blue) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-brand-dark p-12 flex-col justify-between">
        {/* Soft glowing background orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-accent/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />
        
        {/* Top Logo */}
        <div className="flex items-center gap-3 z-10 text-white">
          <div className="text-brand-primary">
            <HeartPulseIcon />
          </div>
          <span className="text-2xl font-bold tracking-tight">CareSync</span>
        </div>

        {/* Center Content */}
        <div className="z-10 mt-20 max-w-lg">
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-8 text-white">
            Care that connects.<br/>
            <span className="text-brand-primary">Care that counts.</span>
          </h1>
          <p className="text-xl text-slate-300 font-medium leading-relaxed mb-12 max-w-md">
            Bring patients, appointments, records, and care teams together in one seamless workspace built to make healthcare simpler.
          </p>

          {/* Clean overlapping glassmorphism cards */}
          <div className="relative h-48 w-full max-w-md animate-float">
            <div className="absolute top-0 left-0 w-64 bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl">
              <div className="h-3 w-1/3 bg-brand-primary/80 rounded-full mb-3"></div>
              <div className="h-2 w-3/4 bg-slate-300/50 rounded-full mb-2"></div>
              <div className="h-2 w-1/2 bg-slate-300/50 rounded-full"></div>
            </div>
            
            <div className="absolute top-12 left-24 w-72 bg-gradient-to-r from-brand-primary to-blue-500 p-6 rounded-2xl shadow-2xl border border-white/20 animate-float-delayed">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20"></div>
                <div>
                  <div className="h-3 w-24 bg-white rounded-full mb-2"></div>
                  <div className="h-2 w-16 bg-white/60 rounded-full"></div>
                </div>
              </div>
              <div className="h-2 w-full bg-white/40 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Bottom footer text */}
        <div className="z-10 text-slate-500 text-sm font-medium">
          © {new Date().getFullYear()} CareSync. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE - Register Form (Clean White/Slate) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-brand-bg">
        
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-10 z-10">
          
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center gap-2 mb-8 justify-center">
            <div className="text-brand-primary">
              <HeartPulseIcon />
            </div>
            <span className="text-2xl font-bold tracking-tight text-brand-dark">CareSync</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-brand-dark mb-2">Create Account</h2>
            <p className="text-slate-500 font-medium">Join CareSync to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Role Selector Tabs */}
            <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 mb-2">
              {['PATIENT', 'DOCTOR', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role }))}
                  className={`flex-1 text-xs sm:text-sm font-bold py-2.5 rounded-lg transition-all duration-300 ${
                    form.role === role 
                      ? 'bg-white text-brand-primary shadow-sm scale-[1.02]' 
                      : 'text-slate-500 hover:text-brand-dark'
                  }`}
                >
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <UserIcon />
                </div>
                <input 
                  type="text" 
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 font-medium text-brand-dark"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <MailIcon />
                </div>
                <input 
                  type="email" 
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 font-medium text-brand-dark"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <LockIcon />
                </div>
                <input 
                  type="password" 
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 font-medium text-brand-dark"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="relative flex items-center py-2 mt-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-bold">Or sign up with</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button type="button" className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm mt-4 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.7 17.57V20.34H19.27C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.27 20.34L15.7 17.57C14.72 18.23 13.47 18.63 12 18.63C9.16 18.63 6.76 16.71 5.9 14.14H2.23V16.99C4.03 20.56 7.71 23 12 23Z" fill="#34A853"/>
                <path d="M5.9 14.14C5.68 13.49 5.56 12.77 5.56 12C5.56 11.23 5.68 10.51 5.9 9.86V7.01H2.23C1.49 8.48 1.06 10.18 1.06 12C1.06 13.82 1.49 15.52 2.23 16.99L5.9 14.14Z" fill="#FBBC05"/>
                <path d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.34 3.88C17.45 2.12 14.97 1 12 1C7.71 1 4.03 3.44 2.23 7.01L5.9 9.86C6.76 7.29 9.16 5.38 12 5.38Z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            
            <p className="text-center text-sm font-bold text-slate-500 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-primary hover:text-brand-primaryHover transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
