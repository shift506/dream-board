export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import Link from "next/link";
import { getAllDecisions } from "@/lib/decisions";

export default async function DecisionsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("boardroom-id")?.value ?? "anonymous";
  const decisions = await getAllDecisions(userId);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="pt-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-new-leaf text-xs font-sub tracking-widest uppercase mb-2">
            Archive
          </p>
          <h1 className="text-3xl font-semibold text-white">Decisions</h1>
          <p className="text-white/50 mt-2">
            Every board session, saved. {decisions.length} session
            {decisions.length !== 1 ? "s" : ""} to date.
          </p>
        </div>
        <Link href="/boardroom" className="btn-primary">
          New Session →
        </Link>
      </div>

      {decisions.length === 0 ? (
        <div className="space-y-4">
          <div className="card p-6 sm:p-8">
            <p className="text-xs font-sub text-white/40 uppercase tracking-widest mb-3">No sessions yet</p>
            <p className="text-white/55 text-sm mb-6 max-w-lg">
              Each session you run is saved here. Your first one is one question away.
            </p>
            <p className="text-xs font-sub text-white/30 uppercase tracking-widest mb-3">Questions to start with</p>
            <div className="space-y-2">
              {[
                "Should we pursue this new opportunity, or stay focused on what's working?",
                "What's the most important thing we should be doing right now that we're not?",
                "What assumptions are we making that, if wrong, would change everything?",
                "Where are we underinvesting relative to our ambition?",
              ].map((q) => (
                <Link
                  key={q}
                  href={`/boardroom?q=${encodeURIComponent(q)}`}
                  className="card-hover flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-sm text-white/65">{q}</span>
                  <span className="text-white/25 text-xs flex-shrink-0">Ask this →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <Link
              key={d.slug}
              href={`/decisions/${d.slug}`}
              className="card-hover block p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-white text-base leading-snug">
                    {d.question || d.title}
                  </h2>
                  {d.date && (
                    <span className="text-xs text-white/35 mt-2 block">{d.date}</span>
                  )}
                </div>
                <span className="text-white/30 text-sm flex-shrink-0">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
