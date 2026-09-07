"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, ShieldAlert } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { isPhonePk } from "@/lib/utils";
import { usePlayer } from "@/lib/store";
import { levelTitle, levelFromXp } from "@/lib/gamification";
import { authModOf, fbAuth } from "@/lib/firebase";
import { LogoMark, Ustad } from "@/components/brand/ustad";

type Mode = "login" | "signup" | "forgot" | "phone-otp";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

export function AuthForm({ mode: initial }: { mode: "login" | "signup" | "forgot" }) {
  const [mode, setMode] = useState<Mode>(initial);
  const { user, configured, redirecting, loginGoogle, loginEmail, signupEmail, loginPhone, confirmOtp, resetPassword, logout } =
    useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const xp = usePlayer((s) => s.xp);
  const lv = levelFromXp(xp);

  useEffect(() => {
    if (user && mode !== "phone-otp") router.push("/profile");
  }, [user, mode, router]);

  const run = async (fn: () => Promise<void>, successMsg?: string) => {
    setErr("");
    setBusy(true);
    try {
      await fn();
      if (successMsg) setOk(successMsg);
      if (!successMsg) router.push("/profile");
    } catch (e) {
      setErr(e instanceof Error ? e.message.replace("Firebase: ", "") : "Kuch ghalat ho gaya — dobara koshish karo.");
    } finally {
      setBusy(false);
    }
  };

  const startPhone = async () => {
    setErr("");
    if (!isPhonePk(phone)) {
      setErr("Pakistani number likho — e.g. 03001234567");
      return;
    }
    setBusy(true);
    try {
      const { RecaptchaVerifier } = await authModOf();
      const auth = await fbAuth();
      // inline widget ("normal") — renders inside the form, never as a popup
      // (popups are blocked inside sandboxed preview iframes)
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "normal" });
      const formatted = phone.startsWith("+92") ? phone : `+92${phone.replace(/^0/, "")}`;
      await loginPhone(formatted, verifier);
      setMode("phone-otp");
      setOk("OTP bhej diya — SMS check karo.");
    } catch (e) {
      setErr(e instanceof Error ? e.message.replace("Firebase: ", "") : "Phone login fail — dobara koshish karo.");
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "login"
      ? "Wapas khush aamdeed!"
      : mode === "signup"
        ? "Account banao — 30 second ka kaam"
        : mode === "phone-otp"
          ? "OTP daalo"
          : "Password bhool gaye?";

  return (
    <div className="page-pad flex min-h-[100dvh] items-center justify-center py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex min-h-11 items-center gap-2" aria-label="Learn & Play PK home">
          <LogoMark className="h-8 w-8" />
          <span className="font-display text-base font-extrabold tracking-tight text-fg">
            Learn<span className="text-brand-ink">&amp;</span>Play PK
          </span>
        </Link>

        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-4">
            <Ustad mood="happy" className="h-16 w-16 shrink-0" />
            <div>
              <h1 className="font-display text-xl font-extrabold text-fg">{title}</h1>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Bina account bhi poora game chalta hai — login sirf progress cloud save + leaderboard ke liye.
              </p>
            </div>
          </div>

          {!configured && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-accent/40 bg-accent-tint p-3 text-xs leading-relaxed text-accent-ink">
              <ShieldAlert size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
              Firebase configure nahi hua (.env.local mein NEXT_PUBLIC_FIREBASE_* missing). Abhi guest mode chal raha
              hai — progress aapke browser mein save hoti hai.
            </div>
          )}

          {user && (
            <div className="mb-4 rounded-xl border border-brand/40 bg-brand-tint p-3 text-sm text-brand-ink">
              Login ho chuke ho: {user.name} (Lv {lv.level} {levelTitle(lv.level)}) —{" "}
              <button className="font-semibold underline" onClick={() => run(logout, "Logout ho gaya.")}>
                logout
              </button>
            </div>
          )}

          {mode === "phone-otp" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">{ok}</p>
              <div>
                <Label htmlFor="otp">6-digit OTP</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>
              <Button block disabled={busy || otp.length < 6} onClick={() => run(() => confirmOtp(otp))}>
                {busy ? "Check ho raha…" : "OTP verify karo"}
              </Button>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"
                onClick={() => setMode("login")}
              >
                <ArrowLeft size={16} strokeWidth={2.2} /> Wapas
              </button>
            </div>
          ) : mode === "forgot" ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="apka@email.com"
                  autoComplete="email"
                />
              </div>
              <Button block disabled={busy || !email} onClick={() => run(() => resetPassword(email), "Reset email bhej diya — inbox check karo!")}>
                {busy ? "Bhej rahe hain…" : "Reset link bhejo"}
              </Button>
              {ok && <p className="text-sm font-semibold text-brand-ink">{ok}</p>}
              <p className="text-center text-sm text-muted">
                Yaad aa gaya?{" "}
                <button className="font-semibold text-brand-ink underline" onClick={() => setMode("login")}>
                  Login karo
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {mode === "signup" && (
                  <div>
                    <Label htmlFor="name">Naam</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aapka naam"
                      autoComplete="name"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="apka@email.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6+ characters"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </div>
                <Button
                  block
                  size="lg"
                  disabled={busy || !email || password.length < 6 || (mode === "signup" && !name)}
                  onClick={() =>
                    mode === "login" ? run(() => loginEmail(email, password)) : run(() => signupEmail(name, email, password))
                  }
                >
                  {busy ? "Ruko…" : mode === "login" ? "Login karo" : "Account banao"}
                </Button>
              </div>

              <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted">
                <span className="h-px flex-1 bg-[var(--border)]" /> ya{" "}
                <span className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={busy || !configured || redirecting}
                  onClick={() => run(loginGoogle)}
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-fg transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  <GoogleMark />
                  {redirecting ? "Google par le ja rahe hain…" : "Google se continue karo"}
                </button>
                <Button
                  variant="secondary"
                  block
                  disabled={busy || !configured}
                  onClick={startPhone}
                >
                  <Phone size={17} strokeWidth={2.2} /> Phone OTP se login
                </Button>
              </div>

              {redirecting && (
                <p
                  className="mt-3 rounded-xl bg-info-tint p-3 text-center text-xs font-semibold text-info-ink"
                  role="status"
                  aria-live="polite"
                >
                  Google par le ja rahe hain… wapas aate hi aap login ho jao ge (progress auto-merge).
                </p>
              )}

              <p className="mt-5 text-center text-sm text-muted">
                {mode === "login" ? (
                  <>
                    Account nahi?{" "}
                    <button className="font-semibold text-brand-ink underline" onClick={() => setMode("signup")}>
                      Banao
                    </button>{" "}
                    ·{" "}
                    <button className="font-semibold text-brand-ink underline" onClick={() => setMode("forgot")}>
                      Password bhool gaye?
                    </button>
                  </>
                ) : (
                  <>
                    Pehle se account hai?{" "}
                    <button className="font-semibold text-brand-ink underline" onClick={() => setMode("login")}>
                      Login
                    </button>
                  </>
                )}
              </p>
            </>
          )}

          {err && (
            <p className="mt-4 rounded-xl border border-danger/30 bg-danger-tint p-3 text-xs text-danger-ink">{err}</p>
          )}
          <div id="recaptcha-container" />

          <p className="mt-6 text-center text-xs leading-relaxed text-muted">
            Continue karne se aap{" "}
            <Link className="font-semibold text-brand-ink underline" href="/terms">
              Terms
            </Link>{" "}
            aur{" "}
            <Link className="font-semibold text-brand-ink underline" href="/privacy">
              Privacy Policy
            </Link>{" "}
            se ittefaq karte hain. Guest progress login par automatically merge ho jata hai.
          </p>
        </Card>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
          <Mail size={13} strokeWidth={2.2} /> Madad chahiye? support@learnplaypk.com
        </p>
      </div>
    </div>
  );
}
