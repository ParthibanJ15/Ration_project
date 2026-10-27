import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { AppHeader } from "@/components/AppHeader";
import { useApp } from "@/lib/app-state";
import { basketCost, totals } from "@/lib/simulator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RationRebalance — Healthier ration baskets for Tamil Nadu" },
      {
        name: "description",
        content:
          "Rebalance your PDS ration basket towards millets and pulses without spending more. Built for low-income households living with diabetes.",
      },
      { property: "og:title", content: "RationRebalance — Healthier ration baskets" },
      {
        property: "og:description",
        content:
          "Swap polished rice for millets and pulses within your budget, print an entitlement sheet, and help push for more millets in the PDS.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { state, update, t, loaded } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const hasPlan = Object.keys(state.plan).length > 0;
  const planCost = hasPlan ? basketCost(state.plan, state.household) : 0;
  const planTotals = totals(state.plan);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <section className="rr-rise mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-ink">
            {t("chooseLanguage")}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-balance sm:text-5xl">
            {lang === "ta"
              ? "அரிசி குறை. சிறுதானியம் கூட்டு. செலவு அதே."
              : "Less rice. More millets. Same money."}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-ink">
            {lang === "ta"
              ? "உங்கள் ரேஷன் கூடையை சர்க்கரை நோய்க்கு ஏற்றபடி மாற்றி, கடைக்காரரிடம் காட்ட ஒரு அச்சிட்ட தாள் தயார் செய்யுங்கள்."
              : "Rebalance your ration basket for diabetes and print a one-page sheet you can show at the ration shop."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => update({ mode: "household" })}
              className={`rounded-2xl border-2 p-5 text-left transition-colors ${
                state.mode === "household"
                  ? "border-green bg-green/5"
                  : "border-line bg-cream"
              }`}
            >
              <div className="text-3xl">🏠</div>
              <div className="mt-2 font-display text-xl tracking-tight">{t("iAmUser")}</div>
              <div className="text-sm text-muted-ink">
                {lang === "ta" ? "I use a ration shop" : "நான் ரேஷன் வாங்குபவர்"}
              </div>
            </button>
            <button
              type="button"
              onClick={() => update({ mode: "worker" })}
              className={`rounded-2xl border-2 p-5 text-left transition-colors ${
                state.mode === "worker" ? "border-green bg-green/5" : "border-line bg-cream"
              }`}
            >
              <div className="text-3xl">🩺</div>
              <div className="mt-2 font-display text-xl tracking-tight">{t("iAmWorker")}</div>
              <div className="text-sm text-muted-ink">
                {lang === "ta"
                  ? "ASHA / NGO — dashboards and moderation"
                  : "ASHA / தன்னார்வ அமைப்பு"}
              </div>
            </button>
          </div>
        </section>

        <section className="rr-rise mt-6 rounded-2xl border border-line bg-cream p-5">
          <div className="font-display text-xl tracking-tight">{t("consentTitle")}</div>
          <p className="mt-2 max-w-3xl text-sm text-pretty text-muted-ink">{t("consentBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                update({ consent: true });
                void navigate({ to: state.mode === "worker" ? "/worker" : "/setup" });
              }}
              className="rounded-lg bg-green px-5 py-3 text-sm font-semibold text-cream"
            >
              {t("agree")}
            </button>
            {loaded && hasPlan ? (
              <Link
                to="/plan"
                className="rounded-lg border border-line bg-paper px-5 py-3 text-sm font-semibold"
              >
                {t("yourPlan")} →
              </Link>
            ) : null}
          </div>
        </section>

        {loaded && hasPlan ? (
          <section className="rr-rise mt-6">
            <h2 className="mb-3 font-display text-2xl tracking-tight">{t("monthlySummary")}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label={lang === "ta" ? "மாதச் செலவு" : "Monthly cost"} value={`₹ ${planCost}`} />
              <Stat label={lang === "ta" ? "அரிசி" : "Rice"} value={`${planTotals.rice} kg`} />
              <Stat
                label={lang === "ta" ? "சிறுதானியம்" : "Millets"}
                value={`${planTotals.millet} kg`}
              />
              <Stat label={lang === "ta" ? "பருப்பு" : "Pulses"} value={`${planTotals.pulses} kg`} />
            </div>
            {state.history.length > 0 ? (
              <div className="mt-3 rounded-2xl border border-line bg-cream p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
                  {lang === "ta" ? "கடந்த மாதங்கள்" : "Past months"}
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {state.history.slice(-6).reverse().map((h) => (
                    <li key={h.month} className="flex justify-between border-b border-line py-1">
                      <span className="font-mono text-xs text-muted-ink">{h.month}</span>
                      <span>
                        ₹ {h.cost} · {h.millet} kg {lang === "ta" ? "சிறுதானியம்" : "millets"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-cream p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl">{value}</div>
    </div>
  );
}
