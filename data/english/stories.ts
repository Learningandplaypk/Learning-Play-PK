import type { Story } from "@/lib/learn-types";

/** Interactive stories with fill-in-the-blank choices — 10 stories. */
export const STORIES: Story[] = [
  {
    title: "The Clever Crow",
    emoji: "🐦",
    text: "A thirsty crow ___ (1) the village. He saw a jug with a little water at the ___. He picked small stones and ___ them into the jug one by one. The water ___ up, and the crow drank happily and flew away.",
    blanks: [
      { options: ["flew to", "fly", "flying"], a: 0 },
      { options: ["top", "bottom", "sky"], a: 1 },
      { options: ["ate", "dropped", "sold"], a: 1 },
      { options: ["rose", "fell", "hid"], a: 0 },
    ],
  },
  {
    title: "Cricket Under the Sun",
    emoji: "🏏",
    text: "Every Sunday, Ali ___ cricket with his friends. Last week, the final over was tense. His friend bowled a fast ___. Ali swung hard and ___ six runs! Everyone ___ and cheered for him.",
    blanks: [
      { options: ["play", "plays", "played"], a: 1 },
      { options: ["yorker", "samosa", "chappal"], a: 0 },
      { options: ["hit", "hits", "hitting"], a: 0 },
      { options: ["cried", "slept", "jumped"], a: 2 },
    ],
  },
  {
    title: "A Visit to Hunza",
    emoji: "🏔️",
    text: "Last summer, our family ___ to Hunza. The mountains were ___ than I imagined. We ___ apricots and fresh bread. At night, the stars ___ like diamonds in the sky.",
    blanks: [
      { options: ["travel", "travels", "travelled"], a: 2 },
      { options: ["tallest", "taller", "tall"], a: 1 },
      { options: ["ate", "eaten", "eating"], a: 0 },
      { options: ["shine", "shines", "shining"], a: 0 },
    ],
  },
  {
    title: "The Lost Wallet",
    emoji: "👛",
    text: "On his way home, Bilal ___ a wallet on the road. It ___ money and an ID card. He ___ the owner through the ID address. The old man was so ___ that he gifted Bilal a new cricket bat.",
    blanks: [
      { options: ["found", "find", "finding"], a: 0 },
      { options: ["contained", "contains", "contain"], a: 0 },
      { options: ["track", "tracked", "tracking"], a: 1 },
      { options: ["angry", "grateful", "sleepy"], a: 1 },
    ],
  },
  {
    title: "Ramzan Nights",
    emoji: "🌙",
    text: "During Ramzan, we ___ before sunrise for sehri. The whole day we ___ without food or water. At iftar, the smell of samosas ___ the whole house. After Maghrib, everyone ___ to the mosque for Taraweeh.",
    blanks: [
      { options: ["woke up", "sleep", "dance"], a: 0 },
      { options: ["fast", "feast", "fight"], a: 0 },
      { options: ["filled", "empty", "burned"], a: 0 },
      { options: ["avoided", "walked", "drove"], a: 1 },
    ],
  },
  {
    title: "The Brave Kitten",
    emoji: "🐱",
    text: "A little kitten was ___ under the heavy rain. Sara heard a soft ___ and ran outside. She wrapped the kitten in a ___ towel and fed it warm milk. Soon it was ___ again and started to purr.",
    blanks: [
      { options: ["drying", "trembling", "sleeping"], a: 1 },
      { options: ["noise", "song", "joke"], a: 0 },
      { options: ["wet", "dry", "broken"], a: 1 },
      { options: ["hungry", "angry", "healthy"], a: 2 },
    ],
  },
  {
    title: "The Football Final",
    emoji: "⚽",
    text: "Our school team ___ the district final. In the last minute, the goalkeeper ___ an amazing save. The referee ___ the whistle and we ___ the trophy high in the air.",
    blanks: [
      { options: ["reached", "reach", "reaching"], a: 0 },
      { options: ["make", "made", "making"], a: 1 },
      { options: ["blow", "blew", "blown"], a: 1 },
      { options: ["lifted", "dropped", "hid"], a: 0 },
    ],
  },
  {
    title: "Grandmother's Wisdom",
    emoji: "👵",
    text: "My grandmother always ___ us stories after Maghrib. She says, 'Time is like a ___ — use it wisely or lose it.' Her words ___ with me forever. I try to ___ every moment of my day.",
    blanks: [
      { options: ["tell", "tells", "told"], a: 1 },
      { options: ["treasure", "trash", "toy"], a: 0 },
      { options: ["stay", "stays", "staying"], a: 1 },
      { options: ["waste", "value", "forget"], a: 1 },
    ],
  },
  {
    title: "The Markhor of Chitral",
    emoji: "🐐",
    text: "High in the mountains of Chitral lives the markhor, our national ___. It can ___ on steep cliffs easily. Poachers once ___ its numbers, but rangers now ___ it carefully.",
    blanks: [
      { options: ["animal", "tree", "river"], a: 0 },
      { options: ["climb", "swim", "fly"], a: 0 },
      { options: ["increased", "reduced", "counted"], a: 1 },
      { options: ["ignore", "protect", "sell"], a: 1 },
    ],
  },
  {
    title: "First Day at School",
    emoji: "🎒",
    text: "On my first day at school, I felt very ___. My mother ___ my hand tightly. My teacher welcomed us with a warm ___. By lunch break, I had already ___ two new friends.",
    blanks: [
      { options: ["nervous", "angry", "hungry"], a: 0 },
      { options: ["left", "held", "painted"], a: 1 },
      { options: ["smile", "book", "umbrella"], a: 0 },
      { options: ["lost", "made", "broke"], a: 1 },
    ],
  },
];
