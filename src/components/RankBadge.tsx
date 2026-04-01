import { TIER_LABELS } from "@/lib/eloUtils";

const TIER_COLORS: Record<string, string> = {
  IRON: "text-muted-foreground",
  BRONZE: "text-[hsl(25,60%,50%)]",
  SILVER: "text-muted-foreground",
  GOLD: "text-secondary",
  PLATINUM: "text-[hsl(175,60%,50%)]",
  EMERALD: "text-[hsl(140,60%,50%)]",
  DIAMOND: "text-[hsl(210,80%,65%)]",
  MASTER: "text-accent",
  GRANDMASTER: "text-destructive",
  CHALLENGER: "text-secondary",
};

// Riot CDN for rank emblems
const getRankEmblemUrl = (tier: string) =>
  `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.png`;

interface RankBadgeProps {
  tier: string;
  rank?: string;
  lp?: number;
  winRate?: number;
  wins?: number;
  losses?: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

const sizeMap = {
  sm: { icon: "h-6 w-6", text: "text-xs", detail: "text-[9px]" },
  md: { icon: "h-8 w-8", text: "text-sm", detail: "text-[10px]" },
  lg: { icon: "h-12 w-12", text: "text-lg", detail: "text-xs" },
};

const RankBadge = ({ tier, rank, lp, winRate, wins, losses, size = "md", showDetails = true }: RankBadgeProps) => {
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
        {showDetails && lp !== undefined && (
          <p className={`${s.detail} text-muted-foreground`}>
            {lp} LP
            {winRate !== undefined && ` • ${winRate}% WR`}
            {wins !== undefined && losses !== undefined && (
              <span className="ml-1">{wins}V {losses}D</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export { RankBadge, TIER_COLORS, getRankEmblemUrl };
export default RankBadge;
