"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { LangKey } from "./store";

/**
 * Lightweight 3-locale system: English, Roman Urdu, اردو (RTL).
 * Chrome/UI copy is localized; game content stays bilingual by design.
 */

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.learn": "Learn",
  "nav.brain": "Brain",
  "nav.quiz": "Quiz",
  "nav.fun": "Fun",
  "nav.profile": "Profile",
  "nav.leaderboard": "Leaderboard",
  "nav.premium": "Premium",
  "nav.shop": "Shop",
  "cta.start": "Start Playing",
  "cta.learnEnglish": "Learn English",
  "cta.enter": "Enter Zone",
  "cta.play": "Play Now",
  "cta.playAgain": "Play Again",
  "cta.share": "Share Score",
  "cta.continue": "Continue",
  "common.xp": "XP",
  "common.coins": "coins",
  "common.streak": "day streak",
  "common.free": "100% Free",
  "home.tagline": "English, Arabic, Korean & more — learn by playing 40+ games. 100% Free.",
  "home.heroA": "Seekho + Khelo.",
  "home.zonesTitle": "4 Zones. Endless Fun.",
  "home.streakTitle": "XP kamao. Streak banao. Badges unlock karo.",
  "home.langsTitle": "8 Languages, Ek Platform",
  "home.premiumTitle": "Go Premium",
  "footer.made": "Made in Pakistan",
};

const roman: Dict = {
  "nav.home": "Home",
  "nav.learn": "Seekho",
  "nav.brain": "Dimaag",
  "nav.quiz": "Quiz",
  "nav.fun": "Masti",
  "nav.profile": "Profile",
  "nav.leaderboard": "Leaderboard",
  "nav.premium": "Premium",
  "nav.shop": "Shop",
  "cta.start": "Khelo Shuru Karo",
  "cta.learnEnglish": "English Seekho",
  "cta.enter": "Zone Mein Dakhil Ho",
  "cta.play": "Abhi Khelo",
  "cta.playAgain": "Dobara Khelo",
  "cta.share": "Score Share Karo",
  "cta.continue": "Age Barho",
  "common.xp": "XP",
  "common.coins": "coins",
  "common.streak": "din ka streak",
  "common.free": "100% Free",
  "home.tagline": "English, Arabic, Korean aur bhi — 40+ games khel kar seekho. Bilkul Free.",
  "home.heroA": "Seekho + Khelo.",
  "home.zonesTitle": "4 Zones. Be-Intiha Masti.",
  "home.streakTitle": "XP kamao. Streak banao. Badges unlock karo.",
  "home.langsTitle": "8 Zubanein, Ek Platform",
  "home.premiumTitle": "Premium Lo",
  "footer.made": "Pakistan mein bana",
};

const ur: Dict = {
  "nav.home": "ہوم",
  "nav.learn": "سیکھیں",
  "nav.brain": "دماغ",
  "nav.quiz": "کوئز",
  "nav.fun": "تفریح",
  "nav.profile": "پروفائل",
  "nav.leaderboard": "لیڈر بورڈ",
  "nav.premium": "پریمیم",
  "nav.shop": "دکان",
  "cta.start": "کھیلنا شروع کریں",
  "cta.learnEnglish": "انگریزی سیکھیں",
  "cta.enter": "زون میں داخل ہوں",
  "cta.play": "ابھی کھیلیں",
  "cta.playAgain": "دوبارہ کھیلیں",
  "cta.share": "سکور شیئر کریں",
  "cta.continue": "آگے بڑھیں",
  "common.xp": "ایکس پی",
  "common.coins": "سکے",
  "common.streak": "دن کا اسٹریک",
  "common.free": "۱۰۰٪ مفت",
  "home.tagline": "انگریزی، عربی، کورین اور مزید — کھیل کر سیکھیں۔ بالکل مفت۔",
  "home.heroA": "سیکھو + کھیلو۔",
  "home.zonesTitle": "۴ زونز۔ بے انتہا تفریح۔",
  "home.streakTitle": "ایکس پی کماؤ۔ اسٹریک بناؤ۔ بیجز حاصل کرو۔",
  "home.langsTitle": "۸ زبانیں، ایک پلیٹ فارم",
  "home.premiumTitle": "پریمیم لیں",
  "footer.made": "پاکستان میں تیار کردہ",
};

const DICTS: Record<LangKey, Dict> = { en, roman, ur };

type I18nCtx = { lang: LangKey; setLang: (l: LangKey) => void; t: (k: string) => string; rtl: boolean };

const Ctx = createContext<I18nCtx>({ lang: "roman", setLang: () => {}, t: (k) => k, rtl: false });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangKey>("roman");

  useEffect(() => {
    const saved = localStorage.getItem("learnplay-lang") as LangKey | null;
    if (saved && DICTS[saved]) setLangState(saved);
  }, []);

  const setLang = (l: LangKey) => {
    setLangState(l);
    try {
      localStorage.setItem("learnplay-lang", l);
    } catch {
      /* storage unavailable */
    }
  };

  const t = (k: string) => DICTS[lang][k] ?? en[k] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t, rtl: lang === "ur" }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
