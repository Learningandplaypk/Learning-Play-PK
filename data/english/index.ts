import type { Word } from "@/lib/learn-types";
import { WORDS_BASIC } from "./words-basic";
import { WORDS_MID } from "./words-mid";
import { WORDS_ADV } from "./words-adv";

export const ENGLISH_WORDS: Word[] = [...WORDS_BASIC, ...WORDS_MID, ...WORDS_ADV];

export { SENTENCES } from "./sentences";
export { GRAMMAR } from "./grammar";
export { IDIOMS } from "./idioms";
export { STORIES } from "./stories";

export function wordsByLevel(lv: 1 | 2 | 3): Word[] {
  return ENGLISH_WORDS.filter((w) => w.lv === lv);
}
