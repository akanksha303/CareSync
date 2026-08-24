const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password_hash = await bcrypt.hash('Password123!', 10);
  
  // Admin
  await prisma.user.upsert({ where: { email: 'admin@caresync.app' }, update: {}, create: { email: 'admin@caresync.app', name: 'System Admin', role: 'ADMIN', password_hash } });

  // Doctors
  const docs = [
    { email: 'sarah@caresync.app', name: 'Dr. Sarah Jenkins', specialisation: 'Cardiologist' },
    { email: 'michael@caresync.app', name: 'Dr. Michael Chen', specialisation: 'Dermatologist' }
  ];
  let docIds = [];
  for (const doc of docs) {
    const u = await prisma.user.upsert({ where: { email: doc.email }, update: {}, create: { email: doc.email, name: doc.name, role: 'DOCTOR', password_hash } });
    await prisma.doctorProfile.upsert({
      where: { user_id: u.id }, update: {},
      create: { user_id: u.id, specialisation: doc.specialisation, slot_duration_min: 30, working_hours: { Monday: { start: '09:00', end: '17:00' }, Tuesday: { start: '09:00', end: '17:00' } } }
    });
    docIds.push(u.id);
  }

  // Patient
  const p = await prisma.user.upsert({ where: { email: 'john@caresync.app' }, update: {}, create: { email: 'john@caresync.app', name: 'Jordan Davis', role: 'PATIENT', password_hash } });

  const now = new Date();
  const c = await prisma.appointment.count({ where: { patient_id: p.id } });
  if (c === 0) {
    const pastTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const pastSlot = await prisma.slot.create({ data: { doctor_id: docIds[0], start_time: pastTime, end_time: new Date(pastTime.getTime() + 30*60000), status: 'BOOKED' } });
    await prisma.appointment.create({
      data: {
        slot_id: pastSlot.id, patient_id: p.id, doctor_id: docIds[0], status: 'COMPLETED',
        symptoms_text: 'Mild chest pain',
        ai_pre_summary: { urgency_level: 'High', chief_complaint: 'Chest pain', questions: ['Is it related to heart?'] },
        prescription: [{ medicine_name: 'Metoprolol', dosage: '50mg', frequency: 'Once daily' }, { medicine_name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' }],
        ai_post_summary: { summary: 'Your heart is healthy.', medications: ['Metoprolol', 'Aspirin'] }
      }
    });

    const futureTime = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const futureSlot = await prisma.slot.create({ data: { doctor_id: docIds[1], start_time: futureTime, end_time: new Date(futureTime.getTime() + 30*60000), status: 'BOOKED' } });
    await prisma.appointment.create({
      data: { slot_id: futureSlot.id, patient_id: p.id, doctor_id: docIds[1], status: 'CONFIRMED', symptoms_text: 'Skin rash', ai_pre_summary: { urgency_level: 'Low', chief_complaint: 'Skin rash' } }
    });
  }
  console.log('SEEDED LOCAL DB');
}
main().catch(console.error).finally(() => prisma.$disconnect());
