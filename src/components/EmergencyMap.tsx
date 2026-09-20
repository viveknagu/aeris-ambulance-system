import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import type { EmergencyRequest, Hospital, LatLng } from "@/lib/emergency/types";

function pinIcon(emoji: string, color: string, pulse = false) {
  return L.divIcon({
    className: "",
    html: `<div class="map-pin ${pulse ? "map-pin-pulse" : ""}" style="--pin:${color}">${emoji}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
}

export default function EmergencyMap({
  center,
  request,
  hospitals,
  height = "100%",
}: {
  center: LatLng;
  request: EmergencyRequest | null;
  hospitals: Hospital[];
  height?: string;
}) {
  const active = request?.status === "picked_up" || request?.status === "reached_hospital";

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height, width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />

      <Marker position={[center.lat, center.lng]} icon={pinIcon("🧍", "#d7263d", true)}>
        <Popup>Patient emergency location</Popup>
      </Marker>

      {hospitals.map((h) => (
        <Marker
          key={h.id}
          position={[h.lat ?? center.lat, h.lng ?? center.lng]}
          icon={pinIcon("🏥", h.id === request?.hospital.id ? "#1b3a6b" : "#5b6b85")}
        >
          <Popup>
            <strong>{h.name}</strong>
            <br />
            {h.type} · {h.beds} emergency beds
            <br />
            {h.distanceKm?.toFixed(1)} km away
          </Popup>
        </Marker>
      ))}

      {request && (
        <>
          <Polyline
            positions={request.routeToPatient.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: active ? "#94a3b8" : "#d7263d",
              weight: active ? 4 : 6,
              opacity: active ? 0.5 : 0.95,
            }}
          />
          <Polyline
            positions={request.routeToHospital.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: active ? "#1b3a6b" : "#f0a500",
              weight: active ? 6 : 4,
              opacity: active ? 0.95 : 0.6,
              dashArray: active ? undefined : "10 8",
            }}
          />
          <Marker
            position={[request.ambulance.position.lat, request.ambulance.position.lng]}
            icon={pinIcon("🚑", "#0f7b3f", true)}
          >
            <Popup>
              <strong>{request.ambulance.number}</strong>
              <br />
              {request.ambulance.driverName} · {request.ambulance.type}
              <br />
              ETA {request.etaMinutes} min
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
