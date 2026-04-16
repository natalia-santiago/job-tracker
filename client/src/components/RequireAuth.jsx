import { Navigate, useLocation } from "react-router-dom";

/*
  RequireAuth (wrapper version)
  - Protects individual components instead of route groups
  - Use when wrapping specific elements instead of using <Outlet />
*/

export default function RequireAuth({ children }) {
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

  return children;
}