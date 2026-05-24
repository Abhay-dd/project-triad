import { useState } from "react";
import axios from "axios";
import { COMPANY } from "../data";
import { Phone, Mail, MapPin, Instagram, Youtube, Linkedin, CheckCircle2, ArrowRight } from "lucide-react";

import { API_URL as API } from "../config";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle");

  const submit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      await axios.post(`${API}/contacts`, form);
      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <section className="pt-40 pb-12 section-pad bg-white" data-testid="contact-hero">
        <div className="container-x">
          <div className="overline text-[var(--gold-deep)]">Contact</div>
          <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[0.95]">Begin a <em className="text-[var(--gold-deep)]">conversation.</em></h1>
          <p className="text-lg mt-8 max-w-xl text-[var(--ink-2)]">Whether you're exploring, comparing, or ready to close — a senior consultant will respond within a business day.</p>
        </div>
      </section>

      <section className="section-pad bg-white" data-testid="contact-main">
        <div className="container-x grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="space-y-8">
              <Detail icon={<Phone size={16} />} label="Phone" value={COMPANY.phone} href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} testId="contact-detail-phone" />
              <Detail icon={<Mail size={16} />} label="Email" value={COMPANY.email} href={`mailto:${COMPANY.email}`} testId="contact-detail-email" />
              <Detail icon={<MapPin size={16} />} label="Office" value={COMPANY.address} testId="contact-detail-address" />
              <Detail icon={<Instagram size={16} />} label="Instagram" value="@triadrealty" href={COMPANY.instagram} testId="contact-detail-instagram" />
            </div>

            <div className="mt-10 flex gap-4">
              <a href={COMPANY.instagram} className="w-11 h-11 border border-[var(--line)] flex items-center justify-center hover:bg-[var(--ink)] hover:text-white transition-colors"><Instagram size={16} /></a>
              <a href={COMPANY.youtube} className="w-11 h-11 border border-[var(--line)] flex items-center justify-center hover:bg-[var(--ink)] hover:text-white transition-colors"><Youtube size={16} /></a>
              <a href={COMPANY.linkedin} className="w-11 h-11 border border-[var(--line)] flex items-center justify-center hover:bg-[var(--ink)] hover:text-white transition-colors"><Linkedin size={16} /></a>
            </div>

            <div className="mt-12 aspect-[4/3] border border-[var(--line)] overflow-hidden">
              <iframe
                title="map"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "grayscale(60%) contrast(0.95)" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Dubai%20Marina&output=embed"
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            {status === "success" ? (
              <div className="border border-[var(--gold)]/40 p-10" data-testid="contact-success">
                <CheckCircle2 className="text-[var(--gold-deep)]" />
                <h3 className="font-display text-3xl mt-4">Message received.</h3>
                <p className="text-[var(--muted)] mt-2">A consultant will reach out within one business day.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-7" data-testid="contact-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <input required placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-line" data-testid="contact-name" />
                  <input required type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-line" data-testid="contact-email" />
                  <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-line" data-testid="contact-phone" />
                  <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-line" data-testid="contact-subject" />
                </div>
                <textarea required rows={5} placeholder="Tell us a little about what you're looking for *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-line" data-testid="contact-message" />
                {status === "error" && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
                <button type="submit" className="btn-gold" disabled={status === "submitting"} data-testid="contact-submit">
                  {status === "submitting" ? "Sending…" : "Send Message"} <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Detail({ icon, label, value, href, testId }) {
  const Inner = (
    <div className="flex items-start gap-4 border-b border-[var(--line)] pb-6">
      <div className="text-[var(--gold-deep)] mt-1">{icon}</div>
      <div>
        <div className="overline text-[var(--muted)]">{label}</div>
        <div className="font-display text-xl mt-1">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} className="block link-gold" data-testid={testId}>{Inner}</a> : <div data-testid={testId}>{Inner}</div>;
}
