"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { LangKey } from "./store";
import { usePlayer } from "./store";
import { isLangKey, documentLangAttrs } from "./i18n-core";

export { isLangKey, documentLangAttrs } from "./i18n-core";

/**
 * Lightweight 3-locale system: English, Roman Urdu, اردو (RTL).
 *
 * English is the default for every new visitor — the browser language is
 * deliberately NOT sniffed. A choice made in onboarding or Settings is
 * persisted to localStorage ("learnplay-lang"), the player store, and
 * users/{uid}.lang once the player signs in.
 */

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home","nav.learn": "Learn","nav.brain": "Brain","nav.quiz": "Quiz","nav.fun": "Fun","nav.profile": "Profile","nav.leaderboard": "Leaderboard","nav.premium": "Premium","nav.shop": "Shop",
  "cta.start": "Start Playing","cta.learnEnglish": "Learn English","cta.enter": "Enter Zone","cta.play": "Play Now","cta.playAgain": "Play Again","cta.share": "Share Score","cta.continue": "Continue",
  "common.xp": "XP","common.coins": "coins","common.streak": "day streak","common.free": "100% Free","common.done": "Done","common.cancel": "Cancel","common.remove": "Remove","common.close": "Close",
  "home.tagline": "21 languages — learn by playing 40+ games. 100% Free.","home.heroA": "Seekho + Khelo.","home.zonesTitle": "4 Zones. Endless Fun.","home.streakTitle": "XP kamao. Streak banao. Badges unlock karo.","home.langsTitle": "21 Languages, One Platform","home.premiumTitle": "Go Premium","home.continue": "Continue learning",
  "footer.made": "Made in Pakistan",
  "onboarding.title": "Choose your app language","onboarding.sub": "You can change both of these any time in Settings.","onboarding.appLang": "App language","onboarding.learnLangs": "Which languages do you want to learn?","onboarding.learnHint": "English is pre-selected. Add as many as you like — there are no limits.","onboarding.start": "Start learning","onboarding.skip": "Skip for now",
  "learn.title": "Learn Zone","learn.sub": "Your languages — words, phrases, listening and pronunciation games, with Urdu + English meanings.","learn.myLangs": "My languages","learn.add": "Add a language","learn.addShort": "Add","learn.progress": "Course progress","learn.xpShort": "XP","learn.wordsShort": "words","learn.lessonsShort": "lessons","learn.levelShort": "Level","learn.open": "Open course","learn.removeQ": "Remove this language?","learn.keepProgress": "Your XP and words stay saved — you can add it again any time.",
  "picker.title": "Add a language","picker.sub": "21 languages, every one free. Pick the ones you actually want to learn.","picker.search": "Search languages","picker.noResults": "No language matched that search.","picker.added": "Added","picker.add": "Add","picker.manage": "Manage","picker.addedToast": "language added to your hub.",
  "tts.note": "Audio is device-dependent","tts.noteBody": "Your browser has no voice for this language, so listening games run without sound. Everything else works.",
  "settings.language": "Language / زبان",
};

const roman: Dict = {
  "nav.home": "Home","nav.learn": "Seekho","nav.brain": "Dimaag","nav.quiz": "Quiz","nav.fun": "Masti","nav.profile": "Profile","nav.leaderboard": "Leaderboard","nav.premium": "Premium","nav.shop": "Shop",
  "cta.start": "Khelo Shuru Karo","cta.learnEnglish": "English Seekho","cta.enter": "Zone Mein Dakhil Ho","cta.play": "Abhi Khelo","cta.playAgain": "Dobara Khelo","cta.share": "Score Share Karo","cta.continue": "Age Barho",
  "common.xp": "XP","common.coins": "coins","common.streak": "din ka streak","common.free": "100% Free","common.done": "Ho gaya","common.cancel": "Rehne do","common.remove": "Hatao","common.close": "Band karo",
  "home.tagline": "21 zubanein — 40+ games khel kar seekho. Bilkul Free.","home.heroA": "Seekho + Khelo.","home.zonesTitle": "4 Zones. Be-Intiha Masti.","home.streakTitle": "XP kamao. Streak banao. Badges unlock karo.","home.langsTitle": "21 Zubanein, Ek Platform","home.premiumTitle": "Premium Lo","home.continue": "Seekhna jari rakho",
  "footer.made": "Pakistan mein bana",
  "onboarding.title": "App ki zubaan chunein","onboarding.sub": "Dono cheezein aap kabhi bhi Settings se badal sakte hain.","onboarding.appLang": "App ki zubaan","onboarding.learnLangs": "Aap kaunsi zubanein seekhna chahte hain?","onboarding.learnHint": "English pehle se selected hai. Jitne chahein add karein — koi limit nahi.","onboarding.start": "Seekhna shuru karo","onboarding.skip": "Abhi rehne do",
  "learn.title": "Seekhne ka Zone","learn.sub": "Aap ki zubanein — words, phrases, listening aur pronunciation games, Urdu + English meanings ke sath.","learn.myLangs": "Meri zubanein","learn.add": "Zubaan add karo","learn.addShort": "Add","learn.progress": "Course progress","learn.xpShort": "XP","learn.wordsShort": "words","learn.lessonsShort": "lessons","learn.levelShort": "Level","learn.open": "Course kholo","learn.removeQ": "Yeh zubaan hata dein?","learn.keepProgress": "Aap ka XP aur words mehfooz rahenge — dobara kabhi bhi add kar sakte hain.",
  "picker.title": "Zubaan add karo","picker.sub": "21 zubanein, har ek free. Wohi chunein jo aap waqai seekhna chahte hain.","picker.search": "Zubaan dhundo","picker.noResults": "Is search se koi zubaan nahi mili.","picker.added": "Add ho gayi","picker.add": "Add","picker.manage": "Manage","picker.addedToast": "zubaan aap ke hub mein add ho gayi.",
  "tts.note": "Audio device par depend karta hai","tts.noteBody": "Aap ke browser mein is zubaan ki voice nahi, is liye listening games bina awaaz ke chalenge. Baqi sab kaam karta hai.",
  "settings.language": "Language / زبان",
};

const ur: Dict = {
  "nav.home": "ہوم","nav.learn": "سیکھیں","nav.brain": "دماغ","nav.quiz": "کوئز","nav.fun": "تفریح","nav.profile": "پروفائل","nav.leaderboard": "لیڈر بورڈ","nav.premium": "پریمیم","nav.shop": "دکان",
  "cta.start": "کھیلنا شروع کریں","cta.learnEnglish": "انگریزی سیکھیں","cta.enter": "زون میں داخل ہوں","cta.play": "ابھی کھیلیں","cta.playAgain": "دوبارہ کھیلیں","cta.share": "سکور شیئر کریں","cta.continue": "آگے بڑھیں",
  "common.xp": "ایکس پی","common.coins": "سکے","common.streak": "دن کا اسٹریک","common.free": "۱۰۰٪ مفت","common.done": "ہو گیا","common.cancel": "رہنے دیں","common.remove": "ہٹائیں","common.close": "بند کریں",
  "home.tagline": "۲۱ زبانیں — کھیل کر سیکھیں، ۴۰ سے زائد گیمز۔ بالکل مفت۔","home.heroA": "سیکھو + کھیلو۔","home.zonesTitle": "۴ زونز۔ بے انتہا تفریح۔","home.streakTitle": "ایکس پی کماؤ۔ اسٹریک بناؤ۔ بیجز حاصل کرو۔","home.langsTitle": "۲۱ زبانیں، ایک پلیٹ فارم","home.premiumTitle": "پریمیم لیں","home.continue": "سیکھنا جاری رکھیں",
  "footer.made": "پاکستان میں تیار کردہ",
  "onboarding.title": "ایپ کی زبان منتخب کریں","onboarding.sub": "یہ دونوں آپ کسی بھی وقت سیٹنگز سے بدل سکتے ہیں۔","onboarding.appLang": "ایپ کی زبان","onboarding.learnLangs": "آپ کون سی زبانیں سیکھنا چاہتے ہیں؟","onboarding.learnHint": "انگریزی پہلے سے منتخب ہے۔ جتنی چاہیں شامل کریں — کوئی حد نہیں۔","onboarding.start": "سیکھنا شروع کریں","onboarding.skip": "ابھی رہنے دیں",
  "learn.title": "سیکھنے کا زون","learn.sub": "آپ کی زبانیں — الفاظ، جملے، سننے اور تلفظ کے کھیل، اردو اور انگریزی معانی کے ساتھ۔","learn.myLangs": "میری زبانیں","learn.add": "زبان شامل کریں","learn.addShort": "شامل کریں","learn.progress": "کورس کی پیش رفت","learn.xpShort": "ایکس پی","learn.wordsShort": "الفاظ","learn.lessonsShort": "اسباق","learn.levelShort": "لیول","learn.open": "کورس کھولیں","learn.removeQ": "یہ زبان ہٹا دیں؟","learn.keepProgress": "آپ کا ایکس پی اور الفاظ محفوظ رہیں گے — دوبارہ کبھی بھی شامل کر سکتے ہیں۔",
  "picker.title": "زبان شامل کریں","picker.sub": "۲۱ زبانیں، ہر ایک مفت۔ وہی منتخب کریں جو آپ واقعی سیکھنا چاہتے ہیں۔","picker.search": "زبان تلاش کریں","picker.noResults": "اس تلاش سے کوئی زبان نہیں ملی۔","picker.added": "شامل ہو گئی","picker.add": "شامل کریں","picker.manage": "انتظام","picker.addedToast": "زبان آپ کے ہب میں شامل ہو گئی۔",
  "tts.note": "آواز آپ کے ڈیوائس پر منحصر ہے","tts.noteBody": "آپ کے براؤزر میں اس زبان کی آواز نہیں، اس لیے سننے کے کھیل بغیر آواز کے چلیں گے۔ باقی سب کام کرتا ہے۔",
  "settings.language": "زبان / Language",
};

const DICTS: Record<LangKey, Dict> = { en, roman, ur };

/** Storage key — also honoured by the QA scripts (browser-qa --lang=ur). */
export const LANG_STORAGE_KEY = "learnplay-lang";

export const UI_LANGS: Array<{ key: LangKey; label: string; native: string }> = [
  { key: "en", label: "English", native: "English" },
  { key: "roman", label: "Roman Urdu", native: "Roman Urdu" },
  { key: "ur", label: "Urdu", native: "اردو" },
];

export function applyDocumentLang(lang: LangKey): void {
  if (typeof document === "undefined") return;
  const { dir, htmlLang } = documentLangAttrs(lang);
  const root = document.documentElement;
  root.setAttribute("dir", dir);
  root.setAttribute("lang", htmlLang);
  root.classList.toggle("lang-ur", lang === "ur");
}

type I18nCtx = { lang: LangKey; setLang: (l: LangKey) => void; t: (k: string) => string; rtl: boolean };

const Ctx = createContext<I18nCtx>({ lang: "en", setLang: () => {}, t: (k) => k, rtl: false });

/** Push lang + language list to Firestore (no-op for guests / unconfigured). */
function persistToAccount(): void {
  void import("./sync")
    .then((m) => m.pushLanguagePrefs())
    .catch(() => {
      /* offline / guest */
    });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangKey>("en");
  const storeLang = usePlayer((s) => s.lang);
  const hydrated = usePlayer((s) => s.hydrated);
  const setPlayer = usePlayer((s) => s.setPlayer);

  useEffect(() => {
    let saved: LangKey | null = null;
    try {
      const raw = localStorage.getItem(LANG_STORAGE_KEY);
      if (isLangKey(raw)) saved = raw;
    } catch {
      /* storage unavailable */
    }
    // A saved chrome choice wins over the store default (the store default is
    // "en" for everyone, so it carries no information of its own).
    let next: LangKey = saved ?? "en";
    if (hydrated && isLangKey(storeLang)) {
      if (saved && saved !== storeLang) {
        setPlayer({ lang: saved });
      } else {
        next = storeLang;
      }
    }
    setLangState(next);
    applyDocumentLang(next);
  }, [hydrated, storeLang, setPlayer]);

  const setLang = useCallback(
    (l: LangKey) => {
      if (!isLangKey(l)) return;
      setLangState(l);
      setPlayer({ lang: l });
      try {
        localStorage.setItem(LANG_STORAGE_KEY, l);
      } catch {
        /* storage unavailable */
      }
      applyDocumentLang(l);
      persistToAccount();
    },
    [setPlayer]
  );

  const t = useCallback((k: string) => DICTS[lang][k] ?? en[k] ?? k, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t, rtl: lang === "ur" }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
