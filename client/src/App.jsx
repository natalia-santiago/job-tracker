import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddJob from "./pages/AddJob";
import Account from "./pages/Account";
import ProtectedRoute from "./components/ProtectedRoute";

/*
  App Routing
  - Handles public vs protected routes
  - Redirects based on authentication state
*/

function RedirectIfAuthenticated({ children }) {
  const token = localStorage.getItem("token");

  if (token && token.trim() !== "") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function DefaultRoute() {
  const token = localStorage.getItem("token");

  // If logged in → go to dashboard
  // If not → go to register
  return (
    <Navigate
      to={token && token.trim() !== "" ? "/dashboard" : "/register"}
      replace
    />
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Routes>
      {/* Smart default route */}
      <Route path="/" element={<DefaultRoute />} />

      {/* Public routes (blocked if logged in) */}
      <Route
        path="/register"
        element={
          <RedirectIfAuthenticated>
            <Register />
          </RedirectIfAuthenticated>
        }
      />

      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-job" element={<AddJob />} />
        <Route path="/account" element={<Account />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}