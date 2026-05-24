import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const dest =
      user.role === "developer"
        ? "/admin/developer"
        : user.role === "owner"
          ? "/admin/owner"
          : "/admin/staff";
    return <Navigate to={dest} replace />;
  }

  return children;
}
