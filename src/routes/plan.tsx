import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { BudgetBar } from "@/components/BudgetBar";
import { FoodInfo } from "@/components/FoodInfo";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";
import { CARD_BY_ID, DISTRICTS, FOOD_BY_ID, FOODS, type ItemId } from "@/lib/pds-data";
import {
  basketCost,
  bestWithinBudget,
  buildScenarios,
  defaultBasket,
  makeCheaper,
  members,
  totals,
  type Basket,
} from "@/lib/simulator";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Basket simulator — RationRebalance" },
      {
        name: "description",
        content:
          "Compare your current ration basket with a healthier one: less polished rice, more millets and pulses, with live cost and budget checks.",
      },
      { property: "og:title", content: "Basket simulator — RationRebalance" },
      {
        property: "og:description",
        content: "Adjust rice, millets and pulses and watch the monthly cost update instantly.",
      },
    ],
  }),
  component: PlanPage,
});

const PLAN_ITEMS: ItemId[] = ["rice", "ragi", "kambu", "thinai", "toor_dal", "channa", "oil"];

function PlanPage() {
  const { state, update, t, loaded } = useApp();
  const lang = state.lang;
  const h = state.household;
  const [selected, setSelected] = useState<ItemId>("ragi");
  const [plan, setPlan] = useState<Basket>({});

  const current = useMemo(
    () => (Object.keys(state.current).length ? state.current : defaultBasket(h)),
    [state.current, h],
  );

  useEffect(() => {
    if (!loaded) return;
    if (Object.keys(state.plan).length) {
      setPlan(state.plan);
      return;
    }
    const scenarios = buildScenarios(current, h);
    setPlan(bestWithinBudget(scenarios, state.budget).basket);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    if (loaded && Object.keys(plan).length) update({ plan });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const currentCost = basketCost(current, h);
  const planCost = basketCost(plan, h);
  const diff = planCost - currentCost;
  const scenarios = useMemo(() => buildScenarios(current, h), [current, h]);
  const planTotals = totals(plan);

  useEffect(() => {
    if (state.budget != null && planCost > state.budget * 1.1) {
      toast.warning(
        lang === "ta"
          ? "இது உங்கள் பட்ஜெட்டை மீறுகிறது."
          : "This plan is above your budget.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planCost]);

  const step = (id: ItemId, delta: number) =>
    setPlan((b) => ({ ...b, [id]: Math.max(0, Math.round(((b[id] ?? 0) + delta) * 2) / 2) }));

  const districtTa = DISTRICTS.find((d) => d.en === h.district)?.ta ?? h.district;
  const card = CARD_BY_ID[h.cardType];

  const { data: posts } = useQuery({
    queryKey: ["forum-preview", h.district],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("id, display_name, tag, body, created_at")
        .eq("district", h.district)
        .eq("status", "visible")
        .order("created_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 pb-44 sm:px-6">
        {/* Profile strip */}
        <section className="rr-rise mt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h1 className="font-display text-3xl tracking-tight text-balance sm:text-4xl">
              {lang === "ta" ? "உங்கள் கூடை" : "Your basket"}
            </h1>
            <Link to="/setup" className="font-mono text-xs text-muted-ink underline">
              {lang === "ta" ? "மாற்று" : "Edit"}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Fact label={t("district")} main={lang === "ta" ? districtTa : h.district} sub={lang === "ta" ? h.district : districtTa} />
            <Fact
              label={t("card")}
              main={lang === "ta" ? card.ta : card.en}
              sub={lang === "ta" ? card.en : card.ta}
            />
            <Fact
              label={t("family")}
              main={String(members(h))}
              sub={`${h.adults} ${t("adults")} · ${h.children} ${t("children")}`}
            />
            <Fact
              label={t("condition")}
              main={h.diabetes === "yes" ? t("yes") : h.diabetes === "no" ? t("no") : t("unsure")}
              sub={lang === "ta" ? "Diabetes" : "சர்க்கரை நோய்"}
              tone
            />
          </div>
        </section>

        {/* Simulator */}
        <section className="rr-rise mt-6" style={{ animationDelay: "80ms" }}>
          <div className="rounded-2xl border border-line bg-cream p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
                  {t("simulator")}
                </span>
                <span
                  className={`size-2 rounded-full ${
                    state.budget != null && planCost > state.budget ? "bg-red" : "bg-green"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    state.budget != null && planCost > state.budget ? "text-red" : "text-green"
                  }`}
                >
                  {state.budget != null && planCost > state.budget
                    ? t("overBudget")
                    : t("withinBudget")}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const order = ["gentle", "balanced", "bold"] as const;
                    const idx = order.findIndex(
                      (id) =>
                        JSON.stringify(scenarios.find((s) => s.id === id)?.basket) ===
                        JSON.stringify(plan),
                    );
                    const nextId = order[(idx + 1) % order.length]!;
                    setPlan(scenarios.find((s) => s.id === nextId)!.basket);
                  }}
                  className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-cream"
                >
                  {t("moreMillets")}
                </button>
                <button
                  type="button"
                  onClick={() => setPlan(scenarios.find((s) => s.id === "cheapest")!.basket)}
                  className="rounded-lg border border-line bg-cream px-3 py-2 text-sm font-semibold"
                >
                  {t("cheapestHealthy")}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Current */}
              <div className="rounded-xl border border-line bg-paper p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-lg tracking-tight">{t("currentBasket")}</span>
                  <span className="font-mono text-xs text-muted-ink">
                    ₹ {currentCost.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="space-y-2">
                  {PLAN_ITEMS.filter((id) => (current[id] ?? 0) > 0 || id === "rice").map((id) => {
                    const food = FOOD_BY_ID[id];
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <div className="grid size-11 place-items-center rounded-lg bg-amber/15 text-2xl">
                          {food.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{lang === "ta" ? food.ta : food.en}</div>
                          <div className="text-xs text-muted-ink">
                            {lang === "ta" ? food.en : food.ta}
                          </div>
                        </div>
                        <div className="font-display text-2xl">
                          {current[id] ?? 0}
                          <span className="text-sm text-muted-ink">{food.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Healthier */}
              <div className="rounded-xl border-2 border-green bg-green/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-lg tracking-tight text-green">
                    {t("healthierBasket")}
                  </span>
                  <span className="font-mono text-xs text-green">
                    ₹ {planCost.toLocaleString("en-IN")} ·{" "}
                    {diff === 0 ? t("sameCost") : `${diff > 0 ? "+" : "−"}₹${Math.abs(diff)}`}
                  </span>
                </div>
                <div className="space-y-2">
                  {PLAN_ITEMS.map((id) => {
                    const food = FOOD_BY_ID[id];
                    const isMillet = food.group === "millet" || food.group === "pulse";
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelected(id)}
                          aria-label={food.en}
                          className={`grid size-11 place-items-center rounded-lg text-2xl ${
                            isMillet ? "bg-green/15" : "bg-amber/15"
                          } ${selected === id ? "ring-2 ring-green" : ""}`}
                        >
                          {food.emoji}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelected(id)}
                          className="flex-1 text-left"
                        >
                          <div className="font-semibold">{lang === "ta" ? food.ta : food.en}</div>
                          <div className="text-xs text-muted-ink">
                            {lang === "ta" ? food.en : food.ta}
                          </div>
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => step(id, -0.5)}
                            aria-label={`less ${food.en}`}
                            className="grid size-8 place-items-center rounded-md border border-line bg-cream font-bold"
                          >
                            −
                          </button>
                          <div className="w-14 text-center font-display text-2xl">
                            {plan[id] ?? 0}
                            <span className="text-sm text-muted-ink">{food.unit}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => step(id, 0.5)}
                            aria-label={`more ${food.en}`}
                            className="grid size-8 place-items-center rounded-md border border-line bg-cream font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Info + summary preview */}
        <section
          className="rr-rise mt-6 grid gap-4 lg:grid-cols-5"
          style={{ animationDelay: "160ms" }}
        >
          <div className="lg:col-span-2">
            <FoodInfo food={FOOD_BY_ID[selected]} />
            <div className="mt-3 flex flex-wrap gap-2">
              {FOODS.filter((f) => PLAN_ITEMS.includes(f.id)).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelected(f.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    selected === f.id ? "border-green bg-green text-cream" : "border-line bg-cream"
                  }`}
                >
                  {f.emoji} {lang === "ta" ? f.ta : f.en}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-cream p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
                {t("entitlementSummary")}
              </span>
              <span className="font-mono text-[10px] text-muted-ink">{t("print")}</span>
            </div>
            <div className="rounded-lg border border-line bg-paper p-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <div className="font-display text-lg tracking-tight">
                    {lang === "ta" ? "கணக்கீட்டு அட்டை" : "Rebalance slip"}
                  </div>
                  <div className="font-mono text-[10px] text-muted-ink">
                    {h.district.toUpperCase()} · {card.en}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-ink">
                  {t("family")} {members(h)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-line py-3 text-center">
                <SlipCell label={lang === "ta" ? "அரிசி" : "Rice"} value={`${planTotals.rice}kg`} />
                <SlipCell
                  label={lang === "ta" ? "சிறுதானியம்" : "Millets"}
                  value={`${planTotals.millet}kg`}
                />
                <SlipCell
                  label={lang === "ta" ? "பருப்பு" : "Pulses"}
                  value={`${planTotals.pulses}kg`}
                />
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm font-semibold text-green">
                  {state.budget == null || planCost <= state.budget
                    ? t("withinBudget")
                    : t("overBudget")}
                </span>
                <span className="font-display text-2xl">₹ {planCost.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/summary"
                className="block rounded-lg bg-ink py-3 text-center text-sm font-semibold text-cream"
              >
                {t("entitlementSummary")} →
              </Link>
            </div>
          </div>
        </section>

        {/* Forum */}
        <section className="rr-rise mt-6" style={{ animationDelay: "240ms" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-tight">{t("forum")}</h2>
            <Link to="/forum" className="font-mono text-xs text-muted-ink underline">
              {lang === "ta" ? districtTa : h.district}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(posts ?? []).map((p) => (
              <div key={p.id} className="rounded-xl border border-line bg-cream p-4">
                <div className="flex items-center gap-2 text-xs text-muted-ink">
                  <span className="size-2 rounded-full bg-amber" />
                  {p.display_name}
                </div>
                <p className="mt-2 text-sm text-pretty">{p.body}</p>
              </div>
            ))}
            {(posts ?? []).length === 0 ? (
              <div className="rounded-xl border border-line bg-cream p-4 text-sm text-muted-ink">
                {lang === "ta"
                  ? "இந்த மாவட்டத்தில் இன்னும் பதிவுகள் இல்லை."
                  : "No posts from your district yet."}
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <BudgetBar
        cost={planCost}
        onFix={
          state.budget != null ? () => setPlan(makeCheaper(plan, h, state.budget!)) : undefined
        }
      />
    </div>
  );
}

function Fact({
  label,
  main,
  sub,
  tone,
}: {
  label: string;
  main: string;
  sub: string;
  tone?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-cream p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
        {label}
      </div>
      <div className={`mt-1 text-lg font-semibold ${tone ? "text-green" : ""}`}>{main}</div>
      <div className="text-sm text-muted-ink">{sub}</div>
    </div>
  );
}

function SlipCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] text-muted-ink">{label}</div>
      <div className="font-display text-xl">{value}</div>
    </div>
  );
}
