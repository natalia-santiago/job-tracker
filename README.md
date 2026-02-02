# Job Tracker

A full-stack job application tracker that lets users securely manage job applications, track statuses, and stay organized throughout the job search.

**Live demo:** https://job-tracker-frontend.netlify.app/  
**API (Render):** https://job-tracker-api-zbeq.onrender.com/  
**Tech stack:** React, Vite, Express, MongoDB, JWT, Axios

---

## ✨ Features

### 🔐 Authentication
- Register & login with JWT
- Protected routes
- Persistent sessions across refresh

### 📋 Job Management
- Add, view, edit, and delete job applications
- Track application status: **applied, interview, offer, rejected**
- Notes per job entry
- Inline status updates
- Export jobs to CSV

### 📊 Dashboard Enhancements
- 3-card layout: **Overview + Stats + Recent Activity**
- Search, filter, and sort jobs
- Loading skeletons
- Toast notifications for success/error actions

### 👤 Account
- Account header shows logged-in user name & email
- Account page (profile details)
- Secure logout

### 🎨 Modern UI
- Clean, responsive layout
- Custom styling (no UI libraries)

---

## 🧠 Architecture

### Frontend
- React + Vite
- React Router
- Axios with auth interceptor
- LocalStorage session persistence

### Backend
- Express API
- MongoDB with Mongoose
- JWT authentication middleware
- CORS configured for local + production

---

## 📁 Project Structure

```text
client/
├─ src/
│ ├─ api/
│ │ └─ api.js
│ ├─ components/
│ │ └─ ProtectedRoute.jsx
│ ├─ pages/
│ │ ├─ Dashboard.jsx
│ │ ├─ AddJob.jsx
│ │ ├─ Account.jsx
│ │ ├─ Login.jsx
│ │ └─ Register.jsx
│ ├─ App.jsx
│ └─ index.css

server/
├─ src/
│ ├─ middleware/
│ │ └─ auth.js
│ ├─ models/
│ │ ├─ User.js
│ │ └─ Job.js
│ ├─ routes/
│ │ ├─ auth.js
│ │ └─ jobs.js
│ └─ index.js
```

---

## ⚙️ Environment Variables

### Frontend (`client/.env`)
```bash
VITE_API_URL=http://localhost:5000/api
```

### Backend (`server/.env`)
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## ▶️ Run Locally

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Open:  
👉 http://localhost:5173

---

## 🚀 Deployment

### Frontend
Netlify  
https://job-tracker-frontend.netlify.app/

### Backend
Render  
https://job-tracker-api-zbeq.onrender.com/

**Notes:**
- Uses environment-based API URLs
- CORS must allow your deployed frontend domain
- Set `VITE_API_URL` in Netlify to point to your Render API (with `/api`)

Example:
```bash
VITE_API_URL=https://job-tracker-api-zbeq.onrender.com/api
```

---

## 📌 Future Improvements
- Password reset flow (forgot password)
- Pagination for large job lists
- Tagging (e.g., “remote”, “hybrid”, “referral”)
- File uploads (resume versions, offer letters)
- Dark mode toggle

---

## 👩‍💻 Author

**Natalia Santiago**  
Computer Science Graduate — Software Engineering  
GitHub: https://github.com/natalia-santiago  
LinkedIn: https://www.linkedin.com/in/natalia-santiago-086570362
