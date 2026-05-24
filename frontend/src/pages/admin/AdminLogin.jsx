import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const dest =
      user.role === "developer"
        ? "/admin/developer"
        : user.role === "owner"
          ? "/admin/owner"
          : "/admin/staff";
    navigate(dest, { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const u = await login(email, password);
      const dest =
        u.role === "developer"
          ? "/admin/developer"
          : u.role === "owner"
            ? "/admin/owner"
            : "/admin/staff";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-alt)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[var(--line)] p-10 shadow-sm">
        <h1 className="font-display text-3xl mb-2">Admin Sign In</h1>
        <p className="text-[var(--muted)] text-sm mb-8">Triad Realty internal portal</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-line !py-2 w-full"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-line !py-2 w-full"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-gold w-full !py-3">
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
