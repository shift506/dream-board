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
  tried: string;
  stakes: string;
  extra: string;
}

const EMPTY_FORM: ContextForm = {
  name: "", role: "", organization: "",
  whatBuilding: "", revenueModel: "",
  whatGoodLooks: "", whatToAvoid: "",
  strategicThemes: "", strategicQuestions: "",
  tried: "", stakes: "", extra: "",
};

type SaveStatus = "clean" | "dirty" | "saving" | "saved" | "error";
type SaveError = string | null;
type Mode = "business" | "project" | "personal";
type Depth = "none" | "basic" | "deep" | "overshare";

// ─── Mode configuration ────────────────────────────────────────────────────

interface ModeConfig {
  label: string;
  description: string;
  basic: {
    situationLabel: string;
    situationPlaceholder: string;
  };
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
    description: "Companies, ventures, and commercial projects",
    basic: {
      situationLabel: "What are you working on?",
      situationPlaceholder: "Give advisors the 30-second version. What's the business, where are you at, and what are you trying to figure out?",
    },
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
      goodHint: "The north star. Advisors calibrate whether their advice moves you toward or away from the goal.",
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
      questionsHint: "Questions you're sitting with. Advisors may surface these angles unprompted. One per line.",
      questionsPlaceholder: "e.g. How do we scale without losing culture?\nWhere should we stay focused vs. expand?",
    },
  },
  project: {
    label: "Project",
    description: "Creative work, nonprofits, and side projects",
    basic: {
      situationLabel: "What's this about?",
      situationPlaceholder: "Describe the project and what you're trying to figure out. Keep it real.",
    },
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
    description: "Life decisions, career moves, and personal growth",
    basic: {
      situationLabel: "What's going on?",
      situationPlaceholder: "Give your advisors the honest version of where you are and what you're navigating.",
    },
    identity: {
      section: "About You",
      rolePlaceholder: "e.g. Teacher, Parent, Career changer — optional",
      orgLabel: "Context",
      orgPlaceholder: "e.g. 15 years in finance, currently exploring a career pivot",
    },
    main: {
      section: "The Situation",
      buildingLabel: "What's Going On",
      buildingHint: "The more honest this is, the better the advice.",
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
      avoidHint: "Hard limits and non-negotiables. One per line.",
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

const DEPTH_CONFIG: Record<Depth, { label: string; sub: string }> = {
  none:      { label: "None",      sub: "Advisors go in cold" },
  basic:     { label: "Basic",     sub: "Quick overview" },
  deep:      { label: "Deep",      sub: "Structured context" },
  overshare: { label: "Overshare", sub: "Tell them everything" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function inferDepth(f: ContextForm): Depth {
  if (f.tried || f.stakes || f.extra) return "overshare";
  if (f.whatGoodLooks || f.whatToAvoid || f.revenueModel || f.strategicThemes || f.strategicQuestions) return "deep";
  if (f.name || f.role || f.organization || f.whatBuilding) return "basic";
  return "none";
}

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
    whatBuilding: section("What You're Building") || section("What This Is About") || section("What's Going On"),
    revenueModel: section("Revenue Model") || section("Resources & Constraints"),
    whatGoodLooks: section("What Good Looks Like") || section("What Success Looks Like"),
    whatToAvoid: section("What to Avoid") || section("What You're Not Willing to Do"),
    strategicThemes: section("Strategic Priorities") || section("What You're Focused On") || section("What You're Working Through"),
    strategicQuestions: section("Strategic Questions") || section("Open Questions") || section("Questions You're Sitting With"),
    tried: section("What You've Tried"),
    stakes: section("What's at Stake"),
    extra: section("Additional Context"),
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
  if (f.whatBuilding.trim()) parts.push("## What You're Building", "", f.whatBuilding.trim(), "");
  if (f.revenueModel.trim()) parts.push("## Revenue Model", "", f.revenueModel.trim(), "");
  if (f.whatGoodLooks.trim()) parts.push("## What Good Looks Like", "", f.whatGoodLooks.trim(), "");
  if (f.whatToAvoid.trim()) parts.push("## What to Avoid", "", toList(f.whatToAvoid), "");
  if (f.strategicThemes.trim()) parts.push("## Strategic Priorities", "", toList(f.strategicThemes), "");
  if (f.strategicQuestions.trim()) parts.push("## Strategic Questions", "", toList(f.strategicQuestions), "");
  if (f.tried.trim()) parts.push("## What You've Tried", "", f.tried.trim(), "");
  if (f.stakes.trim()) parts.push("## What's at Stake", "", f.stakes.trim(), "");
  if (f.extra.trim()) parts.push("## Additional Context", "", f.extra.trim(), "");
  return parts.join("\n").trim();
}

// ─── Example contexts ─────────────────────────────────────────────────────

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
      "Becoming a draftsman for developers\nTaking clients who want generic output at scale\nGrowing so fast Berg stops being the creative force on every project",
    strategicThemes:
      "Land a commercial project with cultural cachet (restaurant, boutique, community space)\nGet the first feature in a design publication\nHire a second architect who can own project management",
    strategicQuestions:
      "Should we niche into a specific style or stay versatile?\nHow do I get off the referral-only treadmill?\nIs there a play beyond buildings — furniture, interiors, product?",
    tried:
      "Tried posting on Instagram — got likes but no leads. Emailed three past clients for referrals and got one project out of it. Nothing systematic yet.",
    stakes:
      "If lead flow doesn't stabilize in the next 6 months, I'll have to start taking any project that comes in. That's the thing that kills the brand.",
    extra:
      "Berg is a perfectionist — it's why the work is great and why it takes twice as long as quoted. That tension is real and unresolved.",
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
      "Allston location opens on time, hits break-even within 90 days, and the original location's operations don't suffer while Sharon is stretched across both.",
    whatToAvoid:
      "Over-customizing the menu for Allston and losing what makes Beacon Street Pizza work\nHiring too fast before we know actual staffing needs\nPerfectionism on the fit-out that eats the timeline",
    strategicThemes:
      "Finalize the fit-out contractor this month\nBuild the GM job description and start recruiting\nDraft soft-launch marketing plan for the Allston neighborhood",
    strategicQuestions:
      "Do we replicate the original menu exactly or adjust for the Allston demographic?\nShould we hire the GM before or after the space is done?\nHow do we keep Back Bay regulars from drifting to the new location?",
    tried:
      "Got one contractor bid — it came in 40% over budget. Currently getting two more bids. Haven't started hiring yet.",
    stakes:
      "If the launch slips more than 60 days or the fit-out goes more than 15% over budget, Back Bay cash flow gets tight.",
    extra:
      "The existing Back Bay team doesn't know about the expansion yet. That conversation needs to happen before we start interviewing for GM.",
  },
  personal: {
    name: "Pete Dunville",
    role: "Pre-med student",
    organization: "3rd year, Boston University — figuring out what comes next",
    whatBuilding:
      "Pete is at a genuine decision point. Med school applications are open and his grades qualify him for programs across the country. Ashley expects him to apply to Boston-area schools. His dad in Providence assumes he'll come home after graduation. And honestly, Pete isn't 100% sure medicine is still what he wants — he just hasn't said it out loud to anyone.",
    revenueModel: "",
    whatGoodLooks:
      "By December, Pete has made a real decision about med school — one he can stand behind, not just the path of least resistance. Whatever he chooses, he chose it on purpose.",
    whatToAvoid:
      "Applying to schools just to keep Ashley comfortable\nGoing back to Providence to work in his dad's furniture store\nPretending certainty he doesn't have\nMaking a $200k decision based on not wanting an awkward conversation",
    strategicThemes:
      "Have an honest conversation with Ashley about what I actually want\nFigure out if the doubt I'm feeling is signal or noise\nGet clearer on what I'd do if I weren't afraid of disappointing people",
    strategicQuestions:
      "Am I running toward medicine or just haven't said no yet?\nWhat do I actually owe Ashley at this stage?\nIf I could do anything — and Bill Dunville didn't exist — what would it be?",
    tried:
      "Took a gap year after undergrad. Spent 6 months in a research lab and 6 months at a startup. Came back more confused. Talked to three doctors — they all said medicine is great. Talked to one who said run.",
    stakes:
      "If I apply and get in, I'm committing to 4+ more years of training before I can actually decide if I hate it. If I don't apply this cycle, I lose a year and that conversation gets harder.",
    extra:
      "Short version: I like solving problems for people. I'm not sure medicine is the best way to do that. I'm also not sure I have the energy to defend that sentence to my dad.",
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────

function isExample(f: ContextForm, mode: Mode): boolean {
  const ex = EXAMPLES[mode];
  return !!(f.name && f.name === ex.name && f.organization === ex.organization);
}

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

function ModeSelector({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="flex gap-2 flex-wrap mb-5">
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
  );
}

function DepthSelector({ depth, onChange }: { depth: Depth; onChange: (d: Depth) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5 mb-6">
      {(["none", "basic", "deep", "overshare"] as const).map((d) => {
        const isActive = depth === d;
        const { label, sub } = DEPTH_CONFIG[d];
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`py-2.5 px-2 rounded-lg text-center transition-all border ${
              isActive
                ? "bg-new-leaf/10 border-new-leaf/35 text-new-leaf"
                : "bg-white/3 border-white/8 text-white/40 hover:text-white/65 hover:bg-white/5 hover:border-white/15"
            }`}
          >
            <p className="text-xs font-medium">{label}</p>
            <p className={`text-[10px] mt-0.5 leading-tight ${isActive ? "text-new-leaf/55" : "text-white/22"}`}>{sub}</p>
          </button>
        );
      })}
    </div>
  );
}

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

export default function ContextEditor({
  initial,
  userId,
}: {
  initial: { business: string; project: string; personal: string };
  userId: string;
}) {
  const [forms, setForms] = useState<Record<Mode, ContextForm>>(() => ({
    business: parseContext(initial.business),
    project: parseContext(initial.project),
    personal: parseContext(initial.personal),
  }));
  const [status, setStatus] = useState<SaveStatus>("clean");
  const [saveError, setSaveError] = useState<SaveError>(null);
  const [mode, setMode] = useState<Mode>("business");
  const [depth, setDepth] = useState<Depth>(() => inferDepth(parseContext(initial.business)));
  const [confirmClear, setConfirmClear] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Hydrate mode from localStorage after mount, then infer depth from that mode's form
  useEffect(() => {
    const stored = localStorage.getItem("boardroom-mode");
    if (stored === "business" || stored === "project" || stored === "personal") {
      setMode(stored);
      setDepth(inferDepth(parseContext(initial[stored])));
    }
  }, [initial]);

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setDepth(inferDepth(forms[m]));
    setConfirmClear(false);
    localStorage.setItem("boardroom-mode", m);
  };

  const handleDepthChange = (d: Depth) => {
    setDepth(d);
    setConfirmClear(false);
  };

  const doSave = useCallback(
    async (f: ContextForm, m: Mode) => {
      setStatus("saving");
      setSaveError(null);
      try {
        const res = await fetch("/api/context", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: buildMarkdown(f), mode: m }),
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
      const currentMode = mode;
      setForms((prev) => {
        const updated = { ...prev[currentMode], [key]: value };
        const next = { ...prev, [currentMode]: updated };
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => doSave(updated, currentMode), 1500);
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
      await doSave(forms[mode], mode);
    },
    [forms, mode, doSave]
  );

  const handleLoadExample = useCallback(() => {
    const example = EXAMPLES[mode];
    setForms((prev) => ({ ...prev, [mode]: example }));
    setDepth(inferDepth(example));
    setConfirmClear(false);
    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(example, mode), 1500);
  }, [mode, doSave]);

  const handleClearForm = useCallback(() => {
    setForms((prev) => ({ ...prev, [mode]: EMPTY_FORM }));
    setDepth("none");
    setConfirmClear(false);
    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(EMPTY_FORM, mode), 1500);
  }, [mode, doSave]);

  const form = forms[mode];
  const cfg = MODES[mode];
  const showingExample = isExample(form, mode);
  const formHasContent = !!(form.name || form.role || form.organization || form.whatBuilding || form.whatGoodLooks);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="pt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-new-leaf text-xs font-sub tracking-widest uppercase mb-2">
            Configuration
          </p>
          <h1 className="text-3xl font-semibold text-white">Your Context</h1>
          <p className="text-white/50 mt-2 max-w-lg">
            Advisors read this before every session.{" "}
            <span className="text-white/30">It&apos;s optional — but the more specific you are, the sharper the advice.</span>
          </p>
        </div>
        <div className="pt-1">
          <StatusPill status={status} />
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        {/* Mode selector */}
        <ModeSelector mode={mode} onChange={handleModeChange} />

        {/* Description + example/clear strip */}
        <div className="flex items-center justify-between gap-3 mb-5 -mt-1">
          <p className="text-xs text-white/25">{cfg.description}</p>
          {showingExample ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-blossom/60">Sample data</span>
              <button
                type="button"
                onClick={handleClearForm}
                className="text-xs text-white/30 hover:text-white/55 transition-colors"
              >
                Clear →
              </button>
            </div>
          ) : depth !== "none" ? (
            <button
              type="button"
              onClick={handleLoadExample}
              className="text-xs text-white/30 hover:text-new-leaf transition-colors whitespace-nowrap flex-shrink-0"
            >
              Load example →
            </button>
          ) : null}
        </div>

        {/* Depth selector */}
        <DepthSelector depth={depth} onChange={handleDepthChange} />

        {/* ── NONE state ──────────────────────────────────────── */}
        {depth === "none" && (
          <div className="py-10 text-center space-y-5">
            <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
              Advisors will work without background on you or your situation. Good for broad questions — but they go deeper when they know more.
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <button
                type="button"
                onClick={() => setDepth("basic")}
                className="text-sm text-new-leaf hover:text-new-leaf/70 transition-colors"
              >
                Add some context →
              </button>
              <Link href="/boardroom" className="text-sm text-white/30 hover:text-white/55 transition-colors">
                Skip — go to boardroom
              </Link>
            </div>
            <p className="text-xs text-white/20">
              Not sure what to write?{" "}
              <button
                type="button"
                onClick={handleLoadExample}
                className="text-new-leaf/50 hover:text-new-leaf transition-colors underline underline-offset-2"
              >
                Load a sample context
              </button>{" "}
              to see what works.
            </p>
          </div>
        )}

        {/* ── Form (Basic / Deep / Overshare) ─────────────────── */}
        {depth !== "none" && (
          <form onSubmit={handleSave} className="space-y-6">

            {/* Identity — always shown */}
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

            {/* Situation — always shown, label/prompt changes by depth */}
            <div>
              <Field
                label={depth === "basic" ? cfg.basic.situationLabel : cfg.main.buildingLabel}
                hint={depth !== "basic" ? cfg.main.buildingHint : undefined}
              >
                <textarea
                  rows={depth === "basic" ? 5 : 3}
                  value={form.whatBuilding}
                  onChange={set("whatBuilding")}
                  placeholder={depth === "basic" ? cfg.basic.situationPlaceholder : cfg.main.buildingPlaceholder}
                  className={textareaClass}
                />
              </Field>
            </div>

            {/* ── DEEP additions ──────────────────────────────── */}
            {(depth === "deep" || depth === "overshare") && (
              <>
                <div className="border-t border-white/5" />

                {/* Revenue / Resources */}
                {cfg.main.showRevenue && (
                  <div>
                    <p className="text-xs font-sub text-white/40 uppercase tracking-widest mb-4">
                      {cfg.main.section}
                    </p>
                    <Field label={cfg.main.revenueLabel} hint={cfg.main.revenueHint}>
                      <textarea
                        rows={2}
                        value={form.revenueModel}
                        onChange={set("revenueModel")}
                        placeholder={cfg.main.revenuePlaceholder}
                        className={textareaClass}
                      />
                    </Field>
                  </div>
                )}

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
              </>
            )}

            {/* ── OVERSHARE additions ─────────────────────────── */}
            {depth === "overshare" && (
              <>
                <div className="border-t border-white/5" />
                <div>
                  <p className="text-xs font-sub text-white/40 uppercase tracking-widest mb-1">Overshare</p>
                  <p className="text-xs text-white/25 mb-4">The advisors won&apos;t tell anyone. Might as well.</p>
                  <div className="space-y-4">
                    <Field label="What have you already tried?">
                      <textarea
                        rows={3}
                        value={form.tried}
                        onChange={set("tried")}
                        placeholder="What approaches have you attempted? What worked, what didn't, what you've ruled out."
                        className={textareaClass}
                      />
                    </Field>
                    <Field label="What's at stake?">
                      <textarea
                        rows={2}
                        value={form.stakes}
                        onChange={set("stakes")}
                        placeholder="What happens if this goes badly? What are the real consequences?"
                        className={textareaClass}
                      />
                    </Field>
                    <Field label="Anything else they should know?">
                      <textarea
                        rows={3}
                        value={form.extra}
                        onChange={set("extra")}
                        placeholder="The thing you haven't said yet. The context behind the context."
                        className={textareaClass}
                      />
                    </Field>
                  </div>
                </div>
              </>
            )}

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

            {/* Clear form — only for non-example real data */}
            {formHasContent && !showingExample && (
              <div className="text-center">
                {confirmClear ? (
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <span className="text-white/40">This will clear your saved context.</span>
                    <button
                      type="button"
                      onClick={handleClearForm}
                      className="text-blossom hover:text-blossom/70 transition-colors"
                    >
                      Clear it
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="text-white/30 hover:text-white/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="text-xs text-white/20 hover:text-white/40 transition-colors"
                  >
                    Clear form
                  </button>
                )}
              </div>
            )}

          </form>
        )}
      </div>

      {/* Boardroom CTA — show once they've gone past None */}
      {depth !== "none" && (
        <div className="card p-5 border-new-leaf/20 bg-new-leaf/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-white">Ready to convene?</p>
              <p className="text-xs text-white/45 mt-0.5">
                {formHasContent
                  ? "Your advisors have context. Bring them a question."
                  : "You can always add more context later."}
              </p>
            </div>
            <Link href="/boardroom" className="btn-primary whitespace-nowrap flex-shrink-0">
              Open Boardroom →
            </Link>
          </div>
        </div>
      )}

      <BoardLink userId={userId} />
    </div>
  );
}
