import { useState } from "react";
import axios from "axios";
import { X, Download } from "lucide-react";

import { API_URL as API } from "../config";

export default function BrochureModal({ open, onClose, projectId, asset = "brochure" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      await axios.post(`${API}/leads`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        project_id: projectId || null,
        asset,
        source_page: typeof window !== "undefined" ? window.location.pathname : null,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div
      data-testid="brochure-modal"
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-xl w-full p-8 md:p-12 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1"
          aria-label="close"
          data-testid="brochure-close"
        >
          <X size={20} />
        </button>

        {status === "success" ? (
          <div className="text-center py-6" data-testid="brochure-success">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--gold)]/15 flex items-center justify-center">
              <Download className="text-[var(--gold-deep)]" />
            </div>
            <h3 className="font-display text-3xl mt-6">You're in.</h3>
            <p className="text-sm text-[var(--muted)] mt-3 max-w-sm mx-auto">
              A consultant will reach out shortly. Your {asset} is on its way to {form.email}.
            </p>
            <button onClick={onClose} className="btn-ghost mt-8">Close</button>
          </div>
        ) : (
          <>
            <div className="overline text-[var(--gold-deep)]">Exclusive Access</div>
            <h3 className="font-display text-3xl md:text-4xl mt-3 leading-none">
              Download the {asset}
            </h3>
            <p className="text-sm text-[var(--muted)] mt-3">
              Floor plans, payment plans, and unit pricing — sent to your inbox in minutes.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-6">
              <input
                required
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-line"
                data-testid="brochure-name"
              />
              <input
                required
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-line"
                data-testid="brochure-email"
              />
              <input
                required
                placeholder="Phone (with country code)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-line"
                data-testid="brochure-phone"
              />
              {status === "error" && (
                <div className="text-sm text-red-600">Something went wrong. Please try again.</div>
              )}
              <button
                type="submit"
                className="btn-gold w-full justify-center"
                disabled={status === "submitting"}
                data-testid="brochure-submit"
              >
                {status === "submitting" ? "Sending…" : "Get the Brochure"}
              </button>
              <p className="text-[11px] text-[var(--muted)] text-center">
                By submitting, you agree to be contacted by a Triad consultant.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
