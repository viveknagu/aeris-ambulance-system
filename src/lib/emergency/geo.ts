import type { LatLng } from "./types";

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Traffic-aware corridor: instead of a straight line, bend the path through
 * offset waypoints so the route follows an arterial detour around the
 * congested centre of the city block.
 */
export function buildRoute(from: LatLng, to: LatLng, bend = 0.18, steps = 48): LatLng[] {
  const mid: LatLng = { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };
  const dLat = to.lat - from.lat;
  const dLng = to.lng - from.lng;
  const ctrl: LatLng = { lat: mid.lat - dLng * bend, lng: mid.lng + dLat * bend };

  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    pts.push({
      lat: inv * inv * from.lat + 2 * inv * t * ctrl.lat + t * t * to.lat,
      lng: inv * inv * from.lng + 2 * inv * t * ctrl.lng + t * t * to.lng,
    });
  }
  return pts;
}

export function routeLengthKm(route: LatLng[]): number {
  let km = 0;
  for (let i = 1; i < route.length; i++) km += haversineKm(route[i - 1]!, route[i]!);
  return km;
}

export async function reverseGeocode(point: LatLng): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? formatCoords(point);
  } catch {
    return formatCoords(point);
  }
}

export function formatCoords(p: LatLng): string {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}

export function getBrowserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });
}
