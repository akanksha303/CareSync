import { prisma } from '../config/prisma';
import type { WorkingHours } from '../types';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export async function generateSlotsForDate(dateStr: string, specificDoctorId?: string): Promise<number> {
  const date = new Date(dateStr);
  const dayName = DAY_NAMES[date.getDay()];

  const where = specificDoctorId ? { user_id: specificDoctorId } : {};
  const profiles = await prisma.doctorProfile.findMany({ where });

  let totalCreated = 0;

  for (const profile of profiles) {
    // Check if doctor is on leave
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    const leave = await prisma.doctorLeave.findFirst({
      where: { doctor_id: profile.user_id, date: { gte: dayStart, lte: dayEnd } },
    });
    if (leave) continue;

    const workingHours = profile.working_hours as WorkingHours;
    const daySchedule = workingHours[dayName];
    if (!daySchedule) continue; // Doctor doesn't work this day

    const { start, end } = daySchedule;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const slotDuration = profile.slot_duration_min;
    const slots: { doctor_id: string; start_time: Date; end_time: Date; status: 'AVAILABLE' }[] = [];

    let current = new Date(date);
    current.setHours(startH, startM, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(endH, endM, 0, 0);

    while (current < endTime) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60 * 1000);
      if (slotEnd > endTime) break;

      // Check if slot already exists
      const existing = await prisma.slot.findFirst({
        where: { doctor_id: profile.id, start_time: new Date(current) },
      });
      if (!existing) {
        slots.push({
          doctor_id: profile.id,
          start_time: new Date(current),
          end_time: new Date(slotEnd),
          status: 'AVAILABLE',
        });
      }
      current = new Date(current.getTime() + slotDuration * 60 * 1000);
    }

    if (slots.length > 0) {
      const result = await prisma.slot.createMany({ data: slots, skipDuplicates: true });
      totalCreated += result.count;
    }
  }

  return totalCreated;
}

export async function generateSlotsForNextDays(days: number = 7): Promise<void> {
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const count = await generateSlotsForDate(dateStr);
    if (count > 0) console.log(`[SlotGen] Generated ${count} slots for ${dateStr}`);
  }
}
