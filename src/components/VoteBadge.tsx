export type Vote = "YES" | "NO" | "CONDITIONAL" | "TBD";

interface VoteBadgeProps {
  vote: Vote;
  size?: "sm" | "md";
}

export default function VoteBadge({ vote, size = "md" }: VoteBadgeProps) {
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  const variants: Record<Vote, string> = {
    YES: "vote-yes",
    NO: "vote-no",
    CONDITIONAL: "vote-conditional",
    TBD: "bg-white/5 text-white/40 border border-white/10",
  };

  return (
    <span className={`inline-flex items-center rounded font-semibold tracking-wide ${sizeClass} ${variants[vote]}`}>
      {vote}
    </span>
  );
}
