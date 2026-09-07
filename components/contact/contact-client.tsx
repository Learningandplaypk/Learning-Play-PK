"use client";

import React, { useState } from "react";
import { Button, Input, Card, Label, Textarea } from "@/components/ui";
import { Mail, ShieldCheck, Clock } from "lucide-react";

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
      <div className="mb-8">
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint text-brand-ink">
          <Mail size={26} strokeWidth={2.2} />
        </span>
        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Rabta karein</h1>
        <p className="mt-2 text-base text-muted">Sawal, mashwara, partnership ya bug — sunna chahte hain.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="p-6">
          <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-fg">
            <Mail size={17} strokeWidth={2.3} className="text-brand-ink" /> Seedha email
          </h3>
          <p className="mt-2 text-sm text-muted">salam@learnplaypk.com</p>
          <p className="mt-1 text-xs text-muted">Free support: 48h • Premium: 12h priority</p>
          <h3 className="mt-5 flex items-center gap-2 font-display text-base font-extrabold text-fg">
            <ShieldCheck size={17} strokeWidth={2.3} className="text-brand-ink" /> Payments &amp; refunds
          </h3>
          <p className="mt-2 text-sm text-muted">billing@learnplaypk.com</p>
        </Card>
        <Card className="p-6">
          <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-fg">
            <Clock size={17} strokeWidth={2.3} className="text-brand-ink" /> Quick message
          </h3>
          <div className="mt-3 space-y-2.5">
            <div>
              <Label htmlFor="c-name">Naam</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" />
            </div>
            <div>
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="apka@email.com" />
            </div>
            <div>
              <Label htmlFor="c-msg">Paighaam</Label>
              <Textarea id="c-msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Paighaam likho…" rows={3} />
            </div>
            <Button className="w-full" disabled={state === "sending" || !msg} onClick={send}>
              {state === "sending" ? "…" : state === "queued" ? "✅ Email app khul gaya" : "Bhejo"}
            </Button>
            {state === "queued" && <p className="text-xs text-brand-ink">Aapka email app khul gaya — wahan se bhej dein. Ya seedha salam@learnplaypk.com likhein.</p>}
          </div>
        </Card>
      </div>

      <div className="card mt-6 p-5 text-sm text-muted">
        <p>Lahore, Pakistan • Bug mile toh screenshot + game ka naam zaroor likhein</p>
      </div>
    </div>
  );
}
