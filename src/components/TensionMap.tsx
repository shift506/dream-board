import type { Advisor } from "@/lib/advisors";
import VoteBadge from "@/components/VoteBadge";

export interface TensionData {
  vote_summary: Record<string, string[]> | null;
  fault_lines: Array<{
    topic: string;
    description: string;
    side_a: { label: string; advisors: string[] };
    side_b: { label: string; advisors: string[] };
  }>;
  agreements: string[];
}

const BOARD_COLORS: Record<string, string> = {
  "Marketing": "bg-blossom/20 text-blossom",
  "Strategy & Direction": "bg-ocean/20 text-ocean",
  "Revenue & Business Model": "bg-breeze/20 text-breeze",
  "Execution & Momentum": "bg-new-leaf/20 text-new-leaf",
  "Systems Change": "bg-ocean/15 text-ocean",
  "Personal": "bg-blossom/15 text-blossom",
};

function AdvisorChip({ slug, advisors }: { slug: string; advisors: Advisor[] }) {
  const advisor = advisors.find((a) => a.slug === slug);
  if (!advisor) return null;
  const initials = advisor.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const colorClass = BOARD_COLORS[advisor.boards[0]] ?? "bg-white/15 text-white/60";
  return (
    <span
      title={advisor.name}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border border-white/10 ${colorClass}`}
    >
      <span className="font-bold">{initials}</span>
      <span className="opacity-80">{advisor.name.split(" ")[0]}</span>
    </span>
  );
}

export default function TensionMap({
  data,
  advisors,
  mode,
}: {
  data: TensionData;
  advisors: Advisor[];
  mode: "decision" | "advisory";
}) {
  return (
    <div className="space-y-4">
      {/* Vote summary — decision mode only */}
      {mode === "decision" && data.vote_summary && (
        <div className="card p-5 space-y-3">
          <h3 className="text-xs font-sub text-white/40 uppercase tracking-widest">Vote Summary</h3>
          <div className="flex flex-wrap gap-4 sm:gap-8">
            {(["YES", "NO", "CONDITIONAL"] as const).map((vote) => {
              const slugs = data.vote_summary?.[vote] ?? [];
              return (
                <div key={vote} className="space-y-2">
                  <VoteBadge vote={vote} size="sm" />
                  <div className="flex flex-col gap-1.5">
                    {slugs.length === 0 ? (
                      <span className="text-xs text-white/25">—</span>
                    ) : (
                      slugs.map((slug) => (
                        <AdvisorChip key={slug} slug={slug} advisors={advisors} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fault lines */}
      {data.fault_lines.length > 0 && (
        <div className="card p-5 space-y-5">
          <h3 className="text-xs font-sub text-white/40 uppercase tracking-widest">Fault Lines</h3>
          <div className="space-y-5">
            {data.fault_lines.map((fl, i) => (
              <div key={i}>
                <div className="mb-3">
                  <p className="text-sm font-semibold text-white">{fl.topic}</p>
                  <p className="text-xs text-white/45 mt-0.5">{fl.description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs text-white/35 font-medium uppercase tracking-wide">{fl.side_a.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {fl.side_a.advisors.map((slug) => (
                        <AdvisorChip key={slug} slug={slug} advisors={advisors} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-white/35 font-medium uppercase tracking-wide">{fl.side_b.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {fl.side_b.advisors.map((slug) => (
                        <AdvisorChip key={slug} slug={slug} advisors={advisors} />
                      ))}
                    </div>
                  </div>
                </div>
                {i < data.fault_lines.length - 1 && (
                  <div className="border-t border-white/5 mt-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared ground */}
      {data.agreements.length > 0 && (
        <div className="card p-5 space-y-3">
          <h3 className="text-xs font-sub text-white/40 uppercase tracking-widest">Shared Ground</h3>
          <ul className="space-y-2">
            {data.agreements.map((agreement, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/65">
                <span className="text-new-leaf mt-0.5 flex-shrink-0">•</span>
                {agreement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
