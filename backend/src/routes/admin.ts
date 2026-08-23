import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { sendCancellationEmail } from '../services/email';
import { deleteCalendarEvent } from '../services/calendar';
import { z } from 'zod';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

// --- Doctor Profile CRUD ---
router.get('/doctors', async (_req: Request, res: Response) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: { doctorProfile: true },
    });
    res.json({ doctors });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/doctors', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(8),
      specialisation: z.string().min(1),
      working_hours: z.record(z.union([z.object({ start: z.string(), end: z.string() }), z.null()])),
      slot_duration_min: z.number().int().min(5).default(30),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { email, name, password, specialisation, working_hours, slot_duration_min } = parsed.data;
    const bcrypt = await import('bcryptjs');
    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email, name, password_hash, role: 'DOCTOR',
        doctorProfile: { create: { specialisation, working_hours, slot_duration_min } },
      },
      include: { doctorProfile: true },
    });
    res.status(201).json({ user });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      res.status(409).json({ error: 'Email already exists' }); return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/doctors/:doctorId/profile', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      specialisation: z.string().optional(),
      working_hours: z.record(z.union([z.object({ start: z.string(), end: z.string() }), z.null()])).optional(),
      slot_duration_min: z.number().int().min(5).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const profile = await prisma.doctorProfile.update({
      where: { user_id: req.params.doctorId },
      data: parsed.data,
    });
    res.json({ profile });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/doctors/:doctorId', async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.doctorId } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// --- Leave Management ---
router.post('/leave', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      doctor_id: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reason: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { doctor_id, date, reason } = parsed.data;
    const leaveDate = new Date(date);

    // Create the leave record (will fail if duplicate with @@unique)
    let leave;
    try {
      leave = await prisma.doctorLeave.create({
        data: { doctor_id, date: leaveDate, reason },
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
        res.status(409).json({ error: 'Leave already marked for this date' }); return;
      }
      throw err;
    }

    // Find all booked appointments for this doctor on this date
    const dayStart = new Date(leaveDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(leaveDate);
    dayEnd.setHours(23, 59, 59, 999);

    const affectedSlots = await prisma.slot.findMany({
      where: {
        doctor_id: (await prisma.doctorProfile.findUnique({ where: { user_id: doctor_id } }))?.id || '',
        start_time: { gte: dayStart, lte: dayEnd },
        status: 'BOOKED',
      },
      include: {
        appointment: {
          include: {
            patient: { select: { email: true, name: true } },
            doctor: { select: { name: true } },
          },
        },
      },
    });

    // Cancel booked appointments in a transaction
    if (affectedSlots.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const slot of affectedSlots) {
          await tx.slot.update({ where: { id: slot.id }, data: { status: 'CANCELLED' } });
          if (slot.appointment) {
            await tx.appointment.update({
              where: { id: slot.appointment.id },
              data: { status: 'CANCELLED' },
            });
          }
        }
      });

      // Fire-and-forget async notifications
      setImmediate(async () => {
        for (const slot of affectedSlots) {
          if (!slot.appointment) continue;
          const appt = slot.appointment;
          // Email notification
          try {
            await sendCancellationEmail({
              to: appt.patient.email,
              patientName: appt.patient.name,
              doctorName: appt.doctor.name,
              date: slot.start_time.toLocaleDateString('en-IN'),
              reason: reason || 'Doctor unavailable',
            }, appt.id);
          } catch (e) { console.error('[Leave] Email send failed:', e); }
          // Calendar notifications
          if (appt.google_event_id_patient) {
            await deleteCalendarEvent(appt.patient_id, appt.google_event_id_patient);
          }
          if (appt.google_event_id_doctor) {
            await deleteCalendarEvent(appt.doctor_id, appt.google_event_id_doctor);
          }
        }
      });
    }

    res.status(201).json({ leave, affected_appointments: affectedSlots.length });
  } catch (err) {
    console.error('Leave error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/leaves', async (_req: Request, res: Response) => {
  try {
    const leaves = await prisma.doctorLeave.findMany({
      include: { doctor: { select: { name: true, email: true } } },
      orderBy: { date: 'desc' },
    });
    res.json({ leaves });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// --- Slot Generation ---
router.post('/slots/generate', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      doctor_id: z.string().optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { doctor_id, date } = parsed.data;
    const { generateSlotsForDate } = await import('../jobs/slotGenerator');
    const count = await generateSlotsForDate(date, doctor_id);
    res.json({ generated: count, date });
  } catch (err) {
    console.error('Slot gen error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Failed Notifications ---
router.get('/notifications/failed', async (_req: Request, res: Response) => {
  try {
    const failed = await prisma.notificationLog.findMany({
      where: { status: { in: ['FAILED', 'RETRYING'] } },
      include: {
        appointment: {
          include: {
            patient: { select: { name: true, email: true } },
            doctor: { select: { name: true } },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: 100,
    });
    res.json({ notifications: failed });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/notifications/:id/retry', async (req: Request, res: Response) => {
  try {
    await prisma.notificationLog.update({
      where: { id: req.params.id },
      data: { status: 'PENDING', attempts: 0, last_error: null },
    });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
