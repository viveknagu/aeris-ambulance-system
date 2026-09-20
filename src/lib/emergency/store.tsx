import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { AMBULANCE_FLEET, FALLBACK_LOCATION, HOSPITALS } from "./data";
import { buildRoute, getBrowserLocation, haversineKm, reverseGeocode, routeLengthKm } from "./geo";
import { realtimeEnabled, supabase } from "../supabase";
import type {
  AppUser,
  DispatchStatus,
  EmergencyContact,
  EmergencyRequest,
  EmergencyType,
  FixedLocation,
  Hospital,
  Language,
  LatLng,
} from "./types";

const STORAGE = {
  user: "ak108_user",
  lang: "ak108_lang",
  contacts: "ak108_contacts",
  request: "ak108_request",
};

const DEFAULT_CONTACTS: EmergencyContact[] = [
  { id: "c1", name: "Family – Primary", phone: "9848000001", relation: "Father" },
  { id: "c2", name: "Police Control Room", phone: "100", relation: "Police" },
];

type Ctx = {
  ready: boolean;
  user: AppUser | null;
  lang: Language;
  setLang: (l: Language) => void;
  signIn: (u: AppUser) => void;
  signOut: () => void;
  location: FixedLocation | null;
  locating: boolean;
  locationError: string | null;
  lockLocation: () => Promise<FixedLocation | null>;
  hospitals: Hospital[];
  request: EmergencyRequest | null;
  dispatch: (input: {
    patientName: string;
    contactPhone: string;
    emergencyType: EmergencyType;
    details: string;
    hospitalId?: string;
  }) => Promise<void>;
  setStatus: (s: DispatchStatus) => void;
  cancelRequest: () => void;
  contacts: EmergencyContact[];
  addContact: (c: Omit<EmergencyContact, "id">) => void;
  removeContact: (id: string) => void;
  playSiren: () => void;
};

const EmergencyContextObj = createContext<Ctx | null>(null);

export function useEmergency(): Ctx {
  const ctx = useContext(EmergencyContextObj);
  if (!ctx) throw new Error("useEmergency must be used inside EmergencyProvider");
  return ctx;
}

function resolveHospitals(origin: LatLng): Hospital[] {
  return HOSPITALS.map((h) => {
    const lat = origin.lat + h.offset.lat;
    const lng = origin.lng + h.offset.lng;
    return { ...h, lat, lng, distanceKm: haversineKm(origin, { lat, lng }) };
  }).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

function rowToRequest(row: Record<string, unknown>): EmergencyRequest {
  return {
    id: String(row.id),
    patientName: String(row.patient_name ?? ""),
    contactPhone: String(row.contact_phone ?? ""),
    emergencyType: row.emergency_type as EmergencyType,
    details: String(row.details ?? ""),
    location: {
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      accuracy: Number(row.accuracy ?? 0),
      address: String(row.address ?? ""),
      lockedAt: Date.parse(String(row.created_at ?? "")) || Date.now(),
    },
    status: row.status as DispatchStatus,
    createdAt: Date.parse(String(row.created_at ?? "")) || Date.now(),
    ambulance: row.ambulance as EmergencyRequest["ambulance"],
    hospital: row.hospital as Hospital,
    etaMinutes: Number(row.eta_minutes ?? 0),
    routeToPatient: (row.route_to_patient ?? []) as LatLng[],
    routeToHospital: (row.route_to_hospital ?? []) as LatLng[],
  };
}

export function EmergencyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [lang, setLangState] = useState<Language>("en");
  const [location, setLocation] = useState<FixedLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>(DEFAULT_CONTACTS);
  const legIndex = useRef(0);

  useEffect(() => {
    try {
      const u = localStorage.getItem(STORAGE.user);
      if (u) setUser(JSON.parse(u) as AppUser);
      const l = localStorage.getItem(STORAGE.lang);
      if (l === "te" || l === "en") setLangState(l);
      const c = localStorage.getItem(STORAGE.contacts);
      if (c) setContacts(JSON.parse(c) as EmergencyContact[]);
      const r = localStorage.getItem(STORAGE.request);
      if (r) {
        const parsed = JSON.parse(r) as EmergencyRequest;
        setRequest(parsed);
        setLocation(parsed.location);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  // One realtime channel is shared by patient and control-room screens.
  // Any insert/update made by either screen is immediately reflected in the other.
  useEffect(() => {
    if (!supabase || !ready) return;

    const onRemoteRequest = (event: Event) => {
      const row = (event as CustomEvent<Record<string, unknown>>).detail;
      if (!row) return;
      const incoming = rowToRequest(row);
      setRequest(incoming);
      setLocation(incoming.location);
    };
    window.addEventListener("ak108:remote-request", onRemoteRequest);

    let channel = supabase
      .channel("ak108-emergency-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emergency_requests" },
        (payload) => {
          const incoming = rowToRequest(payload.new as Record<string, unknown>);
          setRequest((current) => (current?.id === incoming.id || !current ? incoming : current));
          setLocation(incoming.location);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "emergency_requests" },
        (payload) => {
          const incoming = rowToRequest(payload.new as Record<string, unknown>);
          setRequest((current) => (current?.id === incoming.id ? incoming : current));
          setLocation((current) => (current && current.lockedAt ? incoming.location : current));
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.info("[AK108] Realtime connected");
        }
      });

    return () => {
      window.removeEventListener("ak108:remote-request", onRemoteRequest);
      void channel.unsubscribe();
      channel = null as never;
    };
  }, [ready]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE.lang, l);
  }, []);

  const signIn = useCallback((u: AppUser) => {
    setUser(u);
    localStorage.setItem(STORAGE.user, JSON.stringify(u));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE.user);
  }, []);

  const playSiren = useCallback(() => {
    try {
      const AudioCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = new AudioCtor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        osc.frequency.setValueAtTime(760, now + i * 0.5);
        osc.frequency.setValueAtTime(980, now + i * 0.5 + 0.25);
      }
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2);
      osc.start(now);
      osc.stop(now + 2.05);
      osc.onended = () => void ctx.close();
    } catch {
      /* audio blocked */
    }
  }, []);

  const lockLocation = useCallback(async (): Promise<FixedLocation | null> => {
    setLocating(true);
    setLocationError(null);
    try {
      const pos = await getBrowserLocation();
      const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const fixed: FixedLocation = {
        ...point,
        accuracy: Math.round(pos.coords.accuracy),
        address: "Resolving address…",
        lockedAt: Date.now(),
      };
      setLocation(fixed);
      void reverseGeocode(point).then((address) =>
        setLocation((prev) =>
          prev && prev.lockedAt === fixed.lockedAt ? { ...prev, address } : prev,
        ),
      );
      return fixed;
    } catch (err) {
      const message =
        (err as { code?: number })?.code === 1
          ? "Location permission denied. Using approximate city centre."
          : "GPS unavailable. Using approximate city centre.";
      setLocationError(message);
      const fallback: FixedLocation = {
        ...FALLBACK_LOCATION,
        accuracy: 1500,
        address: "Approximate location – Hyderabad city centre",
        lockedAt: Date.now(),
      };
      setLocation(fallback);
      return fallback;
    } finally {
      setLocating(false);
    }
  }, []);

  const hospitals = useMemo(() => resolveHospitals(location ?? FALLBACK_LOCATION), [location]);

  const persistRequest = useCallback(async (next: EmergencyRequest) => {
    localStorage.setItem(STORAGE.request, JSON.stringify(next));
    if (!supabase) return;

    const row = {
      id: next.id,
      patient_name: next.patientName,
      contact_phone: next.contactPhone,
      emergency_type: next.emergencyType,
      details: next.details,
      status: next.status,
      latitude: next.location.lat,
      longitude: next.location.lng,
      accuracy: next.location.accuracy,
      address: next.location.address,
      hospital_id: next.hospital.id,
      hospital: next.hospital,
      ambulance: next.ambulance,
      eta_minutes: next.etaMinutes,
      route_to_patient: next.routeToPatient,
      route_to_hospital: next.routeToHospital,
    };

    const { error } = await supabase.from("emergency_requests").upsert(row, { onConflict: "id" });
    if (error) console.error("[AK108] realtime write failed:", error.message);
  }, []);

  const dispatchRequest = useCallback<Ctx["dispatch"]>(
    async (input) => {
      const loc = location ?? (await lockLocation());
      if (!loc) return;
      const list = resolveHospitals(loc);
      const hospital = list.find((h) => h.id === input.hospitalId) ?? list[0]!;
      const unit = AMBULANCE_FLEET[Math.floor(Math.random() * AMBULANCE_FLEET.length)]!;
      const start: LatLng = { lat: loc.lat - 0.026, lng: loc.lng - 0.03 };
      const routeToPatient = buildRoute(start, loc, 0.16);
      const routeToHospital = buildRoute(loc, { lat: hospital.lat!, lng: hospital.lng! }, -0.12);

      legIndex.current = 0;
      const next: EmergencyRequest = {
        id: `108-${Date.now().toString().slice(-6)}`,
        patientName: input.patientName,
        contactPhone: input.contactPhone,
        emergencyType: input.emergencyType,
        details: input.details,
        location: loc,
        status: "requested",
        createdAt: Date.now(),
        ambulance: { ...unit, position: start },
        hospital,
        etaMinutes: Math.max(3, Math.round(routeLengthKm(routeToPatient) * 2.4)),
        routeToPatient,
        routeToHospital,
      };

      setRequest(next);
      setLocation(loc);
      await persistRequest(next);
      playSiren();
      toast.success(
        realtimeEnabled
          ? "SOS sent — control room connected live"
          : "SOS saved locally — connect Supabase for live control room",
      );

      // These automatic transitions remain for the demo flow; control-room changes are also synced.
      setTimeout(() => setStatusInternal("dispatched"), 1200);
      setTimeout(() => setStatusInternal("en_route"), 2600);
    },
    [location, lockLocation, persistRequest, playSiren],
  );

  const setStatusInternal = useCallback(
    (status: DispatchStatus) => {
      setRequest((prev) => {
        if (!prev) return prev;
        if (status === "picked_up") legIndex.current = 0;
        const next = { ...prev, status };
        void persistRequest(next);
        return next;
      });
    },
    [persistRequest],
  );

  // Demo ambulance movement. Each position is also published so the control room sees it.
  useEffect(() => {
    if (!request) return;
    const moving = request.status === "en_route" || request.status === "picked_up";
    if (!moving) return;
    const route = request.status === "en_route" ? request.routeToPatient : request.routeToHospital;

    if (legIndex.current === 0) {
      let best = 0;
      let bestKm = Infinity;
      route.forEach((p, i) => {
        const km = haversineKm(p, request.ambulance.position);
        if (km < bestKm) {
          bestKm = km;
          best = i;
        }
      });
      legIndex.current = best;
    }

    const timer = setInterval(() => {
      legIndex.current = Math.min(legIndex.current + 1, route.length - 1);
      const idx = legIndex.current;
      const point = route[idx]!;
      const remaining = route.slice(idx);
      const etaMinutes = Math.max(0, Math.round(routeLengthKm(remaining) * 2.4));

      setRequest((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          ambulance: { ...prev.ambulance, position: point },
          etaMinutes,
        };
        if (idx >= route.length - 1) {
          if (prev.status === "en_route") {
            toast.success("Ambulance has arrived at the emergency location");
            next.status = "arrived";
          } else {
            toast.success("Patient handed over at hospital");
            next.status = "reached_hospital";
          }
          next.etaMinutes = 0;
        }
        void persistRequest(next);
        return next;
      });
    }, 700);

    return () => clearInterval(timer);
  }, [request?.status, request?.id, persistRequest]);

  useEffect(() => {
    if (!ready) return;
    if (request) localStorage.setItem(STORAGE.request, JSON.stringify(request));
    else localStorage.removeItem(STORAGE.request);
  }, [ready, request]);

  const addContact = useCallback((c: Omit<EmergencyContact, "id">) => {
    setContacts((prev) => {
      const next = [...prev, { ...c, id: `c${Date.now()}` }];
      localStorage.setItem(STORAGE.contacts, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE.contacts, JSON.stringify(next));
      return next;
    });
  }, []);

  const cancelRequest = useCallback(() => {
    const id = request?.id;
    setRequest(null);
    localStorage.removeItem(STORAGE.request);
    if (id && supabase) {
      void supabase.from("emergency_requests").delete().eq("id", id);
    }
  }, [request?.id]);

  const value: Ctx = {
    ready,
    user,
    lang,
    setLang,
    signIn,
    signOut,
    location,
    locating,
    locationError,
    lockLocation,
    hospitals,
    request,
    dispatch: dispatchRequest,
    setStatus: setStatusInternal,
    cancelRequest,
    contacts,
    addContact,
    removeContact,
    playSiren,
  };

  return <EmergencyContextObj.Provider value={value}>{children}</EmergencyContextObj.Provider>;
}
