# 🏥 CareSync

**CareSync** is a modern, AI-powered healthcare appointment and patient management platform. It bridges the gap between patients and healthcare providers by offering seamless booking, smart AI medical summaries, and a beautifully designed workspace.

## 🌍 Live Deployment

* **Live Website:** [https://care-sync-green.vercel.app](https://care-sync-green.vercel.app)

---

## ✨ Key Features

* **🤖 AI-Powered Medical Assistant (Powered by Groq & Llama 3)**
  * **Pre-Visit:** Automatically summarizes patient symptoms into a professional medical overview for the doctor before the appointment.
  * **Post-Visit:** Translates complex doctor's notes into simple, easy-to-understand language for the patient.
  * **Smart Prescriptions:** Automatically extracts prescribed medications and dosages from doctor notes.
* **👥 Role-Based Portals**
  * **Patient Dashboard:** Search for specialists, book appointments, and view medical history.
  * **Doctor Dashboard:** Manage working hours, view daily schedules, and write visit notes.
  * **Admin Dashboard:** Oversee platform usage and manage hospital staff.
* **🎨 Premium UI/UX**
  * Built with Tailwind CSS featuring a modern glassmorphism design, clean typography, and a calming healthcare color palette.

---

## 🛠️ Tech Stack

### Frontend
* **React 18** (Vite)
* **Tailwind CSS** (Styling & Glassmorphism)
* **React Router** (Navigation)
* **React Query** (Data Fetching & Caching)
* **React Hot Toast** (Notifications)

### Backend
* **Node.js & Express** (REST API)
* **Prisma ORM** (Database Management)
* **PostgreSQL** (Relational Database)
* **Groq Cloud API** (Lightning-fast LLM processing)
* **JWT & bcrypt** (Authentication & Security)

---

## 🚀 Live Demo Credentials

If you are testing the live deployed version of this application, you can log in with any of the following demo accounts:

**Password for ALL accounts:** `Password123!`

| Role | Email |
| :--- | :--- |
| **Patient** | `john@caresync.app` |
| **Doctor** | `sarah@caresync.app` *(Cardiologist)* |
| **Admin** | `admin@caresync.app` |

---

## 💻 Local Setup Instructions

To run this project locally on your machine, follow these steps:

### 1. Database Setup
Ensure you have a PostgreSQL database running locally or on a cloud provider like Render/Supabase.

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/caresync"
JWT_SECRET="your_super_secret_key"
PORT=4000
FRONTEND_URL="http://localhost:5173"
GROQ_API_KEY="your_groq_api_key_here"
GROQ_MODEL="llama3-8b-8192"
```

Push the database schema and start the server:
```bash
npx prisma db push
npm run dev
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL="http://localhost:4000"
```

Start the frontend development server:
```bash
npm run dev
```

---

## ☁️ Cloud Deployment (Vercel)

To deploy the frontend application live to Vercel, follow these steps:

1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import your CareSync GitHub repository.
3. In the project setup screen, change the **Root Directory** to `frontend`.
4. Open the **Environment Variables** section and add:
   * **Name:** `VITE_API_URL`
   * **Value:** *(The URL of your deployed backend, e.g., `https://caresync-backend.onrender.com`)*
5. Click **Deploy**.

*Note: For the application to function, you must also deploy the `backend` folder to a service like Render and provision a PostgreSQL database.*

---
*Built with ❤️ to make healthcare simpler.*
