import { Coordinates } from './distance.util';

export function normalizeAddress(address: string): string {
  return address.replace(/\s+/g, ' ').trim();
}

export function buildNominatimSearchUrl(address: string): string {
  const normalized = normalizeAddress(address);
  const query = encodeURIComponent(normalized);
  return `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
}

export function buildGoogleGeocodeUrl(address: string, apiKey: string): string {
  const normalized = normalizeAddress(address);
  const query = encodeURIComponent(normalized);
  return `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`;
}

export function parseNominatimCoordinates(result: {
  lat: string;
  lon: string;
}): Coordinates {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Invalid geocoding response');
  }

  return { latitude, longitude };
}
