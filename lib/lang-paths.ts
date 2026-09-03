export const LANG_PATHS = ["english", "arabic", "turkish", "chinese", "french", "spanish", "korean", "japanese"];

export function langLabel(slug: string): string | null {
  const map: Record<string, string> = {
    english: "English",
    arabic: "Arabic",
    turkish: "Turkish",
    chinese: "Chinese",
    french: "French",
    spanish: "Spanish",
    korean: "Korean",
    japanese: "Japanese",
  };
  return map[slug] ?? null;
}

export function langFlag(slug: string): string {
  const map: Record<string, string> = {
    english: "🇬🇧", arabic: "🇸🇦", turkish: "🇹🇷", chinese: "🇨🇳", french: "🇫🇷", spanish: "🇪🇸", korean: "🇰🇷", japanese: "🇯🇵",
  };
  return map[slug] ?? "🌍";
}
