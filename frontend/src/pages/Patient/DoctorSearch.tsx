import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const FilterIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;

interface Doctor {
  doctorId: string;
  name: string;
  email: string;
  specialisation: string;
  slot_duration_min: number;
}

export default function DoctorSearch() {
  const [search, setSearch] = useState('');
  const [specialisation, setSpecialisation] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', specialisation],
    queryFn: () => api.get<{ doctors: Doctor[] }>('/api/patient/doctors', {
      params: specialisation ? { specialisation } : {},
    }).then(r => r.data),
  });

  const filtered = data?.doctors?.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialisation.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const specialisations = [...new Set(data?.doctors?.map(d => d.specialisation) || [])];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto font-sans pb-12">
      
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-brand-dark to-slate-900 rounded-[2rem] p-10 shadow-lg border border-slate-700 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2" />
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Find a Specialist</h1>
          <p className="text-slate-300 font-medium text-lg leading-relaxed">Browse our network of top-rated healthcare professionals and book your appointment instantly.</p>
        </div>
      </div>

      {/* Advanced Search Bar (Glassmorphism inspired) */}
      <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 flex flex-col md:flex-row gap-4 relative z-20 -mt-12 mx-4 md:mx-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
            <SearchIcon />
          </div>
          <input 
            type="text" 
            placeholder="Search by doctor name or condition..." 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 text-brand-dark font-medium transition-all"
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="relative md:w-64">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
            <FilterIcon />
          </div>
          <select 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-primary/20 text-brand-dark font-medium transition-all appearance-none cursor-pointer"
            value={specialisation}
            onChange={e => setSpecialisation(e.target.value)}
          >
            <option value="">All Specialisations</option>
            {specialisations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Results Section */}
      <div className="px-2">
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(doctor => (
            <div key={doctor.doctorId} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
              
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-blue-400 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-extrabold text-2xl tracking-tighter">Dr</span>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg border border-emerald-100">
                    {doctor.slot_duration_min}m slots
                  </div>
                </div>
                
                <h3 className="font-extrabold text-xl text-brand-dark mb-1">Dr. {doctor.name}</h3>
                <p className="text-brand-primary font-bold text-sm mb-4">{doctor.specialisation}</p>
              </div>

              <Link to={`/patient/book/${doctor.doctorId}`} className="w-full bg-slate-50 hover:bg-brand-primary text-brand-dark hover:text-white border border-slate-200 hover:border-brand-primary font-bold py-3.5 rounded-xl transition-all text-center group-hover:shadow-[0_4px_14px_0_rgb(37,99,235,0.2)]">
                Book Appointment
              </Link>
            </div>
          ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed mx-2">
            <SearchIcon />
            <p className="text-2xl font-bold text-brand-dark mt-4 mb-2">No specialists found</p>
            <p className="text-slate-500 font-medium">Try adjusting your filters or search term.</p>
            <button onClick={() => { setSearch(''); setSpecialisation(''); }} className="mt-6 text-brand-primary font-bold hover:underline">
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
