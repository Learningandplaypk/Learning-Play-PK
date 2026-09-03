/** Learning content types shared by all LessonEngine games. */

export type Word = {
  en: string;
  ur: string;
  ipa?: string;
  ex?: string;
  lv: 1 | 2 | 3;
};

export type GrammarMCQ = { q: string; o: string[]; a: number; why: string; lv: 1 | 2 | 3 };
export type Sentence = { correct: string[]; ur: string; lv: 1 | 2 | 3 };
export type Idiom = { id: string; meaning: string; ex: string; lv: 1 | 2 | 3 };
export type Story = { title: string; emoji: string; text: string; blanks: Array<{ options: string[]; a: number }> };

export type LWord = { word: string; roman: string; en: string; ur: string };
export type LPhrase = { phrase: string; roman: string; en: string; ur: string };

export type LanguageData = {
  slug: string;
  name: string;
  native: string;
  flag: string;
  code: string; // bcp47 for SpeechSynthesis
  color: string;
  words: LWord[];
  phrases: LPhrase[];
};

export const LANG_ORDER = ["english", "arabic", "turkish", "chinese", "french", "spanish", "korean", "japanese"] as const;
