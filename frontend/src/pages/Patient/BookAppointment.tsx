import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import type { Slot } from '../../types';
import { format } from 'date-fns';

type Step = 'SELECT_SLOT' | 'SYMPTOMS' | 'CONFIRM';

export default function BookAppointment() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('SELECT_SLOT');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [heldUntil, setHeldUntil] = useState<Date | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: () => api.get<{ slots: Slot[] }>(`/api/patient/doctors/${doctorId}/slots`, {
      params: { date },
    }).then((r: any) => r.data),
    enabled: !!doctorId,
  });

  const handleSelectSlot = async (slot: Slot) => {
    setLoading(true);
    try {
      const res = await api.post<{ held_until: string }>(`/api/patient/slots/${slot.id}/hold`);
      setSelectedSlot(slot);
      setHeldUntil(new Date(res.data.held_until));
      setStep('SYMPTOMS');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Slot not available'
        : 'Slot not available';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    try {
      await api.post('/api/patient/appointments', {
        slot_id: selectedSlot.id,
        symptoms_text: symptoms,
      });
      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Booking failed'
        : 'Booking failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const timeRemaining = heldUntil ? Math.max(0, Math.floor((heldUntil.getTime() - Date.now()) / 1000)) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Book Appointment</h1>
        <div className="flex gap-2 mt-3">
          {(['SELECT_SLOT', 'SYMPTOMS', 'CONFIRM'] as Step[]).map((s: any, i: number) => (
            <div key={s} className={`flex items-center gap-2 text-sm ${
              step === s ? 'text-primary-600 font-semibold' : 'text-gray-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step === s ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>{i + 1}</span>
              {s.replace('_', ' ')}
              {i < 2 && <span className="text-gray-300">→</span>}
            </div>
          ))}
        </div>
      </div>

      {step === 'SELECT_SLOT' && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input type="date" className="input" value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDate(e.target.value)} />
          </div>
          {slotsLoading && <div className="text-center py-4 text-gray-500">Loading slots...</div>}
          <div className="grid grid-cols-3 gap-2">
            {slotsData?.slots?.map((slot: any) => (
              <button key={slot.id}
                onClick={() => handleSelectSlot(slot)}
                disabled={loading}
                className="p-3 text-sm border rounded-lg hover:bg-primary-50 hover:border-primary-500 transition-colors text-center">
                {format(new Date(slot.start_time), 'h:mm a')}
              </button>
            ))}
          </div>
          {!slotsLoading && (!slotsData?.slots || slotsData.slots.length === 0) && (
            <p className="text-center text-gray-500 py-4">No available slots for this date</p>
          )}
        </div>
      )}

      {step === 'SYMPTOMS' && selectedSlot && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Describe your symptoms</h2>
            {heldUntil && (
              <span className="text-sm text-orange-600 font-medium">
                ⏱ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining
              </span>
            )}
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <strong>Selected:</strong> {format(new Date(selectedSlot.start_time), 'PPp')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symptoms (optional — helps the doctor prepare)
            </label>
            <textarea className="input h-32 resize-none" value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              placeholder="Describe your symptoms, how long you've had them, severity..." />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setStep('SELECT_SLOT')}>Back</button>
            <button className="btn-primary flex-1" onClick={() => setStep('CONFIRM')}>Continue</button>
          </div>
        </div>
      )}

      {step === 'CONFIRM' && selectedSlot && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Confirm Booking</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-500">Date & Time</span>
              <span className="font-medium">{format(new Date(selectedSlot.start_time), 'PPp')}</span>
            </div>
            {symptoms && (
              <div className="p-2 bg-gray-50 rounded">
                <span className="text-gray-500">Symptoms</span>
                <p className="font-medium mt-1">{symptoms}</p>
              </div>
            )}
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ Your AI pre-visit summary will be generated from your symptoms to help the doctor prepare.
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setStep('SYMPTOMS')}>Back</button>
            <button className="btn-primary flex-1" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


