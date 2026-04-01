"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import VoteBadge, { type Vote } from "@/components/VoteBadge";
import TensionMap from "@/components/TensionMap";
import type { SessionData, SessionAdvisor } from "@/lib/decisions";

type Tab = "round1" | "round2" | "tensions" | "synthesis";

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

function AdvisorCard({
  advisor,
  round,
  mode,
  expanded,
  onToggle,
}: {
  advisor: SessionAdvisor;
  round: "round1" | "round2";
  mode: "decision" | "advisory";
  expanded: boolean;
  onToggle: () => void;
}) {
  const content = round === "round1" ? advisor.round1 : advisor.round2;
  if (!content) return null;

  const vote = round === "round1" && mode === "decision" ? extractVote(content) : null;
  const borderColor = BOARD_LEFT_BORDER[advisor.boards[0]] ?? "border-white/20";
  const initials = advisor.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <div className={`card border-l-2 ${borderColor} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-3 text-left hover:bg-white/3 transition-colors cursor-pointer"
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
          {!expanded && (
            <p className="text-white/35 text-xs mt-1 line-clamp-1">{getPreview(content)}</p>
          )}
        </div>
        <svg
          viewBox="0 0 12 12"
          className={`w-3 h-3 flex-shrink-0 text-white/30 transition-transform ml-2 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          <div className="prose-board text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DecisionClient({ session }: { session: SessionData }) {
  const [activeTab, setActiveTab] = useState<Tab>("round1");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (key: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const hasTensions = !!session.tension;

  const TABS: { id: Tab; label: string; sublabel?: string; enabled: boolean }[] = [
    {
      id: "round1",
      label: "Round 1",
      sublabel: session.mode === "advisory" ? "Strategic Reads" : "Positions",
      enabled: true,
    },
    {
      id: "round2",
      label: "Round 2",
      sublabel: session.mode === "advisory" ? "Pushback" : "Rebuttals",
      enabled: session.advisors.some((a) => !!a.round2),
    },
    { id: "tensions", label: "Tensions", enabled: hasTensions },
    { id: "synthesis", label: "Synthesis", enabled: !!session.synthesis },
  ];

  // Adapt advisors for TensionMap (which expects Advisor type with boards array)
  const advisorsForMap = session.advisors.map((a) => ({
    slug: a.slug,
    name: a.name,
    focus: a.focus,
    boards: a.boards,
    content: "",
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="pt-4">
        <Link
          href="/decisions"
          className="text-xs text-white/35 hover:text-white/60 transition-colors mb-4 inline-block"
        >
          ← All Decisions
        </Link>
        <div className="flex items-start gap-3 flex-wrap mb-1">
          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
            session.mode === "advisory"
              ? "bg-ocean/10 text-ocean border-ocean/25"
              : "bg-new-leaf/10 text-new-leaf border-new-leaf/25"
          }`}>
            {session.mode === "advisory" ? "Advisory" : "Decision"}
          </span>
          {session.date && (
            <span className="text-white/35 text-xs mt-0.5">{session.date}</span>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-white max-w-3xl leading-snug mt-2">
          {session.question}
        </h1>
        <p className="text-white/35 text-xs mt-2">
          {session.advisors.map((a) => a.name).join(" · ")}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-white/10">
        <div className="flex overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => tab.enabled && setActiveTab(tab.id)}
                disabled={!tab.enabled}
                className={`flex-shrink-0 px-4 py-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-new-leaf text-white font-medium"
                    : tab.enabled
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

      {/* Tab content */}
      <div className="space-y-3">
        {activeTab === "round1" &&
          session.advisors.map((advisor) => (
            <AdvisorCard
              key={`${advisor.slug}-r1`}
              advisor={advisor}
              round="round1"
              mode={session.mode}
              expanded={expandedCards.has(`${advisor.slug}-r1`)}
              onToggle={() => toggleCard(`${advisor.slug}-r1`)}
            />
          ))}

        {activeTab === "round2" &&
          session.advisors.map((advisor) => (
            <AdvisorCard
              key={`${advisor.slug}-r2`}
              advisor={advisor}
              round="round2"
              mode={session.mode}
              expanded={expandedCards.has(`${advisor.slug}-r2`)}
              onToggle={() => toggleCard(`${advisor.slug}-r2`)}
            />
          ))}

        {activeTab === "tensions" && session.tension && (
          <TensionMap
            data={session.tension}
            advisors={advisorsForMap}
            mode={session.mode}
          />
        )}

        {activeTab === "synthesis" && session.synthesis && (
          <div className="card border-new-leaf/20 bg-new-leaf/5 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-new-leaf/20 flex items-center justify-center">
                <span className="text-new-leaf text-xs font-bold">C</span>
              </div>
              <span className="font-semibold text-white/85 text-sm">The Chair</span>
            </div>
            <div className="prose-board">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.synthesis}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 pt-2">
        <Link href="/decisions" className="btn-secondary">
          ← Archive
        </Link>
        <Link href="/boardroom" className="btn-primary">
          New Session →
        </Link>
      </div>
    </div>
  );
}
