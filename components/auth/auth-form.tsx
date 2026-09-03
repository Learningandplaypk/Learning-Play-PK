"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { AuthBackground } from "./auth-bg";
import { isPhonePk } from "@/lib/utils";
import { usePlayer } from "@/lib/store";
import { levelTitle, levelFromXp } from "@/lib/gamification";

type Mode = "login" | "signup" | "forgot" | "phone-otp";

export function AuthForm({ mode: initial }: { mode: "login" | "signup" | "forgot" }) {
  const [mode, setMode] = useState<Mode>(initial);
  const { user, configured, loginGoogle, loginEmail, signupEmail, loginPhone, confirmOtp, resetPassword, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
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
      const { RecaptchaVerifier } = await import("firebase/auth");
      const { fbAuth } = await import("@/lib/firebase");
      const verifier = new RecaptchaVerifier(fbAuth(), "recaptcha-container", { size: "invisible" });
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

  const title = mode === "login" ? "Wapas khush aamdeed!" : mode === "signup" ? "Account banao — 30 second ka kaam" : "Password bhool gaye?";

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4 pb-24 pt-24">
      <AuthBackground />
      <div className="glass relative z-10 w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 animate-float place-items-center rounded-3xl bg-gradient-to-br from-neon-green via-electric to-neon-purple text-3xl">🦉</div>
          <h1 className="font-display text-2xl font-black">
            <span className="text-gradient">{title}</span>
          </h1>
          <p className="mt-1 text-xs text-muted">
            Bina account bhi poora game chalta hai — login sirf progress cloud save + leaderboard ke liye.
          </p>
        </div>

        {!configured && (
          <div className="mb-4 rounded-xl border border-neon-orange/40 bg-neon-orange/10 p-3 text-xs leading-relaxed text-neon-orange">
            ⚙️ Firebase configure nahi hua (.env.local mein NEXT_PUBLIC_FIREBASE_* missing). Abhi guest mode chal raha hai — progress aapke browser mein save hota hai. Setup ke liye README dekho.
          </div>
        )}

        {user && (
          <div className="mb-4 rounded-xl border border-neon-green/40 bg-neon-green/10 p-3 text-sm text-neon-green">
            ✅ Login ho chuke ho: {user.name} (Lv {lv.level} {levelTitle(lv.level)}) —{" "}
            <button className="underline" onClick={() => run(logout, "Logout ho gaya.")}>
              logout
            </button>
          </div>
        )}

        {mode === "phone-otp" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">{ok}</p>
            <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit OTP" inputMode="numeric" aria-label="OTP code" />
            <Button className="w-full" disabled={busy || otp.length < 6} onClick={() => run(() => confirmOtp(otp))}>
              {busy ? "Check ho raha…" : "OTP Verify Karo"}
            </Button>
          </div>
        ) : mode === "forgot" ? (
          <div className="space-y-3">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="apka@email.com" aria-label="Email" />
            <Button className="w-full" disabled={busy || !email} onClick={() => run(() => resetPassword(email), "Reset email bhej diya — inbox check karo!")}>
              {busy ? "Bhej rahe hain…" : "Reset Link Bhejo"}
            </Button>
            {ok && <p className="text-sm text-neon-green">{ok}</p>}
            <p className="text-center text-xs text-muted">
              Yaad aa gaya?{" "}
              <button className="text-electric underline" onClick={() => setMode("login")}>
                Login karo
              </button>
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {mode === "signup" && <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" aria-label="Name" />}
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="apka@email.com" aria-label="Email" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)" aria-label="Password" />
              <Button
                className="w-full"
                disabled={busy || !email || password.length < 6 || (mode === "signup" && !name)}
                onClick={() => (mode === "login" ? run(() => loginEmail(email, password)) : run(() => signupEmail(name, email, password)))}
              >
                {busy ? "Ruko…" : mode === "login" ? "🚪 Login" : "🎉 Account Banao"}
              </Button>
            </div>

            <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted">
              <span className="h-px flex-1 bg-white/10" /> ya <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-2.5">
              <Button variant="ghost" className="w-full" disabled={busy || !configured} onClick={() => run(loginGoogle)}>
                <span className="text-base">🇬</span> Google se continue karo
              </Button>
              <Button variant="ghost" className="w-full" disabled={busy || !configured} onClick={startPhone}>
                📱 Phone OTP (JazzCash/EasyPaisa wala number)
              </Button>
            </div>

            <p className="mt-5 text-center text-xs text-muted">
              {mode === "login" ? (
                <>
                  Account nahi?{" "}
                  <button className="text-electric underline" onClick={() => setMode("signup")}>
                    Banao
                  </button>{" "}
                  •{" "}
                  <button className="text-electric underline" onClick={() => setMode("forgot")}>
                    Password bhool gaye?
                  </button>
                </>
              ) : (
                <>
                  Pehle se account hai?{" "}
                  <button className="text-electric underline" onClick={() => setMode("login")}>
                    Login
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {err && <p className="mt-4 rounded-xl bg-pink-accent/15 p-3 text-xs text-pink-accent">⚠️ {err}</p>}
        <div id="recaptcha-container" ref={recaptchaRef} />
        <p className="mt-6 text-center text-[10px] leading-relaxed text-muted/70">
          Continue karne se aap <Link className="underline" href="/terms">Terms</Link> aur <Link className="underline" href="/privacy">Privacy Policy</Link> se ittefaq karte hain. Guest progress login par automatically merge ho jata hai.
        </p>
      </div>
    </div>
  );
}
