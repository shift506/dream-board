"use client";

import { useState, useCallback, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
type SaveError = string | null;
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

// ─── Example contexts ─────────────────────────────────────────────────────
// Characters from Two Guys, a Girl and a Pizza Place

const EXAMPLES: Record<Mode, ContextForm> = {
  business: {
    name: "Michael Bergen",
    role: "Founder & Principal Architect",
    organization: "Berg Architecture Studio",
    whatBuilding:
      "A boutique architecture firm in Boston specializing in residential renovations and quirky commercial spaces. Two years in, running lean — it's Berg plus one drafting intern. Most work comes through word-of-mouth, which is good for quality and terrible for predictability. The portfolio is strong but not published anywhere.",
    revenueModel:
      "Project-based billing for residential and light commercial work. Average project runs $15–40k. Currently managing 4 active projects simultaneously, which is about 1 too many.",
    whatGoodLooks:
      "In 2 years, Berg Architecture Studio is the go-to firm for Boston homeowners who want something genuinely different — creative, livable, a little unexpected. Revenue above $500k, a team of 3–4, and at least one project that gets published in a real design outlet.",
    whatToAvoid:
      "Becoming a draftsman for developers\nTaking clients who want generic output at scale\nGrowing so fast Berg stops being the creative force on every project\nSaying yes to Providence commuter work just because it pays",
    strategicThemes:
      "Land a commercial project with cultural cachet (restaurant, boutique, community space)\nGet the first feature in a design publication\nHire a second architect who can own project management",
    strategicQuestions:
      "Should we niche into a specific style or stay versatile?\nHow do I get off the referral-only treadmill?\nIs there a play beyond buildings — furniture, interiors, product?",
  },
  project: {
    name: "Sharon Carter",
    role: "Operations Lead",
    organization: "Beacon Street Pizza — Allston Expansion",
    whatBuilding:
      "Opening a second Beacon Street Pizza location in Allston. The original Back Bay spot has been profitable for 3 years. This is a 6-month build-out with a target soft launch in March. Sharon is managing the entire project alongside her day job running the original location, which is already a lot.",
    revenueModel:
      "$120k in owner financing. 6-month window before lease acceleration kicks in. One external contractor for the fit-out, Sharon handling everything else. No dedicated project budget for mistakes.",
    whatGoodLooks:
      "Allston location opens on time, hits break-even within 90 days, and the original location's operations don't suffer while Sharon is stretched across both. Bonus: we hire a GM who actually stays.",
    whatToAvoid:
      "Over-customizing the menu for Allston and losing what makes Beacon Street Pizza work\nHiring too fast before we know actual staffing needs\nLetting Pete or Berg get involved in any decisions\nPerfectionism on the fit-out that eats the timeline",
    strategicThemes:
      "Finalize the fit-out contractor this month\nBuild the GM job description and start recruiting\nDraft soft-launch marketing plan for the Allston neighborhood",
    strategicQuestions:
      "Do we replicate the original menu exactly or adjust for the Allston demographic?\nShould we hire the GM before or after the space is done?\nHow do we keep Back Bay regulars from drifting to the new location?",
  },
  personal: {
    name: "Pete Dunville",
    role: "Pre-med student",
    organization: "3rd year, Boston University — figuring out what comes next",
    whatBuilding:
      "Pete is at a genuine decision point. Med school applications are open and his grades qualify him for programs across the country. Ashley expects him to apply to Boston-area schools. His dad in Providence assumes he'll come home after graduation. And honestly, Pete isn't 100% sure medicine is still what he wants — he just hasn't said it out loud to anyone, including himself.",
    revenueModel: "",
    whatGoodLooks:
      "By December, Pete has made a real decision about med school — one he can stand behind, not just the path of least resistance. Whatever he chooses, it's something he chose on purpose, not something that happened to him.",
    whatToAvoid:
      "Applying to schools just to keep Ashley comfortable\nGoing back to Providence to work in his dad's furniture store\nPretending certainty he doesn't have\nMaking a $200k decision based on not wanting an awkward conversation",
    strategicThemes:
      "Have an honest conversation with Ashley about what I actually want\nFigure out if the doubt I'm feeling is signal or noise\nGet clearer on what I'd do if I weren't afraid of disappointing people",
    strategicQuestions:
      "Am I running toward medicine or just haven't said no yet?\nWhat do I actually owe Ashley at this stage?\nIf I could do anything — and Bill Dunville didn't exist — what would it be?",
  },
};

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
  onLoadExample,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  onLoadExample: () => void;
}) {
  const exampleNames: Record<Mode, string> = {
    business: "Berg's architecture firm",
    project: "Sharon's pizza expansion",
    personal: "Pete's med school dilemma",
  };

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
      <div className="flex items-center justify-between gap-4 mt-2.5">
        <p className="text-xs text-white/30">{MODES[mode].description}</p>
        <button
          type="button"
          onClick={onLoadExample}
          className="text-xs text-new-leaf/70 hover:text-new-leaf transition-colors whitespace-nowrap flex-shrink-0"
        >
          Try: {exampleNames[mode]} →
        </button>
      </div>
      <div className="border-t border-white/5 mt-6" />
    </div>
  );
}

// ─── Board link ────────────────────────────────────────────────────────────

function BoardLink({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const url = `${window.location.origin}/board/${userId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-sub text-white/40 uppercase tracking-widest mb-1">Your Board Link</p>
          <p className="text-xs text-white/30">Save this to return to your board from any device</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors whitespace-nowrap flex-shrink-0"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function ContextEditor({ initial, userId }: { initial: string; userId: string }) {
  const [form, setForm] = useState<ContextForm>(() => parseContext(initial));
  const [status, setStatus] = useState<SaveStatus>("clean");
  const [saveError, setSaveError] = useState<SaveError>(null);
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
      setSaveError(null);
      try {
        const res = await fetch("/api/context", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: buildMarkdown(f) }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        setStatus("saved");
        router.refresh();
        setTimeout(() => setStatus("clean"), 2000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setSaveError(msg);
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

  const handleLoadExample = useCallback(() => {
    const example = EXAMPLES[mode];
    setForm(example);
    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(example), 1500);
  }, [mode, doSave]);

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
        <ModeSelector mode={mode} onChange={handleModeChange} onLoadExample={handleLoadExample} />

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
            <p className="text-xs text-blossom">
              Failed to save{saveError ? `: ${saveError}` : ""}. Try again.
            </p>
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

      <div className="card p-5 border-new-leaf/20 bg-new-leaf/5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-white">Ready to convene?</p>
            <p className="text-xs text-white/45 mt-0.5">
              Your advisors have everything they need. Bring them a question.
            </p>
          </div>
          <Link href="/boardroom" className="btn-primary whitespace-nowrap flex-shrink-0">
            Open Boardroom →
          </Link>
        </div>
      </div>

      <BoardLink userId={userId} />
    </div>
  );
}
