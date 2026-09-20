import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

import { AuthScreen } from "@/components/AuthScreen";
import { ControlRoom } from "@/components/ControlRoom";
import { PatientConsole } from "@/components/PatientConsole";
import { Splash } from "@/components/Splash";
import { useEmergency } from "@/lib/emergency/store";

function PatientRoute() {
  const { ready, user, signIn } = useEmergency();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) return <Splash onDone={() => setSplashDone(true)} />;
  if (!ready) return <div className="min-h-screen bg-[var(--gov-navy)]" />;

  if (!user) {
    return (
      <AuthScreen
        onEmergencyBypass={() =>
          signIn({ fullName: "Emergency Caller", phone: "", guest: true })
        }
      />
    );
  }

  return <PatientConsole />;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you requested does not exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PatientRoute />} />
      <Route path="/control-room" element={<ControlRoom />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
