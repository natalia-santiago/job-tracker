Job Tracker

A full-stack job application tracker that lets users securely manage job applications, track statuses, and stay organized throughout the job search.

Live demo: (add after deploy)
Tech stack: React, Vite, Express, MongoDB, JWT, Axios

✨ Features

🔐 Authentication

Register & login with JWT

Protected routes

Persistent sessions across refresh

📋 Job Management

Add, view, and delete job applications

Track application status (applied, interview, offer, rejected)

Notes per job entry

👤 Account Header

Displays logged-in user name & email

Secure logout

🎨 Modern UI

Clean, responsive layout

Centered dashboard

Custom styling (no UI libraries)

🧠 Architecture

Frontend

React + Vite

React Router

Axios with auth interceptor

LocalStorage session persistence

Backend

Express API

MongoDB with Mongoose

JWT authentication middleware

CORS configured for local + production

📁 Project Structure
client/
 ├─ src/
 │  ├─ api/
 │  │  └─ api.js
 │  ├─ components/
 │  │  └─ RequireAuth.jsx
 │  ├─ pages/
 │  │  ├─ Dashboard.jsx
 │  │  ├─ Login.jsx
 │  │  └─ Register.jsx
 │  ├─ App.jsx
 │  ├─ index.css
 │  └─ App.css

server/
 ├─ src/
 │  ├─ middleware/
 │  │  └─ auth.js
 │  ├─ models/
 │  │  ├─ User.js
 │  │  └─ Job.js
 │  ├─ routes/
 │  │  ├─ auth.js
 │  │  └─ jobs.js
 │  └─ index.js

⚙️ Environment Variables
Frontend (client/.env)
VITE_API_URL=http://localhost:5000/api

Backend (server/.env)
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

▶️ Run Locally
Backend
cd server
npm install
npm run dev

Frontend
cd client
npm install
npm run dev


Open:
👉 http://localhost:5173

🚀 Deployment

Backend: Render

Frontend: Netlify / Vercel

Uses environment-based API URLs

CORS configured for production

(Deployment checklist available on request)

📌 Future Improvements

Edit job entries

Account settings page

Job status analytics

Pagination & search

Dark mode toggle

👩‍💻 Author

Natalia Santiago
Computer Science Graduate — Software Engineering
GitHub: add link
LinkedIn: add link