import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { sendBookingConfirmation, sendCancellationEmail, sendReminderEmail } from '../services/email';

const MAX_ATTEMPTS = 3;

function getBackoffDelay(attempts: number): number {
  return Math.pow(2, attempts) * 60 * 1000; // 2^n minutes
}

export function startNotificationWorker(): void {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const pending = await prisma.notificationLog.findMany({
        where: {
          status: { in: ['PENDING', 'RETRYING'] },
        },
        include: {
          appointment: {
            include: {
              patient: { select: { name: true, email: true } },
              doctor: { select: { name: true } },
              slot: true,
            },
          },
        },
        take: 50,
      });

      for (const log of pending) {
        // Exponential backoff check
        if (log.attempts > 0 && log.updated_at) {
          const nextRetry = new Date(log.updated_at.getTime() + getBackoffDelay(log.attempts));
          if (now < nextRetry) continue;
        }

        if (log.type !== 'EMAIL') continue; // Calendar failures handled separately

        const appt = log.appointment;
        const meta = log.metadata as Record<string, string> | null;
        const action = meta?.action;

        try {
          const dt = appt.slot.start_time;
          const dateStr = dt.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

          if (action === 'booking_confirmation') {
            await sendBookingConfirmation({
              to: appt.patient.email,
              patientName: appt.patient.name,
              doctorName: appt.doctor.name,
              date: dateStr,
              time: timeStr,
              appointmentId: appt.id,
            }, appt.id);
          } else if (action === 'cancellation') {
            await sendCancellationEmail({
              to: appt.patient.email,
              patientName: appt.patient.name,
              doctorName: appt.doctor.name,
              date: dateStr,
            }, appt.id);
          } else if (action === 'reminder') {
            await sendReminderEmail({
              to: appt.patient.email,
              patientName: appt.patient.name,
              doctorName: appt.doctor.name,
              date: dateStr,
              time: timeStr,
            }, appt.id);
          }
        } catch (sendErr) {
          const attempts = log.attempts + 1;
          const newStatus = attempts >= MAX_ATTEMPTS ? 'FAILED' : 'RETRYING';
          await prisma.notificationLog.update({
            where: { id: log.id },
            data: {
              attempts,
              status: newStatus,
              last_error: sendErr instanceof Error ? sendErr.message : String(sendErr),
            },
          });
        }
      }
    } catch (err) {
      console.error('[NotificationWorker] Job error:', err);
    }
  });
  console.log('[NotificationWorker] Started — runs every 5 minutes');
}

// 24-hour appointment reminder job
export function startReminderJob(): void {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const window = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const upcoming = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          slot: { start_time: { gte: in24h, lte: window } },
        },
        include: {
          patient: { select: { name: true, email: true } },
          doctor: { select: { name: true } },
          slot: true,
          notificationLogs: { where: { type: 'EMAIL', metadata: { path: ['action'], equals: 'reminder' } } },
        },
      });

      for (const appt of upcoming) {
        // Skip if reminder already queued
        if (appt.notificationLogs.length > 0) continue;

        const dt = appt.slot.start_time;
        const dateStr = dt.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        // Create PENDING notification log (will be picked up by notification worker)
        await prisma.notificationLog.create({
          data: {
            appointment_id: appt.id,
            type: 'EMAIL',
            status: 'PENDING',
            metadata: { action: 'reminder', to: appt.patient.email },
          },
        });
        console.log(`[ReminderJob] Queued reminder for appointment ${appt.id}`);
      }
    } catch (err) {
      console.error('[ReminderJob] Error:', err);
    }
  });
  console.log('[ReminderJob] Started — runs hourly');
}
