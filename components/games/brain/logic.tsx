"use client";

import React, { useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

/** 18 logic riddles + lateral thinking questions with explanations (Roman Urdu). */
const RIDDLES: Array<{ q: string; o: string[]; a: number; why: string }> = [
  { q: "Aik aisi cheez jo tooti toh kaam aati hai — woh kya hai?", o: ["Anda", "Aaina", "Matka", "Ghari"], a: 0, why: "Anda tootne par hi andar ka kham ya murghi kaam aata hai." },
  { q: "Aam ki shaakh par 10 chidiyan baithi theen. Shikari ne 1 ko mara. Kitni baaki?" , o: ["9", "0", "1", "5"], a: 1, why: "Goli ki awaaz se baaki sab urr gaye — isliye 0 baaki." },
  { q: "Woh kya hai jo raat ko aata hai par kabhi subah nahi?", o: ["Chand", "Taare", "Khwaab", "Sard garmi"], a: 2, why: "Khwaab sirf neend mein aata hai, jagte hue kabhi nahi." },
  { q: "Ek ladke ka birthday saal mein sirf ek baar aata hai par woh 4 saal mein ek baar celebrate karta hai. Kyun?", o: ["29 February", "Wo bhool jata hai", "Party mehngi hai", "Wo bahar rehta hai"], a: 0, why: "29 Feb sirf leap year mein aata hai — har 4 saal." },
  { q: "Aap ke pita ki behen ki beti aap ki kya lagti hai?", o: ["Cousin", "Bhatiji", "Khala", "Behen"], a: 0, why: "Pita ki behen = phupho; unki beti = cousin." },
  { q: "5 machines 5 cheezein 5 minute mein banati hain. 100 machines 100 cheezein kitne minute mein?", o: ["100", "20", "5", "50"], a: 2, why: "Har machine 5 min mein 1 cheez — 100 machines 5 min mein 100 cheezein." },
  { q: "Woh kya hai jo jitna khincho utna chhota hota hai?", o: ["Rubber band nahi", "Chuna", "Cigarette", "Sada patta"], a: 2, why: "Cigarette jalne/khenchne par chhoti hoti jati hai." },
  { q: "Aik ghar ke darwaze par 3 switch hain, andar 1 bulb. Sab se kam trips mein bulb ka switch kaise pata karein?", o: ["1 trip", "2 trips", "3 trips", "Possible nahi"], a: 1, why: "Pehla switch on karke thodi der baad off, doosra on — andar jao: jalta bulb = doosra, garam bulb = pehla, thanda = teesra." },
  { q: "2 + 2 = 5 kab ho sakta hai?", o: ["Galti se", "Kabhi nahi", "Rounding mein", "Quantum physics"], a: 2, why: "Rounding ke sath: 2.4 rounds to 2, 2.4+2.4=4.8 rounds to 5." },
  { q: "Kis cheez ka wazan 1 kg zyada hai — 1kg pani ya 1kg loha?", o: ["Pani", "Loha", "Dono barabar", "Depends"], a: 2, why: "Dono ka wazan 1kg hi hai — cheez material nahi, weight matter karta hai." },
  { q: "Bina haath lagaye 5 coin table par kaise rakho taake har coin doosre ko chhue?", o: ["Stack banao", "Cross shape", "Circle", "Possible nahi"], a: 1, why: "Cross (+) shape mein center coin chaaron ko chhoota hai." },
  { q: "Aap 3 darwaze dekh rahe ho: Aag, Pani, Sher. Sab se pehle kaunsa kholo ge?", o: ["Aag wala", "Pani wala", "Sher wala", "Jo pahle mile"], a: 3, why: "Ghar ka darwaza toh khoolna hi parega — sawal trick tha!" },
  { q: "Agar kal ka kal tha, toh aaj kya hai?", o: ["Kal", "Aaj", "Parso", "Kuch nahi"], a: 1, why: "'Kal ka kal' = aaj ke baad ka din, toh sawal ka focus aaj hai." },
  { q: "Aik tanki 2 pipe se bharti hai, 1 se khali. Bhari tanki 6 ghante mein khali ho jati hai. Bharne mein?", o: ["3 ghante", "6 se kam", "6 se zyada", "Depends"], a: 2, why: "Khali karne wala pipe bhi chal raha hai, toh bharna zyada time lega." },
  { q: "Woh number kya hai jo khud se multiply karne par khud hi milta hai?", o: ["0 aur 1", "Sirf 1", "Sirf 0", "Har number"], a: 0, why: "0×0=0 aur 1×1=1 — dono khud ko hi deta hain." },
  { q: "Ek sher 2 second mein ek bakri pakarta hai. 6 bakriyan kitne second?", o: ["12", "6", "2", "10"], a: 1, why: "Sher sab ko ek sath nahi pakadta — har bakri 2 second, total 6." },
  { q: "Meri dadi ke bete ke bete ka mera kya hai?", o: ["Bhai/bhen", "Beta", "Chacha", "Pota"], a: 0, why: "Dadi ka beta = pita; pita ka beta = bhai ya khud aap." },
  { q: "Aisi cheez jo aapki hai magar doosre hi zyada use karte hain?", o: ["Paisa", "Naam", "Phone", "Ghar"], a: 1, why: "Aapka naam doosre log hi bulatay hain." },
];

export default function LogicGame({ onEnd }: GameProps) {
  const TOTAL = 10;
  const [questions] = useState(() =>
    shuffle(RIDDLES)
      .slice(0, TOTAL)
      .map((r) => ({ ...r, options: shuffle(r.o.map((text, i) => ({ text, correct: i === r.a }))) }))
  );
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [startedAt] = useState(() => Date.now());

  const q = questions[idx];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = q.options[i].correct;
    if (ok) {
      sfx("correct");
      setCorrect((c) => c + 1);
    } else sfx("wrong");
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= TOTAL) {
        onEnd({ score: (correct + (ok ? 1 : 0)) * 15, maxScore: TOTAL * 15, accuracy: (correct + (ok ? 1 : 0)) / TOTAL, timeMs: Date.now() - startedAt });
      } else setIdx(idx + 1);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">{idx + 1}/{TOTAL}</span>
        <span className="chip">✅ {correct}</span>
      </div>
      <div className="glass p-6">
        <p className="font-display text-lg font-bold leading-relaxed">🧩 {q.q}</p>
        <div className="mt-5 grid gap-2.5">
          {q.options.map((o, i) => {
            const state = picked === null ? "idle" : o.correct ? "right" : picked === i ? "wrong" : "dim";
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                className={`rounded-xl border px-4 py-3 text-left text-[15px] font-semibold transition ${
                  state === "idle" ? "glass glass-hover" : state === "right" ? "border-neon-green/70 bg-neon-green/15" : state === "wrong" ? "shake border-pink-accent/70 bg-pink-accent/15" : "opacity-40"
                }`}
              >
                {o.text}
              </button>
            );
          })}
        </div>
        {picked !== null && <p className="mt-4 text-sm text-neon-green">💡 {q.why}</p>}
      </div>
    </div>
  );
}
