"use client";

import React, { useState } from "react";
import { Button, Input, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase-config";
import { fsModOf, fbDb } from "@/lib/firebase";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

type Tab = "word" | "question" | "notice";

export function AdminClient() {
  const { user, configured } = useAuth();
  const [tab, setTab] = useState<Tab>("word");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const isAllowed = !!user && ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "");

  // word form
  const [word, setWord] = useState({ en: "", ur: "", ipa: "", ex: "", lv: "1" });
  // question form
  const [question, setQuestion] = useState({ topic: "gk", q: "", o1: "", o2: "", o3: "", o4: "", a: "0", e: "" });

  const submitWord = async () => {
    setBusy(true);
    setMsg("");
    try {
      const { collection, addDoc, serverTimestamp } = await fsModOf();
      await addDoc(collection(await fbDb(), "content_words"), {
        ...word,
        lv: Number(word.lv),
        reviewed: false,
        createdAt: serverTimestamp(),
      });
      setMsg("✅ Word Firestore mein save ho gaya (content_words).");
      setWord({ en: "", ur: "", ipa: "", ex: "", lv: "1" });
    } catch (e) {
      setMsg(`⚠️ ${e instanceof Error ? e.message : "save fail"}`);
    } finally {
      setBusy(false);
    }
  };

  const submitQuestion = async () => {
    setBusy(true);
    setMsg("");
    try {
      const { collection, addDoc, serverTimestamp } = await fsModOf();
      await addDoc(collection(await fbDb(), `content_questions_${question.topic}`), {
        q: question.q,
        o: [question.o1, question.o2, question.o3, question.o4],
        a: Number(question.a),
        e: question.e,
        reviewed: false,
        createdAt: serverTimestamp(),
      });
      setMsg("✅ Question save ho gaya.");
      setQuestion({ ...question, q: "", o1: "", o2: "", o3: "", o4: "", e: "" });
    } catch (e) {
      setMsg(`⚠️ ${e instanceof Error ? e.message : "save fail"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <h1 className="mb-2 font-display text-3xl font-black text-fg">Admin panel</h1>
      <p className="mb-6 text-sm text-muted">Content CRUD — words aur questions seedha Firestore mein.</p>

      {!configured && (
        <Card className="p-6">
          <p className="text-sm text-accent-ink">⚙️ Firebase configure nahi hai (.env.local mein NEXT_PUBLIC_FIREBASE_*). Admin CRUD ke liye Firebase zaroori hai.</p>
        </Card>
      )}

      {configured && !isAllowed && (
        <Card className="p-6">
          <p className="text-sm text-accent-ink">🚫 Yeh panel sirf allowlisted admins ke liye hai (NEXT_PUBLIC_ADMIN_EMAILS). Login: {user?.email ?? "nahi hue"}</p>
        </Card>
      )}

      {configured && isAllowed && (
        <>
          <div className="mb-5 flex gap-2">
            {([["word", "🔤 Word add"], ["question", "❓ Question add"]] as Array<[Tab, string]>).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`chip-btn ${tab === k ? "border-brand/60 text-brand-ink" : ""}`} aria-pressed={tab === k}>
                {label}
              </button>
            ))}
          </div>

          {tab === "word" && (
            <Card className="space-y-3 p-6">
              <Input value={word.en} onChange={(e) => setWord({ ...word, en: e.target.value })} placeholder="English word" aria-label="English word" />
              <Input value={word.ur} onChange={(e) => setWord({ ...word, ur: e.target.value })} placeholder="اردو معنی" aria-label="Urdu meaning" />
              <Input value={word.ipa} onChange={(e) => setWord({ ...word, ipa: e.target.value })} placeholder="IPA (optional)" aria-label="IPA" />
              <Input value={word.ex} onChange={(e) => setWord({ ...word, ex: e.target.value })} placeholder="Example sentence" aria-label="Example" />
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted">Level:</label>
                <select value={word.lv} onChange={(e) => setWord({ ...word, lv: e.target.value })} className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm" aria-label="Level">
                  <option value="1">1 — Beginner</option>
                  <option value="2">2 — Intermediate</option>
                  <option value="3">3 — Pro</option>
                </select>
              </div>
              <Button disabled={busy || !word.en || !word.ur} onClick={submitWord}>
                {busy ? "Saving…" : "💾 Save Word"}
              </Button>
            </Card>
          )}

          {tab === "question" && (
            <Card className="space-y-3 p-6">
              <select value={question.topic} onChange={(e) => setQuestion({ ...question, topic: e.target.value })} className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm" aria-label="Topic">
                {["gk", "pakistan", "science", "islamic", "history", "geography", "sports", "tech", "movies"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <Input value={question.q} onChange={(e) => setQuestion({ ...question, q: e.target.value })} placeholder="Sawal…" aria-label="Question" />
              {[1, 2, 3, 4].map((n) => (
                <Input
                  key={n}
                  value={question[`o${n}` as "o1"]}
                  onChange={(e) => setQuestion({ ...question, [`o${n}`]: e.target.value } as typeof question)}
                  placeholder={`Option ${n}`}
                  aria-label={`Option ${n}`}
                />
              ))}
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted">Sahi jawab:</label>
                <select value={question.a} onChange={(e) => setQuestion({ ...question, a: e.target.value })} className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm" aria-label="Correct option">
                  <option value="0">Option 1</option>
                  <option value="1">Option 2</option>
                  <option value="2">Option 3</option>
                  <option value="3">Option 4</option>
                </select>
              </div>
              <Input value={question.e} onChange={(e) => setQuestion({ ...question, e: e.target.value })} placeholder="Wazahat (optional)" aria-label="Explanation" />
              <Button disabled={busy || !question.q || !question.o1 || !question.o2} onClick={submitQuestion}>
                {busy ? "Saving…" : "💾 Save Question"}
              </Button>
            </Card>
          )}

          {msg && <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm">{msg}</p>}
        </>
      )}
    </div>
  );
}
