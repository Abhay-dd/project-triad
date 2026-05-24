import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MARKET_KPIS, QUARTERS, COMMUNITIES } from "../data";
import { ArrowLeftRight, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { API_URL as API } from "../config";
import { reallyApi } from "../services/api/realEstateApi";
import { sortAlphabetically } from "../utils/propertyFilters";

function normalizeProject(item) {
  return {
    ...item,
    name: item.name || "Project",
    market: item.status || "Primary",
    beds: Array.isArray(item.configuration) ? item.configuration : [],
    price_from: Number(item.price_from || 0),
    sqft_from: Number(item.sqft_from || 0),
    transactions: Array.isArray(item.transactions) ? item.transactions : [],
  };
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function getPeriodStart(period) {
  const now = new Date();
  if (period === "MTD") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "QTD") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), quarterStartMonth, 1);
  }
  return new Date(now.getFullYear(), 0, 1); // YTD
}

function formatDate(date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getMetrics(project, period) {
  if (!project) {
    return {
      medianPpsf: 0,
      medianPrice: 0,
      transactionsCount: 0,
      pctChange: 0,
    };
  }

  const start = getPeriodStart(period);
  const periodTransactions = project.transactions.filter((tx) => {
    const d = new Date(tx.date);
    return !Number.isNaN(d.getTime()) && d >= start;
  });

  const prices = periodTransactions.map((tx) => Number(tx.price || 0)).filter((n) => n > 0);
  const medianPrice = median(prices) || project.price_from;
  const medianPpsf = project.sqft_from > 0 ? medianPrice / project.sqft_from : 0;

  let pctChange = 0;
  if (prices.length >= 2) {
    const first = prices[0];
    const last = prices[prices.length - 1];
    if (first > 0) pctChange = ((last - first) / first) * 100;
  }

  return {
    medianPpsf,
    medianPrice,
    transactionsCount: periodTransactions.length,
    pctChange,
  };
}

export default function Analysis() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [bedsFilter, setBedsFilter] = useState("All");
  const [marketFilter, setMarketFilter] = useState("All");
  const [period, setPeriod] = useState("YTD");
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [compareQuery, setCompareQuery] = useState("");
  const [activeSide, setActiveSide] = useState("left");

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
        asset: "analysis",
        source_page: "/analysis"
      });
      localStorage.setItem("triad_lead_registered", "true");
      setLeadSubmitted(true);
    } catch (err) {
      setLeadError("Something went wrong. Please try again.");
    } finally {
      setSubmittingLead(false);
    }
  };

  const showGate = !user && !leadSubmitted;

  useEffect(() => {
    let isMounted = true;

    const applyItems = (rawItems) => {
      if (!isMounted) return;
      const items = rawItems.map(normalizeProject);
      setProjects(items);
      setLeftId(items[0]?.id || "");
      setRightId(items[1]?.id || "");
    };

    axios
      .get(`${API}/projects`, { params: { per_page: 100 } })
      .then((r) => applyItems(r.data.results || []))
      .catch(() => applyItems(reallyApi.getDummyProperties().properties));

    return () => {
      isMounted = false;
    };
  }, []);

  const bedOptions = useMemo(() => {
    return [
      "All",
      ...sortAlphabetically(
        [...new Set(projects.flatMap((p) => p.beds).filter(Boolean))],
      ),
    ];
  }, [projects]);

  const marketOptions = useMemo(() => {
    return ["All", ...sortAlphabetically([...new Set(projects.map((p) => p.market).filter(Boolean))])];
  }, [projects]);

  const candidates = useMemo(() => {
    return projects
      .filter((project) => bedsFilter === "All" || project.beds.includes(bedsFilter))
      .filter((project) => marketFilter === "All" || project.market === marketFilter)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [projects, bedsFilter, marketFilter]);

  const leftProject = candidates.find((p) => p.id === leftId) || null;
  const rightProject = candidates.find((p) => p.id === rightId) || null;

  const searchMatches = useMemo(() => {
    const q = compareQuery.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [candidates, compareQuery]);

  const assignProject = (projectId, side = activeSide) => {
    if (side === "left") setLeftId(projectId);
    else setRightId(projectId);
    setCompareQuery("");
  };

  const swapSides = () => {
    setLeftId(rightId);
    setRightId(leftId);
  };

  const maxVol = Math.max(...QUARTERS.map((q) => q.vol));
  const leftMetrics = getMetrics(leftProject, period);
  const rightMetrics = getMetrics(rightProject, period);
  const periodStart = getPeriodStart(period);
  const now = new Date();

  return (
    <>
      <section className="pt-40 pb-12 section-pad bg-white" data-testid="analysis-hero">
        <div className="container-x">
          <div className="overline text-[var(--gold-deep)]">Comparative Analysis</div>
          <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[0.95]">
            Sales performance summary comparison
          </h1>
        </div>
      </section>

      <section className="section-pad pt-0 bg-white" data-testid="analysis-compare">
        <div className="container-x max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Beds" value={bedsFilter} options={bedOptions} onChange={setBedsFilter} />
            <Select label="Market" value={marketFilter} options={marketOptions} onChange={setMarketFilter} />
            <Select label="Period" value={period} options={["YTD", "QTD", "MTD"]} onChange={setPeriod} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end mt-5">
            <Select
              label="Location"
              value={leftId}
              options={candidates.map((p) => ({ label: p.name, value: p.id }))}
              onChange={(value) => setLeftId(value)}
            />

            <button
              type="button"
              onClick={swapSides}
              className="h-10 w-10 rounded-full border border-[var(--line)] flex items-center justify-center hover:bg-[var(--bg-alt)]"
              aria-label="Swap compared properties"
            >
              <ArrowLeftRight size={16} />
            </button>

            <Select
              label="Compare with"
              value={rightId}
              options={candidates.map((p) => ({ label: p.name, value: p.id }))}
              onChange={(value) => setRightId(value)}
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSide("left")}
                className={`text-xs uppercase tracking-[0.2em] ${activeSide === "left" ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}
              >
                Assign Left
              </button>
              <button
                type="button"
                onClick={() => setActiveSide("right")}
                className={`text-xs uppercase tracking-[0.2em] ${activeSide === "right" ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}
              >
                Assign Right
              </button>
            </div>

            <div className="relative mt-2">
              <input
                className="input-line"
                placeholder="Type project name"
                value={compareQuery}
                onChange={(e) => setCompareQuery(e.target.value)}
                data-testid="compare-search"
              />
              {compareQuery.trim() && (
                <div className="absolute z-20 top-[calc(100%+6px)] left-0 right-0 bg-white border border-[var(--line)] max-h-72 overflow-auto">
                  {searchMatches.length === 0 && (
                    <div className="px-4 py-3 text-sm text-[var(--muted)]">No matches found.</div>
                  )}
                  {searchMatches.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => assignProject(project.id)}
                      className="w-full text-left px-4 py-3 border-b border-[var(--line)] hover:bg-[var(--bg-alt)] transition-colors"
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <div className="px-5 py-2 rounded-full bg-[#dbeafe] text-[#1e3a8a] text-sm font-medium">
              {formatDate(periodStart)} to {formatDate(now)}
            </div>
          </div>

          <div className="mt-10 relative overflow-hidden">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch transition-all duration-300 ${showGate ? "blur-[6px] pointer-events-none select-none" : ""}`}>
              <CompareMetricsCard project={leftProject} metrics={leftMetrics} side="Left" onClear={() => setLeftId("")} />
              <CompareMetricsCard project={rightProject} metrics={rightMetrics} side="Right" onClear={() => setRightId("")} />
            </div>

            {showGate && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[6px] flex flex-col items-center justify-center p-6 z-10">
                <div className="max-w-md w-full bg-white border border-[var(--line)] p-8 shadow-2xl text-center">
                  <h3 className="font-display text-2xl md:text-3xl text-[var(--ink)] font-bold">Unlock Comparative Analysis</h3>
                  <p className="text-xs text-[var(--muted)] mt-2 mb-6">
                    Enter your details to instantly view sales summaries, transaction history, and price trends.
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
                      {submittingLead ? "Unlocking..." : "Unlock Results"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--ink)] text-white relative" data-testid="analysis-kpis">
        <div className="grain absolute inset-0" />
        <div className="container-x relative">
          <div className="overline text-[var(--gold)]">Market Analysis · UAE 2026</div>
          <h2 className="font-display text-4xl md:text-6xl mt-3">Headline indicators.</h2>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
            {MARKET_KPIS.map((k) => (
              <div key={k.label} className="bg-[var(--ink)] p-8" data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="overline opacity-60">{k.label}</div>
                <div className="font-display text-4xl md:text-5xl mt-3 text-[var(--gold)] tabular">{k.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-5">
              <div className="overline text-[var(--gold)]">Quarterly Transaction Volume</div>
              <h3 className="font-display text-3xl md:text-4xl mt-3">A market in motion.</h3>
              <p className="text-sm opacity-70 mt-4">Volumes in AED billion across 2025 - the upward staircase the Dubai market has been climbing.</p>
            </div>
            <div className="lg:col-span-7">
              <div className="flex items-end gap-4 h-64">
                {QUARTERS.map((q) => (
                  <div key={q.q} className="flex-1 flex flex-col items-center gap-2" data-testid={`quarter-${q.q.replace(/\s+/g, "-")}`}>
                    <div className="font-display text-2xl text-[var(--gold)] tabular">{q.vol}B</div>
                    <div className="w-full bg-[var(--gold)]/30 transition-all" style={{ height: `${(q.vol / maxVol) * 100}%` }}>
                      <div className="w-full bg-[var(--gold)] h-full origin-bottom" style={{ transform: `scaleY(${q.vol / maxVol})` }} />
                    </div>
                    <div className="overline opacity-60">{q.q}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--bg-alt)]" data-testid="analysis-hotspots">
        <div className="container-x">
          <div className="overline text-[var(--gold-deep)]">Investment Hotspots</div>
          <h2 className="font-display text-4xl md:text-6xl mt-3">Where money is moving.</h2>

          <div className="mt-12 space-y-px bg-[var(--line)]">
            {COMMUNITIES.map((c, index) => (
              <div key={c.name} className="bg-white p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:bg-[var(--gold)]/5 transition-colors">
                <div className="md:col-span-1 font-display text-3xl text-[var(--gold-deep)] tabular">0{index + 1}</div>
                <div className="md:col-span-3 font-display text-2xl">{c.name}</div>
                <div className="md:col-span-2 overline text-[var(--muted)]">{c.emirate}</div>
                <div className="md:col-span-3"><span className="overline text-[var(--muted)]">Avg Yield · </span><span className="font-display text-xl text-[var(--gold-deep)]">{c.yield}</span></div>
                <div className="md:col-span-3 text-right"><span className="overline text-[var(--muted)]">Price / sqft · </span><span className="font-display text-xl">{c.ppsf}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block overline text-[var(--muted)] mb-2">{label}</label>
      <select className="input-line" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => {
          if (typeof option === "string") {
            return <option key={option} value={option}>{option}</option>;
          }
          return <option key={option.value} value={option.value}>{option.label}</option>;
        })}
      </select>
    </div>
  );
}

function CompareMetricsCard({ side, project, metrics, onClear }) {
  const changeColor = metrics.pctChange > 0 ? "text-green-600" : metrics.pctChange < 0 ? "text-red-600" : "text-[var(--muted)]";
  const changePrefix = metrics.pctChange > 0 ? "+" : "";

  return (
    <div className="border border-[var(--line)] bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="overline text-[var(--muted)]">{side}</div>
          <h3 className="font-display text-2xl mt-1">{project?.name || "Select Property"}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{project?.location || "-"}</p>
        </div>
        {project && (
          <button type="button" onClick={onClear} className="text-[var(--muted)] hover:text-[var(--ink)]">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="mt-6 space-y-6">
        <MetricBlock value={`AED ${Math.round(metrics.medianPpsf).toLocaleString()}`} label="Median price / sqft" change={`${changePrefix}${metrics.pctChange.toFixed(0)}%`} changeClass={changeColor} />
        <MetricBlock value={`AED ${Math.round(metrics.medianPrice).toLocaleString()}`} label="Median price" change={`${changePrefix}${(metrics.pctChange / 2).toFixed(0)}%`} changeClass={changeColor} />
        <MetricBlock value={metrics.transactionsCount.toLocaleString()} label="Transactions" change={`${changePrefix}${(metrics.pctChange * 1.5).toFixed(0)}%`} changeClass={changeColor} />
      </div>
    </div>
  );
}

function MetricBlock({ value, label, change, changeClass }) {
  return (
    <div className="border-t border-[var(--line)] pt-5 text-center">
      <div className="font-display text-4xl leading-none">{value}</div>
      <div className="text-sm text-[var(--muted)] mt-1">{label}</div>
      <div className={`font-semibold mt-2 ${changeClass}`}>{change}</div>
    </div>
  );
}
