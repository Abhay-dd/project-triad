import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api/client";
import { Plus, Trash, LogOut, Edit, X } from "lucide-react";

const TABS = ["team", "owners", "projects", "blogs", "home", "popup"];

const EMPTY_PROJECT_FORM = {
  id: "",
  name: "",
  developer: "",
  location: "",
  emirate: "",
  type: "",
  configuration: "",
  price_from: "",
  price_currency: "AED",
  sqft_from: "",
  handover: "",
  status: "",
  hot: false,
  tagline: "",
  hero: "",
  description: "",
  amenities: "",
  gallery: "",
};

const EMPTY_BLOG_FORM = {
  id: "",
  title: "",
  category: "",
  author: "",
  date: "",
  read_minutes: "",
  cover: "",
  excerpt: "",
  content: "",
};

const DEFAULT_HOMEPAGE_FORM = {
  launch_title: "",
  launch_description: "",
  launch_video_url: "",
  stat1_value: "",
  stat1_label: "",
  stat2_value: "",
  stat2_label: "",
  stat3_value: "",
  stat3_label: "",
  stat4_value: "",
  stat4_label: "",
  founders_image_url: "",
};

const splitCsv = (s) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const joinCsv = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");

export default function DeveloperAdmin() {
  const { logout, user } = useAuth();
  const [tab, setTab] = useState("team");
  const [team, setTeam] = useState([]);
  const [owners, setOwners] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerForm, setOwnerForm] = useState({
    email: "",
    password: "",
    name: "",
    organization_name: "",
  });
  const [teamModal, setTeamModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: "",
    role: "",
    expertise: "",
    focus: "",
    photo: "",
    phone: "",
    email: "",
    instagram: "",
    linkedin: "",
    bio: "",
    videoUrl: "",
    videoUrl2: "",
  });
  const [projectModal, setProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);
  const [blogModal, setBlogModal] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM);
  const [popupForm, setPopupForm] = useState({
    tag: "",
    title: "",
    description: "",
    btn1_label: "",
    btn1_link: "",
    btn2_label: "",
    btn2_link: "",
    active: true,
  });
  const [homepageForm, setHomepageForm] = useState(DEFAULT_HOMEPAGE_FORM);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [t, o, p, b, h, pop, home] = await Promise.all([
        apiClient.get("/team"),
        apiClient.get("/admin/owners"),
        apiClient.get("/admin/projects"),
        apiClient.get("/admin/blogs"),
        apiClient.get("/admin/system/health"),
        apiClient.get("/settings/popup"),
        apiClient.get("/settings/homepage"),
      ]);
      setTeam(t.data.results || []);
      setOwners(o.data.results || []);
      setProjects(p.data.results || []);
      setBlogs(b.data.results || []);
      setHealth(h.data);
      if (pop.data) {
        setPopupForm({
          tag: pop.data.tag || "",
          title: pop.data.title || "",
          description: pop.data.description || "",
          btn1_label: pop.data.btn1_label || "",
          btn1_link: pop.data.btn1_link || "",
          btn2_label: pop.data.btn2_label || "",
          btn2_link: pop.data.btn2_link || "",
          active: pop.data.active ?? true,
        });
      }
      if (home.data) {
        setHomepageForm({
          ...DEFAULT_HOMEPAGE_FORM,
          launch_title: home.data.launch_title || "",
          launch_description: home.data.launch_description || "",
          launch_video_url: home.data.launch_video_url || "",
          stat1_value: home.data.stat1_value || "",
          stat1_label: home.data.stat1_label || "",
          stat2_value: home.data.stat2_value || "",
          stat2_label: home.data.stat2_label || "",
          stat3_value: home.data.stat3_value || "",
          stat3_label: home.data.stat3_label || "",
          stat4_value: home.data.stat4_value || "",
          stat4_label: home.data.stat4_label || "",
          founders_image_url: home.data.founders_image_url || "",
        });
      }
    } catch {
      /* per-action errors */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createOwner = async (e) => {
    e.preventDefault();
    await apiClient.post("/admin/owners", ownerForm);
    setOwnerForm({ email: "", password: "", name: "", organization_name: "" });
    load();
  };

  const deleteTeam = async (id) => {
    if (!window.confirm("Delete team member?")) return;
    await apiClient.delete(`/team/${id}`);
    load();
  };

  const openTeamModal = (member = null) => {
    if (member) {
      setEditingTeamId(member.id);
      setTeamForm({
        name: member.name || "",
        role: member.role || "",
        expertise: member.expertise || "",
        focus: member.focus || "",
        photo: member.photo || "",
        phone: member.phone || "",
        email: member.email || "",
        instagram: member.instagram || "",
        linkedin: member.linkedin || "",
        bio: member.bio || "",
        videoUrl: member.videoUrl || "",
        videoUrl2: member.videoUrl2 || "",
      });
    } else {
      setEditingTeamId(null);
      setTeamForm({
        name: "",
        role: "",
        expertise: "",
        focus: "",
        photo: "",
        phone: "",
        email: "",
        instagram: "",
        linkedin: "",
        bio: "",
        videoUrl: "",
        videoUrl2: "",
      });
    }
    setTeamModal(true);
  };

  const saveTeam = async (e) => {
    e.preventDefault();
    setActionError("");
    setSaving(true);
    try {
      if (editingTeamId) {
        await apiClient.put(`/team/${editingTeamId}`, teamForm);
      } else {
        await apiClient.post("/team", teamForm);
      }
      setTeamModal(false);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to save team member");
    }
    setSaving(false);
  };

  const openProjectModal = (project = null) => {
    setActionError("");
    if (project) {
      setEditingProjectId(project.id);
      setProjectForm({
        id: project.id || "",
        name: project.name || "",
        developer: project.developer || "",
        location: project.location || "",
        emirate: project.emirate || "",
        type: project.type || "",
        configuration: joinCsv(project.configuration),
        price_from: project.price_from != null ? String(project.price_from) : "",
        price_currency: project.price_currency || "AED",
        sqft_from: project.sqft_from != null ? String(project.sqft_from) : "",
        handover: project.handover || "",
        status: project.status || "",
        hot: Boolean(project.hot),
        tagline: project.tagline || "",
        hero: project.hero || "",
        description: project.description || "",
        amenities: joinCsv(project.amenities),
        gallery: joinCsv(project.gallery),
      });
    } else {
      setEditingProjectId(null);
      setProjectForm(EMPTY_PROJECT_FORM);
    }
    setProjectModal(true);
  };

  const buildProjectPayload = () => {
    const payload = {
      name: projectForm.name,
      developer: projectForm.developer,
      location: projectForm.location,
      emirate: projectForm.emirate,
      type: projectForm.type,
      configuration: splitCsv(projectForm.configuration),
      price_currency: projectForm.price_currency || "AED",
      handover: projectForm.handover,
      status: projectForm.status,
      hot: projectForm.hot,
      tagline: projectForm.tagline,
      hero: projectForm.hero,
      description: projectForm.description,
      amenities: splitCsv(projectForm.amenities),
    };
    if (projectForm.id) payload.id = projectForm.id;
    if (projectForm.price_from !== "") payload.price_from = Number(projectForm.price_from);
    if (projectForm.sqft_from !== "") payload.sqft_from = Number(projectForm.sqft_from);
    const gallery = splitCsv(projectForm.gallery);
    if (gallery.length) payload.gallery = gallery;
    return payload;
  };

  const saveProject = async (e) => {
    e.preventDefault();
    setActionError("");
    setSaving(true);
    try {
      const payload = buildProjectPayload();
      if (editingProjectId) {
        await apiClient.patch(`/admin/projects/${editingProjectId}`, payload);
      } else {
        if (!payload.id) {
          setActionError("Project ID is required for new projects");
          setSaving(false);
          return;
        }
        await apiClient.post("/admin/projects", payload);
      }
      setProjectModal(false);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to save project");
    }
    setSaving(false);
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    setActionError("");
    try {
      await apiClient.delete(`/admin/projects/${id}`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to delete project");
    }
  };

  const openBlogModal = (blog = null) => {
    setActionError("");
    if (blog) {
      setEditingBlogId(blog.id);
      setBlogForm({
        id: blog.id || "",
        title: blog.title || "",
        category: blog.category || "",
        author: blog.author || "",
        date: blog.date || "",
        read_minutes: blog.read_minutes != null ? String(blog.read_minutes) : "",
        cover: blog.cover || "",
        excerpt: blog.excerpt || "",
        content: blog.content || "",
      });
    } else {
      setEditingBlogId(null);
      setBlogForm(EMPTY_BLOG_FORM);
    }
    setBlogModal(true);
  };

  const buildBlogPayload = () => {
    const payload = {
      title: blogForm.title,
      category: blogForm.category,
      author: blogForm.author,
      date: blogForm.date,
      cover: blogForm.cover,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
    };
    if (blogForm.id) payload.id = blogForm.id;
    if (blogForm.read_minutes !== "") payload.read_minutes = Number(blogForm.read_minutes);
    return payload;
  };

  const saveBlog = async (e) => {
    e.preventDefault();
    setActionError("");
    setSaving(true);
    try {
      const payload = buildBlogPayload();
      if (editingBlogId) {
        await apiClient.patch(`/admin/blogs/${editingBlogId}`, payload);
      } else {
        if (!payload.id) {
          setActionError("Blog ID is required for new posts");
          setSaving(false);
          return;
        }
        await apiClient.post("/admin/blogs", payload);
      }
      setBlogModal(false);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to save blog");
    }
    setSaving(false);
  };

  const deleteBlog = async (id) => {
    if (!window.confirm("Delete this blog post?")) return;
    setActionError("");
    try {
      await apiClient.delete(`/admin/blogs/${id}`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to delete blog");
    }
  };

  const savePopupSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setActionError("");
    try {
      const res = await apiClient.put("/admin/settings/popup", popupForm);
      if (res.data) {
        setPopupForm({
          tag: res.data.tag || "",
          title: res.data.title || "",
          description: res.data.description || "",
          btn1_label: res.data.btn1_label || "",
          btn1_link: res.data.btn1_link || "",
          btn2_label: res.data.btn2_label || "",
          btn2_link: res.data.btn2_link || "",
          active: res.data.active ?? true,
        });
        alert("Popup settings updated successfully!");
      }
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to update popup settings");
    }
    setSaving(false);
  };

  const saveHomepageSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setActionError("");
    try {
      const res = await apiClient.put("/admin/settings/homepage", homepageForm);
      if (res.data) {
        setHomepageForm({
          ...DEFAULT_HOMEPAGE_FORM,
          launch_title: res.data.launch_title || "",
          launch_description: res.data.launch_description || "",
          launch_video_url: res.data.launch_video_url || "",
          stat1_value: res.data.stat1_value || "",
          stat1_label: res.data.stat1_label || "",
          stat2_value: res.data.stat2_value || "",
          stat2_label: res.data.stat2_label || "",
          stat3_value: res.data.stat3_value || "",
          stat3_label: res.data.stat3_label || "",
          stat4_value: res.data.stat4_value || "",
          stat4_label: res.data.stat4_label || "",
          founders_image_url: res.data.founders_image_url || "",
        });
        alert("Homepage settings updated successfully!");
      }
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to update homepage settings");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-alt)] pt-32 pb-20">
      <div className="container-x">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="font-display text-4xl">Developer Console</h1>
            <p className="text-[var(--muted)] mt-2">{user?.email}</p>
            {health && (
              <p className="text-xs text-[var(--muted)] mt-1">
                DB: {health.database} · {health.projects} projects · {health.users} users
              </p>
            )}
          </div>
          <button type="button" onClick={logout} className="btn-ghost flex gap-2 items-center">
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm uppercase tracking-widest border ${
                tab === t ? "border-[var(--gold)] bg-white" : "border-[var(--line)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {actionError && !teamModal && !projectModal && !blogModal && (
          <p className="text-red-600 text-sm mb-4">{actionError}</p>
        )}

        {loading ? (
          <p className="text-[var(--muted)]">Loading…</p>
        ) : (
          <>
            {tab === "team" && (
              <div className="bg-white p-8 border border-[var(--line)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl">Team ({team.length})</h2>
                  <button type="button" onClick={() => openTeamModal()} className="btn-gold !px-4 !py-2 flex gap-2 items-center text-sm">
                    <Plus size={14} /> Add Member
                  </button>
                </div>
                <ul className="space-y-2">
                  {team.map((m) => (
                    <li key={m.id} className="flex justify-between items-center border-b border-[var(--line)] py-2">
                      <span>
                        {m.name} — {m.role}
                      </span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openTeamModal(m)} className="p-1 hover:bg-[var(--bg-alt)] rounded">
                          <Edit size={14} />
                        </button>
                        <button type="button" onClick={() => deleteTeam(m.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "owners" && (
              <div className="grid lg:grid-cols-2 gap-8">
                <form onSubmit={createOwner} className="bg-white p-8 border border-[var(--line)] space-y-4">
                  <h2 className="font-display text-2xl">Create Owner</h2>
                  <input
                    placeholder="Name"
                    required
                    className="input-line w-full"
                    value={ownerForm.name}
                    onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    required
                    className="input-line w-full"
                    value={ownerForm.email}
                    onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                  />
                  <input
                    placeholder="Password"
                    type="password"
                    required
                    className="input-line w-full"
                    value={ownerForm.password}
                    onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                  />
                  <input
                    placeholder="Organization name"
                    required
                    className="input-line w-full"
                    value={ownerForm.organization_name}
                    onChange={(e) => setOwnerForm({ ...ownerForm, organization_name: e.target.value })}
                  />
                  <button type="submit" className="btn-gold">
                    <Plus size={14} className="inline mr-1" /> Create
                  </button>
                </form>
                <div className="bg-white p-8 border border-[var(--line)]">
                  <h2 className="font-display text-2xl mb-4">Owners ({owners.length})</h2>
                  <ul className="space-y-2 text-sm">
                    {owners.map((o) => (
                      <li key={o.id}>
                        {o.name} — {o.email} ({o.organization_name})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === "projects" && (
              <div className="bg-white p-8 border border-[var(--line)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl">Projects ({projects.length})</h2>
                  <button type="button" onClick={() => openProjectModal()} className="btn-gold !px-4 !py-2 flex gap-2 items-center text-sm">
                    <Plus size={14} /> Add Project
                  </button>
                </div>
                <ul className="space-y-2">
                  {projects.map((p) => (
                    <li key={p.id} className="flex justify-between items-center border-b border-[var(--line)] py-2">
                      <span className="text-sm">
                        {p.name} <span className="text-[var(--muted)]">— {p.emirate}</span>
                      </span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openProjectModal(p)} className="p-1 hover:bg-[var(--bg-alt)] rounded">
                          <Edit size={14} />
                        </button>
                        <button type="button" onClick={() => deleteProject(p.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "blogs" && (
              <div className="bg-white p-8 border border-[var(--line)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl">Blogs ({blogs.length})</h2>
                  <button type="button" onClick={() => openBlogModal()} className="btn-gold !px-4 !py-2 flex gap-2 items-center text-sm">
                    <Plus size={14} /> Add Blog
                  </button>
                </div>
                <ul className="space-y-2">
                  {blogs.map((b) => (
                    <li key={b.id} className="flex justify-between items-center border-b border-[var(--line)] py-2">
                      <span className="text-sm">{b.title}</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openBlogModal(b)} className="p-1 hover:bg-[var(--bg-alt)] rounded">
                          <Edit size={14} />
                        </button>
                        <button type="button" onClick={() => deleteBlog(b.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "home" && (
              <form onSubmit={saveHomepageSettings} className="bg-white p-8 border border-[var(--line)] space-y-6 max-w-4xl">
                <h2 className="font-display text-2xl mb-4">Homepage Launch Updates</h2>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Section Title</label>
                  <input
                    placeholder="e.g. Why Triad Realty?"
                    required
                    className="input-line w-full"
                    value={homepageForm.launch_title}
                    onChange={(e) => setHomepageForm({ ...homepageForm, launch_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Description</label>
                  <textarea
                    placeholder="Short launch update introduction"
                    required
                    rows={4}
                    className="w-full border border-[var(--line)] p-3 text-sm"
                    value={homepageForm.launch_description}
                    onChange={(e) => setHomepageForm({ ...homepageForm, launch_description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">YouTube Video URL</label>
                    <input
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="input-line w-full"
                      value={homepageForm.launch_video_url}
                      onChange={(e) => setHomepageForm({ ...homepageForm, launch_video_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Founders Image URL</label>
                    <input
                      placeholder="https://..."
                      className="input-line w-full"
                      value={homepageForm.founders_image_url}
                      onChange={(e) => setHomepageForm({ ...homepageForm, founders_image_url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="border border-[var(--line)] p-5">
                      <p className="overline text-[var(--muted)] mb-3">Detail {n}</p>
                      <input
                        placeholder="Value"
                        required
                        className="input-line w-full"
                        value={homepageForm[`stat${n}_value`]}
                        onChange={(e) => setHomepageForm({ ...homepageForm, [`stat${n}_value`]: e.target.value })}
                      />
                      <input
                        placeholder="Label"
                        required
                        className="input-line w-full mt-3"
                        value={homepageForm[`stat${n}_label`]}
                        onChange={(e) => setHomepageForm({ ...homepageForm, [`stat${n}_label`]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={saving} className="btn-gold w-full !py-3">
                  {saving ? "Saving..." : "Save Homepage Settings"}
                </button>
              </form>
            )}

            {tab === "popup" && (
              <form onSubmit={savePopupSettings} className="bg-white p-8 border border-[var(--line)] space-y-6 max-w-2xl">
                <h2 className="font-display text-2xl mb-4">Popup Notification Settings</h2>
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="popup-active"
                    checked={popupForm.active}
                    onChange={(e) => setPopupForm({ ...popupForm, active: e.target.checked })}
                    className="w-4 h-4 text-[var(--gold)] border-[var(--line)] rounded focus:ring-[var(--gold)]"
                  />
                  <label htmlFor="popup-active" className="text-sm font-medium cursor-pointer">
                    Enable Popup Notification on site
                  </label>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Tag/Overline</label>
                  <input
                    placeholder="e.g. New Launch"
                    required
                    className="input-line w-full"
                    value={popupForm.tag}
                    onChange={(e) => setPopupForm({ ...popupForm, tag: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Title</label>
                  <input
                    placeholder="e.g. Marina Aurora — Pre-Launch"
                    required
                    className="input-line w-full"
                    value={popupForm.title}
                    onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Description</label>
                  <textarea
                    placeholder="Short description here..."
                    required
                    rows={3}
                    className="input-line w-full resize-none"
                    value={popupForm.description}
                    onChange={(e) => setPopupForm({ ...popupForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Button 1 Label</label>
                    <input
                      placeholder="e.g. View Details"
                      className="input-line w-full"
                      value={popupForm.btn1_label}
                      onChange={(e) => setPopupForm({ ...popupForm, btn1_label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Button 1 Link</label>
                    <input
                      placeholder="e.g. /projects/marina-aurora"
                      className="input-line w-full"
                      value={popupForm.btn1_link}
                      onChange={(e) => setPopupForm({ ...popupForm, btn1_link: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Button 2 Label</label>
                    <input
                      placeholder="e.g. Compare"
                      className="input-line w-full"
                      value={popupForm.btn2_label}
                      onChange={(e) => setPopupForm({ ...popupForm, btn2_label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Button 2 Link</label>
                    <input
                      placeholder="e.g. /analysis"
                      className="input-line w-full"
                      value={popupForm.btn2_link}
                      onChange={(e) => setPopupForm({ ...popupForm, btn2_link: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-gold w-full !py-3">
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {teamModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto border-l border-[var(--gold)]/30 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl">{editingTeamId ? "Edit Member" : "Add Member"}</h2>
              <button type="button" onClick={() => setTeamModal(false)}>
                <X size={20} />
              </button>
            </div>
            {actionError && <p className="text-red-600 text-sm">{actionError}</p>}
            <form onSubmit={saveTeam} className="space-y-4">
              <input required placeholder="Name *" className="input-line w-full" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
              <input required placeholder="Role *" className="input-line w-full" value={teamForm.role} onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })} />
              <input placeholder="Photo URL" className="input-line w-full" value={teamForm.photo} onChange={(e) => setTeamForm({ ...teamForm, photo: e.target.value })} />
              <input placeholder="Phone" className="input-line w-full" value={teamForm.phone} onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })} />
              <input type="email" placeholder="Email" className="input-line w-full" value={teamForm.email} onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} />
              <input placeholder="Instagram URL" className="input-line w-full" value={teamForm.instagram} onChange={(e) => setTeamForm({ ...teamForm, instagram: e.target.value })} />
              <input placeholder="LinkedIn URL" className="input-line w-full" value={teamForm.linkedin} onChange={(e) => setTeamForm({ ...teamForm, linkedin: e.target.value })} />
              <input placeholder="Expertise" className="input-line w-full" value={teamForm.expertise} onChange={(e) => setTeamForm({ ...teamForm, expertise: e.target.value })} />
              <input placeholder="Focus" className="input-line w-full" value={teamForm.focus} onChange={(e) => setTeamForm({ ...teamForm, focus: e.target.value })} />
              <textarea placeholder="Bio" rows={4} className="w-full border border-[var(--line)] p-3 text-sm" value={teamForm.bio} onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })} />
              <div className="pt-2 border-t border-[var(--line)]">
                <p className="overline text-[var(--muted)] mb-3">YouTube Videos</p>
                <input placeholder="Video URL 1 (YouTube link)" className="input-line w-full" value={teamForm.videoUrl} onChange={(e) => setTeamForm({ ...teamForm, videoUrl: e.target.value })} />
                <input placeholder="Video URL 2 (YouTube link)" className="input-line w-full mt-3" value={teamForm.videoUrl2} onChange={(e) => setTeamForm({ ...teamForm, videoUrl2: e.target.value })} />
              </div>
              <button type="submit" disabled={saving} className="btn-gold w-full">{saving ? "Saving…" : "Save"}</button>
            </form>
          </div>
        </div>
      )}

      {projectModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto border-l border-[var(--gold)]/30 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl">{editingProjectId ? "Edit Project" : "Add Project"}</h2>
              <button type="button" onClick={() => setProjectModal(false)}>
                <X size={20} />
              </button>
            </div>
            {actionError && <p className="text-red-600 text-sm mb-4">{actionError}</p>}
            <form onSubmit={saveProject} className="space-y-4">
              <input
                required
                disabled={Boolean(editingProjectId)}
                placeholder="ID (slug) *"
                className="input-line w-full disabled:opacity-50"
                value={projectForm.id}
                onChange={(e) => setProjectForm({ ...projectForm, id: e.target.value })}
              />
              <input required placeholder="Name *" className="input-line w-full" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
              <input placeholder="Developer" className="input-line w-full" value={projectForm.developer} onChange={(e) => setProjectForm({ ...projectForm, developer: e.target.value })} />
              <input required placeholder="Location *" className="input-line w-full" value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} />
              <input required placeholder="Emirate *" className="input-line w-full" value={projectForm.emirate} onChange={(e) => setProjectForm({ ...projectForm, emirate: e.target.value })} />
              <input placeholder="Type (Apartment, Villa…)" className="input-line w-full" value={projectForm.type} onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value })} />
              <input placeholder="Configuration (comma-separated)" className="input-line w-full" value={projectForm.configuration} onChange={(e) => setProjectForm({ ...projectForm, configuration: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Price from" className="input-line w-full" value={projectForm.price_from} onChange={(e) => setProjectForm({ ...projectForm, price_from: e.target.value })} />
                <input placeholder="Currency" className="input-line w-full" value={projectForm.price_currency} onChange={(e) => setProjectForm({ ...projectForm, price_currency: e.target.value })} />
              </div>
              <input type="number" placeholder="Sqft from" className="input-line w-full" value={projectForm.sqft_from} onChange={(e) => setProjectForm({ ...projectForm, sqft_from: e.target.value })} />
              <input placeholder="Handover" className="input-line w-full" value={projectForm.handover} onChange={(e) => setProjectForm({ ...projectForm, handover: e.target.value })} />
              <input placeholder="Status" className="input-line w-full" value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={projectForm.hot} onChange={(e) => setProjectForm({ ...projectForm, hot: e.target.checked })} />
                Hot listing
              </label>
              <input placeholder="Tagline" className="input-line w-full" value={projectForm.tagline} onChange={(e) => setProjectForm({ ...projectForm, tagline: e.target.value })} />
              <input placeholder="Hero image URL" className="input-line w-full" value={projectForm.hero} onChange={(e) => setProjectForm({ ...projectForm, hero: e.target.value })} />
              <input placeholder="Gallery URLs (comma-separated)" className="input-line w-full" value={projectForm.gallery} onChange={(e) => setProjectForm({ ...projectForm, gallery: e.target.value })} />
              <input placeholder="Amenities (comma-separated)" className="input-line w-full" value={projectForm.amenities} onChange={(e) => setProjectForm({ ...projectForm, amenities: e.target.value })} />
              <textarea placeholder="Description" rows={4} className="w-full border border-[var(--line)] p-3 text-sm" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              <button type="submit" disabled={saving} className="btn-gold w-full">{saving ? "Saving…" : "Save"}</button>
            </form>
          </div>
        </div>
      )}

      {blogModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto border-l border-[var(--gold)]/30 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl">{editingBlogId ? "Edit Blog" : "Add Blog"}</h2>
              <button type="button" onClick={() => setBlogModal(false)}>
                <X size={20} />
              </button>
            </div>
            {actionError && <p className="text-red-600 text-sm mb-4">{actionError}</p>}
            <form onSubmit={saveBlog} className="space-y-4">
              <input
                required
                disabled={Boolean(editingBlogId)}
                placeholder="ID (slug) *"
                className="input-line w-full disabled:opacity-50"
                value={blogForm.id}
                onChange={(e) => setBlogForm({ ...blogForm, id: e.target.value })}
              />
              <input required placeholder="Title *" className="input-line w-full" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} />
              <input placeholder="Category" className="input-line w-full" value={blogForm.category} onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} />
              <input placeholder="Author" className="input-line w-full" value={blogForm.author} onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })} />
              <input type="date" placeholder="Date" className="input-line w-full" value={blogForm.date} onChange={(e) => setBlogForm({ ...blogForm, date: e.target.value })} />
              <input type="number" placeholder="Read minutes" className="input-line w-full" value={blogForm.read_minutes} onChange={(e) => setBlogForm({ ...blogForm, read_minutes: e.target.value })} />
              <input placeholder="Cover image URL" className="input-line w-full" value={blogForm.cover} onChange={(e) => setBlogForm({ ...blogForm, cover: e.target.value })} />
              <textarea placeholder="Excerpt" rows={2} className="w-full border border-[var(--line)] p-3 text-sm" value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} />
              <textarea placeholder="Content" rows={8} className="w-full border border-[var(--line)] p-3 text-sm" value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} />
              <button type="submit" disabled={saving} className="btn-gold w-full">{saving ? "Saving…" : "Save"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
