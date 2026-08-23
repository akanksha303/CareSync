import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { sendMedicationReminder } from '../services/email';

function advanceNextSend(frequency: string, from: Date): Date {
  const next = new Date(from);
  const f = frequency.toLowerCase();
  if (f.includes('hourly') || f.includes('every hour')) {
    next.setHours(next.getHours() + 1);
  } else if (f.includes('twice') || f.includes('bid') || f.includes('2x')) {
    next.setHours(next.getHours() + 12);
  } else if (f.includes('three') || f.includes('tid') || f.includes('3x')) {
    next.setHours(next.getHours() + 8);
  } else {
    // Default: once daily
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function startMedicationReminderJob(): void {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      const now = new Date();
      const due = await prisma.medicationReminder.findMany({
        where: { active: true, next_send_at: { lte: now } },
        include: {
          appointment: {
            include: { patient: { select: { name: true, email: true } } },
          },
        },
        take: 100,
      });

      for (const reminder of due) {
        try {
          await sendMedicationReminder({
            to: reminder.appointment.patient.email,
            patientName: reminder.appointment.patient.name,
            medicineName: reminder.medicine_name,
            dosage: reminder.dosage || undefined,
            frequency: reminder.frequency,
          });
          const nextSend = advanceNextSend(reminder.frequency, now);
          await prisma.medicationReminder.update({
            where: { id: reminder.id },
            data: { next_send_at: nextSend },
          });
        } catch (err) {
          console.error(`[MedReminder] Failed for reminder ${reminder.id}:`, err);
        }
      }
    } catch (err) {
      console.error('[MedReminder] Job error:', err);
    }
  });
  console.log('[MedReminder] Job started — runs every 30 minutes');
}
