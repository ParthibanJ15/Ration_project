import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";
import { DISTRICTS } from "@/lib/pds-data";

export const Route = createFileRoute("/forum")({
  head: () => ({
    meta: [
      { title: "District forum — RationRebalance" },
      {
        name: "description",
        content:
          "Short notes from ration users and health workers: which shops stock millets, what dealers said, and simple millet recipes.",
      },
      { property: "og:title", content: "District forum — RationRebalance" },
      {
        property: "og:description",
        content: "Tips, dealer reports and recipes from ration users across Tamil Nadu.",
      },
    ],
  }),
  component: ForumPage,
});

const TAGS = [
  { id: "dealer", ta: "கடை தகவல்", en: "Dealer info" },
  { id: "problem", ta: "பிரச்சனை", en: "Problem" },
  { id: "recipe", ta: "சமையல்", en: "Recipe" },
  { id: "scheme", ta: "திட்டத் தகவல்", en: "Scheme info" },
  { id: "general", ta: "பொது", en: "General" },
] as const;

function ForumPage() {
  const { state, t } = useApp();
  const lang = state.lang;
  const qc = useQueryClient();
  const [district, setDistrict] = useState(state.household.district);
  const [tag, setTag] = useState<string>("dealer");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["forum", district],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("id, display_name, tag, body, created_at, pinned")
        .eq("district", district)
        .eq("status", "visible")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data;
    },
  });

  const { data: reactions } = useQuery({
    queryKey: ["forum-reactions", district],
    queryFn: async () => {
      const { data, error } = await supabase.from("forum_reactions").select("post_id, kind");
      if (error) throw error;
      return data;
    },
  });

  const countFor = (postId: string, kind: string) =>
    (reactions ?? []).filter((r) => r.post_id === postId && r.kind === kind).length;

  const addPost = useMutation({
    mutationFn: async () => {
      const clean = body.trim();
      if (clean.length < 4) throw new Error("too short");
      if (/\d{8,}/.test(clean)) throw new Error("phone");
      const { error } = await supabase.from("forum_posts").insert({
        display_name: name.trim() || "Anonymous",
        district,
        tag,
        body: clean,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      toast.success(lang === "ta" ? "பதிவு சேர்க்கப்பட்டது" : "Posted");
      void qc.invalidateQueries({ queryKey: ["forum", district] });
    },
    onError: (e: Error) => {
      toast.error(
        e.message === "phone"
          ? lang === "ta"
            ? "தொலைபேசி எண் சேர்க்க வேண்டாம்"
            : "Please don't include phone numbers"
          : lang === "ta"
            ? "கொஞ்சம் அதிகமாக எழுதுங்கள்"
            : "Please write a little more",
      );
    },
  });

  const react = useMutation({
    mutationFn: async ({ postId, kind }: { postId: string; kind: string }) => {
      const { error } = await supabase.from("forum_reactions").insert({ post_id: postId, kind });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["forum-reactions", district] }),
  });

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-6 px-4 pb-24 pt-6 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t("forum")}</h1>

        <div className="flex flex-wrap gap-2">
          {DISTRICTS.map((d) => (
            <button
              key={d.en}
              type="button"
              onClick={() => setDistrict(d.en)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                district === d.en ? "border-green bg-green text-cream" : "border-line bg-cream"
              }`}
            >
              {lang === "ta" ? d.ta : d.en}
            </button>
          ))}
        </div>

        <section className="rounded-2xl border border-line bg-cream p-5">
          <div className="font-display text-xl tracking-tight">{t("writePost")}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TAGS.map((tg) => (
              <button
                key={tg.id}
                type="button"
                onClick={() => setTag(tg.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  tag === tg.id ? "border-green bg-green text-cream" : "border-line bg-paper"
                }`}
              >
                {lang === "ta" ? tg.ta : tg.en}
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lang === "ta" ? "பெயர் (விருப்பம்)" : "Name (optional)"}
            className="mt-3 w-full rounded-lg border border-line bg-paper px-3 py-3 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={
              lang === "ta"
                ? "உங்கள் கடையில் என்ன நடந்தது?"
                : "What happened at your ration shop?"
            }
            className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-3 text-sm"
          />
          <button
            type="button"
            disabled={addPost.isPending}
            onClick={() => addPost.mutate()}
            className="mt-3 w-full rounded-lg bg-ink py-3 text-sm font-semibold text-cream"
          >
            {t("post")}
          </button>
        </section>

        <section className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-ink">…</p>
          ) : (posts ?? []).length === 0 ? (
            <p className="text-sm text-muted-ink">
              {lang === "ta" ? "இன்னும் பதிவுகள் இல்லை." : "No posts yet."}
            </p>
          ) : (
            (posts ?? []).map((p) => (
              <article key={p.id} className="rounded-xl border border-line bg-cream p-4">
                <div className="flex items-center gap-2 text-xs text-muted-ink">
                  <span className="size-2 rounded-full bg-amber" />
                  {p.display_name}
                  <span className="ml-auto font-mono text-[10px]">
                    {TAGS.find((x) => x.id === p.tag)?.[lang] ?? p.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm text-pretty">{p.body}</p>
                <div className="mt-3 flex gap-2">
                  {(
                    [
                      ["up", "👍"],
                      ["helpful", "🙏"],
                      ["problem", "⚠️"],
                    ] as const
                  ).map(([kind, icon]) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => react.mutate({ postId: p.id, kind })}
                      className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold"
                    >
                      {icon} {countFor(p.id, kind)}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
