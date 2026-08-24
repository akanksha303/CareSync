import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  const password_hash = await bcrypt.hash('Password123!', 10);

  // 1. Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@caresync.app' },
    update: {},
    create: {
      email: 'admin@caresync.app',
      name: 'System Admin',
      role: 'ADMIN',
      password_hash,
    },
  });

  // 2. Create Doctors
  const doctorsData = [
    { email: 'sarah@caresync.app', name: 'Dr. Sarah Jenkins', specialisation: 'Cardiologist' },
    { email: 'michael@caresync.app', name: 'Dr. Michael Chen', specialisation: 'Dermatologist' },
    { email: 'emily@caresync.app', name: 'Dr. Emily Stone', specialisation: 'General Practice' },
  ];

  const doctors = [];
  for (const doc of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        name: doc.name,
        role: 'DOCTOR',
        password_hash,
      },
    });

    const profile = await prisma.doctorProfile.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        specialisation: doc.specialisation,
        working_hours: {
          Monday: { start: '09:00', end: '17:00' },
          Tuesday: { start: '09:00', end: '17:00' },
          Wednesday: { start: '09:00', end: '17:00' },
          Thursday: { start: '09:00', end: '17:00' },
          Friday: { start: '09:00', end: '13:00' },
        },
        slot_duration_min: 30,
      },
    });
    doctors.push({ user, profile });
  }

  // 3. Create Patients
  const patientsData = [
    { email: 'john@caresync.app', name: 'John Doe' },
    { email: 'alice@caresync.app', name: 'Alice Smith' },
    { email: 'bob@caresync.app', name: 'Bob Wilson' },
  ];

  const patients = [];
  for (const p of patientsData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        name: p.name,
        role: 'PATIENT',
        password_hash,
      },
    });
    patients.push(user);
  }

  // 4. Create Some Completed Appointments (History)
  console.log('📅 Generating realistic appointment history...');
  
  // Doctor Sarah -> John Doe (Completed yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(10, 0, 0, 0);
  
  const slot1 = await prisma.slot.create({
    data: {
      doctor_id: doctors[0].profile.id,
      start_time: yesterday,
      end_time: new Date(yesterday.getTime() + 30 * 60000),
      status: 'BOOKED',
    }
  });

  await prisma.appointment.create({
    data: {
      slot_id: slot1.id,
      patient_id: patients[0].id,
      doctor_id: doctors[0].user.id,
      status: 'COMPLETED',
      symptoms_text: 'Mild chest pain and shortness of breath when running.',
      doctor_notes: 'Patient exhibits signs of mild angina. Recommended resting and prescribed beta blockers. Scheduled a follow-up EKG.',
      prescription: [
        { medicine: 'Metoprolol', dosage: '25mg', frequency: 'Once daily' }
      ]
    }
  });

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
