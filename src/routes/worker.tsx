import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/worker")({
  head: () => ({
    meta: [
      { title: "Health worker dashboard — RationRebalance" },
      {
        name: "description",
        content:
          "ASHA and NGO view: district-level unmet demand for millets and pulses, CSV export, and forum moderation.",
      },
      { property: "og:title", content: "Health worker dashboard — RationRebalance" },
      {
        property: "og:description",
        content: "See where households are asking for millets and cannot get them.",
      },
    ],
  }),
  component: WorkerPage,
});

function WorkerPage() {
  const { state, t } = useApp();
  const lang = state.lang;
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: records } = useQuery({
    queryKey: ["demand", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demand_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: allPosts } = useQuery({
    queryKey: ["mod-posts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("id, display_name, district, body, status")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const signIn = async (mode: "in" | "up") => {
    const fn =
      mode === "in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/worker` },
          });
    const { error } = await fn;
    if (error) toast.error(error.message);
    else if (mode === "up")
      toast.success(
        lang === "ta" ? "மின்னஞ்சலை உறுதி செய்யுங்கள்" : "Check your email to confirm",
      );
  };

  const byDistrict = aggregate(records ?? []);

  const exportCsv = () => {
    const rows = records ?? [];
    const header = Object.keys(rows[0] ?? { district: "" }).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "unmet-demand.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hidePost = async (id: string) => {
    const { error } = await supabase.from("forum_posts").update({ status: "hidden" }).eq("id", id);
    if (error) toast.error(lang === "ta" ? "அனுமதி இல்லை" : "Not allowed — moderator role needed");
    else void qc.invalidateQueries({ queryKey: ["mod-posts", userId] });
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 pb-24 pt-6 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t("dashboard")}</h1>

        {!ready ? null : !userId ? (
          <section className="max-w-md rounded-2xl border border-line bg-cream p-5">
            <p className="text-sm text-muted-ink">
              {lang === "ta"
                ? "சுகாதார பணியாளர் / அமைப்பு கணக்கில் உள்நுழையுங்கள்."
                : "Sign in with your health worker / NGO account."}
            </p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="email"
              className="mt-3 w-full rounded-lg border border-line bg-paper px-3 py-3 text-sm"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="password"
              className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-3 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void signIn("in")}
                className="flex-1 rounded-lg bg-ink py-3 text-sm font-semibold text-cream"
              >
                {t("signIn")}
              </button>
              <button
                type="button"
                onClick={() => void signIn("up")}
                className="flex-1 rounded-lg border border-line bg-paper py-3 text-sm font-semibold"
              >
                {lang === "ta" ? "கணக்கு உருவாக்கு" : "Create account"}
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-cream"
              >
                {lang === "ta" ? "CSV பதிவிறக்கு" : "Download CSV"}
              </button>
              <button
                type="button"
                onClick={() => void supabase.auth.signOut()}
                className="rounded-lg border border-line bg-cream px-4 py-2.5 text-sm font-semibold"
              >
                {t("signOut")}
              </button>
            </div>

            <section className="rounded-2xl border border-line bg-cream p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
                {lang === "ta" ? "மாவட்ட வாரியாக தேவை" : "Demand by district"}
              </div>
              <table className="mt-3 w-full text-left text-sm">
                <thead className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
                  <tr>
                    <th className="py-2">{lang === "ta" ? "மாவட்டம்" : "District"}</th>
                    <th className="py-2 text-right">{lang === "ta" ? "வீடுகள்" : "Households"}</th>
                    <th className="py-2 text-right">
                      {lang === "ta" ? "சராசரி சிறுதானியம்" : "Avg millets"}
                    </th>
                    <th className="py-2 text-right">
                      {lang === "ta" ? "சராசரி பருப்பு" : "Avg pulses"}
                    </th>
                    <th className="py-2 text-right">
                      {lang === "ta" ? "கிடைக்கவில்லை" : "Cannot get"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byDistrict.map((r) => (
                    <tr key={r.district} className="border-t border-line">
                      <td className="py-2 font-semibold">{r.district}</td>
                      <td className="py-2 text-right">{r.count}</td>
                      <td className="py-2 text-right">{r.avgMillet.toFixed(1)} kg</td>
                      <td className="py-2 text-right">{r.avgPulses.toFixed(1)} kg</td>
                      <td className="py-2 text-right font-semibold text-red">{r.unmetPct}%</td>
                    </tr>
                  ))}
                  {byDistrict.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-muted-ink">
                        {lang === "ta" ? "தரவு இல்லை." : "No records yet."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>

            <section className="rounded-2xl border border-line bg-cream p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-ink">
                {lang === "ta" ? "மன்ற மேற்பார்வை" : "Forum moderation"}
              </div>
              <ul className="mt-3 space-y-2">
                {(allPosts ?? []).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start gap-3 border-b border-line pb-2 text-sm"
                  >
                    <div className="flex-1">
                      <span className="font-semibold">{p.display_name}</span>{" "}
                      <span className="text-muted-ink">· {p.district}</span>
                      <div className="text-pretty">{p.body}</div>
                    </div>
                    {p.status === "visible" ? (
                      <button
                        type="button"
                        onClick={() => void hidePost(p.id)}
                        className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold"
                      >
                        {lang === "ta" ? "மறை" : "Hide"}
                      </button>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-ink">hidden</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

type Record_ = {
  district: string;
  millet_kg: number;
  pulses_kg: number;
  availability: string;
};

function aggregate(rows: Record_[]) {
  const map = new Map<string, { count: number; millet: number; pulses: number; unmet: number }>();
  for (const r of rows) {
    const e = map.get(r.district) ?? { count: 0, millet: 0, pulses: 0, unmet: 0 };
    e.count += 1;
    e.millet += Number(r.millet_kg);
    e.pulses += Number(r.pulses_kg);
    if (r.availability === "no" || r.availability === "sometimes") e.unmet += 1;
    map.set(r.district, e);
  }
  return [...map.entries()]
    .map(([district, e]) => ({
      district,
      count: e.count,
      avgMillet: e.millet / e.count,
      avgPulses: e.pulses / e.count,
      unmetPct: Math.round((e.unmet / e.count) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}
