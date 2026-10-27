import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { useApp } from "@/lib/app-state";
import { CARD_TYPES, DISTRICTS, FOOD_BY_ID, type CardTypeId, type ItemId } from "@/lib/pds-data";
import { basketCost, defaultBasket, type Basket } from "@/lib/simulator";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Set up your household — RationRebalance" },
      {
        name: "description",
        content:
          "Tell us your district, ration card type, family size and monthly food budget to build a healthier basket.",
      },
      { property: "og:title", content: "Set up your household — RationRebalance" },
      {
        property: "og:description",
        content: "District, card type, family size and budget — big buttons, almost no typing.",
      },
    ],
  }),
  component: Setup,
});

const BASIC_ITEMS: ItemId[] = ["rice", "wheat", "toor_dal", "sugar", "oil"];

function Setup() {
  const { state, update, t, loaded } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const h = state.household;

  const [basket, setBasket] = useState<Basket>({});
  const [manual, setManual] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(1500);

  useEffect(() => {
    if (!loaded) return;
    setBasket(Object.keys(state.current).length ? state.current : defaultBasket(h));
    if (state.budget) setBudgetInput(state.budget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const setHousehold = (patch: Partial<typeof h>) => {
    const next = { ...h, ...patch };
    update({ household: next });
    if (!manual) setBasket(defaultBasket(next));
  };

  const step = (id: ItemId, delta: number) =>
    setBasket((b) => ({ ...b, [id]: Math.max(0, Math.round(((b[id] ?? 0) + delta) * 2) / 2) }));

  const cost = basketCost(basket, h);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-28 pt-6 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          {lang === "ta" ? "உங்கள் குடும்பம்" : "Your household"}
        </h1>

        {/* District */}
        <section className="rounded-2xl border border-line bg-cream p-5">
          <Label>{t("district")}</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {DISTRICTS.map((d) => (
              <button
                key={d.en}
                type="button"
                onClick={() => setHousehold({ district: d.en })}
                className={`rounded-full border px-4 py-2.5 text-sm font-semibold ${
                  h.district === d.en
                    ? "border-green bg-green text-cream"
                    : "border-line bg-paper"
                }`}
              >
                {lang === "ta" ? d.ta : d.en}
              </button>
            ))}
          </div>
        </section>

        {/* Card type */}
        <section className="rounded-2xl border border-line bg-cream p-5">
          <Label>{t("card")}</Label>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {CARD_TYPES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setHousehold({ cardType: c.id as CardTypeId })}
                className={`rounded-xl border-2 p-4 text-left ${
                  h.cardType === c.id ? "border-green bg-green/5" : "border-line bg-paper"
                }`}
              >
                <div className="text-2xl">{c.emoji}</div>
                <div className="mt-1 font-semibold">{lang === "ta" ? c.ta : c.en}</div>
                <div className="text-xs text-muted-ink">{lang === "ta" ? c.en : c.ta}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Family */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-cream p-5">
            <Label>{t("adults")}</Label>
            <Stepper
              value={h.adults}
              onChange={(v) => setHousehold({ adults: Math.max(1, v) })}
              step={1}
            />
          </div>
          <div className="rounded-2xl border border-line bg-cream p-5">
            <Label>{t("children")}</Label>
            <Stepper
              value={h.children}
              onChange={(v) => setHousehold({ children: Math.max(0, v) })}
              step={1}
            />
          </div>
        </section>

        {/* Diabetes */}
        <section className="rounded-2xl border border-line bg-cream p-5">
          <Label>{t("condition")}</Label>
          <div className="mt-3 flex gap-2">
            {(["yes", "no", "unsure"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setHousehold({ diabetes: v })}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  h.diabetes === v ? "border-green bg-green text-cream" : "border-line bg-paper"
                }`}
              >
                {t(v === "unsure" ? "unsure" : v)}
              </button>
            ))}
          </div>
        </section>

        {/* Current basket */}
        <section className="rounded-2xl border border-line bg-cream p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>{lang === "ta" ? "இப்போது வாங்குவது" : "What you take now"}</Label>
            <button
              type="button"
              onClick={() => {
                setManual((m) => !m);
                if (manual) setBasket(defaultBasket(h));
              }}
              className="rounded-lg border border-line bg-paper px-3 py-2 text-sm font-semibold"
            >
              {manual
                ? lang === "ta"
                  ? "அரசு அளவைப் பயன்படுத்து"
                  : "Use standard entitlement"
                : lang === "ta"
                  ? "நானே சொல்கிறேன்"
                  : "I'll enter my own"}
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {BASIC_ITEMS.map((id) => {
              const food = FOOD_BY_ID[id];
              return (
                <div key={id} className="flex items-center gap-3 rounded-xl bg-paper p-3">
                  <div className="grid size-11 place-items-center rounded-lg bg-amber/15 text-2xl">
                    {food.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{lang === "ta" ? food.ta : food.en}</div>
                    <div className="text-xs text-muted-ink">
                      {lang === "ta" ? food.en : food.ta}
                    </div>
                  </div>
                  {manual ? (
                    <div className="flex items-center gap-1">
                      <RoundButton onClick={() => step(id, -0.5)}>−</RoundButton>
                      <div className="w-16 text-center font-display text-2xl">
                        {basket[id] ?? 0}
                        <span className="text-sm text-muted-ink">{food.unit}</span>
                      </div>
                      <RoundButton onClick={() => step(id, 0.5)}>+</RoundButton>
                    </div>
                  ) : (
                    <div className="font-display text-2xl">
                      {basket[id] ?? 0}
                      <span className="text-sm text-muted-ink">{food.unit}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-sm text-muted-ink">
              {lang === "ta" ? "மதிப்பிட்ட மாதச் செலவு" : "Estimated monthly cost"}
            </span>
            <span className="font-display text-2xl">₹ {cost.toLocaleString("en-IN")}</span>
          </div>
        </section>

        {/* Budget */}
        <section className="rounded-2xl border border-line bg-cream p-5">
          <Label>{t("budgetQuestion")}</Label>
          <div className="mt-4 flex items-center gap-3">
            <RoundButton onClick={() => setBudgetInput((b) => Math.max(0, b - 100))}>−</RoundButton>
            <div className="font-display text-4xl">₹ {budgetInput.toLocaleString("en-IN")}</div>
            <RoundButton onClick={() => setBudgetInput((b) => b + 100)}>+</RoundButton>
          </div>
          <input
            type="range"
            min={300}
            max={6000}
            step={100}
            value={budgetInput}
            onChange={(e) => setBudgetInput(Number(e.target.value))}
            className="mt-4 w-full accent-green"
            aria-label={t("budget")}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                update({ current: basket, budget: budgetInput, plan: {} });
                void navigate({ to: "/plan" });
              }}
              className="rounded-lg bg-green px-5 py-3 text-sm font-semibold text-cream"
            >
              {t("next")} →
            </button>
            <button
              type="button"
              onClick={() => {
                update({ current: basket, budget: cost, plan: {} });
                void navigate({ to: "/plan" });
              }}
              className="rounded-lg border border-line bg-paper px-5 py-3 text-sm font-semibold"
            >
              {t("skipBudget")}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
      {children}
    </div>
  );
}

function RoundButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid size-11 place-items-center rounded-lg border border-line bg-cream text-xl font-bold"
    >
      {children}
    </button>
  );
}

function Stepper({
  value,
  onChange,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <div className="mt-3 flex items-center gap-3">
      <RoundButton onClick={() => onChange(value - step)}>−</RoundButton>
      <div className="w-14 text-center font-display text-3xl">{value}</div>
      <RoundButton onClick={() => onChange(value + step)}>+</RoundButton>
    </div>
  );
}
