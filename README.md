# 🎓 Smart Classroom MVP

A modern, real-time Virtual Classroom application designed to bridge the gap between teachers and students. Built with a robust **Node.js/Express** backend, a dynamic **React/Vite** frontend, real-time **Socket.io** integration, and **MongoDB** for secure data persistence.

---

## ✨ Features

- **🔐 User Authentication**: Safe sign-up and login with encrypted passwords (via `bcryptjs`) and secure session handling (via `jsonwebtoken`).
- **🏫 Classroom Management**:
  - Teachers can create new classrooms and share the auto-generated unique Classroom Codes.
  - Students can quickly join any classroom using these codes.
- **💬 Live stream & Real-Time Sync**: Announce updates, post queries, and coordinate in real-time with peers using `socket.io-client`.
- **📝 Assignments & Grading**:
  - Teachers can create assignments with attachments, track submissions, and view submission analytics.
  - Students can submit their assignments directly, keeping tracking of due dates.
- **📂 Secure File Sharing**: Upload, download, and store files safely (handled with `multer` and saved in structured upload paths).
- **📊 Reports & Exports**: Generate and download classroom reports, attendance sheets, and assignment lists using `jspdf` and `jspdf-autotable` integrations.
- **🎨 Premium Visual Interface**: Sleek UI designed with modern glassmorphism components, custom CSS theme variables, responsive design configurations, and rich animations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Routing**: React Router DOM (v6)
- **Real-Time Client**: Socket.io Client
- **Document Export**: jsPDF & jsPDF-AutoTable
- **Styling**: Vanilla CSS with custom tokens and variables for responsive layout structure.

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Sockets**: Socket.io
- **File Handling**: Multer
- **Authentication**: JWT & Bcryptjs
- **Logger**: Morgan (Development logs)

---

## 🚀 Getting Started

Follow these steps to run the application locally in your development environment.

### Prerequisites
- [Node.js](https://nodejs.org/en) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a remote MongoDB Atlas cluster)

---

### 1. Setup the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` root directory (refer to `backend/.env.example`):
   ```env
   PORT=4000
   MONGO_URI=mongodb://127.0.0.1:27017/classroom_mvp
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   UPLOAD_DIR=uploads
   CLIENT_ORIGIN=http://localhost:5173
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```

---

### 2. Setup the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `frontend/` root directory (refer to `frontend/.env.example`):
   ```env
   VITE_API_URL=http://localhost:4000
   VITE_SOCKET_URL=http://localhost:4000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

5. Open your browser and go to: `http://localhost:5173`

---

## 🔒 Confidential Data & Security

This repository is configured to prioritize credentials security:
- **Environment variables** (`.env`, `.env.local`, etc.) are hidden from Git tracking.
- **User-submitted uploads** in `backend/uploads/` are ignored so personal student data remains private.
- **Node Modules** are properly ignored.

Do **NOT** commit any `.env` file with hardcoded passwords or keys to GitHub.

---

## 📄 License

This project is licensed under the MIT License.
