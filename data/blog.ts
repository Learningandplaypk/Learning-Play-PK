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
  {
    slug: "german-seekhne-ke-10-free-games",
    title: "German seekhne ke 10 free games — A1 se B1 tak",
    description:
      "Study visa, Ausbildung ya sirf shauq — German games khel kar seekhna sab se tez tareeqa hai. 10 free games aur roz ka plan.",
    date: "2026-09-05",
    readMins: 7,
    emoji: "🇩🇪",
    sections: [
      {
        p: [
          "Germany ka Ausbildung aur study visa Pakistan ke students ke liye sab se barh kar mauqa hai — lekin German language ka A1/B1 certificate aksar rukawat ban jata hai. Coaching classes 40-60 hazaar rupaye leti hain aur schedule bhi fixed hota hai.",
          "Iska hal: roz 20 minute games. Vocabulary aur sentence structure tab yaad hoti hai jab dimaag reward expect kar raha ho — yehi gamification ka usool hai.",
        ],
      },
      {
        h: "1. Word Builder — der/die/das ke sath spelling",
        p: ["Urdu meaning dekh kar letter tiles se word banao. Har noun apne article ke sath aata hai (das Buch, die Lampe), isliye gender bhi sath yaad hota hai."],
      },
      {
        h: "2. Vocabulary Battle — 45 second mein 5 pairs",
        list: ["Round 1: food aur numbers", "Round 2: family aur home", "Round 3: work aur travel", "Timer pressure se recall speed barhti hai"],
      },
      {
        h: "3. Grammar Quest — cases ka RPG battle",
        p: ["Akkusativ, Dativ aur verb conjugation ke MCQs. Sahi jawab = monster ko damage, ghalat = aap ki HP kam. 60 grammar sawalat explanations ke sath."],
      },
      { h: "4. Sentence Puzzle", p: ["German ka word order (verb second position) seekhne ka sab se asaan tareeqa — jumbled words ko sahi tarteeb mein lagao."] },
      { h: "5. Listening Challenge", p: ["Native pronunciation sun kar option chuno. Agar aap ke phone mein German voice nahi toh game batata hai — audio device-dependent hai."] },
      { h: "6. Pronunciation", p: ["Mic se bol kar score lo — umlauts (ä, ö, ü) aur 'ch' ki practice ke liye."] },
      { h: "7. Idiom Master", p: ["'Ich verstehe nur Bahnhof' jaise idioms — native jaisi baat karne ke liye."] },
      { h: "8. Story Builder", p: ["Chhoti kahaniyon ke blanks bharo — context mein grammar."] },
      { h: "9-10. Brain + Typing", list: ["Memory Match se vocabulary recall", "Typing game se German keyboard ki speed"] },
      {
        h: "Roz ka 20-minute plan",
        list: ["5 min: Word Builder (naye words)", "5 min: Vocabulary Battle (recall)", "5 min: Grammar Quest (structure)", "5 min: Listening ya Pronunciation (bolna)"],
      },
      {
        h: "Kitne words chahiye?",
        p: ["Goethe A1 ke liye taqreeban 600-700 words, A2 ke liye 1,300. Humare German pack mein 300 core words hain — roz 10 naye words, 30 din mein A1 ka vocabulary base taiyar."],
      },
      { p: ["Sab kuch free hai: /learn/german par jao, language apne hub mein add karo aur shuru kar do."] },
    ],
  },
  {
    slug: "apni-zubaan-pashto-punjabi-sindhi-seekho",
    title: "Pashto, Punjabi aur Sindhi — apni zubaan likhna seekho",
    description:
      "Bachon ko apni maan zubaan likhna kaise sikhayein? Shahmukhi, Pashto aur Sindhi scripts, romanization aur free games ke sath.",
    date: "2026-09-03",
    readMins: 6,
    emoji: "🖋️",
    sections: [
      {
        p: [
          "Pakistan mein 3 se zyada bari maan zubaanein hain — Punjabi (taqreeban 40%), Pashto aur Sindhi. Lekin school mein sirf Urdu aur English likhi jati hai, aur natija yeh hai ke teesri nasl apni zubaan bol leti hai magar likh nahi sakti.",
          "Achhi khabar: teenon zubanein Arabic script par mabni hain (Punjabi ka Shahmukhi roop), isliye jo Urdu parh leta hai usay sirf chand naye huroof seekhne hain.",
        ],
      },
      {
        h: "Punjabi (Shahmukhi)",
        list: [
          "Urdu ki tarah right-to-left likhi jati hai",
          "Naye huroof: ٹ, ڈ, ڑ, ل਼ਮ — tones ka farq inhi se aata hai",
          "'ਮੈਂ' (Gurmukhi) = 'میں' (Shahmukhi) — dono scripts ek hi zubaan",
          "Humare pack mein 300 words + phrases, Nastaliq font ke sath",
        ],
      },
      {
        h: "Pashto",
        list: [
          "پښتو ke apne huroof hain: ښ (xe), ږ (ge), ټ, ډ, ړ, ڼ",
          "Do mukhya dialects: Yusufzai (North) aur Kandahari (South)",
          "Sentence structure Urdu se milta julta hai — subject object verb",
        ],
      },
      {
        h: "Sindhi",
        list: [
          "52 huroof — sab se zyada Arabic script par mabni zubaanon mein",
          "Khas huroof: ٺ, ٽ, ڀ, ڄ, ڃ, ڏ, ڌ, ڍ, ڇ, ڊ, ڙ, ڪ, ڳ, ڱ, ڻ",
          "Shah Abdul Latif Bhittai ki zubaan — Sindhi literature UNESCO-recognized hai",
        ],
      },
      {
        h: "Bachon ko kaise sikhayein",
        list: [
          "Roz 5 minute — Word Builder se 5 naye words",
          "Script primer se naye huroof ki pehchan",
          "Ghar mein labels lagao: دروازہ, کھڑکی, پانی — apni zubaan mein",
          "Bade buzurgon se kahaniyan suno aur naye words note karo",
        ],
      },
      {
        h: "Balochi bhi shamil",
        p: ["Balochi pack bhi available hai — 300 core words, phrases aur grammar, Naskh font ke sath. /learn par 'Add a language' se apne hub mein add karo."],
      },
      {
        p: [
          "Maan zubaan seekhna sirf nostalgia nahi — research batati hai ke bilingual bachon ki memory aur problem-solving behtar hoti hai. Aur yeh sab bilkul free hai.",
        ],
      },
    ],
  },
  {
    slug: "hindi-vs-urdu-kya-farq-hai",
    title: "Hindi vs Urdu — kya farq hai? Script, vocabulary aur samajh",
    description:
      "Hindi aur Urdu ek hi boli hain? Script ka farq, Devanagari vs Nastaliq, Sanskrit aur Persian vocabulary — aur seekhne wale ke liye iska matlab.",
    date: "2026-09-01",
    readMins: 6,
    emoji: "🔤",
    sections: [
      {
        p: [
          "Agar aap ek Pakistani se Hindi aur ek Indian se Urdu bulwayein, toh dono 90% tak ek dusre ko samajh lenge. Bolaai (Hindustani) taqreeban ek hi hai — farq likhai aur kuch vocabulary ka hai.",
        ],
      },
      {
        h: "1. Script",
        list: [
          "Hindi: Devanagari — left to right, har letter ke upar shirorekha (head-stroke)",
          "Urdu: Nastaliq — right to left, letters jore jate hain",
          "Romanized (Hinglish/Roman Urdu) mein dono ek jaisi lagti hain",
        ],
      },
      {
        h: "2. Vocabulary ka rujhan",
        list: [
          "Urdu: Persian, Arabic aur Turkish se — 'muhabbat', 'kitab', 'shukriya', 'darwaza'",
          "Hindi: Sanskrit se — 'prem', 'pustak', 'dhanyavad', 'dwar'",
          "Roz-marra ki boli mein farq bohat kam: pani, roti, ghar, aana, jana — sab ek",
        ],
      },
      {
        h: "3. Grammar",
        p: ["Dono mein gender hai, postpositions hain, aur sentence structure subject-object-verb hai. 'Main school ja raha hoon' — Hindi aur Urdu dono mein barabar."],
      },
      {
        h: "4. Seekhne wale ke liye matlab",
        list: [
          "Urdu aati hai to Hindi bolna asaan — sirf Devanagari parhna seekhna hai",
          "Bollywood/Hindustani content dono ke liye samajh aata hai",
          "Formal likhai mein farq barh jata hai — akhbar aur kitaabein alag vocabulary use karti hain",
        ],
      },
      {
        h: "Humne kya kiya",
        p: [
          "Learn & Play PK par dono alag packs hain: /learn/urdu (Nastaliq, ur-PK voice) aur /learn/hindi (Devanagari, hi-IN voice). Har pack mein 300 words, phrases, grammar MCQs, jumbled sentences, listening items, kahaniyan aur mahaware — Urdu meanings ke sath.",
          "Fonts bhi alag: Urdu/Punjabi ke liye Noto Nastaliq, Hindi ke liye Noto Sans Devanagari — dono self-hosted, isliye koi CDN dependency nahi.",
        ],
      },
      { p: ["Nateeja: farq hai, magar darwaza ek hi hai. Koi bhi ek seekh lo — doosri 70% khud samajh aane lagegi."] },
    ],
  },
];
