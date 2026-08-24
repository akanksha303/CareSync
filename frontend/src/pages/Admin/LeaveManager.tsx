import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';

interface DoctorUser {
  id: string;
  name: string;
  email: string;
}

interface Leave {
  id: string;
  doctor_id: string;
  date: string;
  reason?: string;
  doctor: { name: string; email: string };
}

export default function LeaveManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ doctor_id: '', date: '', reason: '' });

  const { data: doctorsData } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => api.get<{ doctors: DoctorUser[] }>('/api/admin/doctors').then((r: any) => r.data),
  });

  const { data: leavesData, isLoading } = useQuery({
    queryKey: ['admin-leaves'],
    queryFn: () => api.get<{ leaves: Leave[] }>('/api/admin/leaves').then((r: any) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post<{ affected_appointments: number }>('/api/admin/leave', form),
    onSuccess: (res) => {
      const count = res.data.affected_appointments;
      toast.success(`Leave marked! ${count > 0 ? `${count} appointment(s) cancelled.` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['admin-leaves'] });
      setForm({ doctor_id: '', date: '', reason: '' });
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to mark leave'
        : 'Failed to mark leave';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leave Management</h1>

      <div className="card">
        <h2 className="font-semibold mb-4">Mark Doctor Leave</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select className="input" value={form.doctor_id}
              onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
              <option value="">Select doctor...</option>
              {doctorsData?.doctors?.map((d: any) => (
                <option key={d.id} value={d.id}>Dr. {d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className="input" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <input className="input" placeholder="e.g. Medical emergency" value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          ⚠️ If there are existing booked appointments on this date, they will be automatically cancelled and patients notified.
        </div>
        <button className="btn-primary mt-4" onClick={() => createMutation.mutate()}
          disabled={!form.doctor_id || !form.date || createMutation.isPending}>
          {createMutation.isPending ? 'Processing...' : 'Mark Leave'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Leave Records</h2>
        {isLoading && <div className="text-gray-500 text-sm">Loading...</div>}
        {!isLoading && (!leavesData?.leaves || leavesData.leaves.length === 0) && (
          <p className="text-gray-500 text-sm">No leave records</p>
        )}
        <div className="space-y-2">
          {leavesData?.leaves?.map((leave: any) => (
            <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Dr. {leave.doctor.name}</p>
                <p className="text-sm text-gray-500">{new Date(leave.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              {leave.reason && <span className="text-sm text-gray-600">{leave.reason}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


