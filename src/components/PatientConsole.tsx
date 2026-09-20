import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ClientOnly } from "@/components/ClientOnly";
import { EMERGENCY_TYPES, FALLBACK_LOCATION, STATUS_FLOW, t } from "@/lib/emergency/data";
import { useEmergency } from "@/lib/emergency/store";
import type { EmergencyType } from "@/lib/emergency/types";

const EmergencyMap = lazy(() => import("@/components/EmergencyMap"));

export function PatientConsole() {
  const {
    user,
    lang,
    setLang,
    signOut,
    location,
    locating,
    locationError,
    lockLocation,
    hospitals,
    request,
    dispatch,
    cancelRequest,
    contacts,
    addContact,
    removeContact,
  } = useEmergency();

  const [panel, setPanel] = useState<"sos" | "hospitals" | "contacts">("sos");
  const [patientName, setPatientName] = useState(user?.fullName ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [emergencyType, setEmergencyType] = useState<EmergencyType>("cardiac");
  const [details, setDetails] = useState("");
  const [hospitalId, setHospitalId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!location) void lockLocation();
  }, [location, lockLocation]);

  const center = request
    ? request.location
    : (location ?? FALLBACK_LOCATION);

  const statusIndex = request
    ? STATUS_FLOW.findIndex((s) => s.id === request.status)
    : -1;

  const submit = async () => {
    if (!patientName.trim() || !/^\d{10}$/.test(contactPhone.trim())) {
      toast.error("Enter the patient name and a valid 10-digit contact number");
      return;
    }
    await dispatch({
      patientName: patientName.trim(),
      contactPhone: contactPhone.trim(),
      emergencyType,
      details: details.trim(),
      ...(hospitalId ? { hospitalId } : {}),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b-4 border-[var(--gov-amber)] bg-[var(--gov-navy)] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--gov-red)] text-base font-black">
            108
          </div>
          <div className="mr-auto leading-tight">
            <p className="text-sm font-bold uppercase tracking-[0.2em]">{t("appName", lang)}</p>
            <p className="text-[11px] text-white/65">{t("tagline", lang)}</p>
          </div>
          <a
            href="tel:108"
            className="rounded-lg bg-[var(--gov-red)] px-4 py-2 text-sm font-bold shadow-lg hover:brightness-110"
          >
            ☎ {t("call108", lang)}
          </a>
          <Link
            to="/control-room"
            className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold hover:bg-white/10"
          >
            {t("controlRoom", lang)}
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "te" : "en")}
            className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold hover:bg-white/10"
          >
            {lang === "en" ? "తెలుగు" : "English"}
          </button>
          {user && !user.guest && (
            <button
              onClick={signOut}
              className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold hover:bg-white/10"
            >
              {t("logout", lang)}
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[400px_1fr]">
        <div className="space-y-4">
          {/* Location strip */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {locating ? t("locating", lang) : t("liveLocation", lang)}
              </span>
              <button
                onClick={() => void lockLocation()}
                className="text-xs font-semibold text-[var(--gov-red)] hover:underline"
              >
                Re-lock GPS
              </button>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              {location?.address ?? "Awaiting GPS fix…"}
            </p>
            {location && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)} · ±{location.accuracy} m
              </p>
            )}
            {locationError && (
              <p className="mt-2 rounded-md bg-[var(--gov-amber)]/15 px-2 py-1 text-xs text-[var(--gov-navy)]">
                {locationError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {(
              [
                ["sos", "SOS"],
                ["hospitals", "Hospitals"],
                ["contacts", "Contacts"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setPanel(id)}
                className={`rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  panel === id ? "bg-[var(--gov-navy)] text-white" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {panel === "sos" && !request && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <Input label="Patient name" value={patientName} onChange={setPatientName} />
              <Input
                label="Contact number"
                value={contactPhone}
                onChange={setContactPhone}
                inputMode="numeric"
              />
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Emergency type
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setEmergencyType(e.id)}
                      className={`rounded-lg border px-2 py-2 text-left text-xs font-semibold ${
                        emergencyType === e.id
                          ? "border-[var(--gov-red)] bg-[var(--gov-red)]/10 text-[var(--gov-red)]"
                          : "border-border text-foreground"
                      }`}
                    >
                      <span className="mr-1">{e.icon}</span>
                      {lang === "en" ? e.en : e.te}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Details (optional)
                </span>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--gov-red)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preferred hospital
                </span>
                <select
                  value={hospitalId ?? ""}
                  onChange={(e) => setHospitalId(e.target.value || undefined)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Nearest emergency facility (auto)</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} · {h.distanceKm?.toFixed(1)} km
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={() => void submit()}
                className="sos-glow w-full rounded-2xl bg-[var(--gov-red)] px-4 py-5 text-lg font-black uppercase tracking-widest text-white active:scale-[0.98]"
              >
                🚨 {t("sos", lang)}
              </button>
              <a
                href="tel:108"
                className="block rounded-xl border-2 border-[var(--gov-navy)] px-4 py-3 text-center text-sm font-bold text-[var(--gov-navy)]"
              >
                ☎ {t("call108", lang)}
              </a>
            </div>
          )}

          {panel === "sos" && request && (
            <div className="space-y-3 rounded-xl border-2 border-[var(--gov-red)] bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[var(--gov-red)] px-2 py-1 text-xs font-bold text-white">
                  CASE {request.id}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {new Date(request.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="rounded-xl bg-[var(--gov-navy)] p-4 text-white">
                <p className="text-xs uppercase tracking-widest text-white/60">{t("eta", lang)}</p>
                <p className="text-4xl font-black tabular-nums text-[var(--gov-amber)]">
                  {request.etaMinutes}
                  <span className="ml-1 text-base font-semibold">{t("minutes", lang)}</span>
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {STATUS_FLOW[statusIndex]?.[lang] ?? request.status}
                </p>
              </div>

              <ol className="space-y-1">
                {STATUS_FLOW.map((s, i) => (
                  <li
                    key={s.id}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold ${
                      i <= statusIndex
                        ? "bg-[var(--gov-green)]/10 text-[var(--gov-green)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        i < statusIndex
                          ? "bg-[var(--gov-green)]"
                          : i === statusIndex
                            ? "animate-pulse bg-[var(--gov-red)]"
                            : "bg-border"
                      }`}
                    />
                    {s[lang]}
                  </li>
                ))}
              </ol>

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <Info label={t("vehicle", lang)} value={request.ambulance.number} />
                <Info label={request.ambulance.type} value={request.ambulance.driverName} />
                <Info label={t("hospital", lang)} value={request.hospital.name} span />
              </dl>

              <div className="flex gap-2">
                <a
                  href={`tel:${request.ambulance.driverPhone}`}
                  className="flex-1 rounded-lg bg-[var(--gov-green)] px-3 py-2.5 text-center text-sm font-bold text-white"
                >
                  ☎ {t("driver", lang)}
                </a>
                <button
                  onClick={cancelRequest}
                  className="rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground"
                >
                  Close case
                </button>
              </div>
            </div>
          )}

          {panel === "hospitals" && (
            <div className="space-y-2">
              {hospitals.map((h) => (
                <div key={h.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {lang === "en" ? h.name : h.teluguName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.type} · {h.beds} emergency beds
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-[var(--gov-navy)] px-2 py-1 text-xs font-bold text-white">
                      {h.distanceKm?.toFixed(1)} km
                    </span>
                  </div>
                  <a
                    href={`tel:${h.phone}`}
                    className="mt-2 inline-block text-xs font-semibold text-[var(--gov-red)]"
                  >
                    ☎ {h.phone}
                  </a>
                </div>
              ))}
            </div>
          )}

          {panel === "contacts" && (
            <ContactsPanel
              contacts={contacts}
              onAdd={addContact}
              onRemove={removeContact}
            />
          )}
        </div>

        <div className="min-h-[420px] overflow-hidden rounded-xl border border-border bg-card lg:min-h-[calc(100vh-7rem)]">
          <ClientOnly fallback={<MapSkeleton />}>
            <Suspense fallback={<MapSkeleton />}>
              <EmergencyMap center={center} request={request} hospitals={hospitals} />
            </Suspense>
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-muted text-sm text-muted-foreground">
      Loading live emergency map…
    </div>
  );
}

function Info({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={`rounded-lg bg-muted p-2 ${span ? "col-span-2" : ""}`}>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-xs font-bold text-foreground">{value}</dd>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--gov-red)]"
      />
    </label>
  );
}

function ContactsPanel({
  contacts,
  onAdd,
  onRemove,
}: {
  contacts: { id: string; name: string; phone: string; relation: string }[];
  onAdd: (c: { name: string; phone: string; relation: string }) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");

  return (
    <div className="space-y-3">
      {contacts.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
        >
          <div>
            <p className="text-sm font-bold">{c.name}</p>
            <p className="text-xs text-muted-foreground">
              {c.relation} · {c.phone}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${c.phone}`}
              className="rounded-md bg-[var(--gov-green)] px-3 py-1.5 text-xs font-bold text-white"
            >
              Call
            </a>
            <button
              onClick={() => onRemove(c.id)}
              className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
        <Input label="Name" value={name} onChange={setName} />
        <Input label="Phone" value={phone} onChange={setPhone} inputMode="numeric" />
        <Input label="Relation" value={relation} onChange={setRelation} />
        <button
          onClick={() => {
            if (!name.trim() || !phone.trim()) {
              toast.error("Name and phone are required");
              return;
            }
            onAdd({ name: name.trim(), phone: phone.trim(), relation: relation.trim() || "Contact" });
            setName("");
            setPhone("");
            setRelation("");
          }}
          className="w-full rounded-lg bg-[var(--gov-navy)] px-3 py-2 text-sm font-bold text-white"
        >
          Add emergency contact
        </button>
      </div>
    </div>
  );
}
