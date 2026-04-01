import type { Advisor } from "@/lib/advisors";

interface AdvisorCardProps {
  advisor: Advisor;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const BOARD_COLORS: Record<string, string> = {
  "Marketing": "bg-blossom/10 text-blossom border-blossom/25",
  "Strategy & Direction": "bg-ocean/10 text-ocean border-ocean/25",
  "Revenue & Business Model": "bg-breeze/10 text-breeze border-breeze/25",
  "Execution & Momentum": "bg-new-leaf/10 text-new-leaf border-new-leaf/25",
  "Systems Change": "bg-ocean/10 text-ocean border-ocean/20",
  "Personal": "bg-blossom/10 text-blossom border-blossom/20",
};

export default function AdvisorCard({
  advisor,
  selected,
  disabled = false,
  onClick,
  compact = false,
}: AdvisorCardProps) {
  const initials = advisor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  const interactive = onClick !== undefined && !disabled;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`card transition-all duration-150 ${
        disabled ? "opacity-35 cursor-not-allowed" : interactive ? "cursor-pointer" : ""
      } ${
        selected
          ? "border-new-leaf/50 bg-new-leaf/5 ring-1 ring-new-leaf/25"
          : interactive
          ? "hover:border-white/20 hover:bg-white/8"
          : ""
      } ${compact ? "p-3" : "p-5"}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 rounded-lg flex items-center justify-center font-semibold ${
            compact ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
          } ${
            selected
              ? "bg-new-leaf/20 text-new-leaf"
              : "bg-white/8 text-white/50"
          }`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold text-white ${
                compact ? "text-sm" : "text-base"
              }`}
            >
              {advisor.name}
            </span>
            {selected && (
              <span className="w-4 h-4 rounded-full bg-new-leaf flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-galaxy fill-current">
                  <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </span>
            )}
          </div>
          <p className={`text-white/50 ${compact ? "text-xs" : "text-sm"} mt-0.5`}>
            {advisor.focus}
          </p>
          {!compact && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {advisor.boards.map((board) => (
                <span
                  key={board}
                  className={`text-xs px-2 py-0.5 rounded border ${
                    BOARD_COLORS[board] ?? "bg-white/5 text-white/40 border-white/10"
                  }`}
                >
                  {board}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
