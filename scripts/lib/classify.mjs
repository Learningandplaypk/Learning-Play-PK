/**
 * Lightweight English-gloss classifier — used only by the legacy migration to
 * give carried-over entries a sensible part of speech + category. Authored
 * language sources carry explicit values, so nothing depends on these heuristics.
 */

const VERBS = new Set(
  ("go come eat drink read write speak listen see look give take make do run walk sleep wake open close buy sell pay learn teach work play sing dance cook wash clean help ask answer wait find lose win start stop live love like want need know think understand remember forget call meet visit travel drive ride fly swim jump sit stand fall break cut put carry hold push pull send receive to").split(
    /\s+/
  )
);

const ADJ = new Set(
  ("big small new old fast slow good bad happy sad hot cold easy hard long short tall young rich poor clean dirty beautiful strong weak quiet loud dark bright sweet sour fresh angry tired hungry thirsty free busy important cheap expensive late early near far brave lonely dirty full empty").split(
    /\s+/
  )
);

const CAT_RULES = [
  { cat: "greetings", keys: ["hello", "good morning", "good night", "thank", "sorry", "please", "welcome", "goodbye", "bye", "peace"] },
  { cat: "numbers", keys: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "number", "zero", "hundred", "thousand"] },
  { cat: "family", keys: ["mother", "father", "sister", "brother", "son", "daughter", "uncle", "aunt", "family", "child", "wife", "husband", "grand", "parent", "friend", "neighbour", "neighbor", "man", "woman", "boy", "girl", "baby"] },
  { cat: "food", keys: ["water", "bread", "milk", "apple", "rice", "meat", "tea", "sugar", "salt", "egg", "fish", "food", "fruit", "mango", "banana", "orange", "vegetable", "oil", "flour", "chicken", "curry", "sweet", "breakfast", "lunch", "dinner", "juice", "coffee", "soup", "butter", "honey", "lemon", "onion", "tomato", "potato", "cake", "biscuit", "grape", "carrot", "eat", "drink", "hungry"] },
  { cat: "travel", keys: ["car", "bus", "train", "plane", "airplane", "road", "street", "airport", "station", "ticket", "map", "city", "village", "country", "journey", "travel", "vehicle", "bicycle", "bike", "boat", "bridge", "hotel", "luggage", "town", "sea", "mountain"] },
  { cat: "time", keys: ["day", "night", "week", "month", "year", "hour", "minute", "morning", "evening", "today", "tomorrow", "yesterday", "time", "clock", "season", "summer", "winter", "weekend", "date", "sun", "moon", "star", "always", "never", "sometimes", "now", "later"] },
  { cat: "colors", keys: ["red", "blue", "green", "yellow", "black", "white", "color", "colour", "brown", "grey", "gray", "pink", "purple", "golden", "silver"] },
  { cat: "body", keys: ["hand", "eye", "head", "heart", "leg", "foot", "arm", "ear", "nose", "mouth", "hair", "face", "finger", "tooth", "teeth", "back", "neck", "shoulder", "knee", "body", "blood", "skin", "brain", "stomach", "soul", "tongue"] },
  { cat: "home", keys: ["house", "home", "room", "door", "window", "kitchen", "bed", "table", "chair", "wall", "roof", "floor", "garden", "light", "fan", "lamp", "mirror", "key", "stairs", "bathroom", "sofa", "cupboard", "tree", "flower", "leaf", "rain", "wind", "snow"] },
  { cat: "work", keys: ["work", "job", "office", "money", "salary", "meeting", "boss", "worker", "business", "company", "duty", "career", "staff", "manager", "farmer", "shop", "market", "customer", "price", "factory", "tool", "doctor", "police", "deed"] },
  { cat: "school", keys: ["book", "pen", "school", "student", "teacher", "class", "exam", "paper", "lesson", "study", "question", "answer", "page", "library", "homework", "university", "college", "subject", "science", "history", "math", "language", "word", "letter", "sentence", "dictionary", "pencil", "bag", "board", "test", "result", "knowledge", "education", "wisdom", "mosque", "prayer", "prophet", "religion", "allah", "lord"] },
  { cat: "shopping", keys: ["buy", "sell", "cheap", "expensive", "rupee", "coin", "note", "bill", "size", "receipt", "discount", "pay", "weigh", "shopping"] },
  { cat: "emotions", keys: ["happy", "sad", "angry", "love", "fear", "afraid", "hope", "wish", "joy", "worry", "surprise", "proud", "shame", "peace", "laugh", "cry", "smile", "feel", "mood", "brave", "lonely", "patience", "truth", "goodness"] },
];

export function classifyPos(en) {
  const lower = en.toLowerCase().replace(/^to /, "");
  if (/^(i|you|he|she|it|we|they|my|your|his|her|our|their|this|that|these|those|who|what|which)$/.test(lower)) return "pron";
  if (/^(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|thirty|forty|fifty|hundred|thousand|first|second|half)$/.test(lower)) {
    return "num";
  }
  if (VERBS.has(lower.split(" ")[0]) || en.toLowerCase().startsWith("to ")) return "v";
  if (lower.endsWith("ly")) return "adv";
  if (ADJ.has(lower.split(" ")[0])) return "adj";
  return "n";
}

export function classifyCat(en, pos) {
  const lower = en.toLowerCase();
  for (const rule of CAT_RULES) {
    if (rule.keys.some((k) => lower === k || lower.includes(` ${k}`) || lower.startsWith(`${k} `))) return rule.cat;
  }
  if (pos === "v") return "verbs";
  if (pos === "adj") return "adjectives";
  return "school";
}
