export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialisation: string;
  working_hours: Record<string, { start: string; end: string } | null>;
  slot_duration_min: number;
  user: { id: string; name: string; email: string };
}

export interface Slot {
  id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'CANCELLED';
  held_until: string | null;
}

export interface Appointment {
  id: string;
  slot_id: string;
  patient_id: string;
  doctor_id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  symptoms_text?: string;
  ai_pre_summary?: {
    urgency_level?: 'Low' | 'Medium' | 'High';
    chief_complaint?: string;
    suggested_questions?: string[];
    error?: boolean;
  };
  ai_post_summary?: {
    patient_summary?: string;
    medication_schedule?: string;
    follow_up_steps?: string[];
    error?: boolean;
  };
  doctor_notes?: string;
  prescription?: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  slot: Slot;
  patient?: { id: string; name: string; email: string };
  doctor?: { name: string; email: string };
  medicationReminders?: MedicationReminder[];
}

export interface MedicationReminder {
  id: string;
  medicine_name: string;
  dosage?: string;
  frequency: string;
  next_send_at: string;
  active: boolean;
}

export interface NotificationLog {
  id: string;
  appointment_id: string;
  type: 'EMAIL' | 'CALENDAR';
  status: 'PENDING' | 'SENT' | 'RETRYING' | 'FAILED';
  attempts: number;
  last_error?: string;
  created_at: string;
  appointment?: {
    patient?: { name: string; email: string };
    doctor?: { name: string };
  };
}
