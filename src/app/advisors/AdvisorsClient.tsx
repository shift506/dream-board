"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Advisor } from "@/lib/advisors";
import AdvisorCard from "@/components/AdvisorCard";
import Link from "next/link";

const BOARD_COLORS: Record<string, string> = {
  "Brand & Positioning":    "bg-blossom/10 text-blossom border-blossom/25",
  "Narrative & Voice":      "bg-ocean/10 text-ocean border-ocean/25",
  "Growth & Influence":     "bg-new-leaf/10 text-new-leaf border-new-leaf/25",
  "Strategy & Decisions":   "bg-ocean/10 text-ocean border-ocean/25",
  "Leadership & Power":     "bg-blossom/10 text-blossom border-blossom/25",
  "Economics & Capital":    "bg-breeze/10 text-breeze border-breeze/25",
  "Revenue & Business Model": "bg-breeze/10 text-breeze border-breeze/25",
  "Systems Change":         "bg-ocean/10 text-ocean border-ocean/20",
  "Execution & Momentum":   "bg-new-leaf/10 text-new-leaf border-new-leaf/25",
  "Meaning & Inner Life":   "bg-blossom/10 text-blossom border-blossom/20",
  "Public & Civic":         "bg-ocean/10 text-ocean border-ocean/20",
};

const EMPTY_FORM = {
  name: "", focus: "", boards: [] as string[],
  whoYouAre: "", howYouThink: "", biases: "", voice: "", challenges: "",
};

export default function AdvisorsClient({
  advisors,
  boards,
}: {
  advisors: Advisor[];
  boards: string[];
}) {
  const router = useRouter();
  const [filterBoard, setFilterBoard] = useState<string>("all");
  const [selected, setSelected] = useState<Advisor | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBoard = (b: string) => {
    setForm((prev) => ({
      ...prev,
      boards: prev.boards.includes(b) ? prev.boards.filter((x) => x !== b) : [...prev.boards, b],
    }));
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/advisors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create advisor.");
      }
      setForm(EMPTY_FORM);
      setCreating(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const filtered =
    filterBoard === "all"
      ? advisors
      : advisors.filter((a) => a.boards.includes(filterBoard));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="pt-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-new-leaf text-xs font-sub tracking-widest uppercase mb-2">
            Roster
          </p>
          <h1 className="text-3xl font-semibold text-white">Advisors</h1>
          <p className="text-white/50 mt-2">
            {advisors.length} advisors across {boards.length} boards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCreating(true); setSelected(null); }}
            className="btn-secondary text-sm"
          >
            + Add Advisor
          </button>
          <Link href="/boardroom" className="btn-primary">
            Convene Session →
          </Link>
        </div>
      </div>

      {/* Board filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFilterBoard("all")}
          className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
            filterBoard === "all"
              ? "bg-white/10 border-white/20 text-white"
              : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
          }`}
        >
          All ({advisors.length})
        </button>
        {boards.map((b) => {
          const count = advisors.filter((a) => a.boards.includes(b)).length;
          return (
            <button
              key={b}
              onClick={() => setFilterBoard(b)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                filterBoard === b
                  ? `${BOARD_COLORS[b]} border-current`
                  : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {b} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Advisor grid */}
        <div
          className={`grid gap-3 transition-all duration-200 ${
            selected || creating
              ? "grid-cols-1 sm:grid-cols-2 flex-shrink-0 w-full sm:w-auto sm:max-w-sm"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full"
          }`}
        >
          {filtered.map((advisor) => (
            <AdvisorCard
              key={advisor.slug}
              advisor={advisor}
              selected={selected?.slug === advisor.slug}
              onClick={() => {
                setCreating(false);
                setSelected(selected?.slug === advisor.slug ? null : advisor);
              }}
            />
          ))}
        </div>

        {/* Profile panel */}
        {selected && !creating && (
          <div className="flex-1 min-w-0 animate-slide-up">
            <div className="card p-6 sm:p-8 sm:sticky sm:top-20">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selected.name}</h2>
                  <p className="text-white/50 text-sm mt-1">{selected.focus}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {selected.boards.map((board) => (
                      <span
                        key={board}
                        className={`text-xs px-2 py-0.5 rounded border ${
                          BOARD_COLORS[board] ?? "bg-white/5 text-white/40 border-white/10"
                        }`}
                      >
                        {board}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-white/30 hover:text-white/60 text-lg leading-none transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="prose-board text-sm max-h-[60vh] overflow-y-auto pr-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selected.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Create advisor panel */}
        {creating && (
          <div className="flex-1 min-w-0 animate-slide-up pb-16">
            <div className="card p-6 sm:p-8 sm:sticky sm:top-20 sm:max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">New Advisor</h2>
                  <p className="text-white/40 text-xs mt-1">
                    Create a custom board member profile.
                  </p>
                </div>
                <button
                  onClick={() => { setCreating(false); setError(null); setForm(EMPTY_FORM); }}
                  className="text-white/30 hover:text-white/60 text-lg leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                {/* Name + Focus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 block">Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Clayton Christensen"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 block">Focus *</label>
                    <input
                      required
                      value={form.focus}
                      onChange={(e) => setForm((p) => ({ ...p, focus: e.target.value }))}
                      placeholder="e.g. Disruption Theory"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors"
                    />
                  </div>
                </div>

                {/* Boards */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 block">Boards *</label>
                  <div className="flex flex-wrap gap-2">
                    {boards.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBoard(b)}
                        className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                          form.boards.includes(b)
                            ? `${BOARD_COLORS[b] ?? "bg-white/10 text-white border-white/20"}`
                            : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Who You Are */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 block">Who You Are</label>
                  <textarea
                    rows={2}
                    value={form.whoYouAre}
                    onChange={(e) => setForm((p) => ({ ...p, whoYouAre: e.target.value }))}
                    placeholder="You are roleplaying as… one or two sentences on their identity and expertise."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors"
                  />
                </div>

                {/* How You Think */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 block">How You Think</label>
                  <textarea
                    rows={3}
                    value={form.howYouThink}
                    onChange={(e) => setForm((p) => ({ ...p, howYouThink: e.target.value }))}
                    placeholder={"Core frameworks and worldviews — one per line.\ne.g. Disruption starts from the bottom up\nJobs to be done, not features"}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors"
                  />
                </div>

                {/* Biases */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 block">Biases (Lean Into These)</label>
                  <textarea
                    rows={3}
                    value={form.biases}
                    onChange={(e) => setForm((p) => ({ ...p, biases: e.target.value }))}
                    placeholder={"What they over-index on — one per line.\ne.g. Long-term over short-term\nExecution over strategy"}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors"
                  />
                </div>

                {/* Voice */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 block">Voice</label>
                  <textarea
                    rows={2}
                    value={form.voice}
                    onChange={(e) => setForm((p) => ({ ...p, voice: e.target.value }))}
                    placeholder={"Rhetorical style — one per line.\ne.g. Academic but plain-spoken\nUses case studies and analogies"}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors"
                  />
                </div>

                {/* What You Challenge */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 block">What You Challenge</label>
                  <textarea
                    rows={2}
                    value={form.challenges}
                    onChange={(e) => setForm((p) => ({ ...p, challenges: e.target.value }))}
                    placeholder={"What they push back against — one per line.\ne.g. Sustaining over disruptive thinking\nIncumbent assumptions"}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-blossom">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={saving || !form.name.trim() || !form.focus.trim() || form.boards.length === 0}
                  className="btn-primary w-full"
                >
                  {saving ? "Creating…" : "Add to Board →"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
