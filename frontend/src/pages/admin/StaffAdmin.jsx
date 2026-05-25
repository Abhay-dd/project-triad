import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api/client";
import {
  LogOut, User, Edit3, Save, Camera, Phone, Mail,
  Instagram, Linkedin, X, CheckCircle, AlertCircle,
  Menu, ChevronRight, UserCircle, PhoneCall, Target
} from "lucide-react";

function StatusBadge({ status }) {
  const map = {
    new: "bg-blue-50 text-blue-700",
    assigned: "bg-amber-50 text-amber-700",
    contacted: "bg-purple-50 text-purple-700",
    qualified: "bg-indigo-50 text-indigo-700",
    closed: "bg-emerald-50 text-emerald-700",
    lost: "bg-red-50 text-red-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "new"}
    </span>
  );
}

const formatDate = (value) => {
  if (!value) return "No date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No date";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function StaffAdmin() {
  const { logout, user } = useAuth();
  const [myProfile, setMyProfile] = useState(null);
  const [activeView, setActiveView] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leadUpdating, setLeadUpdating] = useState("");
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      const [teamRes, leadsRes] = await Promise.all([
        apiClient.get("/team"),
        apiClient.get("/admin/leads"),
      ]);
      const members = teamRes.data.results || [];
      setAssignedLeads(leadsRes.data.results || []);
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
    const profilePayload = {
      ...form,
      name: form.name.trim() || user?.name || "Staff Member",
      role: form.role.trim() || "Property Consultant",
      email: user?.email || form.email,
    };
    try {
      if (myProfile) {
        await apiClient.put(`/team/${myProfile.id}`, profilePayload);
        showToast("success", "Profile updated successfully!");
      } else {
        await apiClient.post("/team", profilePayload);
        showToast("success", "Profile created! You now appear on the team page.");
      }
      setForm(profilePayload);
      setEditing(false);
      load();
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Save failed.");
    }
    setSaving(false);
  };

  const updateLeadStatus = async (leadId, status) => {
    setLeadUpdating(leadId);
    try {
      await apiClient.patch(`/admin/leads/${leadId}`, { status });
      setAssignedLeads((items) =>
        items.map((lead) => (lead.id === leadId ? { ...lead, status } : lead))
      );
      showToast("success", "Lead status updated.");
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Could not update lead.");
    }
    setLeadUpdating("");
  };

  const inp = (field, placeholder, type = "text") => (
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
    <div className="min-h-screen bg-[#f4f2ee] flex">

      {/* ─── Mobile Overlay ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`admin-sidebar-fixed fixed top-0 left-0 h-screen min-h-screen w-64 bg-[var(--ink)] flex flex-col z-50 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex-shrink-0`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/triad_logo.jpeg"
              alt="Triad Realty"
              className="h-9 w-auto object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display text-white text-sm leading-tight truncate">Triad Realty</p>
              <p className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">Staff Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/50 hover:text-white p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--gold)] flex items-center justify-center flex-shrink-0 border-2 border-[var(--gold)]/50">
              {form.photo ? (
                <img src={form.photo} alt={form.name} className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-[var(--ink)]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{form.name || user?.name || "Staff Member"}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            type="button"
            onClick={() => { setActiveView("profile"); setEditing(false); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left
              ${activeView === "profile" && !editing
                ? "bg-[var(--gold)] text-[var(--ink)] font-medium"
                : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
          >
            <UserCircle size={16} />
            My Profile
          </button>
          <button
            type="button"
            onClick={() => { setActiveView("leads"); setEditing(false); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left
              ${activeView === "leads"
                ? "bg-[var(--gold)] text-[var(--ink)] font-medium"
                : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
          >
            <PhoneCall size={16} />
            My Leads
            {assignedLeads.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-tight">
                {assignedLeads.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setActiveView("profile"); setEditing(true); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left
              ${activeView === "profile" && editing
                ? "bg-[var(--gold)] text-[var(--ink)] font-medium"
                : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        </nav>

        {/* Team Page Preview */}
        {myProfile && (
          <div className="mx-4 mb-4 bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-3">Your Team Card</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                {form.photo ? (
                  <img src={form.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={14} className="text-white/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{form.name || "—"}</p>
                <p className="text-[var(--gold)] text-[10px] truncate">{form.role || "—"}</p>
              </div>
            </div>
            <a
              href="/team"
              target="_blank"
              rel="noreferrer"
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-white/50 hover:text-[var(--gold)] transition-colors"
            >
              View Team Page <ChevronRight size={11} />
            </a>
          </div>
        )}

        {/* Logout */}
        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors rounded-lg hover:bg-white/10"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile Top Bar */}
        <div className="lg:hidden bg-[var(--ink)] text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 text-white/70 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/triad_logo.jpeg" alt="Triad Realty" className="h-8 w-auto object-contain" />
            <span className="font-display text-sm">Staff Portal</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-white/50 hover:text-white transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-6 sm:top-6 z-[60] flex items-center gap-3 px-5 py-3.5 shadow-xl text-sm font-medium rounded transition-all max-w-sm
            ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            {toast.type === "success" ? <CheckCircle size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
            <span>{toast.msg}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">
                {activeView === "leads" ? "My Leads" : editing ? "Edit Profile" : "My Profile"}
              </h1>
              <p className="text-[var(--muted)] text-sm mt-1">
                {activeView === "leads"
                  ? "Follow up with leads assigned to you by the owner."
                  : editing
                  ? "Update your details — they appear live on the Triad team page."
                  : "This is how you appear on the Triad Realty website."
                }
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeView === "leads" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-[var(--line)] rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Assigned</p>
                    <p className="font-display text-3xl mt-1">{assignedLeads.length}</p>
                  </div>
                  <div className="bg-white border border-[var(--line)] rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">In Progress</p>
                    <p className="font-display text-3xl mt-1">
                      {assignedLeads.filter((lead) => ["assigned", "contacted", "qualified"].includes(lead.status)).length}
                    </p>
                  </div>
                  <div className="bg-white border border-[var(--line)] rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Closed</p>
                    <p className="font-display text-3xl mt-1">
                      {assignedLeads.filter((lead) => lead.status === "closed").length}
                    </p>
                  </div>
                </div>

                {assignedLeads.length === 0 ? (
                  <div className="bg-white border border-[var(--line)] rounded-lg p-8 text-center">
                    <Target className="mx-auto text-[var(--gold)]" size={28} />
                    <h2 className="font-display text-xl mt-4">No leads assigned yet</h2>
                    <p className="text-sm text-[var(--muted)] mt-2">
                      New assignments from the owner will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                    <div className="divide-y divide-[var(--line)]">
                      {assignedLeads.map((lead) => (
                        <div key={lead.id} className="p-5 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-display text-xl text-[var(--ink)]">{lead.name}</h2>
                                <StatusBadge status={lead.status} />
                              </div>
                              <p className="text-xs text-[var(--muted)] mt-1">
                                Assigned {formatDate(lead.updated_at || lead.created_at)}
                              </p>
                              {lead.source_page && (
                                <p className="text-xs text-[var(--muted)] mt-1">{lead.source_page}</p>
                              )}
                            </div>
                            <select
                              className="bg-white border border-[var(--line)] text-xs px-3 py-2 rounded focus:outline-none focus:border-[var(--gold)] transition-colors disabled:opacity-50"
                              value={lead.status || "assigned"}
                              disabled={leadUpdating === lead.id}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            >
                              <option value="assigned">Assigned</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="closed">Closed</option>
                              <option value="lost">Lost</option>
                            </select>
                          </div>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
                              <Phone size={14} /> {lead.phone}
                            </a>
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
                              <Mail size={14} /> {lead.email}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : !editing ? (
              /* ──── VIEW MODE ──── */
              <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden shadow-sm">
                {/* Hero Banner */}
                <div className="h-24 sm:h-28 bg-gradient-to-r from-[var(--ink)] to-[#2a2a2a]" />

                <div className="px-5 sm:px-8 pb-6 sm:pb-8 -mt-12 sm:-mt-14">
                  {/* Avatar row */}
                  <div className="mb-5 flex items-end justify-between">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white overflow-hidden bg-[var(--bg-alt)] shadow-md flex-shrink-0">
                      {form.photo ? (
                        <img src={form.photo} alt={form.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                          <User size={28} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[var(--ink)] text-white text-xs uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors rounded"
                    >
                      <Edit3 size={13} />
                      <span className="hidden sm:inline">Edit Profile</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                  </div>

                  <h2 className="font-display text-xl sm:text-2xl text-[var(--ink)]">{form.name || "—"}</h2>
                  <p className="text-[var(--gold)] text-sm uppercase tracking-widest mt-0.5">{form.role || "—"}</p>

                  {form.expertise && (
                    <p className="text-[var(--muted)] text-sm mt-2">
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
                      ⚠️ Your profile hasn't been created yet. Click <strong>Edit Profile</strong> to set up your public listing on the team page.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ──── EDIT MODE ──── */
              <form onSubmit={save} className="bg-white border border-[var(--line)] rounded-lg shadow-sm">
                {/* Form Header */}
                <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 border-b border-[var(--line)]">
                  <h2 className="font-display text-lg sm:text-xl">Edit Profile</h2>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="p-2 hover:bg-[var(--bg-alt)] rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-6">
                  {/* Photo section */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-3">
                      Profile Photo
                    </label>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--line)] overflow-hidden bg-[var(--bg-alt)] flex-shrink-0">
                        {form.photo ? (
                          <img src={form.photo} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-[200px] space-y-2">
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

                  {/* Basic info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
                      placeholder="Write a short bio about yourself…"
                      className="w-full bg-[#f8f6f2] border border-[var(--line)] px-4 py-3 text-sm rounded focus:outline-none focus:border-[var(--gold)] transition-colors resize-none"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                  </div>

                  {/* Notice */}
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-3 rounded">
                    💡 Your profile will appear as a card on the public <strong>Team</strong> page once saved.
                    Visitors can click it to view your full details.
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-[var(--line)] flex flex-wrap justify-end gap-3">
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
        </main>
      </div>
    </div>
  );
}
