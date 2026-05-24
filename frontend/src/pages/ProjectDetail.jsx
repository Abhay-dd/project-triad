import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Download, MapPin, Phone, Mail, ArrowLeft, ChevronRight } from "lucide-react";
import BrochureModal from "../components/BrochureModal";
import { API_URL as API } from "../config";

const SECTIONS = ["Details", "Gallery", "Floor Plan", "Amenities", "Location", "Payment Plan", "Comparison", "Transactions"];

function toProjectViewModel(item) {
  if (!item) return null;
  return {
    id: item.id,
    hero: item.hero || item.cover || "/placeholder.svg",
    name: item.name || "Project",
    developer: item.developer || "Developer",
    emirate: item.emirate || "UAE",
    tagline: item.tagline || item.description?.slice(0, 100) || "",
    price_from: Number(item.price_from || 0),
    sqft_from: Number(item.sqft_from || 0),
    handover: item.handover || "TBA",
    configuration: Array.isArray(item.configuration) ? item.configuration : [],
    description: item.description || "",
    location: item.location || "",
    gallery: Array.isArray(item.gallery) && item.gallery.length ? item.gallery : [item.hero].filter(Boolean),
    floor_plan: item.floor_plan || item.hero || "/placeholder.svg",
    amenities: Array.isArray(item.amenities) ? item.amenities : ["Swimming Pool", "Gym", "Security", "Parking"],
    map_image: item.map_image || "https://images.unsplash.com/photo-1524661135-423995f22d0b?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
    payment_plan:
      Array.isArray(item.payment_plan) && item.payment_plan.length
        ? item.payment_plan
        : [{ milestone: "Down Payment", percent: 20 }, { milestone: "Handover", percent: 80 }],
    type: item.type || "Apartment",
    transactions: Array.isArray(item.transactions) ? item.transactions : [],
  };
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [others, setOthers] = useState([]);
  const [tab, setTab] = useState("Details");
  const [modal, setModal] = useState(false);
  const [asset, setAsset] = useState("brochure");
  const [mapFullscreen, setMapFullscreen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      axios.get(`${API}/projects/${id}`),
      axios.get(`${API}/projects`, { params: { per_page: 100 } }),
    ]).then(([projectRes, othersRes]) => {
      if (!isMounted) return;

      if (projectRes.status === "fulfilled") {
        setP(toProjectViewModel(projectRes.value.data));
      } else {
        setP({ error: true });
      }

      if (othersRes.status === "fulfilled") {
        const results = othersRes.value.data?.results || [];
        setOthers(results.filter((x) => String(x.id) !== String(id)).map(toProjectViewModel));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!p) {
    return (
      <div className="pt-40 section-pad container-x">
        <h1 className="font-display text-4xl">Loading...</h1>
        <Link to="/projects" className="link-gold mt-6 inline-block">Back to projects</Link>
      </div>
    );
  }

  if (p.error) {
    return (
      <div className="pt-40 section-pad container-x">
        <h1 className="font-display text-4xl">Project Not Found</h1>
        <p className="mt-4 text-[var(--muted)]">Please check back later or contact support.</p>
        <Link to="/projects" className="link-gold mt-6 inline-block">Back to projects</Link>
      </div>
    );
  }

  const openModal = (a) => {
    setAsset(a);
    setModal(true);
  };

  return (
    <>
      <section className="relative h-[80vh] overflow-hidden" data-testid="pdetail-hero">
        <img src={p.hero} alt={p.name} className="w-full h-full object-cover kenburns" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="container-x px-5 lg:px-12 pb-20">
            <Link to="/projects" className="text-white/80 flex items-center gap-2 text-xs uppercase tracking-[0.22em]"><ArrowLeft size={14} />All Projects</Link>
            <div className="overline text-[var(--gold)] mt-8">{p.developer} · {p.emirate}</div>
            <h1 className="font-display text-white text-5xl md:text-7xl mt-4 leading-[0.95]">{p.name}</h1>
            <p className="text-white/85 mt-4 max-w-xl">{p.tagline}</p>
            <div className="flex gap-4 mt-8 flex-wrap">
              <button onClick={() => openModal("brochure")} className="btn-ghost-light" data-testid="pdetail-cta-brochure"><Download size={14} />Download Brochure</button>
              <button onClick={() => openModal("factsheet")} className="text-white text-xs uppercase tracking-[0.22em] border-b border-[var(--gold)] pb-2">Factsheet</button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] text-white" data-testid="pdetail-stats">
        <div className="container-x px-5 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
          <Stat label="Starting From" value={`AED ${(p.price_from / 1_000_000).toFixed(2)}M`} />
          <Stat label="Sqft From" value={p.sqft_from.toLocaleString()} />
          <Stat label="Handover" value={p.handover} />
          <Stat label="Configurations" value={p.configuration.join(" · ")} />
        </div>
      </section>

      <section className="sticky top-[68px] z-30 bg-white border-b border-[var(--line)]" data-testid="pdetail-tabs">
        <div className="container-x px-5 lg:px-12 flex gap-1 overflow-x-auto">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`whitespace-nowrap text-[11px] uppercase tracking-[0.22em] px-4 py-5 border-b-2 transition-colors ${tab === s ? "border-[var(--gold)] text-[var(--ink)]" : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`}
              data-testid={`tab-${s.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="section-pad bg-white" data-testid={`pdetail-section-${tab.toLowerCase().replace(/\s+/g, "-")}`}>
        <div className="container-x">
          {tab === "Details" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7">
                <div className="overline text-[var(--gold-deep)]">The Project</div>
                <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight">{p.name}</h2>
                <p className="text-lg mt-6 leading-relaxed text-[var(--ink-2)]">{p.description}</p>
                <p className="text-base mt-4 leading-relaxed text-[var(--ink-2)]">
                  Located in <strong>{p.location}</strong>, developed by <strong>{p.developer}</strong>, with a planned handover in <strong>{p.handover}</strong>. Available in {p.configuration.join(", ")}.
                </p>
              </div>
              <aside className="lg:col-span-5 bg-[var(--bg-alt)] p-8">
                <div className="overline text-[var(--gold-deep)]">Speak with a Consultant</div>
                <h3 className="font-display text-3xl mt-3">Personalized walkthrough.</h3>
                <p className="text-sm text-[var(--muted)] mt-3">Floor plans, payment options, and pre-launch pricing - direct from the desk handling this project.</p>
                <div className="mt-6 space-y-3">
                  <a href="tel:+971545193393" className="flex items-center gap-3 text-sm link-gold"><Phone size={14} className="text-[var(--gold-deep)]" />+971 54 519 3393</a>
                  <a href="mailto:hello@triadrealty.ae" className="flex items-center gap-3 text-sm link-gold"><Mail size={14} className="text-[var(--gold-deep)]" />hello@triadrealty.ae</a>
                </div>
                <button onClick={() => openModal("brochure")} className="btn-gold w-full justify-center mt-6">Request Brochure</button>
              </aside>
            </div>
          )}

          {tab === "Gallery" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {p.gallery.map((g, i) => (
                <div key={i} className={`img-zoom ${i === 0 ? "md:row-span-2 aspect-[4/5]" : "aspect-[4/3]"}`} data-testid={`gallery-img-${i}`}>
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {tab === "Floor Plan" && (
            <div>
              <div className="overline text-[var(--gold-deep)]">Floor Plans</div>
              <h2 className="font-display text-4xl mt-3">Spatial blueprints.</h2>
              <div className="mt-10 border border-[var(--line)] p-6 bg-[var(--bg-alt)]">
                <img src={p.floor_plan} alt="floor plan" className="w-full" />
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-[var(--muted)]">Detailed plans by configuration available on request.</div>
                  <button onClick={() => openModal("floor-plan")} className="btn-gold">Request Full Plans</button>
                </div>
              </div>
            </div>
          )}

          {tab === "Amenities" && (
            <div>
              <div className="overline text-[var(--gold-deep)]">Amenities</div>
              <h2 className="font-display text-4xl mt-3">Designed around the residents.</h2>
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)]">
                {p.amenities.map((a) => (
                  <div key={a} className="bg-white p-6 flex items-center gap-3" data-testid={`amenity-${a.toLowerCase().replace(/\s+/g, "-")}`}>
                    <ChevronRight size={14} className="text-[var(--gold-deep)]" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Location" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7">
                <div 
                  className="aspect-[4/3] img-zoom cursor-zoom-in relative group overflow-hidden shadow-md"
                  onClick={() => setMapFullscreen(true)}
                  data-testid="map-container"
                >
                  <img src={p.map_image} alt="Location Map" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-xs uppercase tracking-[0.2em] bg-black/60 px-4 py-2 border border-white/20">
                      View Fullscreen
                    </span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="overline text-[var(--gold-deep)]">Location</div>
                <h2 className="font-display text-4xl mt-3">{p.location}</h2>
                <p className="mt-4 text-[var(--ink-2)] leading-relaxed">Strategic positioning in one of {p.emirate}'s most sought-after corridors - minutes from key business districts, beaches, and lifestyle anchors.</p>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-3"><MapPin size={14} className="text-[var(--gold-deep)]" /><span>{p.location}, {p.emirate}, UAE</span></div>
                </div>
              </div>
            </div>
          )}

          {tab === "Payment Plan" && (
            <div>
              <div className="overline text-[var(--gold-deep)]">Payment Plan</div>
              <h2 className="font-display text-4xl mt-3">Structured for the buyer.</h2>
              <div className="mt-10 max-w-3xl">
                {p.payment_plan.map((pl, i) => (
                  <div key={i} className="border-t border-[var(--line)] py-5 flex justify-between items-center" data-testid={`payment-${i}`}>
                    <div>
                      <div className="overline text-[var(--muted)]">Stage {i + 1}</div>
                      <div className="font-display text-2xl mt-1">{pl.milestone}</div>
                    </div>
                    <div className="font-display text-4xl text-[var(--gold-deep)] tabular">{pl.percent}%</div>
                  </div>
                ))}
              </div>
              <button onClick={() => openModal("payment-plan")} className="btn-ghost mt-8">Request Detailed Plan</button>
            </div>
          )}

          {tab === "Comparison" && (
            <div>
              <div className="overline text-[var(--gold-deep)]">Comparison</div>
              <h2 className="font-display text-4xl mt-3">{p.name} versus the market.</h2>
              <div className="mt-10 overflow-x-auto border border-[var(--line)]">
                <table className="w-full text-sm tabular" data-testid="comparison-table">
                  <thead className="bg-[var(--bg-alt)]">
                    <tr>
                      <th className="text-left p-4 overline text-[var(--muted)]">Project</th>
                      <th className="text-left p-4 overline text-[var(--muted)]">Location</th>
                      <th className="text-left p-4 overline text-[var(--muted)]">Type</th>
                      <th className="text-left p-4 overline text-[var(--muted)]">From (AED)</th>
                      <th className="text-left p-4 overline text-[var(--muted)]">Sqft From</th>
                      <th className="text-left p-4 overline text-[var(--muted)]">Handover</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[var(--gold)]/10">
                      <td className="p-4 font-display text-lg">{p.name}</td>
                      <td className="p-4">{p.location}</td>
                      <td className="p-4">{p.type}</td>
                      <td className="p-4">{p.price_from.toLocaleString()}</td>
                      <td className="p-4">{p.sqft_from.toLocaleString()}</td>
                      <td className="p-4">{p.handover}</td>
                    </tr>
                    {others.slice(0, 4).map((o) => (
                      <tr key={o.id} className="border-t border-[var(--line)]">
                        <td className="p-4"><Link to={`/projects/${o.id}`} className="link-gold">{o.title}</Link></td>
                        <td className="p-4">{o.location}</td>
                        <td className="p-4">{o.type}</td>
                        <td className="p-4">{`AED ${Number(o.price_from || 0).toLocaleString()}`}</td>
                        <td className="p-4">{Number(o.sqft_from || 0).toLocaleString()}</td>
                        <td className="p-4">{o.handover || "TBA"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => openModal("comparison")} className="btn-ghost mt-8">Download Full Comparison</button>
            </div>
          )}

          {tab === "Transactions" && (
            <div>
              <div className="overline text-[var(--gold-deep)]">Transaction History</div>
              <h2 className="font-display text-4xl mt-3">Recent recorded sales.</h2>
              <div className="mt-10 max-w-3xl">
                {p.transactions.map((tx, i) => (
                  <div key={i} className="flex justify-between border-t border-[var(--line)] py-5">
                    <div>
                      <div className="overline text-[var(--muted)]">{tx.date}</div>
                      <div className="font-display text-xl mt-1">{tx.unit}</div>
                    </div>
                    <div className="font-display text-2xl tabular">AED {Number(tx.price || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => openModal("market-analysis")} className="btn-ghost mt-8">Get Market Report</button>
            </div>
          )}
        </div>
      </section>

      <BrochureModal open={modal} onClose={() => setModal(false)} projectId={p.id} asset={asset} />

      {/* Fullscreen Map Modal */}
      {mapFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setMapFullscreen(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-[var(--gold)] transition-colors p-2 bg-black/40 rounded-full"
            onClick={() => setMapFullscreen(false)}
            data-testid="close-map-fullscreen"
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={p.map_image} 
            alt="Project Location Map" 
            className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded border border-white/10"
            onClick={(e) => e.stopPropagation()} 
            data-testid="map-fullscreen-image"
          />
        </div>
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-[var(--ink)] p-6">
      <div className="overline opacity-60">{label}</div>
      <div className="font-display text-2xl md:text-3xl mt-2 text-[var(--gold)]">{value}</div>
    </div>
  );
}
