import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";
import { CARD_BY_ID, FOOD_BY_ID, type ItemId } from "@/lib/pds-data";
import { basketCost, defaultBasket, members, totals } from "@/lib/simulator";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Printable entitlement summary — RationRebalance" },
      {
        name: "description",
        content:
          "A one-page sheet in Tamil and English showing your current and suggested ration basket, ready to print or share with your ration dealer.",
      },
      { property: "og:title", content: "Printable entitlement summary — RationRebalance" },
      {
        property: "og:description",
        content: "Show your ration dealer exactly which millets and pulses your family is asking for.",
      },
    ],
  }),
  component: SummaryPage,
});

const ROWS: ItemId[] = ["rice", "ragi", "kambu", "thinai", "toor_dal", "channa", "sugar", "oil"];

function SummaryPage() {
  const { state, update, t } = useApp();
  const lang = state.lang;
  const h = state.household;
  const current = Object.keys(state.current).length ? state.current : defaultBasket(h);
  const plan = Object.keys(state.plan).length ? state.plan : current;
  const currentCost = basketCost(current, h);
  const planCost = basketCost(plan, h);
  const diff = planCost - currentCost;
  const tt = totals(plan);
  const card = CARD_BY_ID[h.cardType];
  const [saving, setSaving] = useState(false);

  const shareText = [
    `${lang === "ta" ? "ரேஷன் கோரிக்கை" : "Ration request"} — ${h.district} · ${card.en}`,
    ...ROWS.filter((id) => (current[id] ?? 0) > 0 || (plan[id] ?? 0) > 0).map(
      (id) =>
        `${FOOD_BY_ID[id].en}: ${current[id] ?? 0} → ${plan[id] ?? 0} ${FOOD_BY_ID[id].unit}`,
    ),
    `${lang === "ta" ? "மொத்தம்" : "Total"}: ₹${planCost}`,
  ].join("\n");

  const saveDemand = async (availability: "yes" | "no" | "sometimes", altSource?: string) => {
    setSaving(true);
    const { error } = await supabase.from("demand_records").insert({
      district: h.district,
      card_type: h.cardType,
      family_size: members(h),
      has_diabetes: h.diabetes,
      rice_kg: tt.rice,
      millet_kg: tt.millet,
      pulses_kg: tt.pulses,
      plan_cost: planCost,
      declared_budget: state.budget,
      availability,
      alt_source: altSource ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(lang === "ta" ? "சேமிக்க முடியவில்லை" : "Could not save");
      return;
    }
    update({
      availability,
      altSource: altSource ?? null,
      history: [
        ...state.history.filter((x) => x.month !== monthKey()),
        { month: monthKey(), cost: planCost, rice: tt.rice, millet: tt.millet, pulses: tt.pulses },
      ],
    });
    toast.success(lang === "ta" ? "நன்றி, பதிவு சேமிக்கப்பட்டது" : "Thanks — your answer was saved");
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-6 px-4 pb-24 pt-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 print-hide">
          <h1 className="font-display text-3xl tracking-tight">{t("entitlementSummary")}</h1>
          <Link to="/plan" className="font-mono text-xs text-muted-ink underline">
            ← {t("back")}
          </Link>
        </div>

        {/* The printable slip */}
        <div className="print-sheet rounded-2xl border border-line bg-cream p-6">
          <div className="flex items-start justify-between border-b border-line pb-4">
            <div>
              <div className="font-display text-2xl tracking-tight">
                {lang === "ta" ? "கணக்கீட்டு அட்டை" : "Ration rebalance slip"}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
                {h.district} · {card.en}
              </div>
            </div>
            <div className="text-right text-sm text-muted-ink">
              {t("family")} {members(h)}
              <br />
              {h.adults} {t("adults")} · {h.children} {t("children")}
            </div>
          </div>

          <table className="mt-4 w-full text-left">
            <thead>
              <tr className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
                <th className="py-2">{lang === "ta" ? "பொருள்" : "Item"}</th>
                <th className="py-2 text-right">{t("currentBasket")}</th>
                <th className="py-2 text-right">{t("healthierBasket")}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.filter((id) => (current[id] ?? 0) > 0 || (plan[id] ?? 0) > 0).map((id) => {
                const f = FOOD_BY_ID[id];
                return (
                  <tr key={id} className="border-t border-line">
                    <td className="py-2">
                      <span className="mr-2">{f.emoji}</span>
                      <span className="font-semibold">{f.ta}</span>{" "}
                      <span className="text-sm text-muted-ink">{f.en}</span>
                    </td>
                    <td className="py-2 text-right font-display text-xl">
                      {current[id] ?? 0}
                      <span className="text-xs text-muted-ink">{f.unit}</span>
                    </td>
                    <td className="py-2 text-right font-display text-xl text-green">
                      {plan[id] ?? 0}
                      <span className="text-xs text-muted-ink">{f.unit}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="text-sm font-semibold text-green">
              {diff === 0
                ? t("sameCost")
                : diff > 0
                  ? `${lang === "ta" ? "கூடுதல்" : "Extra"} ₹${diff} / ${lang === "ta" ? "மாதம்" : "month"}`
                  : `${lang === "ta" ? "சேமிப்பு" : "Saves"} ₹${Math.abs(diff)}`}
            </span>
            <span className="font-display text-2xl">₹ {planCost.toLocaleString("en-IN")}</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-dashed border-line pt-6 text-xs text-muted-ink">
            <div>
              {lang === "ta" ? "சுகாதார பணியாளர் / அமைப்பு" : "Health worker / organisation"}
              <div className="mt-6 border-b border-line" />
            </div>
            <div>
              {lang === "ta" ? "கடை / அலுவலர் கையொப்பம்" : "Dealer / officer signature"}
              <div className="mt-6 border-b border-line" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 print-hide">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 rounded-lg bg-ink py-3 text-sm font-semibold text-cream"
          >
            {t("print")}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg border border-line bg-cream py-3 text-center text-sm font-semibold"
          >
            {t("shareWhatsapp")}
          </a>
        </div>

        {/* Unmet demand capture */}
        <section className="rounded-2xl border border-line bg-cream p-5 print-hide">
          <div className="font-display text-xl tracking-tight">{t("availabilityQuestion")}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["yes", "sometimes", "no"] as const).map((v) => (
              <button
                key={v}
                type="button"
                disabled={saving}
                onClick={() => void saveDemand(v)}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  state.availability === v
                    ? "border-green bg-green text-cream"
                    : "border-line bg-paper"
                }`}
              >
                {t(v)}
              </button>
            ))}
          </div>

          {state.availability === "no" || state.availability === "sometimes" ? (
            <>
              <div className="mt-4 text-sm text-muted-ink">{t("altSourceQuestion")}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["local_shop", t("localShop")],
                    ["weekly_market", t("weeklyMarket")],
                    ["none", t("dontBuy")],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => void saveDemand(state.availability!, key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      state.altSource === key
                        ? "border-green bg-green text-cream"
                        : "border-line bg-paper"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <p className="mt-4 text-xs text-muted-ink">
            {lang === "ta"
              ? "உங்கள் பதில் பெயரில்லாமல் சேமிக்கப்படுகிறது. மாவட்ட வாரியாக சிறுதானியத் தேவையை காட்ட உதவும்."
              : "Your answer is stored anonymously and helps show district-level demand for millets."}
          </p>
        </section>

        <div className="print-hide">
          <Link
            to="/forum"
            className="block rounded-lg bg-green py-3 text-center text-sm font-semibold text-cream"
          >
            {t("writePost")} →
          </Link>
        </div>
      </main>
    </div>
  );
}

function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
