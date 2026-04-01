"use client";

import { useState, useRef, useCallback, type ChangeEvent } from "react";
import mammoth from "mammoth";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Advisor } from "@/lib/advisors";
import AdvisorCard from "@/components/AdvisorCard";
import VoteBadge, { type Vote } from "@/components/VoteBadge";
import TensionMap, { type TensionData } from "@/components/TensionMap";

type Phase = "idle" | "round1" | "round2" | "tensions" | "synthesis" | "saving" | "done" | "error";
type Mode = "decision" | "advisory";
type Tab = "round1" | "round2" | "tensions" | "synthesis";

interface AdvisorMemo {
  slug: string;
  name: string;
  round1: string;
  round2: string;
  done1: boolean;
  done2: boolean;
}

interface StreamEvent {
  type: string;
  phase?: string;
  label?: string;
  advisor?: string;
  text?: string;
  slug?: string;
  data?: TensionData;
  message?: string;
}

const BOARD_LEFT_BORDER: Record<string, string> = {
  "Marketing": "border-blossom/60",
  "Strategy & Direction": "border-ocean/60",
  "Revenue & Business Model": "border-breeze/60",
  "Execution & Momentum": "border-new-leaf/60",
  "Systems Change": "border-ocean/50",
  "Personal": "border-blossom/50",
};

function extractVote(text: string): Vote | null {
  const m =
    text.match(/\*\*(?:your\s+)?vote[^*]*\*\*[:\s]*(YES|NO|CONDITIONAL)/i) ||
    text.match(/\bVOTE[:\s]+(YES|NO|CONDITIONAL)\b/i);
  return m ? (m[1].toUpperCase() as Vote) : null;
}

function getPreview(text: string): string {
  const stripped = text
    .replace(/#{1,6}\s+[^\n]*/g, "")
    .replace(/\*\*[^*]*\*\*/g, "")
    .replace(/\*[^*]*\*/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return stripped.length > 160 ? stripped.slice(0, 160) + "…" : stripped;
}

export default function BoardroomClient({
  advisors,
  boards,
}: {
  advisors: Advisor[];
  boards: string[];
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<Mode>("decision");
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [filterBoard, setFilterBoard] = useState<string>("all");
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseLabel, setPhaseLabel] = useState("");
  const [memos, setMemos] = useState<Record<string, AdvisorMemo>>({});
  const [synthesis, setSynthesis] = useState("");
  const [activeAdvisor, setActiveAdvisor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("round1");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [tensionData, setTensionData] = useState<TensionData | null>(null);
  const [tabsWithData, setTabsWithData] = useState<Set<Tab>>(new Set());
  const [documents, setDocuments] = useState<{ name: string; content: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      if (file.name.endsWith(".docx")) {
        const reader = new FileReader();
        reader.onload = async () => {
          const { value } = await mammoth.extractRawText({
            arrayBuffer: reader.result as ArrayBuffer,
          });
          setDocuments((prev) => [...prev, { name: file.name, content: value }]);
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setDocuments((prev) => [
            ...prev,
            { name: file.name, content: reader.result as string },
          ]);
        };
        reader.readAsText(file);
      }
    });
    e.target.value = "";
  };

  const removeDocument = (name: string) => {
    setDocuments((prev) => prev.filter((d) => d.name !== name));
  };

  const filteredAdvisors =
    filterBoard === "all"
      ? advisors
      : advisors.filter((a) => a.boards.includes(filterBoard));

  const ADVISOR_LIMIT = 3;

  const toggleAdvisor = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < ADVISOR_LIMIT) next.add(slug);
      return next;
    });
  };

  const selectBoard = (board: string) => {
    const slugs = advisors.filter((a) => a.boards.includes(board)).map((a) => a.slug);
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      for (const s of slugs) {
        if (next.size >= ADVISOR_LIMIT) break;
        next.add(s);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedSlugs(new Set());

  const toggleCard = (slug: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const enableTab = (tab: Tab) => {
    setTabsWithData((prev) => new Set([...prev, tab]));
  };

  const runSession = useCallback(async () => {
    if (!question.trim() || selectedSlugs.size === 0) return;

    abortRef.current = new AbortController();
    setPhase("round1");
    setMemos({});
    setSynthesis("");
    setTensionData(null);
    setActiveTab("round1");
    setExpandedCards(new Set());
    setTabsWithData(new Set(["round1"] as Tab[]));

    const initialMemos: Record<string, AdvisorMemo> = {};
    selectedSlugs.forEach((slug) => {
      const advisor = advisors.find((a) => a.slug === slug);
      if (advisor) {
        initialMemos[slug] = { slug, name: advisor.name, round1: "", round2: "", done1: false, done2: false };
      }
    });
    setMemos(initialMemos);

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, advisorSlugs: Array.from(selectedSlugs), mode, documents }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: StreamEvent = JSON.parse(line.slice(6));

            if (event.type === "phase") {
              const newPhase = event.phase as Phase;
              setPhase(newPhase);
              setPhaseLabel(event.label ?? "");
              setActiveAdvisor(null);
              if (newPhase === "round2") {
                enableTab("round2");
                setActiveTab("round2");
              } else if (newPhase === "synthesis") {
                enableTab("synthesis");
                setActiveTab("synthesis");
              }
            } else if (event.type === "tension_data" && event.data) {
              setTensionData(event.data);
              enableTab("tensions");
            } else if (event.type === "advisor_start") {
              setActiveAdvisor(event.advisor ?? null);
              if (event.advisor) {
                setExpandedCards((prev) => new Set([...prev, event.advisor!]));
              }
            } else if (event.type === "token") {
              const { phase: p, advisor, text } = event;
              if (p === "round1" && advisor) {
                setMemos((prev) => ({
                  ...prev,
                  [advisor]: { ...prev[advisor], round1: (prev[advisor]?.round1 ?? "") + text },
                }));
              } else if (p === "round2" && advisor) {
                setMemos((prev) => ({
                  ...prev,
                  [advisor]: { ...prev[advisor], round2: (prev[advisor]?.round2 ?? "") + text },
                }));
              } else if (p === "synthesis") {
                setSynthesis((prev) => prev + (text ?? ""));
              }
            } else if (event.type === "advisor_done") {
              const { phase: p, advisor } = event;
              if (p === "round1" && advisor) {
                setMemos((prev) => ({ ...prev, [advisor]: { ...prev[advisor], done1: true } }));
                setExpandedCards((prev) => {
                  const next = new Set(prev);
                  next.delete(advisor);
                  return next;
                });
              } else if (p === "round2" && advisor) {
                setMemos((prev) => ({ ...prev, [advisor]: { ...prev[advisor], done2: true } }));
                setExpandedCards((prev) => {
                  const next = new Set(prev);
                  next.delete(advisor);
                  return next;
                });
              }
            } else if (event.type === "done") {
              setPhase("done");
              setActiveAdvisor(null);
              if (event.slug) setTimeout(() => router.refresh(), 1000);
            } else if (event.type === "error") {
              setPhase("error");
              setPhaseLabel(event.message ?? "An error occurred. Check your API key and try again.");
              setActiveAdvisor(null);
            }
          } catch {
            // malformed event, skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error(err);
        setPhase("idle");
      }
    }
  }, [question, selectedSlugs, advisors, router, mode]);

  const reset = () => {
    abortRef.current?.abort();
    setPhase("idle");
    setMemos({});
    setSynthesis("");
    setActiveAdvisor(null);
    setPhaseLabel("");
    setActiveTab("round1");
    setExpandedCards(new Set());
    setTensionData(null);
    setTabsWithData(new Set());
    setDocuments([]);
  };

  const isRunning = phase !== "idle" && phase !== "done" && phase !== "error";
  const sessionAdvisors = advisors.filter((a) => selectedSlugs.has(a.slug));

  // ── SETUP SCREEN ──────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="pt-4">
          <p className="text-new-leaf text-xs font-sub tracking-widest uppercase mb-2">Boardroom</p>
          <h1 className="text-3xl font-semibold text-white">Convene a Session</h1>
          <p className="text-white/50 mt-2">
            State your question. Select your board. Get two rounds of debate and a synthesis.
          </p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("decision")}
            className={`card p-4 text-left transition-all border-2 ${
              mode === "decision"
                ? "border-new-leaf/60 bg-new-leaf/5"
                : "border-transparent hover:border-white/10"
            }`}
          >
            <p className={`text-sm font-semibold mb-1 ${mode === "decision" ? "text-new-leaf" : "text-white/70"}`}>
              Decision Mode
            </p>
            <p className="text-xs text-white/40 leading-snug">
              Advisors vote YES / NO / CONDITIONAL across two rounds. Best when you need to commit.
            </p>
          </button>
          <button
            onClick={() => setMode("advisory")}
            className={`card p-4 text-left transition-all border-2 ${
              mode === "advisory"
                ? "border-ocean/60 bg-ocean/5"
                : "border-transparent hover:border-white/10"
            }`}
          >
            <p className={`text-sm font-semibold mb-1 ${mode === "advisory" ? "text-ocean" : "text-white/70"}`}>
              Advisory Mode
            </p>
            <p className="text-xs text-white/40 leading-snug">
              Advisors map the strategic terrain — no votes, just reads, tensions, and questions for you.
            </p>
          </button>
        </div>

        {/* Question input */}
        <div className="card p-6 space-y-3">
          <label className="text-sm font-medium text-white/75 block">
            {mode === "decision" ? "Question for the board" : "Topic for the board"}
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              mode === "decision"
                ? "e.g. Should I pursue a retainer model with the Government of Canada?"
                : "e.g. How should we think about our 2026 growth direction?"
            }
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/25 text-sm resize-none focus:outline-none focus:border-new-leaf/50 focus:ring-1 focus:ring-new-leaf/25 transition-colors"
          />

          {/* Supporting documents */}
          <div className="pt-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json,.html,.xml,.rtf,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            {documents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {documents.map((doc) => (
                  <span
                    key={doc.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/10 text-xs text-white/70"
                  >
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 1h5.5L10 3.5V11H2V1z" /><path d="M7 1v3h3" />
                    </svg>
                    {doc.name}
                    <button
                      onClick={() => removeDocument(doc.name)}
                      className="text-white/30 hover:text-white/70 transition-colors ml-1 p-1 -m-1"
                      aria-label={`Remove ${doc.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors"
            >
              <svg viewBox="0 0 12 12" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              Attach supporting documents
            </button>
          </div>
        </div>

        {/* Advisor selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xs font-sub text-white/40 uppercase tracking-widest">
              Select Advisors{" "}
              <span className={`normal-case tracking-normal font-normal ml-2 ${selectedSlugs.size >= ADVISOR_LIMIT ? "text-blossom/70" : "text-new-leaf"}`}>
                {selectedSlugs.size} / {ADVISOR_LIMIT}
              </span>
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {boards.map((b) => (
                <button
                  key={b}
                  onClick={() => selectBoard(b)}
                  className="text-xs px-3 py-1.5 rounded border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 transition-colors"
                >
                  + {b}
                </button>
              ))}
              {selectedSlugs.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-xs px-3 py-1.5 rounded border border-blossom/30 text-blossom/70 hover:border-blossom/50 hover:text-blossom transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Board filter tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            <button
              onClick={() => setFilterBoard("all")}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-md transition-colors ${
                filterBoard === "all" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              All
            </button>
            {boards.map((b) => (
              <button
                key={b}
                onClick={() => setFilterBoard(b)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-md transition-colors ${
                  filterBoard === b ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAdvisors.map((advisor) => (
              <AdvisorCard
                key={advisor.slug}
                advisor={advisor}
                selected={selectedSlugs.has(advisor.slug)}
                disabled={!selectedSlugs.has(advisor.slug) && selectedSlugs.size >= ADVISOR_LIMIT}
                onClick={() => toggleAdvisor(advisor.slug)}
                compact
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 pb-8">
          <button
            onClick={runSession}
            disabled={!question.trim() || selectedSlugs.size === 0}
            className="btn-primary"
          >
            Convene Board →
          </button>
          {selectedSlugs.size > 0 && (
            <p className="text-white/40 text-sm">
              {selectedSlugs.size} advisor{selectedSlugs.size !== 1 ? "s" : ""} ·{" "}
              ~{Math.ceil(selectedSlugs.size * 2.5)} min
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── SESSION IN PROGRESS / DONE ─────────────────────────────────────────
  const TABS: { id: Tab; label: string; sublabel?: string }[] = [
    { id: "round1", label: "Round 1", sublabel: mode === "advisory" ? "Strategic Reads" : "Positions" },
    { id: "round2", label: "Round 2", sublabel: mode === "advisory" ? "Pushback" : "Rebuttals" },
    { id: "tensions", label: "Tensions" },
    { id: "synthesis", label: "Synthesis" },
  ];

  const renderAdvisorCard = (advisor: Advisor, round: "round1" | "round2") => {
    const memo = memos[advisor.slug];
    const content = round === "round1" ? memo?.round1 : memo?.round2;
    const isDone = round === "round1" ? memo?.done1 : memo?.done2;
    if (!content) return null;

    const isStreaming = activeAdvisor === advisor.slug;
    const isExpanded = isStreaming || expandedCards.has(advisor.slug);
    const vote = round === "round1" && mode === "decision" ? extractVote(content) : null;
    const borderColor = BOARD_LEFT_BORDER[advisor.boards[0]] ?? "border-white/20";
    const initials = advisor.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

    return (
      <div
        key={`${advisor.slug}-${round}`}
        className={`card border-l-2 ${borderColor} animate-slide-up overflow-hidden`}
      >
        {/* Header — always visible, click to toggle */}
        <button
          onClick={() => !isStreaming && toggleCard(advisor.slug)}
          className={`w-full p-5 flex items-center gap-3 text-left ${
            !isStreaming ? "hover:bg-white/3 transition-colors cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/8 flex items-center justify-center text-xs font-semibold text-white/50">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white/85 text-sm">{advisor.name}</span>
              <span className="text-white/35 text-xs">{advisor.focus}</span>
              {vote && <VoteBadge vote={vote} size="sm" />}
            </div>
            {!isExpanded && (
              <p className="text-white/35 text-xs mt-1 line-clamp-1">{getPreview(content)}</p>
            )}
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 ml-2">
            {isStreaming && (
              <span className="flex items-center gap-1.5 text-xs text-new-leaf whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-new-leaf animate-pulse" />
                Writing…
              </span>
            )}
            {isDone && !isStreaming && <span className="text-xs text-breeze">✓</span>}
            {!isStreaming && (
              <svg
                viewBox="0 0 12 12"
                className={`w-3 h-3 text-white/30 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            )}
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-5 pb-5 border-t border-white/5 pt-4">
            <div className="prose-board text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="pt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-new-leaf text-xs font-sub tracking-widest uppercase mb-2">
            {phase === "done" ? "Session Complete" : "In Session"}
          </p>
          <h1 className="text-2xl font-semibold text-white max-w-2xl leading-snug">{question}</h1>
        </div>
        <button onClick={reset} className="btn-secondary text-sm flex-shrink-0">
          {phase === "done" ? "New Session" : "Cancel"}
        </button>
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-new-leaf animate-pulse" />
          <span className="text-sm text-white/50">{phaseLabel}</span>
          {activeAdvisor && (
            <span className="text-sm text-new-leaf">
              {sessionAdvisors.find((a) => a.slug === activeAdvisor)?.name}…
            </span>
          )}
        </div>
      )}

      {/* Error state */}
      {phase === "error" && (
        <div className="card border border-blossom/30 bg-blossom/5 p-5">
          <p className="text-sm font-semibold text-blossom mb-1">Session failed</p>
          <p className="text-sm text-white/50">{phaseLabel}</p>
          <button onClick={reset} className="btn-secondary text-sm mt-4">
            Try Again
          </button>
        </div>
      )}

      {/* Tab navigation + content */}
      {phase !== "error" && (
        <>
          <div className="border-b border-white/10">
            <div className="flex overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const hasData = tabsWithData.has(tab.id);
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => hasData && setActiveTab(tab.id)}
                    disabled={!hasData}
                    className={`flex-shrink-0 px-4 py-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? "border-new-leaf text-white font-medium"
                        : hasData
                        ? "border-transparent text-white/45 hover:text-white/70"
                        : "border-transparent text-white/20 cursor-not-allowed"
                    }`}
                  >
                    {tab.label}
                    {tab.sublabel && (
                      <span className={`text-xs ml-1.5 ${isActive ? "text-white/50" : "text-white/25"}`}>
                        {tab.sublabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {activeTab === "round1" &&
              sessionAdvisors.map((advisor) => renderAdvisorCard(advisor, "round1"))}

            {activeTab === "round2" &&
              sessionAdvisors.map((advisor) => renderAdvisorCard(advisor, "round2"))}

            {activeTab === "tensions" && tensionData && (
              <TensionMap data={tensionData} advisors={sessionAdvisors} mode={mode} />
            )}

            {activeTab === "synthesis" && synthesis && (
              <div className="card border-new-leaf/20 bg-new-leaf/5 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-new-leaf/20 flex items-center justify-center">
                    <span className="text-new-leaf text-xs font-bold">C</span>
                  </div>
                  <span className="font-semibold text-white/85 text-sm">The Chair</span>
                  {phase === "done" && <span className="ml-auto text-xs text-breeze">✓ Saved</span>}
                  {phase === "synthesis" && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-new-leaf">
                      <span className="w-1.5 h-1.5 rounded-full bg-new-leaf animate-pulse" />
                      Synthesizing…
                    </span>
                  )}
                </div>
                <div className="prose-board">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{synthesis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="flex items-center gap-4 pt-2">
          <button onClick={reset} className="btn-primary">
            New Session
          </button>
          <a href="/decisions" className="btn-secondary">
            View Archive
          </a>
        </div>
      )}
    </div>
  );
}
