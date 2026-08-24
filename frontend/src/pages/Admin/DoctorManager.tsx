import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';

interface DoctorUser {
  id: string;
  name: string;
  email: string;
  doctorProfile?: {
    specialisation: string;
    slot_duration_min: number;
    working_hours: Record<string, unknown>;
  };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultWorkingHours = Object.fromEntries(
  DAYS.map((d: any) => [d, d === 'saturday' || d === 'sunday' ? null : { start: '09:00', end: '17:00' }])
);

export default function DoctorManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    specialisation: '', slot_duration_min: 30,
    working_hours: defaultWorkingHours,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => api.get<{ doctors: DoctorUser[] }>('/api/admin/doctors').then((r: any) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/admin/doctors', form),
    onSuccess: () => {
      toast.success('Doctor created!');
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      setShowForm(false);
      setForm({ name: '', email: '', password: '', specialisation: '', slot_duration_min: 30, working_hours: defaultWorkingHours });
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create doctor'
        : 'Failed to create doctor';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/doctors/${id}`),
    onSuccess: () => {
      toast.success('Doctor removed');
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
    },
    onError: () => toast.error('Failed to delete doctor'),
  });

  const generateSlotsMutation = useMutation({
    mutationFn: (data: { doctor_id: string; date: string }) => api.post('/api/admin/slots/generate', data),
    onSuccess: (res: any) => {
      const count = (res.data as { generated: number }).generated;
      toast.success(`Generated ${count} slots!`);
    },
    onError: () => toast.error('Slot generation failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Doctor Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Doctor'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">Add New Doctor</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialisation</label>
              <input className="input" value={form.specialisation} onChange={e => setForm(f => ({ ...f, specialisation: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (min)</label>
              <input type="number" className="input" value={form.slot_duration_min}
                onChange={e => setForm(f => ({ ...f, slot_duration_min: parseInt(e.target.value) }))} />
            </div>
          </div>
          <button className="btn-primary mt-4" onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Doctor'}
          </button>
        </div>
      )}

      {isLoading && <div className="text-center py-8 text-gray-500">Loading...</div>}

      <div className="space-y-3">
        {data?.doctors?.map((doctor: any) => (
          <div key={doctor.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Dr. {doctor.name}</h3>
                <p className="text-sm text-gray-500">{doctor.email}</p>
                {doctor.doctorProfile && (
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                      {doctor.doctorProfile.specialisation}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {doctor.doctorProfile.slot_duration_min} min slots
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => generateSlotsMutation.mutate({
                    doctor_id: doctor.id,
                    date: new Date().toISOString().split('T')[0],
                  })}
                  className="btn-secondary text-sm">
                  Generate Slots
                </button>
                <button
                  onClick={() => { if (confirm('Delete this doctor?')) deleteMutation.mutate(doctor.id); }}
                  className="btn-danger text-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




