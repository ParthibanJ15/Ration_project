import { CARD_BY_ID, FOOD_BY_ID, FOODS, type CardTypeId, type ItemId } from "./pds-data";

export type Basket = Partial<Record<ItemId, number>>;

export type Household = {
  district: string;
  cardType: CardTypeId;
  adults: number;
  children: number;
  diabetes: "yes" | "no" | "unsure";
};

export function members(h: Pick<Household, "adults" | "children">) {
  return Math.max(1, h.adults + h.children);
}

/** Subsidised kg + price available for one item this month. */
export function allowanceFor(cardType: CardTypeId, item: ItemId, memberCount: number) {
  const row = CARD_BY_ID[cardType].allowance.find((a) => a.item === item);
  if (!row) return { kg: 0, price: 0 };
  return { kg: row.fixed + row.perMember * memberCount, price: row.price };
}

/** Monthly cost of a basket: subsidised quantity first, remainder at market price. */
export function basketCost(basket: Basket, h: Household) {
  const m = members(h);
  let total = 0;
  for (const [id, qty] of Object.entries(basket) as [ItemId, number][]) {
    if (!qty) continue;
    const { kg, price } = allowanceFor(h.cardType, id, m);
    const subsidised = Math.min(qty, kg);
    const extra = Math.max(0, qty - kg);
    total += subsidised * price + extra * FOOD_BY_ID[id].marketPrice;
  }
  return Math.round(total);
}

/** "Typical" basket if the household simply takes its entitlement. */
export function defaultBasket(h: Household): Basket {
  const m = members(h);
  const basket: Basket = {};
  for (const item of FOODS) {
    const { kg } = allowanceFor(h.cardType, item.id, m);
    if (kg > 0) basket[item.id] = round(kg);
  }
  basket.rice = round(Math.max(basket.rice ?? 0, m * 5));
  basket.toor_dal = round(Math.max(basket.toor_dal ?? 0, 1));
  basket.oil = round(Math.max(basket.oil ?? 0, 1));
  basket.sugar = round(basket.sugar ?? 1);
  return basket;
}

const round = (n: number) => Math.round(n * 2) / 2;

export type Scenario = {
  id: "gentle" | "balanced" | "bold" | "cheapest";
  ta: string;
  en: string;
  basket: Basket;
  cost: number;
};

/** Move a share of rice into millets, and lift pulses a little. */
function swap(current: Basket, share: number, pulseBoost: number): Basket {
  const rice = current.rice ?? 0;
  const moved = round(rice * share);
  const half = round(moved / 2);
  return {
    ...current,
    rice: round(rice - moved),
    ragi: round((current.ragi ?? 0) + half),
    kambu: round((current.kambu ?? 0) + (moved - half)),
    toor_dal: round((current.toor_dal ?? 0) + pulseBoost),
    channa: round((current.channa ?? 0) + pulseBoost),
  };
}

export function buildScenarios(current: Basket, h: Household): Scenario[] {
  const make = (
    id: Scenario["id"],
    ta: string,
    en: string,
    share: number,
    pulseBoost: number,
  ): Scenario => {
    const basket = swap(current, share, pulseBoost);
    return { id, ta, en, basket, cost: basketCost(basket, h) };
  };

  return [
    make("gentle", "சிறிய மாற்றம்", "Small change", 0.2, 0.5),
    make("balanced", "சமநிலை", "Balanced", 0.4, 1),
    make("bold", "அதிக சிறுதானியம்", "More millets", 0.6, 1),
    make("cheapest", "மலிவான நல்ல வழி", "Cheapest healthy", 0.3, 0),
  ];
}

/** Pick the healthiest scenario that still fits the budget. */
export function bestWithinBudget(scenarios: Scenario[], budget: number | null) {
  if (budget == null) return scenarios[1]!;
  const order: Scenario["id"][] = ["bold", "balanced", "gentle", "cheapest"];
  for (const id of order) {
    const s = scenarios.find((x) => x.id === id);
    if (s && s.cost <= budget) return s;
  }
  return scenarios.find((s) => s.id === "cheapest")!;
}

/** Shave the plan down until it fits the budget: millets back to rice, then oil. */
export function makeCheaper(basket: Basket, h: Household, budget: number): Basket {
  const next = { ...basket };
  for (let i = 0; i < 40; i++) {
    if (basketCost(next, h) <= budget) break;
    if ((next.thinai ?? 0) > 0) next.thinai = round((next.thinai ?? 0) - 0.5);
    else if ((next.ragi ?? 0) > 0) {
      next.ragi = round((next.ragi ?? 0) - 0.5);
      next.rice = round((next.rice ?? 0) + 0.5);
    } else if ((next.kambu ?? 0) > 0) {
      next.kambu = round((next.kambu ?? 0) - 0.5);
      next.rice = round((next.rice ?? 0) + 0.5);
    } else if ((next.channa ?? 0) > 0) next.channa = round((next.channa ?? 0) - 0.5);
    else if ((next.oil ?? 0) > 0.5) next.oil = round((next.oil ?? 0) - 0.5);
    else break;
  }
  return next;
}

export function totals(basket: Basket) {
  let millet = 0;
  let pulses = 0;
  let rice = 0;
  for (const [id, qty] of Object.entries(basket) as [ItemId, number][]) {
    const g = FOOD_BY_ID[id].group;
    if (g === "millet") millet += qty ?? 0;
    if (g === "pulse") pulses += qty ?? 0;
    if (id === "rice") rice += qty ?? 0;
  }
  return { millet, pulses, rice };
}

export function budgetStatus(cost: number, budget: number | null) {
  if (budget == null) return "unknown" as const;
  if (cost <= budget) return "ok" as const;
  if (cost <= budget * 1.1) return "close" as const;
  return "over" as const;
}
