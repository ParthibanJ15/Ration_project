import { Link } from "@tanstack/react-router";

import { useApp } from "@/lib/app-state";

const NAV = [
  { to: "/plan", ta: "கணக்கீடு", en: "Basket" },
  { to: "/summary", ta: "சுருக்கம்", en: "Summary" },
  { to: "/forum", ta: "மன்றம்", en: "Forum" },
  { to: "/worker", ta: "பணியாளர்", en: "Worker" },
] as const;

export function AppHeader() {
  const { state, update } = useApp();
  const lang = state.lang;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur-md print-hide">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-green font-display text-lg text-cream">
            RR
          </div>
          <div className="leading-none">
            <div className="font-display text-xl tracking-tight">RationRebalance</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-ink">
              {lang === "ta" ? "நேரடி கணக்கீடு" : "Live basket"}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-ink transition-colors hover:bg-cream"
              activeProps={{ className: "bg-cream text-ink border border-line" }}
            >
              {lang === "ta" ? n.ta : n.en}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 rounded-full border border-line bg-cream p-1">
          <button
            type="button"
            onClick={() => update({ lang: "ta" })}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              lang === "ta" ? "bg-ink text-cream" : "text-muted-ink"
            }`}
          >
            தமிழ்
          </button>
          <button
            type="button"
            onClick={() => update({ lang: "en" })}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              lang === "en" ? "bg-ink text-cream" : "text-muted-ink"
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-muted-ink"
            activeProps={{ className: "bg-cream text-ink border border-line" }}
          >
            {lang === "ta" ? n.ta : n.en}
          </Link>
        ))}
      </nav>
    </header>
  );
}
