import type { LolMatch } from "@/hooks/useRiotMatches";
import ProfileCharts from "@/components/ProfileCharts";

const StatsTab = ({ matches }: { matches: LolMatch[] }) => (
  <ProfileCharts matches={matches} />
);

export default StatsTab;
