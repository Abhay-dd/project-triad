import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getBackendUrl } from "../../config";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const u = await login(email.trim(), password);
      const dest =
        u.role === "developer"
          ? "/admin/developer"
          : u.role === "owner"
            ? "/admin/owner"
            : "/admin/staff";
      navigate(dest, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError(`Cannot reach the admin API at ${getBackendUrl()}. Start the backend server and try again.`);
      } else {
        setError(err.response?.data?.detail || "Invalid email or password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-bg min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="admin-login-decoration" aria-hidden="true" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm border border-[var(--line)] shadow-2xl">
          {/* Top gold accent */}
          <div className="h-1 w-full bg-gradient-to-r from-[var(--gold-deep)] via-[var(--gold)] to-[var(--gold-deep)]" />

          <div className="px-8 sm:px-10 py-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/triad_logo.jpeg"
                alt="Triad Realty"
                className="h-12 w-auto object-contain flex-shrink-0"
              />
              <div>
                <p className="font-display text-xl tracking-tight text-[var(--ink)]">Triad Realty</p>
                <p className="overline text-[9px] text-[var(--muted)] -mt-0.5">Admin Portal</p>
              </div>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink)] mb-1">
              Welcome back
            </h1>
            <p className="text-[var(--muted)] text-sm mb-8">
              Sign in to access your dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@triadrealty.ae"
                    className="w-full pl-10 pr-4 py-3 bg-[#f8f6f2] border border-[var(--line)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors rounded"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-[#f8f6f2] border border-[var(--line)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors rounded"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[var(--ink)] text-white text-xs uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 sm:px-10 py-4 bg-[var(--bg-alt)] border-t border-[var(--line)]">
            <p className="text-[10px] text-[var(--muted)] text-center uppercase tracking-widest">
              Triad Realty · Luxury Off-Plan UAE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
