const ALPHA_SORT_OPTIONS = { sensitivity: "base" };

export const AREA_COORDINATES = {
  "dubai marina": { lat: 25.0788, lng: 55.1378 },
  "palm jumeirah": { lat: 25.1124, lng: 55.1390 },
  "downtown dubai": { lat: 25.1972, lng: 55.2744 },
  "aljada": { lat: 25.3188, lng: 55.4742 },
  "business bay": { lat: 25.1831, lng: 55.2662 },
  "dubai hills estate": { lat: 25.1054, lng: 55.2440 },
  "dubai hills": { lat: 25.1054, lng: 55.2440 },
  "dubai creek harbour": { lat: 25.1969, lng: 55.3392 },
  "jumeirah village circle": { lat: 25.0607, lng: 55.2076 },
  "jvc": { lat: 25.0607, lng: 55.2076 },
  "meydan": { lat: 25.1585, lng: 55.3090 },
  "difc": { lat: 25.2128, lng: 55.2801 },
  "jumeirah beach residence": { lat: 25.0768, lng: 55.1312 },
  "jbr": { lat: 25.0768, lng: 55.1312 },
  "arjan": { lat: 25.0560, lng: 55.2341 },
  "dubai sports city": { lat: 25.0401, lng: 55.2198 },
  "al furjan": { lat: 25.0347, lng: 55.1612 },
  "dubai south": { lat: 24.8722, lng: 55.1666 },
  "bluewaters island": { lat: 25.0792, lng: 55.1224 },
  "tilal al ghaf": { lat: 25.0163, lng: 55.2078 },
  "tilal al ghaf estate": { lat: 25.0163, lng: 55.2078 },
  "town square": { lat: 25.0210, lng: 55.2810 },
  "mohammed bin rashid city": { lat: 25.1480, lng: 55.3120 },
  "al safa": { lat: 25.1834, lng: 55.2447 },
  "emaar beachfront": { lat: 25.0922, lng: 55.1394 },
  "yas island": { lat: 24.4988, lng: 54.6072 },
  "saadiyat island": { lat: 24.5367, lng: 54.4333 },
  "reem island": { lat: 24.4965, lng: 54.4034 },
  "al reem island": { lat: 24.4965, lng: 54.4034 },
  "al raha beach": { lat: 24.4372, lng: 54.5768 },
  "al maryah island": { lat: 24.5028, lng: 54.3881 },
  "ajman corniche": { lat: 25.4140, lng: 55.4380 },
  "ajman garden city": { lat: 25.3990, lng: 55.4980 },
  "mina al arab": { lat: 25.7001, lng: 55.8450 },
  "hayat island": { lat: 25.6888, lng: 55.8288 },
  "al marjan island": { lat: 25.6692, lng: 55.7656 },
  "fujairah city": { lat: 25.1288, lng: 56.3265 },
  "umm al quwain": { lat: 25.5647, lng: 55.5534 },
  "damac lagoons": { lat: 25.0215, lng: 55.2435 },
  "jumeirah lake towers": { lat: 25.0777, lng: 55.1500 },
  "jlt": { lat: 25.0777, lng: 55.1500 },
  "emaar south": { lat: 24.8780, lng: 55.1480 },
  "dubai harbour": { lat: 25.0886, lng: 55.1352 },
  "arabian ranches iii": { lat: 25.0780, lng: 55.2950 },
  "arabian ranches": { lat: 25.0780, lng: 55.2950 },
  "ghaf woods": { lat: 25.0500, lng: 55.2850 },
  "al zorah": { lat: 25.4333, lng: 55.4833 },
  "dubai islands": { lat: 25.3090, lng: 55.2750 },
  "expo city dubai": { lat: 24.9634, lng: 55.1506 },
  "mina rashid": { lat: 25.2711, lng: 55.2719 },
  "nad al sheba": { lat: 25.1386, lng: 55.3488 },
  "nad al sheba gardens": { lat: 25.1386, lng: 55.3488 },
  "madinat jumeirah": { lat: 25.1333, lng: 55.1870 },
  "madinat jumeirah living": { lat: 25.1333, lng: 55.1870 },
  "wadi al safa": { lat: 25.1012, lng: 55.3780 },
  "dubailand": { lat: 25.0820, lng: 55.3340 },
  "dubailan": { lat: 25.0820, lng: 55.3340 },
  "al jaddaf": { lat: 25.2111, lng: 55.3262 },
  "khalifa city": { lat: 24.4250, lng: 54.5750 },
  "city walk": { lat: 25.2078, lng: 55.2625 },
  "the valley": { lat: 24.9920, lng: 55.4320 },
  "dubai investment park": { lat: 24.9810, lng: 55.1760 },
  "la mer": { lat: 25.2272, lng: 55.2530 }
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function sortAlphabetically(values) {
  return [...values].sort((a, b) => a.localeCompare(b, undefined, ALPHA_SORT_OPTIONS));
}

export function normalizeProperties(rawItems = []) {
  return rawItems.map((item, index) => {
    const configList = Array.isArray(item.configuration)
      ? item.configuration
      : typeof item.bedrooms === "string"
        ? item.bedrooms.split(",")
        : [];

    const rawPrice = Number(item.rawPrice || item.price_from || 0);
    const coords = item.coordinates || {};
    const hasValidCoords = coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng);
    
    let resolvedCoords;
    if (hasValidCoords) {
      resolvedCoords = coords;
    } else {
      const locationKey = String(item.location || item.city || "").trim().toLowerCase();
      const baseCoords = AREA_COORDINATES[locationKey] || { lat: 25.2048, lng: 55.2708 };
      
      // Jitter using deterministic hash of project id/title to prevent complete overlap
      const h = hashString(item.id || item.title || item.name || String(index));
      const offsetLat = ((h % 100) - 50) * 0.0001;
      const offsetLng = (((h >> 8) % 100) - 50) * 0.0001;
      
      resolvedCoords = {
        lat: baseCoords.lat + offsetLat,
        lng: baseCoords.lng + offsetLng
      };
    }

    return {
      ...item,
      name: item.name || item.title || "",
      title: item.title || item.name || "",
      location: item.location || item.city || "",
      market: item.market || item.status || "Primary",
      beds: configList.length ? configList.join(", ") : String(item.beds || item.bedrooms || "N/A"),
      rawPrice,
      startingPrice: item.startingPrice || `AED ${rawPrice.toLocaleString()}`,
      completionDate: item.completionDate || item.handover || "TBA",
      isFeatured: Boolean(item.isFeatured || item.hot),
      image: item.image || item.hero || item.cover || "/placeholder.svg",
      coordinates: resolvedCoords,
    };
  });
}

export function buildFilterOptions(items = []) {
  const normalized = normalizeProperties(items);
  const locations = sortAlphabetically(
    [...new Set(normalized.map((item) => item.location).filter(Boolean))],
  );
  const markets = sortAlphabetically(
    [...new Set(normalized.map((item) => item.market).filter(Boolean))],
  );
  const beds = sortAlphabetically(
    [
      ...new Set(
        normalized
          .flatMap((item) => item.beds.split(","))
          .map((b) => b.trim())
          .filter(Boolean),
      ),
    ],
  );
  const maxPrice = Math.max(2_000_000, ...normalized.map((item) => item.rawPrice || 0));

  return {
    locations: ["All", ...locations],
    markets: ["All", ...markets],
    beds: ["All", ...beds],
    maxPrice,
  };
}

export function filterProperties(items = [], filters) {
  const normalized = normalizeProperties(items);
  const query = (filters.query || "").trim().toLowerCase();

  return normalized.filter((item) => {
    const matchesQuery =
      !query ||
      [item.name, item.title, item.location, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);

    const matchesLocation =
      filters.location === "All" || item.location === filters.location;
    const matchesMarket = filters.market === "All" || item.market === filters.market;
    const matchesBeds =
      filters.beds === "All" ||
      item.beds
        .split(",")
        .map((b) => b.trim().toUpperCase())
        .includes(String(filters.beds).trim().toUpperCase());
    const matchesPrice = item.rawPrice <= (filters.priceMax || Number.MAX_SAFE_INTEGER);

    return matchesQuery && matchesLocation && matchesMarket && matchesBeds && matchesPrice;
  });
}
