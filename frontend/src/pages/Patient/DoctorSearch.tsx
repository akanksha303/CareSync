import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find a Doctor</h1>
        <p className="text-gray-500">Search by name or specialisation</p>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <input type="text" placeholder="Search by name..." className="input flex-1"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input md:w-48" value={specialisation}
            onChange={e => setSpecialisation(e.target.value)}>
            <option value="">All Specialisations</option>
            {specialisations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-500">Searching...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(doctor => (
          <div key={doctor.doctorId} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Dr. {doctor.name}</h3>
                <p className="text-primary-600 text-sm font-medium">{doctor.specialisation}</p>
                <p className="text-gray-500 text-xs mt-1">{doctor.slot_duration_min} min slots</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-lg">{doctor.name[0]}</span>
              </div>
            </div>
            <Link to={`/patient/book/${doctor.doctorId}`} className="btn-primary w-full mt-4 text-center block">
              Book Appointment
            </Link>
          </div>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">No doctors found</p>
          <p className="text-sm mt-2">Try adjusting your search</p>
        </div>
      )}
    </div>
  );
}
