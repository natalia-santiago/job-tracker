import { Navigate, Outlet, useLocation } from "react-router-dom";

/*
  ProtectedRoute
  - Prevents access to private routes if user is not authenticated
  - Redirects to login and remembers intended destination
*/

export default function ProtectedRoute() {
  const location = useLocation();

  const token = localStorage.getItem("token");

  // Treat missing, null, or empty token as unauthenticated
  const isAuthenticated = Boolean(token && token.trim() !== "");

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}