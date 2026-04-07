import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Gamepad2, Shield, Swords, Edit2, Save, X, Camera, Loader2, AlertTriangle, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useRiotProfile } from "@/hooks/useRiotMatches";
import RankBadge from "@/components/RankBadge";
import { TIERS, DIVISIONS, TIER_LABELS } from "@/lib/eloUtils";

const RIOT_ID_REGEX = /^.{3,16}#[A-Za-z0-9]{3,5}$/;

const ProfileCard = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [riotId, setRiotId] = useState("");
  const [manualTier, setManualTier] = useState("");
  const [manualDivision, setManualDivision] = useState("IV");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: riotData } = useRiotProfile("lol", profile?.riot_id, "br1", 1);
  const riotRank = riotData?.game === "lol" && riotData.summoner?.ranked
    ? riotData.summoner.ranked.find(r => r.queueType === "RANKED_SOLO_5x5")
      ?? riotData.summoner.ranked.find(r => r.queueType === "RANKED_FLEX_SR")
      ?? null
    : null;

  const hasRiotRank = !!riotRank;
  const profileManualTier = (profile as any)?.rank_tier as string | null;
  const profileManualDivision = (profile as any)?.rank_division as string | null;
  const profileRankSource = (profile as any)?.rank_source as string | null;

  useEffect(() => {
    if (!profile || !user || !riotRank) return;
    const currentSource = profileRankSource;
    const currentTier = profileManualTier;
    if (currentSource !== "riot" || currentTier !== riotRank.tier) {
      supabase.from("profiles").update({
        rank_tier: riotRank.tier,
        rank_division: riotRank.rank,
        rank_source: "riot",
        rank: `${TIER_LABELS[riotRank.tier] ?? riotRank.tier} ${riotRank.rank}`,
      } as any).eq("user_id", user.id).then(() => refreshProfile());
    }
  }, [riotRank, profile, user]);

  const effectiveRank = hasRiotRank
    ? { tier: riotRank.tier, division: riotRank.rank, source: "riot" as const, lp: riotRank.lp, winRate: riotRank.winRate }
    : profileManualTier
      ? { tier: profileManualTier, division: profileManualDivision ?? "IV", source: "manual" as const, lp: undefined, winRate: undefined }
      : null;

  const highTiers = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  const showDivision = manualTier && !highTiers.includes(manualTier);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setDiscordUsername(profile.discord_username ?? "");
      setRiotId(profile.riot_id ?? "");
      setManualTier(profileManualTier ?? "");
      setManualDivision(profileManualDivision ?? "IV");
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione um arquivo de imagem."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem muito grande (máx 2MB)."); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: `${publicUrl}?t=${Date.now()}` }).eq("user_id", user.id);
      toast.success("Foto atualizada!");
      await refreshProfile();
    } catch (err: any) { toast.error(err.message || "Erro ao fazer upload."); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!profile) return;
    if (riotId && !RIOT_ID_REGEX.test(riotId)) {
      toast.error("Riot ID inválido. Use o formato Nome#TAG (ex: Player#BR1)");
      return;
    }

    setSaving(true);
    try {
      if (username !== profile.username) {
        const { data: existing } = await supabase.from("profiles").select("id").eq("username", username.trim()).neq("user_id", profile.user_id).maybeSingle();
        if (existing) { toast.error("Este nome de usuário já está em uso."); setSaving(false); return; }
      }
      if (riotId && riotId !== profile.riot_id) {
        const { data: existingRiot } = await supabase.from("profiles").select("id").eq("riot_id", riotId.trim()).neq("user_id", profile.user_id).maybeSingle();
        if (existingRiot) { toast.error("Este Riot ID já está vinculado a outra conta."); setSaving(false); return; }
      }

      const tier = manualTier || null;
      const division = highTiers.includes(manualTier) ? "I" : (manualDivision || "IV");
      const rankDisplay = tier ? `${TIER_LABELS[tier] ?? tier} ${highTiers.includes(tier) ? "" : division}`.trim() : null;

      const updatePayload: any = {
        username: username.trim(),
        preferred_game: "lol",
        discord_username: discordUsername || null,
        riot_id: riotId.trim() || null,
      };

      if (!hasRiotRank) {
        updatePayload.rank_tier = tier;
        updatePayload.rank_division = division;
        updatePayload.rank_source = tier ? "manual" : null;
        updatePayload.rank = rankDisplay;
      }

      const { error } = await supabase.from("profiles").update(updatePayload).eq("user_id", profile.user_id);
      if (error) {
        if (error.message.includes("profiles_username_unique")) toast.error("Este nome de usuário já está em uso.");
        else if (error.message.includes("profiles_riot_id_unique")) toast.error("Este Riot ID já está vinculado a outra conta.");
        else toast.error("Erro ao atualizar perfil.");
        return;
      }

      toast.success("Perfil atualizado!");
      setEditing(false);
      await refreshProfile();
    } finally { setSaving(false); }
  };

  if (!profile) return null;

  const initials = profile.username.slice(0, 2).toUpperCase();
  const displayEmail = user?.email ?? "";

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="clip-angle border border-border gradient-card p-8 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full border-2 border-primary/40 bg-muted flex items-center justify-center font-display text-2xl font-bold text-primary box-glow-primary overflow-hidden">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-5 w-5 text-foreground" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              {editing ? (
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="font-display text-lg font-bold bg-muted border-border" />
              ) : (
                <h2 className="font-display text-2xl font-bold tracking-wider text-foreground">{profile.username}</h2>
              )}
              {effectiveRank ? (
                <div className="mt-1">
                  <RankBadge tier={effectiveRank.tier} rank={effectiveRank.division} lp={effectiveRank.lp} winRate={effectiveRank.winRate} size="sm" />
                  {effectiveRank.source === "manual" && (
                    <p className="text-xs text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="h-3 w-3" /> Rank definido manualmente
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem Rank</p>
              )}
              {displayEmail && <p className="text-xs text-muted-foreground/60 mt-0.5">{displayEmail}</p>}
            </div>
          </div>
          <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving} className="p-2 text-muted-foreground transition-colors hover:text-primary">
            {editing ? <Save className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
          </button>
        </div>

        {editing && (
          <div className="mt-4 space-y-3">
            {!hasRiotRank && (
              <div>
                <label className="font-display text-xs tracking-wider text-muted-foreground">RANK (MANUAL)</label>
                <p className="text-xs text-muted-foreground/60 mb-1">
                  {profile.riot_id ? "Nenhum rank encontrado via API. Selecione manualmente:" : "Selecione seu rank:"}
                </p>
                <div className="flex gap-2">
                  <Select value={manualTier || "none"} onValueChange={(v) => { setManualTier(v === "none" ? "" : v); if (highTiers.includes(v)) setManualDivision("I"); }}>
                    <SelectTrigger className="bg-muted border-border flex-1"><SelectValue placeholder="Elo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem Rank</SelectItem>
                      {TIERS.map((tier) => (
                        <SelectItem key={tier} value={tier}>{TIER_LABELS[tier]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showDivision && (
                    <Select value={manualDivision} onValueChange={setManualDivision}>
                      <SelectTrigger className="bg-muted border-border w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIVISIONS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}

            {hasRiotRank && (
              <div className="border border-primary/20 bg-primary/5 p-3 rounded">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  ✓ Rank obtido automaticamente via Riot API
                </p>
                <RankBadge tier={riotRank!.tier} rank={riotRank!.rank} lp={riotRank!.lp} winRate={riotRank!.winRate} size="sm" />
              </div>
            )}

            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">RIOT ID</label>
              <Input value={riotId} onChange={(e) => setRiotId(e.target.value)} placeholder="Player#BR1" className="bg-muted border-border" />
              <p className="text-xs text-muted-foreground/60 mt-1">Formato: Nome#TAG (3-5 caracteres após #)</p>
            </div>
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">DISCORD</label>
              <Input value={discordUsername} onChange={(e) => setDiscordUsername(e.target.value)} placeholder="Usuario#1234" className="bg-muted border-border" />
            </div>
            <button onClick={() => { setEditing(false); if (profile) { setUsername(profile.username); setRiotId(profile.riot_id ?? ""); } }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="h-3 w-3" /> Cancelar
            </button>
          </div>
        )}

        {!editing && (
          <>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { label: "PARTIDAS", value: "0", icon: Swords },
                { label: "VITÓRIAS", value: "—", icon: Shield },
                { label: "AMIGOS", value: "0", icon: Gamepad2 },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="mx-auto h-5 w-5 text-primary/60" />
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="font-display text-xs tracking-widest text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {profile.discord_username && (
              <div className="mt-6 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center"><span className="text-sm">🎮</span></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Discord</p>
                      <p className="text-sm font-medium text-foreground">{profile.discord_username}</p>
                    </div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(profile.discord_username!); toast.success("Copiado!"); }} className="p-2 text-muted-foreground transition-colors hover:text-primary">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {profile.riot_id && (
              <div className="mt-3 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center"><span className="text-sm">⚔️</span></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Riot ID</p>
                      <p className="text-sm font-medium text-foreground">{profile.riot_id}</p>
                    </div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(profile.riot_id!); toast.success("Copiado!"); }} className="p-2 text-muted-foreground transition-colors hover:text-primary">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-5">
              <button onClick={() => navigate("/settings")} className="w-full clip-angle-sm bg-muted hover:bg-accent px-5 py-3 font-display text-sm font-semibold tracking-wider text-foreground transition-all flex items-center justify-center gap-2">
                <Settings className="h-5 w-5" /> Configurações
              </button>
            </div>
          </>
        )}
    </motion.div>
  );
};

export default ProfileCard;
