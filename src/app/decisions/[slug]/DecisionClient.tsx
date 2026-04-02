"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import VoteBadge, { type Vote } from "@/components/VoteBadge";
import TensionMap from "@/components/TensionMap";
import type { SessionData, SessionAdvisor } from "@/lib/decisions";

// ─── HTML Report Generator ─────────────────────────────────────────────────

function mdToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[hul])(.+)$/gm, (line) => line ? line : "")
    .replace(/^([^<\n].+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}

function buildReport(session: SessionData): string {
  const voteColor: Record<string, string> = {
    YES: "#22c55e", NO: "#ef4444", CONDITIONAL: "#f59e0b",
  };

  const advisorSection = (advisor: SessionAdvisor, round: "round1" | "round2") => {
    const content = round === "round1" ? advisor.round1 : advisor.round2;
    if (!content) return "";
    const voteMatch = content.match(/\*\*(?:your\s+)?vote[^*]*\*\*[:\s]*(YES|NO|CONDITIONAL)/i)
      || content.match(/\bVOTE[:\s]+(YES|NO|CONDITIONAL)\b/i);
    const vote = voteMatch?.[1]?.toUpperCase();
    return `
      <div class="advisor-card">
        <div class="advisor-header">
          <div class="advisor-meta">
            <strong>${advisor.name}</strong>
            <span class="focus">${advisor.focus}</span>
            ${vote ? `<span class="vote" style="color:${voteColor[vote]};border-color:${voteColor[vote]}">${vote}</span>` : ""}
          </div>
        </div>
        <div class="advisor-content">${mdToHtml(content)}</div>
      </div>`;
  };

  const tensionRows = session.tension?.vote_summary
    ? Object.entries(session.tension.vote_summary).flatMap(([vote, names]) =>
        names.map((name) => `
          <tr>
            <td>${name}</td>
            <td style="color:${voteColor[vote] ?? "#999"};font-weight:600">${vote}</td>
            <td></td>
          </tr>`)
      ).join("")
    : "";

  const faultLines = session.tension?.fault_lines?.map((fl) => `
    <div class="fault-line">
      <div class="fault-label">${fl.topic}</div>
      <div class="fault-camps">
        <div><strong>${fl.side_a.label}:</strong> ${fl.side_a.advisors.join(", ")}</div>
        <div><strong>${fl.side_b.label}:</strong> ${fl.side_b.advisors.join(", ")}</div>
        <div class="fault-description">${fl.description}</div>
      </div>
    </div>`).join("") ?? "";

  const hasRound2 = session.advisors.some((a) => !!a.round2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${session.question}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f9f9f8; color: #1a1a1a; line-height: 1.6; padding: 2rem 1rem; }
  .container { max-width: 760px; margin: 0 auto; }
  .report-header { border-bottom: 2px solid #e5e5e5; padding-bottom: 1.5rem; margin-bottom: 2rem; }
  .report-header .badge { display: inline-block; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid; margin-bottom: 0.75rem; background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
  .report-header h1 { font-size: 1.6rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.5rem; }
  .report-header .meta { font-size: 0.8rem; color: #666; }
  .section { margin-bottom: 2.5rem; }
  .section-title { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 1rem; padding-bottom: 0.4rem; border-bottom: 1px solid #e5e5e5; }
  .advisor-card { border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 1rem; background: #fff; overflow: hidden; }
  .advisor-header { padding: 0.875rem 1rem; background: #fafafa; border-bottom: 1px solid #e5e5e5; }
  .advisor-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .advisor-meta strong { font-size: 0.9rem; }
  .focus { font-size: 0.75rem; color: #888; }
  .vote { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.06em; padding: 0.15rem 0.5rem; border-radius: 4px; border: 1px solid; }
  .advisor-content { padding: 1rem; font-size: 0.875rem; }
  .advisor-content h2 { font-size: 0.95rem; margin: 1rem 0 0.4rem; color: #333; }
  .advisor-content h3 { font-size: 0.875rem; margin: 0.75rem 0 0.3rem; color: #444; }
  .advisor-content p { margin-bottom: 0.6rem; }
  .advisor-content ul { padding-left: 1.25rem; margin-bottom: 0.6rem; }
  .advisor-content li { margin-bottom: 0.2rem; }
  .advisor-content strong { font-weight: 600; }
  .tensions-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .tensions-table th { text-align: left; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #999; padding: 0.4rem 0.75rem; border-bottom: 1px solid #e5e5e5; }
  .tensions-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f0f0f0; }
  .fault-line { border: 1px solid #e5e5e5; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; background: #fff; }
  .fault-label { font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem; }
  .fault-camps { font-size: 0.8rem; color: #555; display: flex; flex-direction: column; gap: 0.25rem; }
  .fault-description { margin-top: 0.5rem; color: #666; font-style: italic; }
  .synthesis-card { border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4; padding: 1.25rem; }
  .synthesis-card .chair { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
  .synthesis-card .chair-badge { width: 28px; height: 28px; border-radius: 6px; background: #166534; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }
  .synthesis-card .chair-name { font-weight: 600; font-size: 0.875rem; }
  .synthesis-content { font-size: 0.875rem; }
  .synthesis-content h2 { font-size: 0.95rem; margin: 1rem 0 0.4rem; }
  .synthesis-content p { margin-bottom: 0.6rem; }
  .synthesis-content ul { padding-left: 1.25rem; margin-bottom: 0.6rem; }
  .synthesis-content li { margin-bottom: 0.2rem; }
  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e5e5; font-size: 0.75rem; color: #bbb; text-align: center; }
  @media print { body { background: #fff; padding: 0; } }
</style>
</head>
<body>
<div class="container">
  <div class="report-header">
    <div class="badge">${session.mode === "advisory" ? "Advisory Session" : "Decision Session"}</div>
    <h1>${session.question}</h1>
    <div class="meta">${session.date} &nbsp;·&nbsp; ${session.advisors.map((a) => a.name).join(", ")}</div>
  </div>

  <div class="section">
    <div class="section-title">Round 1 — ${session.mode === "advisory" ? "Strategic Reads" : "Positions"}</div>
    ${session.advisors.map((a) => advisorSection(a, "round1")).join("")}
  </div>

  ${hasRound2 ? `
  <div class="section">
    <div class="section-title">Round 2 — ${session.mode === "advisory" ? "Pushback" : "Rebuttals"}</div>
    ${session.advisors.map((a) => advisorSection(a, "round2")).join("")}
  </div>` : ""}

  ${session.tension ? `
  <div class="section">
    <div class="section-title">Tensions</div>
    <table class="tensions-table">
      <thead><tr><th>Advisor</th><th>Vote</th><th>Condition</th></tr></thead>
      <tbody>${tensionRows}</tbody>
    </table>
    ${faultLines ? `<div style="margin-top:1rem">${faultLines}</div>` : ""}
  </div>` : ""}

  ${session.synthesis ? `
  <div class="section">
    <div class="section-title">Synthesis</div>
    <div class="synthesis-card">
      <div class="chair">
        <div class="chair-badge">C</div>
        <span class="chair-name">The Chair</span>
      </div>
      <div class="synthesis-content">${mdToHtml(session.synthesis)}</div>
    </div>
  </div>` : ""}

  <div class="footer">Generated by Your Dream Board</div>
</div>
</body>
</html>`;
}

function downloadReport(session: SessionData) {
  const html = buildReport(session);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `board-session-${session.date ?? "report"}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

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
      <div className="flex items-center gap-4 pt-2 flex-wrap">
        <Link href="/decisions" className="btn-secondary">
          ← Archive
        </Link>
        <Link href="/boardroom" className="btn-primary">
          New Session →
        </Link>
        <button
          type="button"
          onClick={() => downloadReport(session)}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
        >
          Download Report
        </button>
      </div>
    </div>
  );
}
