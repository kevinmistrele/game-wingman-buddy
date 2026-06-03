import { TIER_LABELS } from "@/lib/eloUtils";
import type { TierColorKey } from "@/design-system/tokens";

const TIER_COLORS: Record<string, string> = {
  IRON:        "text-tier-iron",
  BRONZE:      "text-tier-bronze",
  SILVER:      "text-tier-silver",
  GOLD:        "text-tier-gold",
  PLATINUM:    "text-tier-platinum",
  EMERALD:     "text-tier-emerald",
  DIAMOND:     "text-tier-diamond",
  MASTER:      "text-tier-master",
  GRANDMASTER: "text-tier-grandmaster",
  CHALLENGER:  "text-tier-challenger",
} satisfies Record<TierColorKey, string>;

const getRankEmblemUrl = (tier: string) =>
  `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.png`;

interface RankBadgeProps {
  tier: string;
  rank?: string;
  winRate?: number;
  wins?: number;
  losses?: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

const sizeMap = {
  sm: { icon: "h-6 w-6", text: "text-xs", detail: "text-xs" },
  md: { icon: "h-8 w-8", text: "text-sm", detail: "text-xs" },
  lg: { icon: "h-12 w-12", text: "text-lg", detail: "text-xs" },
};

const RankBadge = ({ tier, rank, winRate, wins, losses, size = "md", showDetails = true }: RankBadgeProps) => {
  const s = sizeMap[size];
  const colorClass = TIER_COLORS[tier] ?? "text-foreground";
  const label = TIER_LABELS[tier] ?? tier;

  return (
    <div className="flex items-center gap-2">
      <img
        src={getRankEmblemUrl(tier)}
        alt={label}
        className={`${s.icon} object-contain`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div>
        <p className={`font-display font-bold ${s.text} ${colorClass}`}>
          {label} {rank}
        </p>
        {showDetails && (winRate !== undefined || (wins !== undefined && losses !== undefined)) && (
          <p className={`${s.detail} text-muted-foreground`}>
            {winRate !== undefined && `${winRate}% WR`}
            {wins !== undefined && losses !== undefined && (
              <span>{winRate !== undefined ? " • " : ""}{wins}V {losses}D</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export { RankBadge, TIER_COLORS, getRankEmblemUrl };
export default RankBadge;
