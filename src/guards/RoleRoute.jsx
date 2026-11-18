
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function RoleRoute({
  children,
  allowedRoles = [],
}) {
  const auth = useContext(AuthContext);

  if (!auth || auth.loading) {
    return (
      <main className="route-loading" role="status">
        <p>Checking your access permissions...</p>
      </main>
    );
  }

  if (!auth.user || !auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = String(auth.profile?.role || "")
    .trim()
    .toLowerCase();

  const permittedRoles = allowedRoles.map((role) =>
    String(role).trim().toLowerCase()
  );

  if (!userRole || !permittedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
