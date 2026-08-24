import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import patientRouter from './routes/patient';
import doctorRouter from './routes/doctor';
import calendarRouter from './routes/calendar';

import { startSlotExpiryJob } from './jobs/slotExpiry';
import { startNotificationWorker, startReminderJob } from './jobs/notificationWorker';
import { startMedicationReminderJob } from './jobs/medicationReminder';
import { generateSlotsForNextDays } from './jobs/slotGenerator';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/patient', patientRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/calendar', calendarRouter);

// Database Seed Route (For Demo/Submission)
app.get('/api/seed', async (_req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');
    const prisma = new PrismaClient();
    
    const password_hash = await bcrypt.hash('Password123!', 10);

    // 1. Admin
    await prisma.user.upsert({
      where: { email: 'admin@caresync.app' },
      update: {},
      create: { email: 'admin@caresync.app', name: 'System Admin', role: 'ADMIN', password_hash },
    });

    // 2. Doctors
    const doctorsData = [
      { email: 'sarah@caresync.app', name: 'Dr. Sarah Jenkins', specialisation: 'Cardiologist' },
      { email: 'michael@caresync.app', name: 'Dr. Michael Chen', specialisation: 'Dermatologist' }
    ];
    let docIds = [];
    for (const doc of doctorsData) {
      const u = await prisma.user.upsert({
        where: { email: doc.email },
        update: {},
        create: { email: doc.email, name: doc.name, role: 'DOCTOR', password_hash },
      });
      await prisma.doctorProfile.upsert({
        where: { user_id: u.id },
        update: {},
        create: {
          user_id: u.id, specialisation: doc.specialisation, slot_duration_min: 30,
          working_hours: { Monday: { start: '09:00', end: '17:00' }, Tuesday: { start: '09:00', end: '17:00' }, Wednesday: { start: '09:00', end: '17:00' }, Thursday: { start: '09:00', end: '17:00' }, Friday: { start: '09:00', end: '17:00' } }
        },
      });
      docIds.push(u.id);
    }

    // 3. Patients
    const patientEmail = 'john@caresync.app';
    const patient = await prisma.user.upsert({
      where: { email: patientEmail },
      update: {},
      create: { email: patientEmail, name: 'Jordan Davis', role: 'PATIENT', password_hash },
    });
    
    await prisma.user.upsert({
      where: { email: 'alice@caresync.app' },
      update: {},
      create: { email: 'alice@caresync.app', name: 'Alice Smith', role: 'PATIENT', password_hash },
    });

    // 4. Heavy Mock Data for Jordan Davis
    const now = new Date();
    const existingAppts = await prisma.appointment.count({ where: { patient_id: patient.id } });
    
    if (existingAppts === 0) {
      // Past Completed Appointment (for prescriptions & history)
      const pastTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const pastSlot = await prisma.slot.create({
        data: { doctor_id: docIds[0], start_time: pastTime, end_time: new Date(pastTime.getTime() + 30*60000), status: 'BOOKED' }
      });
      await prisma.appointment.create({
        data: {
          slot_id: pastSlot.id,
          patient_id: patient.id,
          doctor_id: docIds[0],
          status: 'COMPLETED',
          symptoms_text: 'Mild chest pain and shortness of breath during exercise.',
          ai_pre_summary: { urgency_level: 'High', chief_complaint: 'Chest pain during exertion', questions: ['Is it related to heart?', 'Should I stop exercising?'] },
          doctor_notes: 'Patient exhibits exercise-induced angina. Recommended lifestyle changes and prescribed beta-blockers.',
          prescription: [{ medicine_name: 'Metoprolol', dosage: '50mg', frequency: 'Once daily' }, { medicine_name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' }],
          ai_post_summary: { summary: 'Your heart is generally healthy, but we are starting you on a light medication to help with the chest pain during workouts.', follow_up: 'Return in 4 weeks for a stress test.', medications: ['Metoprolol 50mg daily', 'Aspirin 81mg daily'] }
        }
      });

      // Future Upcoming Appointment
      const futureTime = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const futureSlot = await prisma.slot.create({
        data: { doctor_id: docIds[1], start_time: futureTime, end_time: new Date(futureTime.getTime() + 30*60000), status: 'BOOKED' }
      });
      await prisma.appointment.create({
        data: {
          slot_id: futureSlot.id,
          patient_id: patient.id,
          doctor_id: docIds[1],
          status: 'CONFIRMED',
          symptoms_text: 'Dry skin and mild rash on arms.',
          ai_pre_summary: { urgency_level: 'Low', chief_complaint: 'Skin rash', questions: ['Could this be eczema?', 'Are there specific lotions I should use?'] }
        }
      });
      
      // Far Future Pending Appointment
      const farTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const farSlot = await prisma.slot.create({
        data: { doctor_id: docIds[0], start_time: farTime, end_time: new Date(farTime.getTime() + 30*60000), status: 'BOOKED' }
      });
      await prisma.appointment.create({
        data: {
          slot_id: farSlot.id,
          patient_id: patient.id,
          doctor_id: docIds[0],
          status: 'PENDING',
          symptoms_text: 'Follow up for chest pain medication efficacy.',
        }
      });
    }

    res.json({ success: true, message: "🚀 Database massively populated with rich, realistic Medical history data!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Start background jobs
startSlotExpiryJob();
startNotificationWorker();
startReminderJob();
startMedicationReminderJob();

// Generate slots for next 7 days on startup (in background)
setImmediate(async () => {
  try {
    await generateSlotsForNextDays(7);
  } catch (err) {
    console.error('[Startup] Slot generation failed:', err);
  }
});

// Daily slot generation at midnight
import cron from 'node-cron';
cron.schedule('0 0 * * *', async () => {
  await generateSlotsForNextDays(1);
  console.log('[Daily] Generated slots for tomorrow');
});

app.listen(PORT, () => {
  console.log(`🚀 CareSync API running on port ${PORT}`);
});

export default app;

