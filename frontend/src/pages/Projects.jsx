import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Search, ArrowUpRight, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import ProjectMap from "../components/ProjectMap";
import { API_URL as API } from "../config";
import { reallyApi } from "../services/api/realEstateApi";
import { buildFilterOptions, filterProperties, normalizeProperties } from "../utils/propertyFilters";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 6;

export default function Projects() {
  const { user } = useAuth();
  const [all, setAll] = useState([]);

  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
  const [leadSubmitted, setLeadSubmitted] = useState(() => localStorage.getItem("triad_lead_registered") === "true");
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadError, setLeadError] = useState("");

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLead(true);
    setLeadError("");
    try {
      await axios.post(`${API}/leads`, {
        ...leadForm,
        asset: "premium-listings",
        source_page: "/projects"
      });
      localStorage.setItem("triad_lead_registered", "true");
      setLeadSubmitted(true);
    } catch (err) {
      setLeadError("Something went wrong. Please try again.");
    } finally {
      setSubmittingLead(false);
    }
  };
  const [filters, setFilters] = useState({
    query: "",
    location: "All",
    market: "All",
    beds: "All",
    priceMax: 20_000_000,
  });
  const [page, setPage] = useState(1);
  const [hotPage, setHotPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const showGate = !user && !leadSubmitted && page > 5;
  const [filterOptions, setFilterOptions] = useState({
    locations: ["All"],
    markets: ["All"],
    beds: ["All"],
    maxPrice: 20_000_000,
  });

  useEffect(() => {
    let isMounted = true;

    const applyItems = (rawItems) => {
      const normalized = normalizeProperties(rawItems);
      const options = buildFilterOptions(normalized);
      setAll(normalized);
      setFilterOptions(options);
      setFilters((prev) => ({ ...prev, priceMax: options.maxPrice }));
    };

    axios
      .get(`${API}/projects`, { params: { per_page: 100 } })
      .then((response) => {
        if (!isMounted) return;
        applyItems(response.data?.results || []);
      })
      .catch(() => {
        if (!isMounted) return;
        applyItems(reallyApi.getDummyProperties().properties);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => filterProperties(all, filters), [all, filters]);

  useEffect(() => {
    setPage(1);
    setHotPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hot = all.filter((p) => p.isFeatured);

  const HOT_PAGE_SIZE = 6;
  const totalHotPages = Math.max(1, Math.ceil(hot.length / HOT_PAGE_SIZE));
  const hotPageItems = hot.slice((hotPage - 1) * HOT_PAGE_SIZE, hotPage * HOT_PAGE_SIZE);

  return (
    <>
      <section className="pt-28 pb-0 bg-white" data-testid="projects-hero">
        <div className="container-x px-5 lg:px-12">
          <div className="flex flex-wrap items-end gap-4 mb-8">
            <div>
              <div className="overline text-[var(--gold-deep)]">Projects</div>
              <h1 className="font-display text-4xl md:text-6xl leading-[0.95] mt-3">
                Every address worth <em className="text-[var(--gold-deep)]">considering.</em>
              </h1>
            </div>
          </div>

          <div className="bg-[var(--bg-alt)] p-5 md:p-8 border border-[var(--line)]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              <div className="md:col-span-4">
                <label className="overline text-[var(--muted)]">Search</label>
                <div className="flex items-center gap-3 border-b border-[var(--line)] mt-2">
                  <Search size={16} className="text-[var(--muted)]" />
                  <input
                    className="input-line !border-0"
                    placeholder="Name, location, keyword..."
                    value={filters.query}
                    onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                    data-testid="filter-search"
                  />
                </div>
              </div>
              <Select
                label="Location / Area"
                value={filters.location}
                options={filterOptions.locations}
                onChange={(value) => setFilters((prev) => ({ ...prev, location: value }))}
                testId="filter-location"
              />
              <Select
                label="Market"
                value={filters.market}
                options={filterOptions.markets}
                onChange={(value) => setFilters((prev) => ({ ...prev, market: value }))}
                testId="filter-market"
              />
              <Select
                label="Beds"
                value={filters.beds}
                options={filterOptions.beds}
                onChange={(value) => setFilters((prev) => ({ ...prev, beds: value }))}
                testId="filter-beds"
              />
              <div className="md:col-span-2">
                <label className="overline text-[var(--muted)]">
                  Max Price · AED {(filters.priceMax / 1_000_000).toFixed(1)}M
                </label>
                <input
                  type="range"
                  min={100000}
                  max={Math.max(filterOptions.maxPrice, 2_000_000)}
                  step={100000}
                  value={filters.priceMax}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, priceMax: Number(e.target.value) }))
                  }
                  className="w-full mt-3 accent-[var(--gold-deep)]"
                  data-testid="filter-price"
                />
              </div>
            </div>
          </div>

          <div className="relative mt-8 overflow-hidden">
            <div className={`transition-all duration-300 ${!user && !leadSubmitted ? "blur-[6px] pointer-events-none select-none" : ""}`}>
              <ProjectMap properties={filtered} />
            </div>
            
            {!user && !leadSubmitted && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] flex flex-col items-center justify-center p-6 z-10">
                <div className="max-w-md w-full bg-white border border-[var(--line)] p-8 shadow-2xl text-center">
                  <h3 className="font-display text-2xl md:text-3xl text-[var(--ink)] font-bold">Unlock Interactive Map</h3>
                  <p className="text-xs text-[var(--muted)] mt-2 mb-6">
                    Enter your details to instantly view project locations, area summaries, and explore the interactive map.
                  </p>
                  <form onSubmit={handleLeadSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Full Name</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="John Doe" 
                        value={leadForm.name} 
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} 
                        className="input-line !py-2 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Email Address</label>
                      <input 
                        required 
                        type="email" 
                        placeholder="john@example.com" 
                        value={leadForm.email} 
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} 
                        className="input-line !py-2 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Phone Number</label>
                      <input 
                        required 
                        type="tel" 
                        placeholder="+971 50 000 0000" 
                        value={leadForm.phone} 
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} 
                        className="input-line !py-2 text-sm" 
                      />
                    </div>
                    {leadError && <p className="text-red-500 text-xs mt-1">{leadError}</p>}
                    <button 
                      type="submit" 
                      disabled={submittingLead}
                      className="btn-gold w-full justify-center mt-6 text-xs uppercase tracking-widest font-semibold"
                    >
                      {submittingLead ? "Unlocking..." : "Unlock Map"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {hot.length > 0 && (
        <section className="bg-[var(--ink)] text-white py-12 mt-10 relative overflow-hidden" data-testid="projects-hot">
          <div className="grain absolute inset-0 opacity-40 pointer-events-none" />
          <div className="container-x px-5 lg:px-12 relative">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Flame size={16} className="text-[var(--gold)]" />
                <span className="overline text-[var(--gold)]">Hot Launches · Limited Inventory</span>
              </div>
              <div className="overline text-white/50 text-[11px]">
                Showing {hotPageItems.length} of {hot.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotPageItems.map((p) => (
                <Link
                  to={`/projects/${p.id}`}
                  key={p.id}
                  className="group block border border-white/15 hover:border-[var(--gold)] transition-colors p-6 bg-white/[0.02]"
                  data-testid={`hot-${p.id}`}
                >
                  <div className="aspect-video img-zoom mb-5">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="overline opacity-60">{p.location}</div>
                  <h3 className="font-display text-2xl mt-2">{p.title}</h3>
                  <div className="mt-4 flex justify-between items-end">
                    <div className="font-display text-lg text-[var(--gold)]">{p.startingPrice}</div>
                    <ArrowUpRight
                      size={16}
                      className="opacity-50 group-hover:opacity-100 group-hover:text-[var(--gold)]"
                    />
                  </div>
                </Link>
              ))}
            </div>

            {totalHotPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setHotPage((p) => Math.max(1, p - 1))}
                  disabled={hotPage === 1}
                  className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-[var(--gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 text-white"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalHotPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setHotPage(n)}
                    className={`w-10 h-10 flex items-center justify-center border text-sm font-medium transition-all duration-300 ${
                      n === hotPage
                        ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--ink)] font-semibold"
                        : "border-white/20 hover:border-[var(--gold)] text-white"
                    }`}
                    aria-label={`Page ${n}`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setHotPage((p) => Math.min(totalHotPages, p + 1))}
                  disabled={hotPage === totalHotPages}
                  className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-[var(--gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 text-white"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-12 bg-white" data-testid="projects-filters">
        <div className="container-x px-5 lg:px-12">
          <div className="flex items-center justify-between mb-8">
            <div className="font-display text-2xl">
              <span className="tabular">{filtered.length}</span> Projects
            </div>
            <div className="overline text-[var(--muted)]">
              Page {page} of {totalPages}
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-16 text-center border border-[var(--line)]">Loading projects...</div>
          ) : showGate ? (
            <div className="bg-white p-8 md:p-16 border border-[var(--line)] flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="max-w-md w-full">
                <h3 className="font-display text-2xl md:text-3xl text-[var(--ink)] font-bold">Unlock Premium Listings</h3>
                <p className="text-xs text-[var(--muted)] mt-2 mb-6">
                  You have reached the limit of free project listings. Enter your details to instantly view page 6 and beyond of our exclusive portfolio.
                </p>
                <form onSubmit={handleLeadSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Full Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="John Doe" 
                      value={leadForm.name} 
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} 
                      className="input-line !py-2 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Email Address</label>
                    <input 
                      required 
                      type="email" 
                      placeholder="john@example.com" 
                      value={leadForm.email} 
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} 
                      className="input-line !py-2 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Phone Number</label>
                    <input 
                      required 
                      type="tel" 
                      placeholder="+971 50 000 0000" 
                      value={leadForm.phone} 
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} 
                      className="input-line !py-2 text-sm" 
                    />
                  </div>
                  {leadError && <p className="text-red-500 text-xs mt-1">{leadError}</p>}
                  <button 
                    type="submit" 
                    disabled={submittingLead}
                    className="btn-gold w-full justify-center mt-6 text-xs uppercase tracking-widest font-semibold"
                  >
                    {submittingLead ? "Unlocking..." : "Unlock Premium Listings"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)]">
              {pageItems.map((p) => (
                <Link
                  to={`/projects/${p.id}`}
                  key={p.id}
                  className="bg-white block group"
                  data-testid={`project-card-${p.id}`}
                >
                  <div className="aspect-[4/3] img-zoom relative">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    {p.isFeatured && (
                      <div className="absolute top-4 left-4 bg-[var(--ink)] text-[var(--gold)] overline px-3 py-1">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="overline text-[var(--muted)]">{p.developer}</div>
                    <h3 className="font-display text-2xl mt-2">{p.title}</h3>
                    <div className="text-sm text-[var(--muted)] mt-1">{p.location}</div>
                    <div className="flex justify-between items-end mt-6 pt-4 border-t border-[var(--line)]">
                      <div>
                        <div className="overline opacity-60">From</div>
                        <div className="font-display text-xl text-[var(--gold-deep)] mt-1">
                          {p.startingPrice}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="overline opacity-60">Handover</div>
                        <div className="font-display text-xl mt-1">{p.completionDate}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="bg-white p-16 text-center col-span-3">
                  <p className="font-display text-2xl">No projects match your filters.</p>
                  <p className="text-sm text-[var(--muted)] mt-2">
                    Try adjusting your search or contact our consultants for off-market listings.
                  </p>
                </div>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center border border-[var(--line)] hover:border-[var(--gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`w-10 h-10 flex items-center justify-center border text-sm font-medium transition-colors ${
                    n === page
                      ? "border-[var(--gold)] bg-[var(--ink)] text-white"
                      : "border-[var(--line)] hover:border-[var(--gold)]"
                  }`}
                  aria-label={`Page ${n}`}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center border border-[var(--line)] hover:border-[var(--gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Select({ label, value, options, onChange, testId }) {
  return (
    <div className="md:col-span-2">
      <label className="overline text-[var(--muted)]">{label}</label>
      <select
        className="input-line mt-2 cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
