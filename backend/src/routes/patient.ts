import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { generatePreVisitSummary } from '../services/llm';
import { sendBookingConfirmation } from '../services/email';
import { createCalendarEvent } from '../services/calendar';
import { z } from 'zod';

const router = Router();
router.use(authenticate, requireRole('PATIENT'));

// Search doctors by specialisation
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const { specialisation, name } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (specialisation) where.specialisation = { contains: specialisation, mode: 'insensitive' };
    const profiles = await prisma.doctorProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
          ...(name ? { where: { name: { contains: name as string, mode: 'insensitive' } } } : {}),
        },
      },
    });
    const doctors = profiles
      .filter(p => p.user)
      .map(p => ({
        doctorId: p.user_id,
        name: p.user.name,
        email: p.user.email,
        specialisation: p.specialisation,
        slot_duration_min: p.slot_duration_min,
      }));
    res.json({ doctors });
  } catch (err) {
    console.error('Search doctors error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available slots for a doctor
router.get('/doctors/:doctorId/slots', async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query as { date?: string };
    const profile = await prisma.doctorProfile.findUnique({ where: { user_id: doctorId } });
    if (!profile) { res.status(404).json({ error: 'Doctor not found' }); return; }

    const where: Record<string, unknown> = {
      doctor_id: profile.id,
      status: 'AVAILABLE',
      start_time: { gte: new Date() },
    };
    if (date) {
      const d = new Date(date as string);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      where.start_time = { gte: dayStart, lte: dayEnd };
    }
    const slots = await prisma.slot.findMany({
      where,
      orderBy: { start_time: 'asc' },
      take: 50,
    });
    res.json({ slots });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// Hold a slot — atomic conditional update
router.post('/slots/:slotId/hold', async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    const heldUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    // Atomic conditional update: only update if status is AVAILABLE
    const result = await prisma.slot.updateMany({
      where: { id: slotId, status: 'AVAILABLE' },
      data: { status: 'HELD', held_until: heldUntil },
    });
    if (result.count === 0) {
      res.status(409).json({ error: 'Slot no longer available' });
      return;
    }
    res.json({ held_until: heldUntil });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// Book appointment (HELD -> BOOKED + create Appointment row)
router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      slot_id: z.string(),
      symptoms_text: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { slot_id, symptoms_text } = parsed.data;
    const patientId = req.user!.userId;

    // Verify slot is HELD (by this session — anyone who has it held can complete booking)
    const slot = await prisma.slot.findUnique({ where: { id: slot_id } });
    if (!slot) { res.status(404).json({ error: 'Slot not found' }); return; }
    if (slot.status !== 'HELD') { res.status(409).json({ error: 'Slot is not held' }); return; }
    if (slot.held_until && slot.held_until < new Date()) {
      res.status(409).json({ error: 'Hold expired — slot is no longer reserved for you' }); return;
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: slot.doctor_id } });
    if (!doctorProfile) { res.status(404).json({ error: 'Doctor profile not found' }); return; }

    // Generate pre-visit LLM summary (non-blocking on failure)
    let aiPreSummary: object | null = null;
    if (symptoms_text) {
      const summary = await generatePreVisitSummary(symptoms_text);
      aiPreSummary = summary;
    }

    // Atomic HELD -> BOOKED + create appointment in transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.slot.updateMany({
        where: { id: slot_id, status: 'HELD' },
        data: { status: 'BOOKED', held_until: null },
      });
      if (updated.count === 0) throw new Error('SLOT_NOT_HELD');

      return tx.appointment.create({
        data: {
          slot_id,
          patient_id: patientId,
          doctor_id: doctorProfile.user_id,
          status: 'CONFIRMED',
          symptoms_text,
          ai_pre_summary: aiPreSummary || undefined,
        },
        include: {
          patient: { select: { name: true, email: true } },
          doctor: { select: { name: true, email: true } },
          slot: true,
        },
      });
    });

    // Async: send email + create calendar events
    setImmediate(async () => {
      try {
        const dt = appointment.slot.start_time;
        const dateStr = dt.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        await sendBookingConfirmation({
          to: appointment.patient.email,
          patientName: appointment.patient.name,
          doctorName: appointment.doctor.name,
          date: dateStr,
          time: timeStr,
          appointmentId: appointment.id,
        }, appointment.id);
      } catch (e) { console.error('[Book] Email failed:', e); }

      try {
        const eventSummary = `Appointment with Dr. ${appointment.doctor.name}`;
        const desc = `CareSync appointment. Reference: ${appointment.id}`;
        const [patientEventId, doctorEventId] = await Promise.all([
          createCalendarEvent(patientId, {
            summary: eventSummary,
            description: desc,
            startTime: appointment.slot.start_time,
            endTime: appointment.slot.end_time,
            attendeeEmail: appointment.doctor.email,
          }),
          createCalendarEvent(doctorProfile.user_id, {
            summary: `Appointment with ${appointment.patient.name}`,
            description: desc,
            startTime: appointment.slot.start_time,
            endTime: appointment.slot.end_time,
            attendeeEmail: appointment.patient.email,
          }),
        ]);
        if (patientEventId || doctorEventId) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              ...(patientEventId ? { google_event_id_patient: patientEventId } : {}),
              ...(doctorEventId ? { google_event_id_doctor: doctorEventId } : {}),
            },
          });
        }
      } catch (e) { console.error('[Book] Calendar failed:', e); }
    });

    res.status(201).json({ appointment });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'SLOT_NOT_HELD') {
      res.status(409).json({ error: 'Slot booking failed — slot may have expired' }); return;
    }
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      res.status(409).json({ error: 'Appointment already exists for this slot' }); return;
    }
    console.error('Book appointment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List patient appointments
router.get('/appointments', async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patient_id: req.user!.userId },
      include: {
        slot: true,
        doctor: { select: { name: true, email: true } },
        medicationReminders: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json({ appointments });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// Cancel appointment
router.post('/appointments/:id/cancel', async (req: Request, res: Response) => {
  try {
    const appt = await prisma.appointment.findFirst({
      where: { id: req.params.id, patient_id: req.user!.userId },
      include: { slot: true, doctor: { select: { name: true } }, patient: { select: { name: true, email: true } } },
    });
    if (!appt) { res.status(404).json({ error: 'Appointment not found' }); return; }
    if (appt.status === 'CANCELLED') { res.status(400).json({ error: 'Already cancelled' }); return; }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({ where: { id: appt.id }, data: { status: 'CANCELLED' } });
      await tx.slot.update({ where: { id: appt.slot_id }, data: { status: 'AVAILABLE', held_until: null } });
    });

    setImmediate(async () => {
      try {
        const { sendCancellationEmail } = await import('../services/email');
        await sendCancellationEmail({
          to: appt.patient.email,
          patientName: appt.patient.name,
          doctorName: appt.doctor.name,
          date: appt.slot.start_time.toLocaleDateString('en-IN'),
        }, appt.id);
      } catch (e) { console.error('[Cancel] Email failed:', e); }
      if (appt.google_event_id_patient) await deleteCalendarEvent(appt.patient_id, appt.google_event_id_patient);
      if (appt.google_event_id_doctor) await deleteCalendarEvent(appt.doctor_id, appt.google_event_id_doctor);
    });

    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
