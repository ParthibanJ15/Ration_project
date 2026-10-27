import { useApp } from "@/lib/app-state";
import { budgetStatus } from "@/lib/simulator";

export function BudgetBar({ cost, onFix }: { cost: number; onFix?: () => void }) {
  const { state, t } = useApp();
  const budget = state.budget;
  const status = budgetStatus(cost, budget);
  const pct = budget ? Math.min(100, Math.round((cost / budget) * 100)) : 100;

  const tone =
    status === "over" ? "bg-red" : status === "close" ? "bg-turmeric" : "bg-green";
  const label =
    status === "over"
      ? t("overBudget")
      : status === "close"
        ? t("slightlyOver")
        : status === "ok"
          ? t("withinBudget")
          : "";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 backdrop-blur-md print-hide">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold">
            {t("budget")}
            {label ? <span className="ml-2 font-normal text-muted-ink">· {label}</span> : null}
          </span>
          <span className="font-mono text-xs text-muted-ink">
            ₹ {cost.toLocaleString("en-IN")}
            {budget ? ` / ₹ ${budget.toLocaleString("en-IN")}` : ""}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full transition-all duration-500 ${tone}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {status === "over" && onFix ? (
          <button
            type="button"
            onClick={onFix}
            className="mt-2 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-cream sm:w-auto"
          >
            {t("makeCheaper")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
