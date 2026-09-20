import type { Ambulance, EmergencyType, Hospital, Language } from "./types";

// Fallback centre: Hyderabad, used when GPS is unavailable.
export const FALLBACK_LOCATION = { lat: 17.385, lng: 78.4867 };

export const HOSPITALS: Hospital[] = [
  {
    id: "h1",
    name: "Govt. General Hospital – Trauma Block",
    teluguName: "ప్రభుత్వ జనరల్ ఆసుపత్రి – ట్రామా విభాగం",
    type: "Trauma Centre",
    phone: "04024600001",
    emergency: true,
    beds: 14,
    offset: { lat: 0.018, lng: 0.012 },
  },
  {
    id: "h2",
    name: "Arogya Kavacha Emergency Centre",
    teluguName: "ఆరోగ్య కవచ అత్యవసర కేంద్రం",
    type: "Multi-Speciality",
    phone: "04024600002",
    emergency: true,
    beds: 9,
    offset: { lat: -0.021, lng: 0.019 },
  },
  {
    id: "h3",
    name: "District Civil Hospital",
    teluguName: "జిల్లా సివిల్ ఆసుపత్రి",
    type: "Govt General",
    phone: "04024600003",
    emergency: true,
    beds: 22,
    offset: { lat: 0.028, lng: -0.024 },
  },
  {
    id: "h4",
    name: "City Cardiac & Stroke Institute",
    teluguName: "సిటీ కార్డియాక్ & స్ట్రోక్ ఇన్‌స్టిట్యూట్",
    type: "Multi-Speciality",
    phone: "04024600004",
    emergency: true,
    beds: 6,
    offset: { lat: -0.032, lng: -0.015 },
  },
];

export const AMBULANCE_FLEET: Omit<Ambulance, "position">[] = [
  { number: "TS 09 UB 1084", driverName: "Ravi Teja", driverPhone: "9848010801", type: "108 ALS" },
  { number: "AP 16 EM 2231", driverName: "Suresh Babu", driverPhone: "9848010802", type: "108 BLS" },
  { number: "TS 07 GA 4410", driverName: "Naveen Kumar", driverPhone: "9848010803", type: "108 ALS" },
];

export const EMERGENCY_TYPES: {
  id: EmergencyType;
  en: string;
  te: string;
  icon: string;
}[] = [
  { id: "cardiac", en: "Cardiac / Chest Pain", te: "గుండె నొప్పి", icon: "❤️" },
  { id: "accident", en: "Road Accident / Trauma", te: "రోడ్డు ప్రమాదం", icon: "🚗" },
  { id: "pregnancy", en: "Pregnancy / Labour", te: "ప్రసవం", icon: "🤰" },
  { id: "breathing", en: "Breathing Difficulty", te: "శ్వాస సమస్య", icon: "🫁" },
  { id: "stroke", en: "Stroke / Unconscious", te: "స్ట్రోక్ / స్పృహ కోల్పోవడం", icon: "🧠" },
  { id: "other", en: "Other Emergency", te: "ఇతర అత్యవసరం", icon: "🚨" },
];

type Dict = Record<string, { en: string; te: string }>;

export const STRINGS: Dict = {
  appName: { en: "Arogya Kavacha 108", te: "ఆరోగ్య కవచ 108" },
  tagline: {
    en: "National Emergency Ambulance Dispatch",
    te: "జాతీయ అత్యవసర అంబులెన్స్ సేవ",
  },
  sos: { en: "EMERGENCY SOS", te: "అత్యవసర SOS" },
  sosHint: { en: "Press and hold to dispatch 108", te: "108 కోసం నొక్కి పట్టుకోండి" },
  call108: { en: "Call 108 Now", te: "108కు కాల్ చేయండి" },
  liveLocation: { en: "Live Location Locked", te: "ప్రత్యక్ష లొకేషన్ నమోదైంది" },
  locating: { en: "Locking GPS…", te: "GPS గుర్తిస్తోంది…" },
  eta: { en: "ETA", te: "చేరే సమయం" },
  minutes: { en: "min", te: "నిమి" },
  driver: { en: "Driver", te: "డ్రైవర్" },
  vehicle: { en: "Ambulance No.", te: "అంబులెన్స్ నం." },
  hospital: { en: "Destination Hospital", te: "గమ్య ఆసుపత్రి" },
  hospitals: { en: "Nearby Emergency Hospitals", te: "సమీప అత్యవసర ఆసుపత్రులు" },
  contacts: { en: "Emergency Contacts", te: "అత్యవసర పరిచయాలు" },
  controlRoom: { en: "Control Room / Driver", te: "కంట్రోల్ రూమ్ / డ్రైవర్" },
  login: { en: "Sign In", te: "సైన్ ఇన్" },
  logout: { en: "Sign Out", te: "సైన్ అవుట్" },
  guest: { en: "Skip – Emergency 108 SOS", te: "దాటవేయి – అత్యవసర 108 SOS" },
};

export function t(key: string, lang: Language): string {
  return STRINGS[key]?.[lang] ?? key;
}

export const STATUS_FLOW: {
  id: import("./types").DispatchStatus;
  en: string;
  te: string;
}[] = [
  { id: "requested", en: "Request Received", te: "అభ్యర్థన అందింది" },
  { id: "dispatched", en: "Ambulance Dispatched", te: "అంబులెన్స్ పంపబడింది" },
  { id: "en_route", en: "En Route to Patient", te: "రోగి వద్దకు వస్తోంది" },
  { id: "arrived", en: "Arrived at Scene", te: "సంఘటన స్థలానికి చేరింది" },
  { id: "picked_up", en: "Patient Picked Up", te: "రోగిని తీసుకెళ్తోంది" },
  { id: "reached_hospital", en: "Reached Hospital", te: "ఆసుపత్రికి చేరింది" },
];
