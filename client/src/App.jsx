import { Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddJob from "./pages/AddJob";
import Account from "./pages/Account";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <Routes>
      {/* default route */}
      <Route path="/" element={<Navigate to="/register" replace />} />

      {/* public routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* protected routes */}
      <Route
        path="/dashboard"
        element={token ? <Dashboard /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/add-job"
        element={token ? <AddJob /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/account"
        element={token ? <Account /> : <Navigate to="/login" replace />}
      />

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
