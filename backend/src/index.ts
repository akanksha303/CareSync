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
          working_hours: { Monday: { start: '09:00', end: '17:00' }, Tuesday: { start: '09:00', end: '17:00' } }
        },
      });
    }

    // 3. Patients
    const patients = ['john@caresync.app', 'alice@caresync.app'];
    for (const p of patients) {
      await prisma.user.upsert({
        where: { email: p },
        update: {},
        create: { email: p, name: p.split('@')[0].toUpperCase(), role: 'PATIENT', password_hash },
      });
    }

    res.json({ success: true, message: "🚀 Database successfully populated with Antigravity Demo Data!" });
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

