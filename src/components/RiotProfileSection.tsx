import { useAuth } from "@/contexts/AuthContext";
import { useRiotProfile } from "@/hooks/useRiotMatches";
import LolProfile from "@/components/LolProfile";
import { AlertCircle, Loader2 } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 font-display text-sm tracking-wider text-muted-foreground">
            CARREGANDO DADOS DA RIOT...
          </span>
        </div>
      )}

      {error && (
        <div className="clip-angle border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-destructive mb-2" />
          <p className="text-sm text-destructive">{(error as Error).message}</p>
          <p className="text-xs text-muted-foreground mt-1">Verifique se sua API Key da Riot está válida</p>
        </div>
      )}

      {!isLoading && !error && data && data.game === "lol" && (
        <LolProfile data={data} />
      )}
    </div>
  );
};

export default RiotProfileSection;
