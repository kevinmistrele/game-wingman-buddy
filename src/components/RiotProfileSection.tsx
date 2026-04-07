import { useAuth } from "@/contexts/AuthContext";
import { useRiotProfile } from "@/hooks/useRiotMatches";
import { AlertCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "@/components/profile/OverviewTab";
import MatchesTab from "@/components/profile/MatchesTab";
import StatsTab from "@/components/profile/StatsTab";
import ChampionsTab from "@/components/profile/ChampionsTab";

const RiotProfileSection = () => {
  const { profile } = useAuth();
  const { data, isLoading, error } = useRiotProfile("lol", profile?.riot_id, "br1", 10);

  if (!profile?.riot_id) {
    return (
      <div className="clip-angle border border-border gradient-card p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="font-display text-sm tracking-wider text-muted-foreground">
          VINCULE SEU RIOT ID NO PERFIL PARA VER SUAS ESTATÍSTICAS
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 font-display text-sm tracking-wider text-muted-foreground">CARREGANDO DADOS DA RIOT...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clip-angle border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-destructive mb-2" />
        <p className="text-sm text-destructive">{(error as Error).message}</p>
        <p className="text-xs text-muted-foreground mt-1">Verifique se sua API Key da Riot está válida</p>
      </div>
    );
  }

  if (!data || data.game !== "lol") return null;

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full grid grid-cols-4 mb-4">
        <TabsTrigger value="overview" className="font-display text-xs tracking-wider">VISÃO GERAL</TabsTrigger>
        <TabsTrigger value="matches" className="font-display text-xs tracking-wider">PARTIDAS</TabsTrigger>
        <TabsTrigger value="stats" className="font-display text-xs tracking-wider">ESTATÍSTICAS</TabsTrigger>
        <TabsTrigger value="champions" className="font-display text-xs tracking-wider">CAMPEÕES</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab data={data} />
      </TabsContent>

      <TabsContent value="matches">
        <MatchesTab matches={data.recentMatches} />
      </TabsContent>

      <TabsContent value="stats">
        <StatsTab matches={data.recentMatches} />
      </TabsContent>

      <TabsContent value="champions">
        <ChampionsTab matches={data.recentMatches} masteries={data.topChampions} />
      </TabsContent>
    </Tabs>
  );
};

export default RiotProfileSection;
