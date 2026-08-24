# CareSync

CareSync is a premium healthcare SaaS platform that seamlessly connects patients, doctors, and administrators. It modernizes the clinical experience with AI-powered medical summaries, atomic anti-double-booking scheduling, and automated Google Calendar integrations.

## 🌟 Key Features

care-sync-sooty-iota.vercel.app

### 1. Smart Scheduling & Anti-Double-Booking
* **Atomic Slot Locking:** Uses PostgreSQL transactions to temporarily hold a slot for 10 minutes when a patient begins checkout, preventing simultaneous bookings.
* **Dynamic Availability:** Doctors configure working hours and slot durations; the system automatically generates available slots via a background cron job.
* **Leave Management:** Admins can approve doctor leaves, which automatically handles conflicts and reschedules affected appointments.

### 2. AI-Powered Healthcare (Groq LLM)
* **Pre-Visit Triage:** When patients book an appointment and enter symptoms, the Groq LLaMA-3 model instantly triages the symptoms, determines an urgency level (High/Medium/Low), and generates suggested clinical questions for the doctor.
* **Post-Visit Translation:** Doctors submit raw clinical notes and prescriptions. CareSync AI translates this jargon into a plain-English recovery plan for the patient, including follow-up steps.

### 3. Automated Background Workers
* **Notification Engine:** Dispatches Email and Google Calendar invites asynchronously. Features a resilient retry mechanism that logs failed notifications for Admin review.
* **Medication Reminders:** Background cron jobs process active prescriptions and send daily pill reminders to patients.

### 4. Role-Based Portals
* **Patient Portal:** Glassmorphism dashboard to book slots, view AI care timelines, and track active medications.
* **Doctor Portal:** Clinical dashboard to manage daily schedules, view AI patient charts, and prescribe medication.
* **Admin Portal:** System control center to monitor failed notifications, manage doctor profiles, and resolve leave conflicts.

---

## 🏗 Architecture & Tech Stack

### Frontend
* **Framework:** React 18 with TypeScript & Vite
* **Routing & State:** React Router DOM, TanStack React Query
* **Styling:** Tailwind CSS (Custom glassmorphism design system)
* **Hosting:** Vercel

### Backend
* **Runtime & Framework:** Node.js, Express.js with TypeScript
* **Database & ORM:** PostgreSQL managed via Prisma ORM
* **Authentication:** JWT (JSON Web Tokens) & bcrypt
* **AI Provider:** Groq API (`llama3-8b-8192`)
* **Integrations:** Google Calendar API (OAuth 2.0), Nodemailer
* **Hosting:** Render

---

## 📂 Folder Structure

### 🖥️ Backend (Node.js & Express)
* **`prisma/`** — PostgreSQL database schema (`schema.prisma`).
* **`src/`**
  * **`config/`** — Prisma client and Nodemailer email configurations.
  * **`jobs/`** — Background workers (cron jobs, email notifications, slot expiry).
  * **`middleware/`** — JWT authentication and role-based access controllers.
  * **`routes/`** — API endpoints logically split by role (`admin.ts`, `doctor.ts`, `patient.ts`, `auth.ts`).
  * **`types/`** — Global TypeScript interfaces.
  * **`index.ts`** — Main server entry point and Database Seeder.

### 🎨 Frontend (React & Vite)
* **`src/`**
  * **`api/`** — Axios client with JWT interceptors for secure backend communication.
  * **`components/`** — Reusable UI components.
  * **`contexts/`** — React Context providers (AuthContext).
  * **`pages/`** — The core application views, separated by user role:
    * **`Admin/`** — Control center, leave management, and system alerts.
    * **`Auth/`** — Login and Registration screens.
    * **`Doctor/`** — Clinical dashboard, patient charts, and AI prescriptions.
    * **`Patient/`** — Booking interface, active medications, and care timelines.
  * **`App.tsx`** — React Router configuration.
  * **`main.tsx`** — React DOM mounting and Query Provider.

---

## 🗄 Database Structure

The PostgreSQL database is heavily normalized to ensure data integrity and fast queries.

### Core Models

* **`User`**: Base authentication table (Fields: `id`, `email`, `password_hash`, `role`).
* **`DoctorProfile`**: Extended data for doctors (Fields: `user_id`, `specialisation`, `working_hours`, `slot_duration_min`).
* **`DoctorLeave`**: Tracks approved days off to prevent slot generation.
* **`Slot`**: Represents a bookable block of time (Fields: `doctor_id`, `start_time`, `end_time`, `status` [AVAILABLE, HELD, BOOKED]).
* **`Appointment`**: The core clinical record. Connects a `Slot`, `Patient`, and `Doctor`. Stores `symptoms_text`, `doctor_notes`, `prescription` (JSON), and the AI outputs (`ai_pre_summary`, `ai_post_summary`).
* **`NotificationLog`**: Queue for background tasks. Tracks `type` (EMAIL/CALENDAR), `status` (PENDING, SENT, FAILED), and `attempts`.

---

## 🔌 Core API Endpoints

### Auth
* `POST /api/auth/register` - Create new user account
* `POST /api/auth/login` - Authenticate and return JWT token

### Patient API
* `GET /api/patient/doctors` - Browse available doctors and specialties
* `GET /api/patient/slots/:doctorId` - Fetch available (non-held) slots
* `POST /api/patient/appointments/hold` - Temporarily lock a slot for booking
* `POST /api/patient/appointments` - Confirm booking and trigger AI Pre-Visit Triage
* `GET /api/patient/appointments` - Fetch patient history and prescriptions

### Doctor API
* `GET /api/doctor/appointments` - View today's schedule and patient charts
* `POST /api/doctor/appointments/:id/complete` - Submit clinical notes/prescriptions and trigger AI Post-Visit summary
* `POST /api/doctor/leaves` - Request time off

### Admin API
* `GET /api/admin/notifications/failed` - Monitor background worker health
* `GET /api/admin/leaves/conflicts` - Review appointments affected by doctor leaves
* `GET /api/seed` - Instantly populate the database with comprehensive mock data

---

## 🚀 Running the Project Locally

### Prerequisites
* Node.js (v18+)
* PostgreSQL running locally or via Docker

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file and configure `DATABASE_URL`, `JWT_SECRET`, and `GROQ_API_KEY`.
4. Run migrations: `npx prisma migrate dev`
5. Start server: `npm run dev` (Runs on `http://localhost:4000`)

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Create a `.env` file: `VITE_API_URL=http://localhost:4000`
4. Start client: `npm run dev` (Runs on `http://localhost:5173`)

---

## 🔑 Quick Demo Access

You can instantly populate the database with rich medical history, AI summaries, and active prescriptions by hitting the `/api/seed` route on the backend. Once seeded, use these credentials on the login page:

* **Admin:** `admin@caresync.app` | `Password123!`
* **Doctor:** `sarah@caresync.app` | `Password123!`
* **Patient:** `john@caresync.app` | `Password123!`
