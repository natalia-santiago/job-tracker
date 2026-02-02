import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Not logged in -> send to login and remember where user tried to go
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Logged in -> render the nested route (dashboard, add-job, account, etc.)
  return <Outlet />;
}
