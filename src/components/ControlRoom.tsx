import { lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";

import { ClientOnly } from "@/components/ClientOnly";
import { EMERGENCY_TYPES, FALLBACK_LOCATION, STATUS_FLOW } from "@/lib/emergency/data";
import { useEmergency } from "@/lib/emergency/store";
import { haversineKm } from "@/lib/emergency/geo";
import { supabase } from "@/lib/supabase";

const EmergencyMap = lazy(() => import("@/components/EmergencyMap"));

export function ControlRoom() {
  const { request, hospitals, setStatus, lang } = useEmergency();
  const center = request ? request.location : FALLBACK_LOCATION;
  const statusIndex = request ? STATUS_FLOW.findIndex((s) => s.id === request.status) : -1;
  useEffect(() => {
    if (!supabase || request) return;

    void supabase
      .from("emergency_requests")
      .select("*")
      .not("status", "eq", "reached_hospital")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("[AK108] control-room fetch failed:", error.message);
          return;
        }
        if (data) {
          // Reuse the shared store's realtime subscription by refreshing the page state
          // through the browser event below when the row exists.
          window.dispatchEvent(new CustomEvent("ak108:remote-request", { detail: data }));
        }
      });
  }, [request]);

  const type = EMERGENCY_TYPES.find((e) => e.id === request?.emergencyType);

  const distanceToPatient = request
    ? haversineKm(request.ambulance.position, request.location)
    : 0;
  const distanceToHospital =
    request && request.hospital.lat
      ? haversineKm(request.ambulance.position, {
          lat: request.hospital.lat,
          lng: request.hospital.lng!,
        })
      : 0;

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 z-30 border-b-4 border-[var(--gov-amber)] bg-[var(--gov-navy)]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--gov-red)] text-base font-black">
            108
          </div>
          <div className="mr-auto leading-tight">
            <p className="text-sm font-bold uppercase tracking-[0.2em]">Control Room · Driver Console</p>
            <p className="text-[11px] text-white/65">Dispatch operations &amp; navigation</p>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-[var(--gov-green)]/20 px-3 py-1 text-xs font-bold text-[var(--gov-green)] sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--gov-green)]" /> LIVE
          </span>
          <Link
            to="/"
            className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold hover:bg-white/10"
          >
            Patient App
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">
            Incoming emergency requests
          </h2>

          {!request && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
              No active 108 cases. Raise an SOS from the patient app to see live dispatch here.
            </div>
          )}

          {request && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--gov-red)]/60 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-[var(--gov-red)] px-2 py-1 text-xs font-bold">
                    {request.id}
                  </span>
                  <span className="text-xs text-white/60">
                    {new Date(request.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-3 text-lg font-bold">{request.patientName}</p>
                <p className="text-xs text-white/70">
                  {type?.icon} {lang === "en" ? type?.en : type?.te} · ☎ {request.contactPhone}
                </p>
                {request.details && (
                  <p className="mt-2 rounded-md bg-white/5 p-2 text-xs text-white/70">
                    {request.details}
                  </p>
                )}
                <p className="mt-3 font-mono text-[11px] text-[var(--gov-amber)]">
                  {request.location.lat.toFixed(5)}, {request.location.lng.toFixed(5)} · ±
                  {request.location.accuracy} m
                </p>
                <p className="text-xs text-white/60">{request.location.address}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-white/50">
                  Assigned unit
                </p>
                <p className="mt-1 text-base font-bold">{request.ambulance.number}</p>
                <p className="text-xs text-white/70">
                  {request.ambulance.driverName} · {request.ambulance.type}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-[var(--gov-red)]/15 p-2">
                    <p className="text-[10px] uppercase text-white/50">To patient</p>
                    <p className="text-sm font-black">{distanceToPatient.toFixed(1)} km</p>
                  </div>
                  <div className="rounded-lg bg-[var(--gov-amber)]/15 p-2">
                    <p className="text-[10px] uppercase text-white/50">To hospital</p>
                    <p className="text-sm font-black">{distanceToHospital.toFixed(1)} km</p>
                  </div>
                </div>
                <p className="mt-3 rounded-lg bg-[var(--gov-navy)] p-3 text-sm font-semibold">
                  🧭 {navigationHint(request.status)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/50">
                  Update dispatch status
                </p>
                <div className="grid gap-2">
                  {STATUS_FLOW.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setStatus(s.id)}
                      className={`rounded-lg px-3 py-2 text-left text-xs font-bold transition ${
                        i === statusIndex
                          ? "bg-[var(--gov-red)] text-white"
                          : i < statusIndex
                            ? "bg-[var(--gov-green)]/20 text-[var(--gov-green)]"
                            : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {i + 1}. {s[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="min-h-[440px] overflow-hidden rounded-xl border border-white/10 lg:min-h-[calc(100vh-7rem)]">
          <ClientOnly
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-white/50">
                Loading dispatch map…
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-white/50">
                  Loading dispatch map…
                </div>
              }
            >
              <EmergencyMap center={center} request={request} hospitals={hospitals} />
            </Suspense>
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}

function navigationHint(status: string): string {
  switch (status) {
    case "requested":
      return "Confirm unit availability and dispatch immediately.";
    case "dispatched":
      return "Head out on the highlighted red corridor — traffic-avoiding arterial route.";
    case "en_route":
      return "Continue on red corridor. Use siren at junctions, keep left lane clear.";
    case "arrived":
      return "On scene. Stabilise patient, then mark Patient Picked Up.";
    case "picked_up":
      return "Follow the navy corridor to the destination trauma centre.";
    default:
      return "Case complete. Hand over documents at the emergency desk.";
  }
}
