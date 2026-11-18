
import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const auth = useContext(AuthContext);
  const location = useLocation();

  // Wait until Supabase restores the existing session.
  if (!auth || auth.loading) {
    return (
      <main className="route-loading" role="status">
        <p>Verifying your session...</p>
      </main>
    );
  }

  // Guests must sign in before entering protected pages.
  if (!auth.user || !auth.isAuthenticated) {
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
