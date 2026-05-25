import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { AREA_COORDINATES } from "../utils/propertyFilters";

const DEFAULT_CENTER = [25.2048, 55.2708];

const createCustomMarker = (areaName, count) => {
  return L.divIcon({
    html: `
      <div class="custom-area-group-marker flex flex-col items-center">
        <div class="custom-area-marker-badge">${count}</div>
        <div class="custom-area-marker-label">${areaName}</div>
      </div>
    `,
    className: "custom-area-marker",
    iconSize: [120, 50],
    iconAnchor: [60, 25],
    popupAnchor: [0, -25],
  });
};

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }
    map.fitBounds(points, { padding: [32, 32] });
  }, [map, points]);

  return null;
}

function InvalidateMapSize({ trigger }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [map, trigger]);
  return null;
}

function ProjectPopupContent({ properties }) {
  const [index, setIndex] = useState(0);

  if (!properties || properties.length === 0) return null;
  const property = properties[index];

  return (
    <div className="overflow-hidden bg-white font-sans text-sm w-[260px] sm:w-[300px]">
      {properties.length > 1 && (
        <div className="bg-[var(--bg-alt)] border-b border-[var(--line)] px-4 py-2 flex justify-between items-center text-xs">
          <span className="font-semibold text-[var(--muted)]">
            Project {index + 1} of {properties.length}
          </span>
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => (i - 1 + properties.length) % properties.length);
              }}
              className="font-bold hover:text-[var(--gold)] transition-colors uppercase tracking-wider text-[10px]"
            >
              &larr; Prev
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => (i + 1) % properties.length);
              }}
              className="font-bold hover:text-[var(--gold)] transition-colors uppercase tracking-wider text-[10px]"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      {property.image && (
        <div className="aspect-[16/10] w-full overflow-hidden relative">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          {property.isFeatured && (
            <span className="absolute top-2 left-2 bg-[var(--ink)] text-[var(--gold)] text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold">
              Featured
            </span>
          )}
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
          {property.developer || "Developer"}
        </div>
        <h4 className="font-display text-base font-bold text-[var(--ink)] leading-tight line-clamp-1">
          {property.title}
        </h4>
        <div className="text-xs text-[var(--muted)]">
          {property.location}
        </div>
        <div className="pt-2 border-t border-[var(--line)] flex justify-between items-center">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[var(--muted)]">Starting Price</div>
            <div className="font-display text-sm font-semibold text-[var(--gold-deep)]">
              {property.startingPrice}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-[var(--muted)]">Handover</div>
            <div className="font-semibold text-xs text-[var(--ink)]">
              {property.completionDate}
            </div>
          </div>
        </div>
        <div className="pt-1">
          <Link
            to={`/projects/${property.id}`}
            className="block text-center bg-[var(--ink)] hover:bg-[var(--gold)] hover:text-[var(--ink)] text-white font-semibold text-xs py-2 px-4 transition-colors uppercase tracking-wider"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProjectMap({ properties }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);

  const grouped = useMemo(() => {
    const groups = {};
    properties.forEach((p) => {
      const loc = p.location || "UAE";
      if (!groups[loc]) {
        const locKey = loc.trim().toLowerCase();
        const baseCoords = AREA_COORDINATES[locKey];
        let coords = baseCoords;

        if (!coords && p.coordinates && Number.isFinite(p.coordinates.lat) && Number.isFinite(p.coordinates.lng)) {
          coords = p.coordinates;
        }

        if (!coords) {
          coords = { lat: 25.2048, lng: 55.2708 };
        }

        groups[loc] = {
          location: loc,
          coordinates: coords,
          properties: [],
        };
      }
      groups[loc].properties.push(p);
    });
    return Object.values(groups);
  }, [properties]);

  const points = useMemo(
    () =>
      grouped
        .map((g) => g.coordinates)
        .filter((coord) => coord && Number.isFinite(coord.lat) && Number.isFinite(coord.lng))
        .map((coord) => [coord.lat, coord.lng]),
    [grouped],
  );

  return (
    <section
      className={`${
        isFullscreen
          ? "fixed inset-0 z-[9999] bg-white w-screen h-screen flex flex-col m-0 border-0"
          : "mt-6 sm:mt-8 border border-[var(--line)] bg-white relative transition-all duration-300"
      }`}
      data-testid="projects-map"
    >
      {/* Map header */}
      <div className="p-4 sm:p-5 md:p-6 border-b border-[var(--line)] flex flex-wrap justify-between items-center gap-3 bg-white">
        <div>
          <div className="overline text-[var(--gold-deep)]">Project Map</div>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            {properties.length} location{properties.length !== 1 ? "s" : ""} match the active filters.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSatellite(!isSatellite)}
            className="btn-ghost !px-3 !py-2 text-[10px] uppercase tracking-wider flex items-center gap-1.5 border border-[var(--line)] bg-white hover:bg-[var(--bg-alt)] transition-all duration-300 font-semibold"
          >
            {isSatellite ? "🗺️ Road" : "🛰️ Satellite"}
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-gold !px-3 !py-2 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-semibold"
          >
            {isFullscreen ? "✕ Close" : "⛶ Full"}
          </button>
        </div>
      </div>

      {/* Map container — responsive height */}
      <div className={`w-full ${isFullscreen ? "flex-1" : "h-[260px] sm:h-[360px] md:h-[420px]"}`}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={10}
          scrollWheelZoom
          className="h-full w-full"
          attributionControl={false}
        >
          <TileLayer
            key={isSatellite ? "satellite" : "roadmap"}
            url={
              isSatellite
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            }
            attribution={
              isSatellite
                ? "Tiles &copy; Esri &mdash; Source: Esri"
                : "&copy; OpenStreetMap contributors"
            }
          />
          <FitBounds points={points} />
          <InvalidateMapSize trigger={isFullscreen} />
          {grouped.map((group) => {
            const coord = group.coordinates;
            if (!coord || !Number.isFinite(coord.lat) || !Number.isFinite(coord.lng)) return null;
            return (
              <Marker
                key={group.location}
                position={[coord.lat, coord.lng]}
                icon={createCustomMarker(group.location, group.properties.length)}
              >
                <Popup maxWidth={320} minWidth={240} className="custom-project-popup">
                  <ProjectPopupContent properties={group.properties} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}
