import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, Crosshair, Gamepad2 } from "lucide-react";
import logo from "@/assets/logo.png";

const RIOT_ID_REGEX = /^.{3,16}#[A-Za-z0-9]{3,5}$/;

interface OnboardingModalProps {
  userId: string;
  defaultUsername: string;
  onComplete: () => void;
}

const OnboardingModal = ({ userId, defaultUsername, onComplete }: OnboardingModalProps) => {
  const [username, setUsername] = useState(defaultUsername);
  const [riotId, setRiotId] = useState("");
  const [riotIdError, setRiotIdError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateRiotId = (value: string) => {
    if (!value) { setRiotIdError(""); return true; }
    if (!RIOT_ID_REGEX.test(value)) {
      setRiotIdError("Formato inválido. Use Nome#TAG (ex: Player#BR1)");
      return false;
    }
    setRiotIdError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Nome de usuário é obrigatório");
      return;
    }
    if (!riotId.trim()) {
      toast.error("Riot ID é obrigatório");
      return;
    }
    if (!validateRiotId(riotId)) return;

    setLoading(true);
    try {
      // Check username uniqueness
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim())
        .neq("user_id", userId)
        .maybeSingle();

      if (existing) {
        toast.error("Este nome de usuário já está em uso. Escolha outro.");
        setLoading(false);
        return;
      }

      // Check Riot ID uniqueness
      if (riotId) {
        const { data: existingRiot } = await supabase
          .from("profiles")
          .select("id")
          .eq("riot_id", riotId.trim())
          .neq("user_id", userId)
          .maybeSingle();

        if (existingRiot) {
          toast.error("Este Riot ID já está vinculado a outra conta.");
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          riot_id: riotId.trim() || null,
        })
        .eq("user_id", userId);

      if (error) {
        if (error.message.includes("profiles_username_unique")) {
          toast.error("Este nome de usuário já está em uso.");
        } else if (error.message.includes("profiles_riot_id_unique")) {
          toast.error("Este Riot ID já está vinculado a outra conta.");
        } else {
          toast.error("Erro ao salvar perfil.");
        }
        return;
      }

      toast.success("Perfil configurado!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="clip-angle border border-border gradient-card p-8 max-w-md w-full mx-4"
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <img src={logo} alt="MatchGaming" className="h-10 w-10" />
          <h2 className="font-display text-xl font-bold tracking-wider text-primary">
            CONFIGURAR PERFIL
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Complete seu perfil para encontrar seus teammates
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-display text-xs tracking-wider text-muted-foreground">
              NOME DE USUÁRIO *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="SeuGamertag"
                className="pl-10 bg-muted border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-display text-xs tracking-wider text-muted-foreground">
              RIOT ID *
            </Label>
            <div className="relative">
              <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={riotId}
                onChange={(e) => {
                  setRiotId(e.target.value);
                  if (riotIdError) validateRiotId(e.target.value);
                }}
                onBlur={() => validateRiotId(riotId)}
                placeholder="Player#BR1"
                className={`pl-10 bg-muted border-border ${riotIdError ? "border-destructive" : ""}`}
              />
            </div>
            {riotIdError && <p className="text-xs text-destructive">{riotIdError}</p>}
            <p className="text-[10px] text-muted-foreground/60">
              Formato: Nome#TAG (3-5 caracteres alfanuméricos após #)
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full clip-angle-sm font-display tracking-wider"
          >
            <Gamepad2 className="h-4 w-4 mr-2" />
            {loading ? "SALVANDO..." : "COMEÇAR"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
