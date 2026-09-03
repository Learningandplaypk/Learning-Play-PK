"use client";

import React, { useState } from "react";
import { Button, Input, TiltCard } from "@/components/ui";

export function ContactClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "queued">("idle");

  const send = () => {
    const subject = encodeURIComponent(`[LKP] ${name || "Salam"} ka paighaam`);
    const body = encodeURIComponent(`${msg}\n\n— ${name} (${email})`);
    window.location.href = `mailto:salam@learnplaypk.com?subject=${subject}&body=${body}`;
    setState("queued");
  };

  return (
    <div className="mx-auto">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 animate-float place-items-center rounded-3xl bg-gradient-to-br from-electric/40 to-neon-purple/40 text-4xl">📮</div>
        <h1 className="font-display text-3xl font-black">
          <span className="text-gradient">Rabta Karein</span>
        </h1>
        <p className="mt-2 text-sm text-muted">Sawal, mashwara, partnership ya bug — sunna chahte hain.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TiltCard className="p-6">
          <h3 className="font-display font-bold">⚡ Seedha email</h3>
          <p className="mt-2 text-sm text-muted">salam@learnplaypk.com</p>
          <p className="mt-1 text-xs text-muted">Free support: 48h • Premium: 12h priority</p>
          <h3 className="mt-5 font-display font-bold">🛡️ Payments & refunds</h3>
          <p className="mt-2 text-sm text-muted">billing@learnplaypk.com</p>
        </TiltCard>
        <TiltCard className="p-6">
          <h3 className="font-display font-bold">✉️ Quick message</h3>
          <div className="mt-3 space-y-2.5">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" aria-label="Name" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" />
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Paighaam likho…"
              rows={3}
              className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-electric/60"
              aria-label="Message"
            />
            <Button className="w-full" disabled={state === "sending" || !msg} onClick={send}>
              {state === "sending" ? "…" : state === "queued" ? "✅ Email app khul gaya" : "Bhejo"}
            </Button>
            {state === "queued" && <p className="text-xs text-neon-green">Aapka email app khul gaya — wahan se bhej dein. Ya seedha salam@learnplaypk.com likhein.</p>}
          </div>
        </TiltCard>
      </div>

      <div className="glass mt-6 p-5 text-center text-sm text-muted">
        <p>🏫 Lahore, Pakistan • 🐛 Bug mile toh screenshot + game ka naam zaroor likhein</p>
      </div>
    </div>
  );
}
