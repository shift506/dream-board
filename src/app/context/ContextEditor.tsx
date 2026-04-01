"use client";

import { useState, useCallback, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ContextForm {
  name: string;
  role: string;
  organization: string;
  whatBuilding: string;
  revenueModel: string;
  whatGoodLooks: string;
  whatToAvoid: string;
  strategicThemes: string;
  strategicQuestions: string;
}

type SaveStatus = "clean" | "dirty" | "saving" | "saved" | "error";
type Mode = "business" | "project" | "personal";

// ─── Mode configuration ────────────────────────────────────────────────────

interface ModeConfig {
  label: string;
  description: string;
  identity: {
    section: string;
    rolePlaceholder: string;
    orgLabel: string;
    orgPlaceholder: string;
  };
  main: {
    section: string;
    buildingLabel: string;
    buildingHint: string;
    buildingPlaceholder: string;
    showRevenue: boolean;
    revenueLabel: string;
    revenueHint: string;
    revenuePlaceholder: string;
  };
  direction: {
    section: string;
    goodLabel: string;
    goodHint: string;
    goodPlaceholder: string;
    avoidLabel: string;
    avoidHint: string;
    avoidPlaceholder: string;
  };
  strategic: {
    section: string;
    prioritiesLabel: string;
    prioritiesHint: string;
    prioritiesPlaceholder: string;
    questionsLabel: string;
    questionsHint: string;
    questionsPlaceholder: string;
  };
}

const MODES: Record<Mode, ModeConfig> = {
  business: {
    label: "Business",
    description: "For companies, ventures, and commercial projects",
    identity: {
      section: "About You",
      rolePlaceholder: "e.g. Co-CEO, Founder",
      orgLabel: "Organization",
      orgPlaceholder: "e.g. ShiftFlow Innovation & Design",
    },
    main: {
      section: "The Business",
      buildingLabel: "What You're Building",
      buildingHint: "Advisors use this to understand your market, customers, and stage before they respond.",
      buildingPlaceholder: "Describe the business — what it does, who it serves, what stage it's at.",
      showRevenue: true,
      revenueLabel: "Revenue Model",
      revenueHint: "Shapes how advisors think about offers, pricing, and unit economics.",
      revenuePlaceholder: "How do you make money? e.g. fee-for-service, DTC e-commerce, SaaS…",
    },
    direction: {
      section: "Direction & Constraints",
      goodLabel: "What Good Looks Like",
      goodHint: "The north star. Advisors use this to calibrate whether their advice moves you toward or away from the goal.",
      goodPlaceholder: "Describe success in 2–3 years. What does the business look like if things go well?",
      avoidLabel: "What to Avoid",
      avoidHint: "Anti-goals and hard constraints. Advisors won't recommend paths that violate these. One per line.",
      avoidPlaceholder: "e.g. Commodity pricing that erodes premium positioning\nGrowth that dilutes brand meaning",
    },
    strategic: {
      section: "Strategic Context",
      prioritiesLabel: "Current Priorities",
      prioritiesHint: "What you're focused on right now. One per line.",
      prioritiesPlaceholder: "e.g. Deepening positioning as a strategic partner\nBuilding national brand awareness",
      questionsLabel: "Open Strategic Questions",
      questionsHint: "Questions you're sitting with. Advisors may surface relevant angles unprompted. One per line.",
      questionsPlaceholder: "e.g. How do we scale without losing culture?\nWhere should we stay focused vs. expand?",
    },
  },
  project: {
    label: "Project",
    description: "For creative work, nonprofits, and side projects",
    identity: {
      section: "About You",
      rolePlaceholder: "e.g. Project Lead, Creative Director",
      orgLabel: "Project or Organization",
      orgPlaceholder: "e.g. The Documentary / Greenfield Community Lab",
    },
    main: {
      section: "The Project",
      buildingLabel: "What This Is About",
      buildingHint: "Advisors use this to understand the nature of the project, who it's for, and where it stands.",
      buildingPlaceholder: "Describe the project — what it is, who it serves, what stage it's at.",
      showRevenue: true,
      revenueLabel: "Resources & Constraints",
      revenueHint: "Funding, timelines, capacity — helps advisors give realistic recommendations.",
      revenuePlaceholder: "e.g. Grant-funded through Q3, two part-time contributors, no paid staff yet…",
    },
    direction: {
      section: "Direction",
      goodLabel: "What Success Looks Like",
      goodHint: "The north star. Advisors calibrate their advice against this.",
      goodPlaceholder: "Describe what this looks like when it goes well — for you and for the people it serves.",
      avoidLabel: "What to Avoid",
      avoidHint: "Constraints and non-starters. One per line.",
      avoidPlaceholder: "e.g. Scope creep that delays launch\nPartnerships that compromise independence",
    },
    strategic: {
      section: "Current State",
      prioritiesLabel: "What You're Focused On",
      prioritiesHint: "What's live right now. One per line.",
      prioritiesPlaceholder: "e.g. Finalizing the pilot\nFinding a distribution partner",
      questionsLabel: "Open Questions",
      questionsHint: "What you're still figuring out. One per line.",
      questionsPlaceholder: "e.g. Should we go wide or stay focused?\nHow do we build momentum without burning out?",
    },
  },
  personal: {
    label: "Personal",
    description: "For life decisions, career moves, and personal growth",
    identity: {
      section: "About You",
      rolePlaceholder: "e.g. Teacher, Parent, Career changer — optional",
      orgLabel: "Context",
      orgPlaceholder: "e.g. 15 years in finance, currently exploring a career pivot",
    },
    main: {
      section: "The Situation",
      buildingLabel: "What's Going On",
      buildingHint: "The more honest this is, the better the advice. Advisors use this to understand your situation before they respond.",
      buildingPlaceholder: "Describe what you're navigating — where you are, what's happening, what you're considering.",
      showRevenue: false,
      revenueLabel: "",
      revenueHint: "",
      revenuePlaceholder: "",
    },
    direction: {
      section: "Direction",
      goodLabel: "What Good Looks Like",
      goodHint: "The outcome you're hoping for. Helps advisors know what counts as a win.",
      goodPlaceholder: "Describe what you're moving toward. What does life look like if this goes well?",
      avoidLabel: "What You're Not Willing to Do",
      avoidHint: "Hard limits and non-negotiables. Advisors won't push you toward these. One per line.",
      avoidPlaceholder: "e.g. Uprooting the family for a role\nTaking on debt to fund the transition",
    },
    strategic: {
      section: "Open Questions",
      prioritiesLabel: "What You're Working Through",
      prioritiesHint: "What you're actively processing. One per line.",
      prioritiesPlaceholder: "e.g. Whether to stay or leave\nHow to have the conversation with my partner",
      questionsLabel: "Questions You're Sitting With",
      questionsHint: "The deeper questions underneath the decision. One per line.",
      questionsPlaceholder: "e.g. Am I running toward something or away from something?\nWhat would I regret not trying?",
    },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseContext(raw: string): ContextForm {
  const section = (heading: string) => {
    const re = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
    return raw.match(re)?.[1]?.trim() ?? "";
  };
  const boldField = (key: string) =>
    raw.match(new RegExp(`\\*\\*${key}:\\*\\*[ \\t]*(.+)`))?.[1]?.trim() ?? "";

  return {
    name: boldField("Name"),
    role: boldField("Role"),
    organization: boldField("Organization"),
    whatBuilding: section("What You're Building"),
    revenueModel: section("Revenue Model"),
    whatGoodLooks: section("What Good Looks Like"),
    whatToAvoid: section("What to Avoid"),
    strategicThemes: section("Strategic Priorities"),
    strategicQuestions: section("Strategic Questions"),
  };
}

function toList(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.startsWith("-") ? l : `- ${l}`))
    .join("\n");
}

const bold = (key: string, val: string) =>
  `**${key}:**${val.trim() ? ` ${val.trim()}` : ""}`;

function buildMarkdown(f: ContextForm): string {
  const parts: string[] = [
    "## About You",
    bold("Name", f.name),
    bold("Role", f.role),
    bold("Organization", f.organization),
    "",
  ];
  if (f.whatBuilding.trim()) {
    parts.push("## What You're Building", "", f.whatBuilding.trim(), "");
  }
  if (f.revenueModel.trim()) {
    parts.push("## Revenue Model", "", f.revenueModel.trim(), "");
  }
  if (f.whatGoodLooks.trim()) {
    parts.push("## What Good Looks Like", "", f.whatGoodLooks.trim(), "");
  }
  if (f.whatToAvoid.trim()) {
    parts.push("## What to Avoid", "", toList(f.whatToAvoid), "");
  }
  if (f.strategicThemes.trim()) {
    parts.push("## Strategic Priorities", "", toList(f.strategicThemes), "");
  }
  if (f.strategicQuestions.trim()) {
    parts.push("## Strategic Questions", "", toList(f.strategicQuestions), "");
  }
  return parts.join("\n").trim();
}

// ─── Sub-components ────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors";

const textareaClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/50 block">{label}</label>
      {hint && <p className="text-xs text-white/25 leading-snug">{hint}</p>}
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: SaveStatus }) {
  if (status === "clean") return null;

  const config: Record<Exclude<SaveStatus, "clean">, { dot: string; label: string }> = {
    dirty: { dot: "bg-blossom/70 animate-pulse", label: "Unsaved changes" },
    saving: { dot: "bg-white/40 animate-pulse", label: "Saving…" },
    saved: { dot: "bg-breeze", label: "Saved" },
    error: { dot: "bg-blossom", label: "Failed to save" },
  };

  const { dot, label } = config[status];

  return (
    <div className="flex items-center gap-1.5 text-xs text-white/40 animate-fade-in">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </div>
  );
}

function ModeSelector({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="pb-6">
      <div className="flex gap-2 flex-wrap">
        {(["business", "project", "personal"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={
              m === mode
                ? "px-4 py-1.5 rounded-full text-xs font-medium bg-new-leaf text-galaxy transition-colors"
                : "px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 border border-white/10 transition-colors"
            }
          >
            {MODES[m].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/30 mt-2.5">{MODES[mode].description}</p>
      <div className="border-t border-white/5 mt-6" />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function ContextEditor({ initial }: { initial: string }) {
  const [form, setForm] = useState<ContextForm>(() => parseContext(initial));
  const [status, setStatus] = useState<SaveStatus>("clean");
  const [mode, setMode] = useState<Mode>("business");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Hydrate mode from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("boardroom-mode");
    if (stored === "business" || stored === "project" || stored === "personal") {
      setMode(stored);
    }
  }, []);

  const handleModeChange = (m: Mode) => {
    setMode(m);
    localStorage.setItem("boardroom-mode", m);
  };

  const doSave = useCallback(
    async (f: ContextForm) => {
      setStatus("saving");
      try {
        const res = await fetch("/api/context", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: buildMarkdown(f) }),
        });
        if (!res.ok) throw new Error();
        setStatus("saved");
        router.refresh();
        setTimeout(() => setStatus("clean"), 2000);
      } catch {
        setStatus("error");
      }
    },
    [router]
  );

  const set =
    (key: keyof ContextForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => doSave(next), 1500);
        return next;
      });
      setStatus("dirty");
    };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (timerRef.current) clearTimeout(timerRef.current);
      await doSave(form);
    },
    [form, doSave]
  );

  const cfg = MODES[mode];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="pt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-new-leaf text-xs font-sub tracking-widest uppercase mb-2">
            Configuration
          </p>
          <h1 className="text-3xl font-semibold text-white">Your Context</h1>
          <p className="text-white/50 mt-2">
            Advisors read this before every session. Keep it current.
          </p>
        </div>
        <div className="pt-1">
          <StatusPill status={status} />
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        <ModeSelector mode={mode} onChange={handleModeChange} />

        <form onSubmit={handleSave} className="space-y-6">

          {/* Identity */}
          <div>
            <p className="text-xs font-sub text-white/40 uppercase tracking-widest mb-4">
              {cfg.identity.section}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Field label="Your Name">
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. Nick Scott"
                  className={inputClass}
                />
              </Field>
              <Field label="Your Role">
                <input
                  value={form.role}
                  onChange={set("role")}
                  placeholder={cfg.identity.rolePlaceholder}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label={cfg.identity.orgLabel}>
              <input
                value={form.organization}
                onChange={set("organization")}
                placeholder={cfg.identity.orgPlaceholder}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="border-t border-white/5" />

          {/* Main section */}
          <div>
            <p className="text-xs font-sub text-white/40 uppercase tracking-widest mb-4">
              {cfg.main.section}
            </p>
            <div className="space-y-4">
              <Field label={cfg.main.buildingLabel} hint={cfg.main.buildingHint}>
                <textarea
                  rows={3}
                  value={form.whatBuilding}
                  onChange={set("whatBuilding")}
                  placeholder={cfg.main.buildingPlaceholder}
                  className={textareaClass}
                />
              </Field>
              {cfg.main.showRevenue && (
                <Field label={cfg.main.revenueLabel} hint={cfg.main.revenueHint}>
                  <textarea
                    rows={2}
                    value={form.revenueModel}
                    onChange={set("revenueModel")}
                    placeholder={cfg.main.revenuePlaceholder}
                    className={textareaClass}
                  />
                </Field>
              )}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Direction */}
          <div>
            <p className="text-xs font-sub text-white/40 uppercase tracking-widest mb-4">
              {cfg.direction.section}
            </p>
            <div className="space-y-4">
              <Field label={cfg.direction.goodLabel} hint={cfg.direction.goodHint}>
                <textarea
                  rows={3}
                  value={form.whatGoodLooks}
                  onChange={set("whatGoodLooks")}
                  placeholder={cfg.direction.goodPlaceholder}
                  className={textareaClass}
                />
              </Field>
              <Field label={cfg.direction.avoidLabel} hint={cfg.direction.avoidHint}>
                <textarea
                  rows={3}
                  value={form.whatToAvoid}
                  onChange={set("whatToAvoid")}
                  placeholder={cfg.direction.avoidPlaceholder}
                  className={textareaClass}
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Strategic */}
          <div>
            <p className="text-xs font-sub text-white/40 uppercase tracking-widest mb-4">
              {cfg.strategic.section}
            </p>
            <div className="space-y-4">
              <Field label={cfg.strategic.prioritiesLabel} hint={cfg.strategic.prioritiesHint}>
                <textarea
                  rows={3}
                  value={form.strategicThemes}
                  onChange={set("strategicThemes")}
                  placeholder={cfg.strategic.prioritiesPlaceholder}
                  className={textareaClass}
                />
              </Field>
              <Field label={cfg.strategic.questionsLabel} hint={cfg.strategic.questionsHint}>
                <textarea
                  rows={3}
                  value={form.strategicQuestions}
                  onChange={set("strategicQuestions")}
                  placeholder={cfg.strategic.questionsPlaceholder}
                  className={textareaClass}
                />
              </Field>
            </div>
          </div>

          {status === "error" && (
            <p className="text-xs text-blossom">Failed to save. Try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "saving"}
            className="btn-primary w-full"
          >
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save Context →"}
          </button>

        </form>
      </div>
    </div>
  );
}
