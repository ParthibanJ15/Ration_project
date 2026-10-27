// Table-driven PDS data. Prices are editable estimates (₹) for Tamil Nadu,
// so policy changes can be updated here without touching the simulator logic.

export type ItemId =
  | "rice"
  | "wheat"
  | "ragi"
  | "kambu"
  | "thinai"
  | "toor_dal"
  | "channa"
  | "sugar"
  | "oil";

export type FoodItem = {
  id: ItemId;
  ta: string;
  en: string;
  emoji: string;
  unit: "kg" | "L";
  group: "grain" | "millet" | "pulse" | "other";
  marketPrice: number;
  nutrition: { sugar: number; fiber: number; fullness: number };
  advice: { ta: string; en: string };
};

export const FOODS: FoodItem[] = [
  {
    id: "rice",
    ta: "அரிசி",
    en: "Polished rice",
    emoji: "🍚",
    unit: "kg",
    group: "grain",
    marketPrice: 42,
    nutrition: { sugar: 5, fiber: 1, fullness: 2 },
    advice: {
      ta: "பளபளப்பான அரிசி சர்க்கரையை வேகமாக ஏற்றுகிறது. கொஞ்சம் குறைத்து சிறுதானியம் சேருங்கள்.",
      en: "Polished rice raises blood sugar fast. Use a little less and add millets.",
    },
  },
  {
    id: "wheat",
    ta: "கோதுமை",
    en: "Wheat",
    emoji: "🌾",
    unit: "kg",
    group: "grain",
    marketPrice: 35,
    nutrition: { sugar: 4, fiber: 2, fullness: 3 },
    advice: {
      ta: "அரிசியை விட கொஞ்சம் மேல், ஆனால் சிறுதானியம் இன்னும் நல்லது.",
      en: "A little better than rice, but millets are still better.",
    },
  },
  {
    id: "ragi",
    ta: "ராகி",
    en: "Ragi · Finger millet",
    emoji: "🌾",
    unit: "kg",
    group: "millet",
    marketPrice: 48,
    nutrition: { sugar: 2, fiber: 4, fullness: 4 },
    advice: {
      ta: "ராகி உங்கள் சர்க்கரையை நிலையாக வைக்கும், நீண்ட நேரம் வயிறு நிறைந்திருக்கும்.",
      en: "Ragi keeps your sugar steady and keeps you full for longer.",
    },
  },
  {
    id: "kambu",
    ta: "கம்பு",
    en: "Kambu · Pearl millet",
    emoji: "🌾",
    unit: "kg",
    group: "millet",
    marketPrice: 45,
    nutrition: { sugar: 2, fiber: 4, fullness: 4 },
    advice: {
      ta: "கம்பு கூழ் அல்லது தோசை செய்யலாம். சர்க்கரை மெதுவாக ஏறும்.",
      en: "Make kambu koozh or dosai. Sugar rises slowly.",
    },
  },
  {
    id: "thinai",
    ta: "தினை",
    en: "Thinai · Foxtail millet",
    emoji: "🌾",
    unit: "kg",
    group: "millet",
    marketPrice: 60,
    nutrition: { sugar: 2, fiber: 4, fullness: 4 },
    advice: {
      ta: "அரிசிக்கு பதிலாக தினை சாதம் செய்யலாம். சுவை ஒன்றுதான்.",
      en: "Cook thinai instead of rice. It tastes much the same.",
    },
  },
  {
    id: "toor_dal",
    ta: "துவரம் பருப்பு",
    en: "Toor dal",
    emoji: "🫘",
    unit: "kg",
    group: "pulse",
    marketPrice: 140,
    nutrition: { sugar: 1, fiber: 5, fullness: 5 },
    advice: {
      ta: "பருப்பு புரதம் தரும், சாதத்துடன் சேர்த்தால் சர்க்கரை குறைவாக ஏறும்.",
      en: "Dal gives protein and lowers the sugar spike from rice.",
    },
  },
  {
    id: "channa",
    ta: "கடலை பருப்பு",
    en: "Channa dal",
    emoji: "🫘",
    unit: "kg",
    group: "pulse",
    marketPrice: 90,
    nutrition: { sugar: 1, fiber: 5, fullness: 5 },
    advice: {
      ta: "மலிவான புரதம். வாரம் இரண்டு முறை சுண்டல் செய்யுங்கள்.",
      en: "Cheap protein. Make sundal twice a week.",
    },
  },
  {
    id: "sugar",
    ta: "சர்க்கரை",
    en: "Sugar",
    emoji: "🍬",
    unit: "kg",
    group: "other",
    marketPrice: 45,
    nutrition: { sugar: 5, fiber: 1, fullness: 1 },
    advice: {
      ta: "சர்க்கரை நோய் இருந்தால் முடிந்தவரை குறைக்கவும்.",
      en: "If you have diabetes, keep this as low as you can.",
    },
  },
  {
    id: "oil",
    ta: "எண்ணெய்",
    en: "Cooking oil",
    emoji: "🫗",
    unit: "L",
    group: "other",
    marketPrice: 130,
    nutrition: { sugar: 1, fiber: 1, fullness: 2 },
    advice: {
      ta: "எண்ணெய் குறைத்தால் மாதச் செலவும் குறையும்.",
      en: "Using less oil also lowers your monthly cost.",
    },
  },
];

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f])) as Record<
  ItemId,
  FoodItem
>;

export type CardTypeId = "aay" | "priority" | "nphh_sugar" | "nphh";

export type CardType = {
  id: CardTypeId;
  ta: string;
  en: string;
  emoji: string;
  /** Subsidised allowance: fixed kg plus per-member kg, at the given ₹/kg. */
  allowance: { item: ItemId; fixed: number; perMember: number; price: number }[];
};

export const CARD_TYPES: CardType[] = [
  {
    id: "aay",
    ta: "அந்த்யோதயா (AAY)",
    en: "Antyodaya — AAY",
    emoji: "🟡",
    allowance: [
      { item: "rice", fixed: 35, perMember: 0, price: 0 },
      { item: "sugar", fixed: 1, perMember: 0, price: 13.5 },
      { item: "toor_dal", fixed: 1, perMember: 0, price: 30 },
      { item: "oil", fixed: 1, perMember: 0, price: 25 },
    ],
  },
  {
    id: "priority",
    ta: "முன்னுரிமை அட்டை",
    en: "Priority household",
    emoji: "🟢",
    allowance: [
      { item: "rice", fixed: 0, perMember: 5, price: 0 },
      { item: "sugar", fixed: 0.5, perMember: 0, price: 13.5 },
      { item: "toor_dal", fixed: 1, perMember: 0, price: 30 },
      { item: "oil", fixed: 1, perMember: 0, price: 25 },
    ],
  },
  {
    id: "nphh_sugar",
    ta: "சர்க்கரை அட்டை",
    en: "No-commodity (sugar) card",
    emoji: "⚪",
    allowance: [
      { item: "sugar", fixed: 1, perMember: 0, price: 13.5 },
      { item: "oil", fixed: 1, perMember: 0, price: 25 },
    ],
  },
  {
    id: "nphh",
    ta: "பொது அட்டை",
    en: "Non-priority card",
    emoji: "⚫",
    allowance: [{ item: "sugar", fixed: 1, perMember: 0, price: 13.5 }],
  },
];

export const CARD_BY_ID = Object.fromEntries(CARD_TYPES.map((c) => [c.id, c])) as Record<
  CardTypeId,
  CardType
>;

export const DISTRICTS = [
  { ta: "திருவள்ளூர்", en: "Tiruvallur" },
  { ta: "சென்னை", en: "Chennai" },
  { ta: "காஞ்சிபுரம்", en: "Kancheepuram" },
  { ta: "வேலூர்", en: "Vellore" },
  { ta: "சேலம்", en: "Salem" },
  { ta: "ஈரோடு", en: "Erode" },
  { ta: "கோயம்புத்தூர்", en: "Coimbatore" },
  { ta: "திருப்பூர்", en: "Tiruppur" },
  { ta: "மதுரை", en: "Madurai" },
  { ta: "தஞ்சாவூர்", en: "Thanjavur" },
  { ta: "திருச்சிராப்பள்ளி", en: "Tiruchirappalli" },
  { ta: "திருநெல்வேலி", en: "Tirunelveli" },
  { ta: "தூத்துக்குடி", en: "Thoothukudi" },
  { ta: "நாகப்பட்டினம்", en: "Nagapattinam" },
  { ta: "விழுப்புரம்", en: "Villupuram" },
  { ta: "தர்மபுரி", en: "Dharmapuri" },
];
