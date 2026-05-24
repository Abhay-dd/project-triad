import { DUMMY_PROPERTIES, getDummyPropertyDetail as generateDummyPropertyDetail } from './dummyData';
import { getBackendUrl } from '../../config';

const BACKEND = getBackendUrl();
const PROXY = `${BACKEND}/api/external`;

const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 };

class ReallyApi {
  async fetchPropertiesPage(page, perPage) {
    const url = new URL(`${PROXY}/properties`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    url.searchParams.append('has_escrow', 'true');
    url.searchParams.append('price_type', 'area');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });

    if (!response.ok) return null;
    return response.json();
  }

  toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  parseCoordinates(value) {
    if (!value) return null;

    if (Array.isArray(value) && value.length >= 2) {
      const lat = this.toNumber(value[0]);
      const lng = this.toNumber(value[1]);
      return lat != null && lng != null ? { lat, lng } : null;
    }

    if (typeof value === 'string') {
      const parts = value.split(',').map((part) => part.trim());
      if (parts.length >= 2) {
        const lat = this.toNumber(parts[0]);
        const lng = this.toNumber(parts[1]);
        return lat != null && lng != null ? { lat, lng } : null;
      }
      return null;
    }

    if (typeof value === 'object') {
      const lat = this.toNumber(value.lat ?? value.latitude);
      const lng = this.toNumber(value.lng ?? value.longitude ?? value.lon);
      return lat != null && lng != null ? { lat, lng } : null;
    }

    return null;
  }

  parseImageUrl(imageUrlString) {
    try {
      if (!imageUrlString || typeof imageUrlString !== 'string') {
        return '/placeholder.svg';
      }
      if (imageUrlString.startsWith('{') || imageUrlString.startsWith('[')) {
        const imageData = JSON.parse(imageUrlString);
        return imageData.url || '/placeholder.svg';
      }
      return imageUrlString;
    } catch {
      return '/placeholder.svg';
    }
  }

  formatCompletionDate(completionDateTime) {
    try {
      if (!completionDateTime) return 'TBA';
      const date = new Date(completionDateTime);
      if (isNaN(date.getTime())) return 'TBA';
      return date.getFullYear().toString();
    } catch {
      return 'TBA';
    }
  }

  formatPrice(price) {
    if (!price || price === 0) return 'Contact for price';
    return `AED ${price.toLocaleString()}`;
  }

  transformProperty(property) {
    const coordinates =
      this.parseCoordinates(property.coordinates) ||
      this.parseCoordinates(property.location_coordinates) ||
      this.parseCoordinates(property.lat_lng) ||
      this.parseCoordinates({ lat: property.latitude, lng: property.longitude });

    const bedrooms =
      property.unit_bedrooms ||
      property.bedrooms ||
      (property.min_bedrooms && property.max_bedrooms
        ? `${property.min_bedrooms}-${property.max_bedrooms}`
        : property.min_bedrooms || '1-4');

    return {
      id: property.id,
      title: property.name || 'Property',
      name: property.name || 'Property',
      developer: property.developer || '-',
      location: property.area || property.location || '',
      city: property.city || property.area || '',
      type: property.property_type || 'Apartment',
      market: property.sale_status || property.market || 'Primary',
      beds: String(bedrooms),
      startingPrice: this.formatPrice(property.min_price_aed),
      rawPrice: property.min_price_aed || 0,
      completionDate: this.formatCompletionDate(property.completion_datetime),
      paymentPlan: 'Flexible payment plans available',
      bedrooms: String(bedrooms),
      bathrooms: property.bathrooms ? String(property.bathrooms) : '1-3',
      area: property.min_price_per_area_unit
        ? `Starting from ${Math.round(property.min_price_per_area_unit)} ${property.area_unit || 'sqft'}`
        : '-',
      roi: '8-12%',
      image: this.parseImageUrl(property.cover_image_url),
      features: ['Premium Location', 'Modern Design', 'High Quality Finishes'],
      amenities: ['Swimming Pool', 'Gym', 'Security', 'Parking'],
      description: `Premium ${property.name} by ${property.developer} in ${property.area}. ${property.has_escrow ? 'Escrow protected.' : ''} ${property.post_handover ? 'Post handover payment plan available.' : ''}`,
      downPayment: '10% - 20%',
      isFeatured: property.is_partner_project || false,
      coordinates,
    };
  }

  mergePropertyMarkers(properties, markers) {
    if (!Array.isArray(markers) || markers.length === 0) return properties;

    const markerMap = new Map();
    markers.forEach((marker) => {
      const coords =
        this.parseCoordinates(marker.coordinates) ||
        this.parseCoordinates(marker.location) ||
        this.parseCoordinates({
          lat: marker.lat ?? marker.latitude,
          lng: marker.lng ?? marker.longitude ?? marker.lon,
        });
      if (!coords) return;

      const keys = [marker.property_id, marker.propertyId, marker.id, marker.listing_id]
        .filter((key) => key != null)
        .map((key) => String(key));

      keys.forEach((key) => markerMap.set(key, coords));
    });

    return properties.map((property, index) => {
      if (property.coordinates) return property;
      const fromMarker = markerMap.get(String(property.id));
      if (fromMarker) return { ...property, coordinates: fromMarker };

      // Deterministic local fallback to keep map usable even when marker feed is sparse.
      const lat = DUBAI_CENTER.lat + ((index % 7) - 3) * 0.015;
      const lng = DUBAI_CENTER.lng + ((index % 5) - 2) * 0.02;
      return { ...property, coordinates: { lat, lng } };
    });
  }

  async getProperties(options = {}) {
    try {
      const { page = 1, perPage = 50 } = options;
      const firstPage = await this.fetchPropertiesPage(page, perPage);
      if (!firstPage) {
        return this.getDummyProperties();
      }

      const allItems = [...(firstPage.items || [])];
      let nextPage = page + 1;
      const totalPages = Number(firstPage.pagination?.pages || 1);

      while (allItems.length < perPage && nextPage <= totalPages) {
        const extraPage = await this.fetchPropertiesPage(nextPage, perPage);
        if (!extraPage || !Array.isArray(extraPage.items) || extraPage.items.length === 0) break;
        allItems.push(...extraPage.items);
        nextPage += 1;
      }

      const transformedProperties = allItems
        .slice(0, perPage)
        .map((property) => this.transformProperty(property));
      const markers = await this.getPropertyMarkers();

      return {
        properties: this.mergePropertyMarkers(transformedProperties, markers),
        pagination: firstPage.pagination || {
          has_next: false,
          has_prev: false,
          page: 1,
          pages: 1,
          per_page: 50,
          total: 0,
        },
        source: 'external',
      };
    } catch {
      return this.getDummyProperties();
    }
  }

  async getPropertyById(id) {
    try {
      const response = await fetch(`${PROXY}/properties/${id}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });

      if (!response.ok) {
        return this.getDummyPropertyDetail(id);
      }

      return await response.json();
    } catch {
      return this.getDummyPropertyDetail(id);
    }
  }

  getDummyProperties() {
    const withCoordinates = DUMMY_PROPERTIES.map((property, index) => ({
      ...property,
      name: property.title,
      market: property.saleStatus || 'Primary',
      beds: String(property.bedrooms || '1-4'),
      coordinates: {
        lat: DUBAI_CENTER.lat + ((index % 7) - 3) * 0.015,
        lng: DUBAI_CENTER.lng + ((index % 5) - 2) * 0.02,
      },
    }));

    return {
      properties: withCoordinates,
      pagination: {
        has_next: false,
        has_prev: false,
        page: 1,
        pages: 1,
        per_page: 50,
        total: withCoordinates.length,
      },
      source: 'fallback',
    };
  }

  getDummyPropertyDetail(id) {
    return generateDummyPropertyDetail(id, DUMMY_PROPERTIES);
  }

  async getPropertyMarkers() {
    try {
      const response = await fetch(`${PROXY}/property-markers`, {
        method: 'GET',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) return [];
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.markers)) return data.markers;
      if (Array.isArray(data.items)) return data.items;
      return [];
    } catch {
      return [];
    }
  }

  async getFilters() {
    try {
      const headers = { accept: 'application/json' };
      const [areasRes, bedroomsRes, statusesRes] = await Promise.all([
        fetch(`${PROXY}/areas`, { method: 'GET', headers }),
        fetch(`${PROXY}/unit-bedrooms`, { method: 'GET', headers }),
        fetch(`${PROXY}/sale-statuses`, { method: 'GET', headers }),
      ]);

      let areas = [];
      let bedrooms = [];
      let saleStatuses = [];

      if (areasRes.ok) areas = await areasRes.json();
      if (bedroomsRes.ok) bedrooms = await bedroomsRes.json();
      if (statusesRes.ok) saleStatuses = await statusesRes.json();

      return {
        areas: Array.isArray(areas) ? areas.filter((a) => a.name) : [],
        bedrooms: Array.isArray(bedrooms) ? bedrooms : [],
        saleStatuses: Array.isArray(saleStatuses) ? saleStatuses : [],
        property_types: [
          { id: 'apartment', name: 'Apartment' },
          { id: 'villa', name: 'Villa' },
          { id: 'townhouse', name: 'Townhouse' },
          { id: 'penthouse', name: 'Penthouse' },
        ],
      };
    } catch {
      return {
        areas: [],
        bedrooms: [],
        saleStatuses: [],
        property_types: [],
      };
    }
  }
}

export const reallyApi = new ReallyApi();
