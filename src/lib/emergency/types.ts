export type LatLng = { lat: number; lng: number };

export type FixedLocation = LatLng & {
  accuracy: number;
  address: string;
  lockedAt: number;
};

export type Hospital = {
  id: string;
  name: string;
  teluguName: string;
  type: "Trauma Centre" | "Govt General" | "Multi-Speciality";
  phone: string;
  emergency: boolean;
  beds: number;
  offset: LatLng;
  distanceKm?: number;
  lat?: number;
  lng?: number;
};

export type EmergencyType =
  | "cardiac"
  | "accident"
  | "pregnancy"
  | "breathing"
  | "stroke"
  | "other";

export type DispatchStatus =
  | "requested"
  | "dispatched"
  | "en_route"
  | "arrived"
  | "picked_up"
  | "reached_hospital";

export type Ambulance = {
  number: string;
  driverName: string;
  driverPhone: string;
  type: string;
  position: LatLng;
};

export type EmergencyRequest = {
  id: string;
  patientName: string;
  contactPhone: string;
  emergencyType: EmergencyType;
  details: string;
  location: FixedLocation;
  status: DispatchStatus;
  createdAt: number;
  ambulance: Ambulance;
  hospital: Hospital;
  etaMinutes: number;
  routeToPatient: LatLng[];
  routeToHospital: LatLng[];
};

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
};

export type AppUser = {
  fullName: string;
  phone: string;
  email?: string;
  guest?: boolean;
};

export type Language = "en" | "te";
