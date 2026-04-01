import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Gamepad2, Shield, Swords, Edit2, Save, X, Camera, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type PreferredGame = Database["public"]["Enums"]["preferred_game"];

const RIOT_ID_REGEX = /^.{3,16}#[A-Za-z0-9]{3,5}$/;

const ProfileCard = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [preferredGame, setPreferredGame] = useState<PreferredGame>("both");
  const [rank, setRank] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [riotId, setRiotId] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setPreferredGame(profile.preferred_game);
      setRank(profile.rank ?? "");
      setDiscordUsername(profile.discord_username ?? "");
      setRiotId(profile.riot_id ?? "");
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 2MB).");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);

      toast.success("Foto atualizada!");
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETAR") return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) throw error;
      toast.success("Conta deletada com sucesso.");
      await signOut();
      navigate("/auth");
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar conta.");
    } finally {
      setDeleting(false);
    }
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
        const { data: existing } = await supabase
          .from("profiles").select("id").eq("username", username.trim())
          .neq("user_id", profile.user_id).maybeSingle();
        if (existing) { toast.error("Este nome de usuário já está em uso."); setSaving(false); return; }
      }

      if (riotId && riotId !== profile.riot_id) {
        const { data: existingRiot } = await supabase
          .from("profiles").select("id").eq("riot_id", riotId.trim())
          .neq("user_id", profile.user_id).maybeSingle();
        if (existingRiot) { toast.error("Este Riot ID já está vinculado a outra conta."); setSaving(false); return; }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          preferred_game: preferredGame,
          rank: rank || null,
          discord_username: discordUsername || null,
          riot_id: riotId.trim() || null,
        })
        .eq("user_id", profile.user_id);

      if (error) {
        if (error.message.includes("profiles_username_unique")) toast.error("Este nome de usuário já está em uso.");
        else if (error.message.includes("profiles_riot_id_unique")) toast.error("Este Riot ID já está vinculado a outra conta.");
        else toast.error("Erro ao atualizar perfil.");
        return;
      }

      toast.success("Perfil atualizado!");
      setEditing(false);
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  const initials = profile.username.slice(0, 2).toUpperCase();
  const displayEmail = user?.email ?? "";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="clip-angle border border-border gradient-card p-8 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-5">
            {/* Avatar with upload */}
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
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Camera className="h-5 w-5 text-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              {editing ? (
                <Input value={username} onChange={(e) => setUsername(e.target.value)}
                  className="font-display text-lg font-bold bg-muted border-border" />
              ) : (
                <h2 className="font-display text-2xl font-bold tracking-wider text-foreground">
                  {profile.username}
                </h2>
              )}
              <p className="text-sm text-muted-foreground">
                {profile.rank ?? "Sem Rank"} • {profile.preferred_game === "both" ? "Todos os Jogos" : profile.preferred_game === "lol" ? "League of Legends" : "Valorant"}
              </p>
              {displayEmail && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">{displayEmail}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className="p-2 text-muted-foreground transition-colors hover:text-primary"
          >
            {editing ? <Save className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
          </button>
        </div>

        {editing && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">JOGO PREFERIDO</label>
              <Select value={preferredGame} onValueChange={(v) => setPreferredGame(v as PreferredGame)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lol">League of Legends</SelectItem>
                  <SelectItem value="valorant">Valorant</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">RANK</label>
              <Input value={rank} onChange={(e) => setRank(e.target.value)} placeholder="Diamante II" className="bg-muted border-border" />
            </div>
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">RIOT ID</label>
              <Input value={riotId} onChange={(e) => setRiotId(e.target.value)} placeholder="Player#BR1" className="bg-muted border-border" />
              <p className="text-[10px] text-muted-foreground/60 mt-1">Formato: Nome#TAG (3-5 caracteres após #)</p>
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
                  <p className="font-display text-[10px] tracking-widest text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {profile.discord_username && (
              <div className="mt-6 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-sm">🎮</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Discord</p>
                      <p className="text-sm font-medium text-foreground">{profile.discord_username}</p>
                    </div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(profile.discord_username!); toast.success("Copiado!"); }}
                    className="p-2 text-muted-foreground transition-colors hover:text-primary">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {profile.riot_id && (
              <div className="mt-3 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="text-sm">⚔️</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Riot ID</p>
                      <p className="text-sm font-medium text-foreground">{profile.riot_id}</p>
                    </div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(profile.riot_id!); toast.success("Copiado!"); }}
                    className="p-2 text-muted-foreground transition-colors hover:text-primary">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Delete account */}
            <div className="mt-6 border-t border-border pt-5">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 text-xs text-destructive/70 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Excluir minha conta
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Conta</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Todos os seus dados, conversas, amigos e histórico serão permanentemente deletados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Digite <span className="font-bold text-foreground">DELETAR</span> para confirmar:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETAR"
              className="bg-muted border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== "DELETAR" || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileCard;
