import { useState } from "react";
import { toast } from "sonner";

import { useEmergency } from "@/lib/emergency/store";

type Method = "phone" | "email";

export function AuthScreen({ onEmergencyBypass }: { onEmergencyBypass: () => void }) {
  const { signIn, lang, setLang } = useEmergency();
  const [method, setMethod] = useState<Method>("phone");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [busy, setBusy] = useState(false);

  const sendOtp = () => {
    if (!/^\d{10}$/.test(phone.trim())) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(code);
    setOtpSent(true);
    toast.success(`Verification code sent: ${code}`, { duration: 8000 });
  };

  const verifyOtp = () => {
    if (otp.trim() !== sentCode) {
      toast.error("Incorrect verification code");
      return;
    }
    signIn({ fullName: fullName.trim() || "108 User", phone: phone.trim() });
    toast.success("Signed in to Arogya Kavacha 108");
  };

  const emailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      toast.error("Enter a valid email and a password of at least 6 characters");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      signIn({ fullName: fullName.trim() || email.split("@")[0]!, phone: phone.trim(), email });
      setBusy(false);
    }, 500);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--gov-navy)] px-4 py-10">
      <div className="absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(135deg,white_0_2px,transparent_2px_16px)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gov-red)] text-lg font-black text-white">
              108
            </div>
            <div className="leading-tight text-white">
              <p className="text-sm font-bold uppercase tracking-widest">Arogya Kavacha</p>
              <p className="text-[11px] text-white/60">Emergency Response Service</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === "en" ? "te" : "en")}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
          >
            {lang === "en" ? "తెలుగు" : "English"}
          </button>
        </div>

        <button
          onClick={onEmergencyBypass}
          className="sos-glow mb-5 w-full rounded-2xl bg-[var(--gov-red)] px-5 py-4 text-left text-white transition-transform active:scale-[0.98]"
        >
          <span className="block text-lg font-black uppercase tracking-wide">
            Emergency 108 SOS
          </span>
          <span className="block text-xs text-white/85">
            Skip sign-in — dispatch an ambulance immediately
          </span>
        </button>

        <div className="rounded-2xl border border-white/15 bg-white p-6 shadow-2xl">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition ${
                  mode === m ? "bg-[var(--gov-navy)] text-white" : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div className="mb-4 flex gap-2">
            {(["phone", "email"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                  method === m
                    ? "border-[var(--gov-red)] bg-[var(--gov-red)]/10 text-[var(--gov-red)]"
                    : "border-border text-muted-foreground"
                }`}
              >
                {m === "phone" ? "Phone OTP" : "Email"}
              </button>
            ))}
          </div>

          {method === "phone" ? (
            <div className="space-y-3">
              {mode === "signup" && (
                <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Your name" />
              )}
              <Field
                label="Mobile number"
                value={phone}
                onChange={setPhone}
                placeholder="10-digit mobile"
                inputMode="numeric"
              />
              {otpSent && (
                <Field
                  label="Verification code"
                  value={otp}
                  onChange={setOtp}
                  placeholder="6-digit OTP"
                  inputMode="numeric"
                />
              )}
              <button
                onClick={otpSent ? verifyOtp : sendOtp}
                className="w-full rounded-lg bg-[var(--gov-navy)] px-4 py-3 text-sm font-bold text-white hover:opacity-95"
              >
                {otpSent ? "Verify & Continue" : "Send OTP"}
              </button>
            </div>
          ) : (
            <form onSubmit={emailAuth} className="space-y-3">
              {mode === "signup" && (
                <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Your name" />
              )}
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="••••••"
                type="password"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-[var(--gov-navy)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            Government of India emergency service. Misuse of 108 is a punishable offence.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--gov-red)] focus:ring-2 focus:ring-[var(--gov-red)]/20"
      />
    </label>
  );
}
