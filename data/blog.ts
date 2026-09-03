/** Blog posts — structured content (SEO, no MDX runtime needed). */
export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMins: number;
  emoji: string;
  sections: Array<{ h?: string; p?: string[]; list?: string[] }>;
};

export const POSTS: BlogPost[] = [
  {
    slug: "english-seekhne-ke-10-games",
    title: "English seekhne ke 10 games — bina bore hue",
    description: "Grammar ke rules ratta lagaye bagair, games khel kar English kaise seekhein — 10 tested tareeqay.",
    date: "2026-08-20",
    readMins: 6,
    emoji: "🎮",
    sections: [
      { p: ["English seekhna Pakistan mein har student ki zaroorat hai — lekin heavy grammar books se sab bhaagtay hain. Achhi khabar: dimaag games se zyada tez seekhta hai kyunki reward system engagement banata hai."] },
      { h: "1. Word Builder se vocabulary", list: ["Roz 8 words — letter tiles se spelling bhi yaad hoti hai", "Urdu meaning pehle parho, phir word banao"] },
      { h: "2. Grammar Quest = RPG battle", p: ["Monster ko hit karne ke liye grammar ka sahi jawab do. Pata bhi nahi chalta aur tenses clear ho gaye."] },
      { h: "3-10. Baaki games", list: ["Vocabulary Battle — matching se pairs yaad", "Sentence Puzzle — word order ka sense", "Listening Challenge — sun kar samajhna", "Pronunciation — mic se bolne ki practice", "Idiom Master — native jaisi baat", "Story Builder — context mein words", "2048 aur Memory — dimaag tez", "Typing — speed + spelling"] },
      { p: ["Roz sirf 15 minute — 30 din mein farq khud nazar aayega. Learn & Play PK par yeh sab bilkul free hai."] },
    ],
  },
  {
    slug: "arabic-seekhna-quran-ke-liye",
    title: "Quran samajhne ke liye Arabic — 50 words se shuruaat",
    description: "Quranic Arabic ke sab se zyada aane wale words — Urdu meanings ke sath. 50 words = Quran ki 50% tashkeel.",
    date: "2026-08-05",
    readMins: 5,
    emoji: "🕌",
    sections: [
      { p: ["Quran Pak ke taqreeban 77,000 words hain, magar un mein se sirf ~300 words baar baar aate hain. Matlab: thode se words seekh kar aap Quran ki bohot samajh hasil kar sakte hain."] },
      { h: "Pehle 50 words", p: ["Allah, Rabb, Rahman, Raheem, Yawm, Deen, Qalb, Nafs, Sabr, Salaat... — Learn & Play PK ke Arabic section mein yeh sab Urdu meanings aur ayah context ke sath hain."] },
      { h: "Kaise yaad rakhein", list: ["Har word ka apna card — 3 dafa dekho", "Quran mein sunte waqt word dhoondo", "Roz 5 naye, puranay dohrate jao", "Listening Challenge se talaffuz theek karo"] },
      { p: ["Tarjuma parhne se behtar hai ke lafz ka matlab dil mein utar jaye. 30 din ka plan banayein — roz 5 words."] },
    ],
  },
  {
    slug: "streak-psychology",
    title: "Streak ka psychology — aadat kaise banti hai",
    description: "21 din ka science: streak systems aadat kaise banate hain aur aap apna streak kaise bachayein.",
    date: "2026-07-22",
    readMins: 4,
    emoji: "🔥",
    sections: [
      { p: ["Dopamine sirf reward par nahi — expectation par bhi release hota hai. Isi liye daily chest aur streak fire itna effective hai."] },
      { h: "3 rules", list: ["Roz thora — 1 game bhi chalega (5 min)", "Waqt pakka karo — subah chai ke baad ya raat sonay se pehle", "Miss ho jaye toh Streak Freeze use karo — guilt se quit log sab se zyada hotay hain"] },
      { p: ["Learn & Play PK par streak freeze shop mein 60 coins ka milta hai, aur din 7 ke daily chest mein free milta hai. Aaj se shuru karein — 30 din baad khud hairan honge."] },
    ],
  },
  {
    slug: "sudoku-seekhne-ka-tareeqa",
    title: "Sudoku 7 din mein — beginner se pro",
    description: "Sudoku ke basic techniques: scanning, singles, pairs. Har level ka tareeqa.",
    date: "2026-07-10",
    readMins: 5,
    emoji: "🔢",
    sections: [
      { p: ["Sudoku math nahi — logic hai. 1-9 har row, column aur 3×3 box mein sirf ek dafa. Bas!"] },
      { h: "Din 1-2: Scanning", p: ["Jo number sab se zyada bhara ho us se shuru karo. Kis kis row/column/box mein woh nahi hai — wahan jagah dhoondo."] },
      { h: "Din 3-4: Naked Singles", p: ["Jis cell mein sirf ek number possible ho, wo pakka likho. Notes mode use karo (humare Sudoku mein hota hai)."] },
      { h: "Din 5-7: Pairs", p: ["Do cells mein sirf do hi numbers possible hon toh woh numbers baaki cells se hat jate hain. Easy level se Hard level tak practice karein."] },
    ],
  },
  {
    slug: "mobile-gaming-pakistan",
    title: "Pakistan mein mobile gaming ka ueej — data aur trends",
    description: "Pakistan ke 60%+ internet users mobile gaming khelte hain. Data rates, 4G coverage aur local content ka asar.",
    date: "2026-06-28",
    readMins: 6,
    emoji: "📱",
    sections: [
      { p: ["Pakistan mein 190 million+ mobile subscribers hain aur sab se tez barhne wala segment casual/educational gaming hai. Sasta 4G aur budget phones ne gaming ko har ghar pohancha diya hai."] },
      { h: "Kya chalta hai", list: ["Chhoti file size — 50MB se kam", "Offline mode — load shedding ka jawab", "Roman Urdu UI — English-only apps se 2x engagement", "Streaks aur leaderboards — competition ka maza"] },
      { h: "Learn & Play PK ka approach", p: ["Humne PWA banaya — install karo aur 2MB se kam. Games browser mein chalte hain, offline bhi. Local language support full."] },
    ],
  },
];
