import { transporter } from '../config/email';
import { prisma } from '../config/prisma';

const FROM = process.env.EMAIL_FROM || 'CareSync <no-reply@caresync.app>';

export interface BookingEmailData {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  appointmentId: string;
}

export interface CancellationEmailData {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  reason?: string;
}

export interface ReminderEmailData {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}

export interface MedReminderEmailData {
  to: string;
  patientName: string;
  medicineName: string;
  dosage?: string;
  frequency: string;
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function sendBookingConfirmation(
  data: BookingEmailData,
  appointmentId: string
): Promise<void> {
  const logId = await createLog(appointmentId, 'EMAIL', { action: 'booking_confirmation', to: data.to });
  try {
    await transporter.sendMail({
      from: FROM,
      to: data.to,
      subject: `✅ Appointment Confirmed — ${data.date} at ${data.time}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563eb">Appointment Confirmed</h2>
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>Your appointment with <strong>Dr. ${data.doctorName}</strong> has been confirmed.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Date</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${data.date}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Time</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${data.time}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Reference</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${data.appointmentId}</td></tr>
          </table>
          <p style="color:#6b7280;font-size:12px">Please arrive 10 minutes early. Reply to this email if you need to reschedule.</p>
        </div>
      `,
    });
    await updateLog(logId, 'SENT');
  } catch (err) {
    await updateLog(logId, 'RETRYING', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

export async function sendCancellationEmail(
  data: CancellationEmailData,
  appointmentId: string
): Promise<void> {
  const logId = await createLog(appointmentId, 'EMAIL', { action: 'cancellation', to: data.to });
  try {
    await transporter.sendMail({
      from: FROM,
      to: data.to,
      subject: `❌ Appointment Cancelled — ${data.date}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#dc2626">Appointment Cancelled</h2>
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>Your appointment with <strong>Dr. ${data.doctorName}</strong> on <strong>${data.date}</strong> has been cancelled.</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          <p>Please book a new appointment at your convenience.</p>
        </div>
      `,
    });
    await updateLog(logId, 'SENT');
  } catch (err) {
    await updateLog(logId, 'RETRYING', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

export async function sendReminderEmail(
  data: ReminderEmailData,
  appointmentId: string
): Promise<void> {
  const logId = await createLog(appointmentId, 'EMAIL', { action: 'reminder', to: data.to });
  try {
    await transporter.sendMail({
      from: FROM,
      to: data.to,
      subject: `🔔 Reminder: Appointment Tomorrow at ${data.time}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#d97706">Appointment Reminder</h2>
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>This is a reminder for your appointment with <strong>Dr. ${data.doctorName}</strong>.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Date</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${data.date}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Time</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${data.time}</td></tr>
          </table>
          <p>See you soon!</p>
        </div>
      `,
    });
    await updateLog(logId, 'SENT');
  } catch (err) {
    await updateLog(logId, 'RETRYING', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

export async function sendMedicationReminder(
  data: MedReminderEmailData
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: data.to,
    subject: `💊 Medication Reminder: ${data.medicineName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">Medication Reminder</h2>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Time to take your medication:</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Medicine</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${data.medicineName}</td></tr>
          ${data.dosage ? `<tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Dosage</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${data.dosage}</td></tr>` : ''}
          <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Frequency</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${data.frequency}</td></tr>
        </table>
      </div>
    `,
  });
}

export function formatDate(dt: Date | string): string {
  const { date, time } = formatDateTime(new Date(dt).toISOString());
  return `${date} at ${time}`;
}

async function createLog(
  appointmentId: string,
  type: 'EMAIL' | 'CALENDAR',
  metadata?: object
): Promise<string> {
  const log = await prisma.notificationLog.create({
    data: { appointment_id: appointmentId, type, status: 'PENDING', metadata: metadata || {} },
  });
  return log.id;
}

async function updateLog(id: string, status: 'SENT' | 'RETRYING' | 'FAILED', error?: string): Promise<void> {
  await prisma.notificationLog.update({
    where: { id },
    data: {
      status,
      ...(error ? { last_error: error, attempts: { increment: 1 } } : {}),
    },
  });
}
