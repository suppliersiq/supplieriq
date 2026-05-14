import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// usage:
//   <ProtectedRoute>              → any logged-in user
//   <ProtectedRoute role="admin"> → admins only
//   <ProtectedRoute role="supplier"> → suppliers only
export default function ProtectedRoute({ children, role }) {
  const { session, loading, role: userRole } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui", color: "#AAA", fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (role && userRole !== role) {
    // Wrong role — redirect to their own home
    return <Navigate to={userRole === "admin" ? "/dashboard" : "/portal"} replace />;
  }

  return children;
}
