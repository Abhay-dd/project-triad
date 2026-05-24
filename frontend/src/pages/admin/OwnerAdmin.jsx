import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api/client";
import { getAnalyticsSummary } from "../../hooks/useAnalytics";
import {
  LogOut, Users, TrendingUp, Target, XCircle, PhoneCall,
  Plus, Trash, Eye, BarChart2, UserCheck, Home,
  Building, Star, Award, Activity, ChevronRight, Search
} from "lucide-react";

const TABS = ["overview", "leads", "staff", "analytics"];

const TAB_LABELS = {
  overview: "Overview",
  leads: "Leads",
  staff: "Staff",
  analytics: "Analytics",
};

const TAB_ICONS = {
  overview: Home,
  leads: PhoneCall,
  staff: Users,
  analytics: BarChart2,
};

function KpiCard({ icon: Icon, label, value, sub, color = "gold" }) {
  const colorMap = {
    gold: "bg-[var(--gold)]/10 text-[var(--gold-deep)]",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    muted: "bg-[var(--bg-alt)] text-[var(--muted)]",
  };
  return (
    <div className="bg-white border border-[var(--line)] rounded-lg p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[var(--muted)] text-xs uppercase tracking-widest mb-1">{label}</p>
        <p className="font-display text-3xl text-[var(--ink)]">{value}</p>
        {sub && <p className="text-xs text-[var(--muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

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
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "new"}
    </span>
  );
}

export default function OwnerAdmin() {
  const { logout, user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [staff, setStaff] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "" });
  const [addingStaff, setAddingStaff] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [s, l, a, p, t] = await Promise.all([
        apiClient.get("/admin/staff"),
        apiClient.get("/admin/leads"),
        apiClient.get("/admin/attendance"),
        apiClient.get("/projects"),
        apiClient.get("/team"),
      ]);
      setStaff(s.data.results || []);
      setLeads(l.data.results || []);
      setAttendance(a.data.results || []);
      setProjects(p.data.results || []);
      setTeam(t.data.results || []);
    } catch { /* ignore */ }
    setAnalytics(getAnalyticsSummary());
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const createStaff = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/admin/staff", staffForm);
      setStaffForm({ name: "", email: "", password: "" });
      setAddingStaff(false);
      load();
    } catch { /* ignore */ }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm("Remove this staff member?")) return;
    await apiClient.delete(`/admin/staff/${id}`);
    load();
  };

  const assignLead = async (leadId, staffId) => {
    await apiClient.patch(`/admin/leads/${leadId}`, {
      assigned_to: staffId || null,
      status: staffId ? "assigned" : "new",
    });
    load();
  };

  const updateLeadStatus = async (leadId, status) => {
    await apiClient.patch(`/admin/leads/${leadId}`, { status });
    load();
  };

  const clearAllLeads = async () => {
    if (!window.confirm("Are you sure you want to clear all leads? This cannot be undone.")) return;
    try {
      await apiClient.delete("/admin/leads");
      load();
    } catch {
      alert("Failed to clear leads.");
    }
  };

  // ─── Derived stats ───
  const closed = leads.filter((l) => l.status === "closed").length;
  const lost = leads.filter((l) => l.status === "lost").length;
  const inProgress = leads.filter((l) =>
    ["contacted", "qualified", "assigned"].includes(l.status)
  ).length;
  const unassigned = leads.filter((l) => !l.assigned_to).length;

  // Staff performance
  const staffPerf = staff.map((s) => {
    const assigned = leads.filter((l) => l.assigned_to === s.id);
    const closedCount = assigned.filter((l) => l.status === "closed").length;
    const lastActive = attendance
      .filter((a) => a.user_id === s.id)
      .sort((a, b) => new Date(b.login_at) - new Date(a.login_at))[0];
    return { ...s, assigned: assigned.length, closed: closedCount, lastActive };
  });

  // Filtered leads
  const filteredLeads = leads
    .filter((l) => {
      if (leadFilter !== "all" && l.status !== leadFilter) return false;
      if (leadSearch) {
        const q = leadSearch.toLowerCase();
        return l.name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.phone?.includes(q);
      }
      return true;
    });

  // Resolve project/team names for analytics
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const teamMap = Object.fromEntries(team.map((m) => [m.id, m.name]));

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex">
      {/* ─── Sidebar ─── */}
      <aside className="w-60 bg-[var(--ink)] flex-shrink-0 flex flex-col min-h-screen">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/triad_logo.jpeg"
              alt="Triad Realty"
              className="h-10 w-auto object-contain flex-shrink-0"
            />
            <div>
              <p className="font-display text-white text-base leading-tight">Triad Realty</p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">Owner Portal</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--gold)] flex items-center justify-center flex-shrink-0">
              <UserCheck size={16} className="text-[var(--ink)]" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || "Owner"}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {TABS.map((t) => {
            const Icon = TAB_ICONS[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left
                  ${tab === t
                    ? "bg-[var(--gold)] text-[var(--ink)] font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
              >
                <Icon size={16} />
                {TAB_LABELS[t]}
                {t === "leads" && unassigned > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {unassigned}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

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

      {/* ─── Main content ─── */}
      <main className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <div className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-8">

            {/* ══════════ OVERVIEW ══════════ */}
            {tab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h1 className="font-display text-3xl text-[var(--ink)]">Dashboard Overview</h1>
                  <p className="text-[var(--muted)] text-sm mt-1">Real-time snapshot of your operations.</p>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  <KpiCard icon={Building} label="Total Projects" value={projects.length} sub="In database" color="gold" />
                  <KpiCard icon={Target} label="Total Leads" value={leads.length} sub="All time" color="blue" />
                  <KpiCard icon={Award} label="Leads Closed" value={closed} sub={`${leads.length ? Math.round((closed / leads.length) * 100) : 0}% close rate`} color="green" />
                  <KpiCard icon={XCircle} label="Leads Lost" value={lost} sub="Marked as lost" color="red" />
                  <KpiCard icon={Activity} label="In Progress" value={inProgress} sub="Active follow-ups" color="purple" />
                  <KpiCard icon={Users} label="Active Staff" value={staff.length} sub="Team members" color="muted" />
                </div>

                {/* Staff Performance */}
                <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--line)] flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--gold)]" />
                    <h2 className="font-display text-lg">Staff Performance</h2>
                  </div>
                  <div className="divide-y divide-[var(--line)]">
                    {staffPerf.length === 0 && (
                      <p className="px-6 py-6 text-[var(--muted)] text-sm">No staff members yet.</p>
                    )}
                    {staffPerf.map((s) => (
                      <div key={s.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[var(--bg-alt)] flex items-center justify-center flex-shrink-0">
                            <Users size={14} className="text-[var(--muted)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--ink)] truncate">{s.name}</p>
                            <p className="text-xs text-[var(--muted)] truncate">{s.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-center flex-shrink-0">
                          <div>
                            <p className="text-lg font-display text-[var(--ink)]">{s.assigned}</p>
                            <p className="text-xs text-[var(--muted)] uppercase tracking-widest">Assigned</p>
                          </div>
                          <div>
                            <p className="text-lg font-display text-emerald-600">{s.closed}</p>
                            <p className="text-xs text-[var(--muted)] uppercase tracking-widest">Closed</p>
                          </div>
                          <div className="w-16">
                            <div className="h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--gold)] rounded-full"
                                style={{ width: s.assigned ? `${(s.closed / s.assigned) * 100}%` : "0%" }}
                              />
                            </div>
                            <p className="text-xs text-[var(--muted)] mt-1">
                              {s.assigned ? Math.round((s.closed / s.assigned) * 100) : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Leads */}
                <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PhoneCall size={16} className="text-[var(--gold)]" />
                      <h2 className="font-display text-lg">Recent Leads</h2>
                    </div>
                    <button type="button" onClick={() => setTab("leads")} className="text-xs text-[var(--muted)] hover:text-[var(--gold)] flex items-center gap-1 transition-colors">
                      View all <ChevronRight size={13} />
                    </button>
                  </div>
                  <div className="divide-y divide-[var(--line)]">
                    {leads.slice(0, 6).map((l) => (
                      <div key={l.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--ink)] truncate">{l.name}</p>
                          <p className="text-xs text-[var(--muted)] truncate">{l.email} · {l.phone}</p>
                        </div>
                        <StatusBadge status={l.status} />
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <p className="px-6 py-6 text-sm text-[var(--muted)]">No leads yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ LEADS ══════════ */}
            {tab === "leads" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="font-display text-3xl text-[var(--ink)]">Lead Management</h1>
                    <p className="text-[var(--muted)] text-sm mt-1">All incoming leads — assign and track progress.</p>
                  </div>
                  {leads.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllLeads}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors duration-200 font-medium shadow-sm"
                    >
                      Clear All Leads
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="text"
                      placeholder="Search leads..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-[var(--line)] rounded text-sm focus:outline-none focus:border-[var(--gold)] transition-colors w-56"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["all", "new", "assigned", "contacted", "qualified", "closed", "lost"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setLeadFilter(f)}
                        className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded transition-colors
                          ${leadFilter === f ? "bg-[var(--ink)] text-white" : "bg-white border border-[var(--line)] hover:border-[var(--ink)]"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--line)] bg-[var(--bg-alt)]">
                          <th className="text-left px-5 py-3.5 text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Name</th>
                          <th className="text-left px-5 py-3.5 text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Contact</th>
                          <th className="text-left px-5 py-3.5 text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Status</th>
                          <th className="text-left px-5 py-3.5 text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Assign To</th>
                          <th className="text-left px-5 py-3.5 text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {filteredLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-[var(--bg-alt)] transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-[var(--ink)]">{lead.name}</p>
                              {lead.source_page && <p className="text-xs text-[var(--muted)]">{lead.source_page}</p>}
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-[var(--muted)]">{lead.email}</p>
                              <p className="text-xs text-[var(--muted)]">{lead.phone}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusBadge status={lead.status} />
                            </td>
                            <td className="px-5 py-3.5">
                              <select
                                className="bg-white border border-[var(--line)] text-sm px-2 py-1.5 rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                                value={lead.assigned_to || ""}
                                onChange={(e) => assignLead(lead.id, e.target.value)}
                              >
                                <option value="">Unassigned</option>
                                {staff.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3.5">
                              <select
                                className="bg-white border border-[var(--line)] text-sm px-2 py-1.5 rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                                value={lead.status || "new"}
                                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                              >
                                <option value="new">New</option>
                                <option value="assigned">Assigned</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                                <option value="closed">Closed</option>
                                <option value="lost">Lost</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                        {filteredLeads.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-10 text-center text-[var(--muted)] text-sm">
                              No leads match your filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ STAFF ══════════ */}
            {tab === "staff" && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-3xl text-[var(--ink)]">Staff Management</h1>
                    <p className="text-[var(--muted)] text-sm mt-1">{staff.length} team member{staff.length !== 1 ? "s" : ""}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddingStaff(!addingStaff)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--ink)] text-white text-xs uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors rounded"
                  >
                    <Plus size={14} /> Add Staff
                  </button>
                </div>

                {/* Add staff form */}
                {addingStaff && (
                  <form onSubmit={createStaff} className="bg-white border border-[var(--line)] rounded-lg p-6">
                    <h3 className="font-display text-lg mb-5">New Staff Member</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <input
                        required
                        placeholder="Full Name"
                        className="bg-[#f8f6f2] border border-[var(--line)] px-4 py-2.5 text-sm rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                        value={staffForm.name}
                        onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      />
                      <input
                        required
                        type="email"
                        placeholder="Email Address"
                        className="bg-[#f8f6f2] border border-[var(--line)] px-4 py-2.5 text-sm rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      />
                      <input
                        required
                        type="password"
                        placeholder="Password"
                        className="bg-[#f8f6f2] border border-[var(--line)] px-4 py-2.5 text-sm rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="px-5 py-2 bg-[var(--ink)] text-white text-sm rounded hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors">
                        Create
                      </button>
                      <button type="button" onClick={() => setAddingStaff(false)} className="px-5 py-2 border border-[var(--line)] text-sm rounded hover:border-[var(--ink)] transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Staff cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staff.length === 0 && (
                    <p className="text-[var(--muted)] text-sm col-span-2 py-10 text-center">No staff members yet. Click Add Staff to create one.</p>
                  )}
                  {staffPerf.map((s) => (
                    <div key={s.id} className="bg-white border border-[var(--line)] rounded-lg p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                            <Users size={18} className="text-[var(--gold-deep)]" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--ink)]">{s.name}</p>
                            <p className="text-xs text-[var(--muted)]">{s.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteStaff(s.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-[var(--bg-alt)] rounded p-3 text-center">
                          <p className="font-display text-xl text-[var(--ink)]">{s.assigned}</p>
                          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mt-0.5">Assigned</p>
                        </div>
                        <div className="bg-emerald-50 rounded p-3 text-center">
                          <p className="font-display text-xl text-emerald-700">{s.closed}</p>
                          <p className="text-xs text-emerald-600 uppercase tracking-widest mt-0.5">Closed</p>
                        </div>
                        <div className="bg-[var(--bg-alt)] rounded p-3 text-center">
                          <p className="font-display text-xl text-[var(--ink)]">
                            {s.assigned ? Math.round((s.closed / s.assigned) * 100) : 0}%
                          </p>
                          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mt-0.5">Rate</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--gold)] rounded-full transition-all"
                          style={{ width: s.assigned ? `${(s.closed / s.assigned) * 100}%` : "0%" }}
                        />
                      </div>

                      {s.lastActive && (
                        <p className="text-xs text-[var(--muted)] mt-3">
                          Last active: {new Date(s.lastActive.login_at).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════ ANALYTICS ══════════ */}
            {tab === "analytics" && (
              <div className="space-y-8">
                <div>
                  <h1 className="font-display text-3xl text-[var(--ink)]">Website Analytics</h1>
                  <p className="text-[var(--muted)] text-sm mt-1">
                    Based on page visits tracked in this browser.
                  </p>
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-2 gap-4">
                  <KpiCard icon={Eye} label="Total Page Views" value={analytics?.totalViews || 0} sub="All time in this browser" color="blue" />
                  <KpiCard icon={TrendingUp} label="Views This Week" value={analytics?.last7Days || 0} sub="Last 7 days" color="green" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Top Pages */}
                  <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden lg:col-span-1">
                    <div className="px-5 py-4 border-b border-[var(--line)] flex items-center gap-2">
                      <Star size={15} className="text-[var(--gold)]" />
                      <h3 className="font-display text-base">Top Pages</h3>
                    </div>
                    <div className="divide-y divide-[var(--line)]">
                      {analytics?.topPages?.length === 0 && (
                        <p className="px-5 py-5 text-sm text-[var(--muted)]">No data yet — visit some pages first.</p>
                      )}
                      {analytics?.topPages?.map(({ path, count }, i) => (
                        <div key={path} className="px-5 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs text-[var(--muted)] w-5 flex-shrink-0">#{i + 1}</span>
                            <span className="text-sm text-[var(--ink)] truncate">{path}</span>
                          </div>
                          <span className="text-xs font-medium text-[var(--gold-deep)] flex-shrink-0">{count} views</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Team Members */}
                  <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--line)] flex items-center gap-2">
                      <Users size={15} className="text-[var(--gold)]" />
                      <h3 className="font-display text-base">Most Viewed Team</h3>
                    </div>
                    <div className="divide-y divide-[var(--line)]">
                      {analytics?.topTeam?.length === 0 && (
                        <p className="px-5 py-5 text-sm text-[var(--muted)]">No team profile visits yet.</p>
                      )}
                      {analytics?.topTeam?.map(({ id, count }, i) => (
                        <div key={id} className="px-5 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[var(--bg-alt)] flex items-center justify-center flex-shrink-0">
                              <Users size={12} className="text-[var(--muted)]" />
                            </div>
                            <span className="text-sm text-[var(--ink)] truncate">{teamMap[id] || id}</span>
                          </div>
                          <span className="text-xs font-medium text-[var(--gold-deep)] flex-shrink-0">{count} views</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Properties */}
                  <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--line)] flex items-center gap-2">
                      <Building size={15} className="text-[var(--gold)]" />
                      <h3 className="font-display text-base">Most Viewed Properties</h3>
                    </div>
                    <div className="divide-y divide-[var(--line)]">
                      {analytics?.topProperties?.length === 0 && (
                        <p className="px-5 py-5 text-sm text-[var(--muted)]">No property visits tracked yet.</p>
                      )}
                      {analytics?.topProperties?.map(({ id, count }, i) => (
                        <div key={id} className="px-5 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[var(--bg-alt)] flex items-center justify-center flex-shrink-0">
                              <Building size={12} className="text-[var(--muted)]" />
                            </div>
                            <span className="text-sm text-[var(--ink)] truncate">{projectMap[id] || id}</span>
                          </div>
                          <span className="text-xs font-medium text-[var(--gold-deep)] flex-shrink-0">{count} views</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-800">
                  <strong>ℹ️ About Analytics:</strong> Data is tracked locally in this browser using localStorage.
                  As visitors browse the website on the same device, their page views are recorded here.
                  For multi-user tracking, a server-side analytics endpoint would be needed.
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
