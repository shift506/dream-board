export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAllDecisions } from "@/lib/decisions";
import { getAllAdvisors, ALL_BOARDS } from "@/lib/advisors";
import { getBusinessContext } from "@/lib/context";

function extractContextSummary(raw: string): string {
  const lines = raw.split("\n").filter((l) => l.trim() && !l.startsWith("**")&& !l.startsWith("##") && !l.startsWith("# #"));
  return lines.slice(0, 3).join(" ").slice(0, 300) + "…";
}

export default async function DashboardPage() {
  const [decisions, context, advisors] = await Promise.all([getAllDecisions(), getBusinessContext(), getAllAdvisors()]);
  const recentDecisions = decisions.slice(0, 3);

  const boardCounts = ALL_BOARDS.map((board) => ({
    board,
    count: advisors.filter((a) => a.boards.includes(board)).length,
  }));

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="pt-4">
        <p className="text-new-leaf text-xs font-sub tracking-widest uppercase mb-2">
          ShiftFlow Innovation & Design
        </p>
        <h1 className="text-3xl font-semibold text-white">Your Dream Board</h1>
        <p className="text-white/50 mt-2 max-w-xl">
          Convene your advisory board for strategic decisions. Structured debate,
          honest synthesis, no flattery.
        </p>
      </div>

      {/* CTA */}
      <div className="card p-6 border-new-leaf/20 bg-new-leaf/5">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-white">Ready to convene?</h2>
            <p className="text-white/50 text-sm mt-1">
              Bring a question to the board. Get structured debate in two rounds plus a synthesis.
            </p>
          </div>
          <Link href="/boardroom" className="btn-primary whitespace-nowrap">
            Open Boardroom →
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Advisors", value: advisors.length },
          { label: "Boards", value: ALL_BOARDS.length },
          { label: "Sessions", value: decisions.length },
          { label: "Questions Decided", value: decisions.length },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-2xl font-semibold text-new-leaf">{value}</div>
            <div className="text-xs text-white/40 mt-1 font-sub tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        {/* Recent decisions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-sub text-white/40 uppercase tracking-widest">
              Recent Sessions
            </h2>
            <Link href="/decisions" className="text-xs text-new-leaf hover:text-new-leaf/70 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentDecisions.length === 0 && (
              <p className="text-white/30 text-sm">No sessions yet. Convene your first one.</p>
            )}
            {recentDecisions.map((d) => (
              <Link
                key={d.slug}
                href={`/decisions/${d.slug}`}
                className="card-hover block p-4"
              >
                <div className="text-sm font-medium text-white/85 leading-snug line-clamp-2">
                  {d.question || d.title}
                </div>
                {d.date && (
                  <div className="text-xs text-white/35 mt-1.5">{d.date}</div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Board roster */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-sub text-white/40 uppercase tracking-widest">
              Boards
            </h2>
            <Link href="/advisors" className="text-xs text-new-leaf hover:text-new-leaf/70 transition-colors">
              All advisors →
            </Link>
          </div>
          <div className="space-y-2">
            {boardCounts.map(({ board, count }) => (
              <Link
                key={board}
                href={`/advisors?board=${encodeURIComponent(board)}`}
                className="card-hover flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-white/75">{board}</span>
                <span className="text-xs text-white/35">{count} advisors</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Business context snippet */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-sub text-white/40 uppercase tracking-widest">
            Context
          </h2>
          <Link href="/context" className="text-xs text-new-leaf hover:text-new-leaf/70 transition-colors">
            Edit →
          </Link>
        </div>
        {context ? (
          <p className="text-white/55 text-sm leading-relaxed">
            {extractContextSummary(context)}
          </p>
        ) : (
          <p className="text-white/30 text-sm">
            No context yet.{" "}
            <Link href="/context" className="text-new-leaf hover:underline">
              Add context for your advisors →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
