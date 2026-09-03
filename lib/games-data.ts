/** Server-safe game catalog (no components) — used by static pages for metadata + params. */

export type ZoneKey = "learn" | "brain" | "quiz" | "fun";

export type GameData = {
  slug: string;
  zone: ZoneKey;
  title: string;
  desc: string;
  emoji: string;
  howTo: string[];
  langs?: string[];
};

const ALL_LANGS = ["english", "arabic", "turkish", "chinese", "french", "spanish", "korean", "japanese"];
const EN_ONLY = ["english"];

export const LEARN_GAME_DATA: GameData[] = [
  { slug: "word-builder", zone: "learn", title: "Word Builder", desc: "Letter tiles se word banao — Urdu meaning dekh kar.", emoji: "🔤", howTo: ["Urdu meaning parho", "Letter tiles tap karke word banao", "8 words theek banao"], langs: ALL_LANGS },
  { slug: "grammar-quest", zone: "learn", title: "Grammar Quest", desc: "RPG battle! Sahi jawab se monster ko hit karo.", emoji: "⚔️", howTo: ["Sahi jawab chuno — monster ko damage", "Streak = double damage", "3 galtiyan = khatam"], langs: EN_ONLY },
  { slug: "vocab-battle", zone: "learn", title: "Vocabulary Battle", desc: "Timer ke against word-meaning pairs milao.", emoji: "🃏", howTo: ["Word aur Urdu meaning match karo", "45 sec mein 5 pairs", "3 rounds"], langs: ALL_LANGS },
  { slug: "sentence-puzzle", zone: "learn", title: "Sentence Puzzle", desc: "Jumbled words ko sahi tarteeb mein lagao.", emoji: "🧩", howTo: ["Urdu translation parho", "Words tap karke jumla banao", "Undo bhi hota hai"], langs: ALL_LANGS },
  { slug: "listening-challenge", zone: "learn", title: "Listening Challenge", desc: "Sun kar sahi word/jumla pehchano.", emoji: "🎧", howTo: ["Speaker tap karke suno", "Sahi option chuno", "Kam replays = zyada score"], langs: ALL_LANGS },
  { slug: "idiom-master", zone: "learn", title: "Idiom Master", desc: "English idioms ke matlab pehchano.", emoji: "🗣️", howTo: ["Idiom parho", "Sahi matlab chuno", "Example sath milega"], langs: EN_ONLY },
  { slug: "story-builder", zone: "learn", title: "Story Builder", desc: "Kahani ke blanks bharo.", emoji: "📖", howTo: ["Blank ke liye word chuno", "2 stories per round", "Perfect = bonus"], langs: EN_ONLY },
  { slug: "pronunciation", zone: "learn", title: "Pronunciation", desc: "Word ko clearly bolein — mic score dega.", emoji: "🎤", howTo: ["Word parho", "Mic tap karke bolein", "72%+ = pass"], langs: ALL_LANGS },
];

export const BRAIN_GAME_DATA: GameData[] = [
  { slug: "memory", zone: "brain", title: "Memory Match", desc: "3D flipping cards — pairs match karo.", emoji: "🧠", howTo: ["Card tap karke kholein", "Same pair dhundo", "Kam moves = zyada XP"] },
  { slug: "math-speed", zone: "brain", title: "Math Speed", desc: "60 second mein jitne hisaab kar sako.", emoji: "➗", howTo: ["Jawab type karo", "Har 5 sahi = level up", "Tez + sahi = zyada score"] },
  { slug: "reaction", zone: "brain", title: "Reaction Time", desc: "Green dekha aur tap kiya? Kitne fast ho?", emoji: "⚡", howTo: ["Tap karke shuru", "Green par foran tap", "5 rounds average"] },
  { slug: "stroop", zone: "brain", title: "Color Challenge", desc: "Stroop test — dimaagh ko dhoka mat do.", emoji: "🎨", howTo: ["INK ka rang dekho", "Word ke matlab se match?", "✓ / ✗ — 45 sec"] },
  { slug: "sequence", zone: "brain", title: "Sequence Memory", desc: "Simon ka pattern yaad rakho.", emoji: "🔔", howTo: ["Pattern dekho", "Repeat karo", "Har round lamba"] },
  { slug: "g2048", zone: "brain", title: "2048", desc: "Tiles joro, 2048 tak pohancho.", emoji: "🔢", howTo: ["Swipe/arrows", "Same numbers merge", "2048 banao!"] },
  { slug: "sudoku", zone: "brain", title: "Sudoku", desc: "Unique generated puzzles, 3 levels.", emoji: "⭕", howTo: ["Level chuno", "Cell + number", "1-9 har row/column/box"] },
  { slug: "chess", zone: "brain", title: "Chess vs AI", desc: "Minimax AI ke khilaf shatranj.", emoji: "♟️", howTo: ["Tum white", "Tap + green dot par rakho", "Checkmate karo!"] },
  { slug: "pattern", zone: "brain", title: "Pattern Master", desc: "Shape sequence ka agla step.", emoji: "🔷", howTo: ["Pattern dekho", "Agla shape chuno", "10 rounds"] },
  { slug: "logic", zone: "brain", title: "Logic Puzzles", desc: "Riddles aur paheliyan.", emoji: "🧩", howTo: ["Paheli parho", "Sahi option chuno", "Wazahat milti hai"] },
];

export const QUIZ_TOPIC_DATA: GameData[] = [
  { slug: "gk", zone: "quiz", title: "General Knowledge Quiz", desc: "Duniya ka aam maloomat — mixed bag.", emoji: "🌍", howTo: ["10 sawalat × 20 sec", "Sahi = +10 + streak bonus", "Wazahat bhi milegi"] },
  { slug: "pakistan", zone: "quiz", title: "Pakistan Quiz", desc: "Quaid, tarikh, geography — sab kuch.", emoji: "🇵🇰", howTo: ["10 sawalat × 20 sec", "Sahi = +10 + streak bonus", "Wazahat bhi milegi"] },
  { slug: "science", zone: "quiz", title: "Science Quiz", desc: "Physics, chemistry, biology.", emoji: "🔬", howTo: ["10 sawalat × 20 sec", "Sahi = +10 + streak bonus", "Wazahat bhi milegi"] },
  { slug: "islamic", zone: "quiz", title: "Islamic Quiz", desc: "Deen ke aham maloomat.", emoji: "🕌", howTo: ["10 sawalat × 20 sec", "Sahi = +10 + streak bonus", "Wazahat bhi milegi"] },
  { slug: "history", zone: "quiz", title: "History Quiz", desc: "Tareekh ke aham mor.", emoji: "🏛️", howTo: ["10 sawalat × 20 sec", "Sahi = +10 + streak bonus", "Wazahat bhi milegi"] },
  { slug: "geography", zone: "quiz", title: "Geography Quiz", desc: "Mulk, pahar, samandar.", emoji: "🗺️", howTo: ["10 sawalat × 20 sec", "Sahi = +10 + streak bonus", "Wazahat bhi milegi"] },
  { slug: "sports", zone: "quiz", title: "Sports Quiz", desc: "Cricket-heavy, Olympics samet.", emoji: "🏏", howTo: ["10 sawalat × 20 sec", "Sahi = +10 + streak bonus", "Wazahat bhi milegi"] },
  { slug: "tech", zone: "quiz", title: "Tech Quiz", desc: "Computer, internet, AI.", emoji: "💻", howTo: ["10 sawalat × 20 sec", "Sahi = +10 + streak bonus", "Wazahat bhi milegi"] },
  { slug: "movies", zone: "quiz", title: "Lollywood & More Quiz", desc: "Films, drama, music.", emoji: "🎬", howTo: ["10 sawalat × 20 sec", "Sahi = +10 + streak bonus", "Wazahat bhi milegi"] },
  { slug: "millionaire", zone: "quiz", title: "Kon Banega Crorepati", desc: "15 sawalat, 7 checkpoints, 3 lifelines.", emoji: "💰", howTo: ["15 sawalat ki ladder", "3 lifelines", "Checkpoints par paisa safe"] },
];

export const FUN_GAME_DATA: GameData[] = [
  { slug: "snake3d", zone: "fun", title: "Snake 3D", desc: "Neon 3D snake — phal khao, barha karo.", emoji: "🐍", howTo: ["Arrows / swipe", "Pink phal khao", "Takrana mana hai!"] },
  { slug: "tetris", zone: "fun", title: "Tetris", desc: "Classic block puzzle — neon style.", emoji: "🧱", howTo: ["← → move, ↑ rotate", "↓ soft, Space hard drop", "Line bharo"] },
  { slug: "flappy", zone: "fun", title: "Flappy Neon", desc: "Tap karo, pipes se guzro.", emoji: "🐤", howTo: ["Tap = uchhalo", "Pipes se guzro", "Har pipe = 1 point"] },
  { slug: "tictactoe", zone: "fun", title: "Tic Tac Toe 3D", desc: "3D board par perfect AI ke khilaf.", emoji: "⭕", howTo: ["Tum X", "Tile tap karo", "3 line banao"] },
  { slug: "connect4", zone: "fun", title: "Connect 4", desc: "4 disc ek line mein lagao.", emoji: "🔴", howTo: ["Column tap karo", "4 ek line", "AI depth-4"] },
  { slug: "hangman", zone: "fun", title: "Hangman", desc: "Word guess karo — galti jaan le.", emoji: "🎯", howTo: ["Urdu hint dekho", "Letters guess", "6 galtiyan max"] },
  { slug: "wordsearch", zone: "fun", title: "Word Search", desc: "Chhupe huay words dhoondo.", emoji: "🔍", howTo: ["Words grid mein hain", "Drag karke select", "7 words dhundo"] },
  { slug: "minesweeper", zone: "fun", title: "Minesweeper", desc: "Classic bomb game — logic se jeeto.", emoji: "💣", howTo: ["Tap = khodo", "Long-press = flag", "Numbers = aas paas bombs"] },
  { slug: "typing", zone: "fun", title: "Typing Speed", desc: "WPM test — Roman Urdu + English.", emoji: "⌨️", howTo: ["Text type karo", "Galtiyan laal", "Tez + sahi = XP"] },
  { slug: "bubble", zone: "fun", title: "Bubble Shooter", desc: "Aim karo, chalao, phoro.", emoji: "🫧", howTo: ["Tap = shoot", "3+ same rang phate", "Jhoolte = bonus"] },
  { slug: "fruitninja", zone: "fun", title: "Fruit Ninja", desc: "Swipe karke phal kaato!", emoji: "🍉", howTo: ["Swipe = blade", "Phal kato", "Bombs se bacho"] },
  { slug: "jumble", zone: "fun", title: "Word Jumble", desc: "Ulte-palte letters ka word.", emoji: "🔀", howTo: ["Letters dekho", "Word type karo", "Hint = Urdu"] },
  { slug: "racing", zone: "fun", title: "Neon Racer", desc: "Endless 3D highway.", emoji: "🏎️", howTo: ["← → / swipe", "Blocks se bacho", "Door tak bhaago"] },
  { slug: "crossword", zone: "fun", title: "Crossword", desc: "Urdu clues se crossword bharo.", emoji: "✒️", howTo: ["Clues parho", "Letters likho", "Check dabao"] },
  { slug: "g2048", zone: "fun", title: "2048", desc: "Tiles joro, 2048 tak pohancho.", emoji: "🔢", howTo: ["Swipe/arrows", "Merge karo", "2048 banao"] },
];

export const ALL_GAME_DATA: GameData[] = [...LEARN_GAME_DATA, ...BRAIN_GAME_DATA, ...QUIZ_TOPIC_DATA, ...FUN_GAME_DATA];

export function getGameData(slug: string): GameData | undefined {
  return ALL_GAME_DATA.find((g) => g.slug === slug);
}
