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
