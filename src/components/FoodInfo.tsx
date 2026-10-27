import { speak, useApp } from "@/lib/app-state";
import type { FoodItem } from "@/lib/pds-data";

function Meter({ label, score, tone }: { label: string; score: number; tone: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-xs text-muted-ink">{score}/5</span>
      </div>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`size-3 rounded-full ${i <= score ? tone : "bg-line"}`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

export function FoodInfo({ food }: { food: FoodItem }) {
  const { state, t } = useApp();
  const lang = state.lang;
  const advice = food.advice[lang];

  return (
    <div className="rounded-2xl border border-line bg-cream p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-14 place-items-center rounded-xl bg-green/15 text-3xl">
          {food.emoji}
        </div>
        <div>
          <div className="font-display text-2xl tracking-tight">
            {lang === "ta" ? food.ta : food.en}
          </div>
          <div className="text-sm text-muted-ink">{lang === "ta" ? food.en : food.ta}</div>
        </div>
        <button
          type="button"
          onClick={() => speak(advice, lang)}
          aria-label={t("listen")}
          className="ml-auto grid size-11 place-items-center rounded-full bg-ink text-lg text-cream"
        >
          ▶
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <Meter label={t("sugar")} score={food.nutrition.sugar} tone="bg-amber" />
        <Meter label={t("fiber")} score={food.nutrition.fiber} tone="bg-green" />
        <Meter label={t("fullness")} score={food.nutrition.fullness} tone="bg-green" />
      </div>

      <p className="mt-4 text-sm text-pretty">{advice}</p>
    </div>
  );
}
