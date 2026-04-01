import Link from "next/link";
import { getAllDecisions } from "@/lib/decisions";

export default function DecisionsPage() {
  const decisions = getAllDecisions();

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
        <div className="card p-12 text-center">
          <p className="text-white/40">No sessions yet.</p>
          <Link href="/boardroom" className="text-new-leaf hover:text-new-leaf/70 text-sm mt-2 inline-block transition-colors">
            Convene your first session →
          </Link>
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
                  <div className="flex items-center gap-3 mt-2">
                    {d.date && (
                      <span className="text-xs text-white/35">{d.date}</span>
                    )}
                    <span className="text-xs text-white/25">
                      {d.files.length} file{d.files.length !== 1 ? "s" : ""}
                    </span>
                  </div>
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
