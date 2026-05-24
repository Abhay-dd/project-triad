import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api/client";
import {
  LogOut, User, Edit3, Save, Camera, Phone, Mail,
  Instagram, Linkedin, X, CheckCircle, AlertCircle
} from "lucide-react";

export default function StaffAdmin() {
  const { logout, user } = useAuth();
  const [myProfile, setMyProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // {type, msg}
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "", role: "", expertise: "", focus: "",
    photo: "", phone: "", email: "", instagram: "",
    linkedin: "", bio: "", videoUrl: "", videoUrl2: "",
  });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get("/team");
      const members = r.data.results || [];
      // Match by email (staff email should match team member email)
      const mine = members.find(
        (m) => m.email?.toLowerCase() === user?.email?.toLowerCase()
      );
      setMyProfile(mine || null);
      if (mine) {
        setForm({
          name: mine.name || "",
          role: mine.role || "",
          expertise: mine.expertise || "",
          focus: mine.focus || "",
          photo: mine.photo || "",
          phone: mine.phone || "",
          email: mine.email || "",
          instagram: mine.instagram || "",
          linkedin: mine.linkedin || "",
          bio: mine.bio || "",
          videoUrl: mine.videoUrl || "",
          videoUrl2: mine.videoUrl2 || "",
        });
      } else {
        setForm((f) => ({ ...f, email: user?.email || "", name: user?.name || "" }));
      }
    } catch {
      showToast("error", "Could not load profile data.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, photo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (myProfile) {
        await apiClient.put(`/team/${myProfile.id}`, form);
        showToast("success", "Profile updated successfully!");
      } else {
        await apiClient.post("/team", form);
        showToast("success", "Profile created successfully!");
      }
      setEditing(false);
      load();
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Save failed.");
    }
    setSaving(false);
  };

  const inp = (field, placeholder, type = "text", extra = "") => (
    <div>
      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-1.5">
        {placeholder}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full bg-[#f8f6f2] border border-[var(--line)] px-4 py-2.5 text-sm rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      {/* Top Bar */}
      <div className="bg-[var(--ink)] text-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/triad_logo.jpeg"
            alt="Triad Realty"
            className="h-9 w-auto object-contain flex-shrink-0"
          />
          <div className="flex items-center gap-3">
            <div className="w-px h-7 bg-white/20" />
            <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center">
              <User size={16} className="text-[var(--ink)]" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name || user?.email}</p>
              <p className="text-xs opacity-50 uppercase tracking-widest">Staff Portal</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 shadow-xl text-sm font-medium rounded transition-all
          ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-[var(--ink)]">My Profile</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            This is how you appear on the Triad Realty website.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !editing ? (
          /* ──── VIEW MODE ──── */
          <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden shadow-sm">
            {/* Hero Banner */}
            <div className="h-28 bg-gradient-to-r from-[var(--ink)] to-[#2a2a2a]" />

            <div className="px-8 pb-8 -mt-14">
              {/* Avatar */}
              <div className="mb-5 flex items-end justify-between">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-[var(--bg-alt)] shadow-md flex-shrink-0">
                  {form.photo ? (
                    <img src={form.photo} alt={form.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[var(--ink)] text-white text-xs uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors rounded"
                >
                  <Edit3 size={13} /> Edit Profile
                </button>
              </div>

              <h2 className="font-display text-2xl text-[var(--ink)]">{form.name || "—"}</h2>
              <p className="text-[var(--gold)] text-sm uppercase tracking-widest mt-0.5">{form.role || "—"}</p>

              {form.expertise && (
                <p className="text-[var(--muted)] text-sm mt-1">
                  <span className="font-medium text-[var(--ink)]">Expertise:</span> {form.expertise}
                </p>
              )}
              {form.focus && (
                <p className="text-[var(--muted)] text-sm mt-0.5">
                  <span className="font-medium text-[var(--ink)]">Focus:</span> {form.focus}
                </p>
              )}

              {form.bio && (
                <p className="text-sm text-[var(--muted)] mt-4 leading-relaxed border-t border-[var(--line)] pt-4">{form.bio}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {form.phone && (
                  <a href={`tel:${form.phone}`} className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
                    <Phone size={14} /> {form.phone}
                  </a>
                )}
                {form.email && (
                  <a href={`mailto:${form.email}`} className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
                    <Mail size={14} /> {form.email}
                  </a>
                )}
                {form.instagram && (
                  <a href={form.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
                    <Instagram size={14} /> Instagram
                  </a>
                )}
                {form.linkedin && (
                  <a href={form.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
                    <Linkedin size={14} /> LinkedIn
                  </a>
                )}
              </div>

              {!myProfile && (
                <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  ⚠️ Your profile hasn't been created yet. Click <strong>Edit Profile</strong> to set up your public listing.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ──── EDIT MODE ──── */
          <form onSubmit={save} className="bg-white border border-[var(--line)] rounded-lg shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--line)]">
              <h2 className="font-display text-xl">Edit Profile</h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="p-2 hover:bg-[var(--bg-alt)] rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Photo section */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-3">
                  Profile Photo
                </label>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full border-2 border-[var(--line)] overflow-hidden bg-[var(--bg-alt)] flex-shrink-0">
                    {form.photo ? (
                      <img src={form.photo} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                        <User size={28} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-[var(--line)] text-xs uppercase tracking-widest hover:border-[var(--gold)] transition-colors rounded"
                    >
                      <Camera size={13} /> Upload Photo
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoFile}
                    />
                    <input
                      type="url"
                      placeholder="Or paste image URL"
                      className="w-full bg-[#f8f6f2] border border-[var(--line)] px-4 py-2 text-xs rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                      value={form.photo}
                      onChange={(e) => setForm({ ...form, photo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {inp("name", "Full Name")}
                {inp("role", "Job Title / Role")}
                {inp("expertise", "Area of Expertise")}
                {inp("focus", "Focus Area")}
                {inp("phone", "Phone Number", "tel")}
                {inp("email", "Email Address", "email")}
                {inp("instagram", "Instagram Profile URL", "url")}
                {inp("linkedin", "LinkedIn Profile URL", "url")}
                {inp("videoUrl", "Video URL (primary)")}
                {inp("videoUrl2", "Video URL (secondary)")}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-1.5">
                  Bio / About
                </label>
                <textarea
                  rows={4}
                  placeholder="Write a short bio about yourself..."
                  className="w-full bg-[#f8f6f2] border border-[var(--line)] px-4 py-3 text-sm rounded focus:outline-none focus:border-[var(--gold)] transition-colors resize-none"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-[var(--line)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 border border-[var(--line)] text-sm hover:border-[var(--ink)] transition-colors rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--ink)] text-white text-sm hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors rounded disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
