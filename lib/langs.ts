import type { LanguageData } from "./learn-types";
import { ARABIC } from "@/data/langs/arabic";
import { TURKISH } from "@/data/langs/turkish";
import { FRENCH } from "@/data/langs/french";
import { SPANISH } from "@/data/langs/spanish";
import { KOREAN } from "@/data/langs/korean";
import { CHINESE } from "@/data/langs/chinese";
import { JAPANESE } from "@/data/langs/japanese";

export const LANGUAGES: Record<string, LanguageData> = {
  arabic: ARABIC,
  turkish: TURKISH,
  french: FRENCH,
  spanish: SPANISH,
  korean: KOREAN,
  chinese: CHINESE,
  japanese: JAPANESE,
};

export function getLanguage(slug: string): LanguageData | null {
  return LANGUAGES[slug] ?? null;
}

export const LANGUAGE_SLUGS = Object.keys(LANGUAGES);
