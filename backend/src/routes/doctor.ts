import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { generatePostVisitSummary } from '../services/llm';
import { z } from 'zod';

const router = Router();
router.use(authenticate, requireRole('DOCTOR'));

// Get doctor's appointments
router.get('/appointments', async (req: Request, res: Response) => {
  try {
    const { status } = req.query as { status?: string };
    const where: Record<string, unknown> = { doctor_id: req.user!.userId };
    if (status) where.status = status;
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        slot: true,
        patient: { select: { id: true, name: true, email: true } },
        medicationReminders: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json({ appointments });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// Get single appointment
router.get('/appointments/:id', async (req: Request, res: Response) => {
  try {
    const appt = await prisma.appointment.findFirst({
      where: { id: req.params.id, doctor_id: req.user!.userId },
      include: {
        slot: true,
        patient: { select: { id: true, name: true, email: true } },
        medicationReminders: true,
      },
    });
    if (!appt) { res.status(404).json({ error: 'Appointment not found' }); return; }
    res.json({ appointment: appt });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// Submit post-visit notes + prescription
router.post('/appointments/:id/complete', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      doctor_notes: z.string().min(1),
      prescription: z.array(z.object({
        medicine_name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
      })).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { doctor_notes, prescription } = parsed.data;

    const appt = await prisma.appointment.findFirst({
      where: { id: req.params.id, doctor_id: req.user!.userId },
    });
    if (!appt) { res.status(404).json({ error: 'Appointment not found' }); return; }

    // Generate post-visit AI summary (non-blocking on failure)
    const aiPostSummary = await generatePostVisitSummary(doctor_notes);

    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: {
        doctor_notes,
        prescription: prescription || undefined,
        ai_post_summary: aiPostSummary,
        status: 'COMPLETED',
      },
    });

    // Create medication reminders
    if (prescription && prescription.length > 0) {
      const reminders = prescription.map(p => ({
        appointment_id: appt.id,
        medicine_name: p.medicine_name,
        dosage: p.dosage,
        frequency: p.frequency,
        next_send_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        active: true,
      }));
      await prisma.medicationReminder.createMany({ data: reminders });
    }

    res.json({ appointment: updated });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// Get doctor's profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const profile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user!.userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }
    res.json({ profile });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// Get doctor's leaves
router.get('/leaves', async (req: Request, res: Response) => {
  try {
    const leaves = await prisma.doctorLeave.findMany({
      where: { doctor_id: req.user!.userId },
      orderBy: { date: 'desc' },
    });
    res.json({ leaves });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
