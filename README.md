# CareSync — Healthcare Appointment & Follow-up Manager

A full-stack healthcare platform with **Patient**, **Doctor**, and **Admin** portals.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Frontend | React + TypeScript + Tailwind CSS |
| Auth | JWT + bcrypt + Role-based access |
| Background Jobs | node-cron (slot expiry, reminders, notifications) |
| Email | Nodemailer (SMTP) |
| Calendar | Google Calendar API v3 + OAuth 2.0 |
| LLM | OpenAI API (gpt-4o) |

---

## Setup Guide

### Prerequisites
- Node.js 18+
- PostgreSQL database (Render free tier recommended)
- SMTP credentials (Gmail App Password recommended)
- OpenAI API key
- Google Cloud Console project with Calendar API enabled

### 1. Clone & Install

```bash
git clone https://github.com/<your-org>/caresync.git

# Backend
cd caresync/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

**Backend** — copy `backend/.env.example` to `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/caresync
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=4000
FRONTEND_URL=https://your-vercel-app.vercel.app

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=CareSync <no-reply@caresync.app>

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-render-backend.onrender.com/api/calendar/callback
```

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=https://your-render-backend.onrender.com
```

### 3. Database Setup

```bash
cd backend
npx prisma migrate deploy   # production
# OR for development:
npx prisma db push
npx prisma generate
```

### 4. Run Locally

```bash
# Backend (port 4000)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

---

## Deployment

### Backend → Render

1. Connect your GitHub repo on [render.com](https://render.com)
2. Create a **Web Service**:
   - **Root directory**: `backend`
   - **Build command**: `npm install && npx prisma generate && npm run build`
   - **Start command**: `npm start`
3. Add all env vars from `backend/.env.example`
4. Create a **PostgreSQL** database on Render, copy the `DATABASE_URL`

### Frontend → Vercel

1. Import your GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root directory** to `frontend`
3. Add env var: `VITE_API_URL=https://your-render-backend.onrender.com`
4. Deploy

---

## API Documentation

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, get JWT |
| GET | `/api/auth/me` | JWT | Get current user |

### Patient Portal

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/patient/doctors` | Search doctors (`?specialisation=`, `?name=`) |
| GET | `/api/patient/doctors/:id/slots` | Get available slots (`?date=YYYY-MM-DD`) |
| POST | `/api/patient/slots/:slotId/hold` | Hold slot for 5 minutes (atomic) |
| POST | `/api/patient/appointments` | Book held slot |
| GET | `/api/patient/appointments` | List my appointments |
| POST | `/api/patient/appointments/:id/cancel` | Cancel appointment |

### Doctor Portal

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/doctor/appointments` | List appointments (`?status=CONFIRMED`) |
| GET | `/api/doctor/appointments/:id` | Get appointment detail |
| POST | `/api/doctor/appointments/:id/complete` | Submit notes + prescription |
| GET | `/api/doctor/profile` | Get doctor profile |

### Admin Portal

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/doctors` | List all doctors |
| POST | `/api/admin/doctors` | Create doctor + profile |
| PUT | `/api/admin/doctors/:id/profile` | Update working hours/specialisation |
| DELETE | `/api/admin/doctors/:id` | Delete doctor |
| POST | `/api/admin/leave` | Mark leave (auto-cancels conflicts) |
| GET | `/api/admin/leaves` | List all leave records |
| POST | `/api/admin/slots/generate` | Generate slots for a date |
| GET | `/api/admin/notifications/failed` | List failed/retrying notifications |
| POST | `/api/admin/notifications/:id/retry` | Reset notification for retry |

### Google Calendar

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/calendar/auth` | Get Google OAuth URL |
| GET | `/api/calendar/callback` | OAuth 2.0 callback |

---

## Database Schema Diagram

```
User
├── id (PK)
├── email (unique)
├── password_hash
├── role: PATIENT | DOCTOR | ADMIN
├── name
├── google_access_token (nullable)
└── google_refresh_token (nullable)
    │
    ├─[1:1]→ DoctorProfile
    │         ├── specialisation
    │         ├── working_hours (JSON: { monday: { start, end } | null, ... })
    │         ├── slot_duration_min
    │         └─[1:N]→ Slot
    │                   ├── start_time / end_time
    │                   ├── status: AVAILABLE | HELD | BOOKED | CANCELLED
    │                   ├── held_until (nullable, used for 5-min hold)
    │                   └─[1:1]→ Appointment (unique constraint on slot_id)
    │                             ├── patient_id → User
    │                             ├── doctor_id → User
    │                             ├── status: PENDING | CONFIRMED | COMPLETED | CANCELLED
    │                             ├── symptoms_text
    │                             ├── ai_pre_summary (JSON)
    │                             ├── ai_post_summary (JSON)
    │                             ├── doctor_notes
    │                             ├── prescription (JSON array)
    │                             ├── google_event_id_patient
    │                             ├── google_event_id_doctor
    │                             ├─[1:N]→ NotificationLog
    │                             │         ├── type: EMAIL | CALENDAR
    │                             │         ├── status: PENDING | SENT | RETRYING | FAILED
    │                             │         ├── attempts
    │                             │         └── last_error
    │                             └─[1:N]→ MedicationReminder
    │                                       ├── medicine_name / dosage / frequency
    │                                       ├── next_send_at
    │                                       └── active
    └─[1:N]→ DoctorLeave
              ├── date
              └── reason
```

---

## LLM Prompts

### Pre-Visit Summary (Phase 4)

```
Analyse these symptoms and return a JSON object with exactly these fields:
urgency_level (must be exactly "Low", "Medium", or "High"),
chief_complaint (string),
and suggested_questions (array of exactly 3 strings for the doctor to ask).
Return ONLY valid JSON, no markdown.

Symptoms: <symptoms_text>
```

**Response schema:**
```json
{
  "urgency_level": "Low | Medium | High",
  "chief_complaint": "string",
  "suggested_questions": ["string", "string", "string"]
}
```

### Post-Visit Summary (Phase 5)

```
Convert these clinical notes into a JSON object with exactly these fields:
patient_summary (a patient-friendly paragraph),
medication_schedule (a clear readable string),
follow_up_steps (array of strings).
Return ONLY valid JSON, no markdown.

Clinical notes: <doctor_notes>
```

**Response schema:**
```json
{
  "patient_summary": "string",
  "medication_schedule": "string",
  "follow_up_steps": ["string", "..."]
}
```

**Failure handling:** Both calls have a 10-second timeout and are wrapped in try/catch. On any failure (timeout, invalid JSON, API error), the system stores `{ error: true, raw_symptoms: "..." }` and **never blocks the booking or completion flow**.

---

## Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → Enable **Google Calendar API**
3. Go to **Credentials** → Create **OAuth 2.0 Client ID** (Web application)
4. Add authorized redirect URI: `https://your-render-backend.onrender.com/api/calendar/callback`
5. Copy **Client ID** and **Client Secret** to your backend `.env`
6. Go to **OAuth Consent Screen** → Add test users (or publish for production)

Users connect their Google Calendar from the frontend via the `/api/calendar/auth` endpoint, which generates the OAuth URL. After OAuth, tokens are stored encrypted in the `User` table.

---

## Working Hours JSON Format

```json
{
  "monday": { "start": "09:00", "end": "17:00" },
  "tuesday": { "start": "09:00", "end": "17:00" },
  "wednesday": { "start": "09:00", "end": "13:00" },
  "thursday": { "start": "09:00", "end": "17:00" },
  "friday": { "start": "09:00", "end": "17:00" },
  "saturday": null,
  "sunday": null
}
```

`null` means the doctor doesn't work that day — no slots generated.
