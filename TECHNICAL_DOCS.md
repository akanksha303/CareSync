# ⚙️ CareSync Technical Documentation

This document provides a comprehensive overview of the CareSync PostgreSQL Database Schema and the REST API Endpoints used by the frontend to communicate with the Node.js/Express backend.

---

## 🗄️ Database Schema (Prisma / PostgreSQL)

The database is built using a relational model to ensure data integrity between users, medical staff, availability slots, and appointments.

### 1. Core Models

*   **`User`**: The central authentication model for the platform.
    *   Fields: `id`, `email`, `password_hash`, `name`, `role` (Enum: PATIENT, DOCTOR, ADMIN).
    *   Relations: Has One `DoctorProfile` (if role is DOCTOR), Has Many `Appointments`.
*   **`DoctorProfile`**: Extended information specific to medical staff.
    *   Fields: `id`, `user_id`, `specialisation`, `working_hours` (JSON), `slot_duration_min`.
    *   Relations: Belongs to `User`, Has Many `Slots`.
*   **`Slot`**: Represents a specific time block on a doctor's calendar.
    *   Fields: `id`, `doctor_id`, `start_time`, `end_time`, `status` (Enum: AVAILABLE, HELD, BOOKED).
    *   Relations: Belongs to `DoctorProfile`, Has One `Appointment`.
*   **`Appointment`**: The core transactional record tying a patient and doctor together.
    *   Fields: `id`, `slot_id`, `patient_id`, `doctor_id`, `status` (PENDING, CONFIRMED, COMPLETED, CANCELLED).
    *   AI Fields: `symptoms_text`, `ai_pre_summary` (JSON), `ai_post_summary` (JSON), `doctor_notes`, `prescription` (JSON).

### 2. Entity Relationship Summary
*   **User (Patient)** 1 ---> N **Appointment**
*   **User (Doctor)** 1 ---> 1 **DoctorProfile**
*   **DoctorProfile** 1 ---> N **Slot**
*   **Slot** 1 ---> 1 **Appointment**

---

## 🔌 REST API Documentation

All protected routes require a Bearer token in the Authorization header:
`Authorization: Bearer <JWT_TOKEN>`

### 🔐 Authentication

#### 1. Register User
*   **URL:** `/api/auth/register`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Payload:**
    ```json
    {
      "email": "john@caresync.app",
      "password": "Password123!",
      "name": "John Doe",
      "role": "PATIENT"
    }
    ```
*   **Success Response:** `201 Created` returns `{ "token": "jwt...", "user": {...} }`

#### 2. Login
*   **URL:** `/api/auth/login`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Payload:** `{ "email": "john...", "password": "..." }`
*   **Success Response:** `200 OK` returns `{ "token": "jwt...", "user": {...} }`

---

### 🩺 Patient Endpoints

#### 1. Get All Doctors
*   **URL:** `/api/patient/doctors`
*   **Method:** `GET`
*   **Auth Required:** Yes (Role: PATIENT)
*   **Description:** Returns a list of all active doctors and their specialties for the search page.

#### 2. Get Doctor's Available Slots
*   **URL:** `/api/patient/doctors/:id/slots`
*   **Method:** `GET`
*   **Description:** Returns available 30-minute blocks for a specific doctor.

#### 3. Book an Appointment
*   **URL:** `/api/patient/appointments`
*   **Method:** `POST`
*   **Auth Required:** Yes (Role: PATIENT)
*   **Description:** Books a slot and triggers the **Groq LLM** to generate the Pre-Visit AI summary.
*   **Payload:**
    ```json
    {
      "slot_id": "cuid_string_here",
      "symptoms_text": "I have had a severe headache for 3 days."
    }
    ```
*   **Success Response:** `201 Created` returns the confirmed Appointment object.

#### 4. Get Patient Appointments
*   **URL:** `/api/patient/appointments`
*   **Method:** `GET`
*   **Auth Required:** Yes (Role: PATIENT)
*   **Description:** Retrieves all upcoming and past appointments for the logged-in patient, including AI summaries and prescriptions.

---

### 👨‍⚕️ Doctor Endpoints

#### 1. Get Doctor's Schedule
*   **URL:** `/api/doctor/appointments`
*   **Method:** `GET`
*   **Auth Required:** Yes (Role: DOCTOR)
*   **Description:** Retrieves all booked appointments for the logged-in doctor.

#### 2. Complete an Appointment
*   **URL:** `/api/doctor/appointments/:id/complete`
*   **Method:** `PUT`
*   **Auth Required:** Yes (Role: DOCTOR)
*   **Description:** Submits medical notes and triggers the **Groq LLM** to generate the Post-Visit AI translation and extract medications.
*   **Payload:**
    ```json
    {
      "doctor_notes": "Patient exhibits migraines. Prescribed 400mg Ibuprofen twice daily."
    }
    ```
*   **Success Response:** `200 OK` returns the updated Appointment object with generated `ai_post_summary` and `prescription`.

---

### 🛡️ Admin Endpoints

#### 1. Get Platform Statistics
*   **URL:** `/api/admin/stats`
*   **Method:** `GET`
*   **Auth Required:** Yes (Role: ADMIN)
*   **Description:** Returns global statistics (total patients, doctors, and appointments) for the admin dashboard.
