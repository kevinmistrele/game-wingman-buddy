import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Palette, Trash2, Download, Loader2, ArrowLeft, Volume2, VolumeX, ShieldBan, ChevronLeft, ChevronRight, UserX, Map } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { isSoundEnabled, setSoundEnabled } from "@/lib/soundUtils";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES, type Role } from "@/lib/eloUtils";
import RoleIcon, { ROLE_LABELS } from "@/components/RoleIcon";
import { toast } from "sonner";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  profile?: { username: string; avatar_url: string | null };
}

const PAGE_SIZE = 10;
const MAX_BLOCKED = 50;

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [preferredRole, setPreferredRole] = useState<Role | null>(null);
  const [preferredDuoRole, setPreferredDuoRole] = useState<Role | null>(null);
  const [savingRoles, setSavingRoles] = useState(false);

  // Load role preferences from profile
  useEffect(() => {
    if (!profile) return;
    setPreferredRole(((profile as any)?.preferred_role as Role) ?? null);
    setPreferredDuoRole(((profile as any)?.preferred_duo_role as Role) ?? null);
  }, [profile]);

  const handleSaveRoles = async () => {
    if (!user) return;
    setSavingRoles(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        preferred_role: preferredRole,
        preferred_duo_role: preferredDuoRole,
      } as any)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao salvar preferências de rota");
    } else {
      toast.success("Preferências de rota salvas!");
    }
    setSavingRoles(false);
  };

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedTotal, setBlockedTotal] = useState(0);
  const [blockedPage, setBlockedPage] = useState(0);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const confirmWord = "DELETAR";

  const fetchBlocked = useCallback(async () => {
    if (!user) return;
    setLoadingBlocked(true);
    const offset = blockedPage * PAGE_SIZE;

    const { count } = await supabase
      .from("blocked_users")
      .select("id", { count: "exact", head: true })
      .eq("blocker_id", user.id);

    setBlockedTotal(count ?? 0);

    const { data } = await supabase
      .from("blocked_users")
      .select("id, blocked_id, created_at")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data) {
      const enriched: BlockedUser[] = [];
      for (const b of data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("user_id", b.blocked_id)
          .single();
        enriched.push({ ...b, profile: profile ?? undefined });
      }
      setBlockedUsers(enriched);
    }
    setLoadingBlocked(false);
  }, [user, blockedPage]);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const handleUnblock = async (blockId: string) => {
    setUnblockingId(blockId);
    const { error } = await supabase.from("blocked_users").delete().eq("id", blockId);
    if (error) {
      toast.error("Erro ao desbloquear jogador.");
    } else {
      toast.success("Jogador desbloqueado.");
      fetchBlocked();
    }
    setUnblockingId(null);
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== confirmWord || !user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) throw error;
      await signOut();
      navigate("/");
    } catch {
      toast.error("Erro ao excluir conta");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadData = async () => {
    if (!user) return;
    setDownloading(true);
    try {
      const [profileRes, matchesRes, convosRes, messagesRes, friendsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("matches").select("*").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
        supabase.from("conversations").select("*").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
        supabase.from("messages").select("*").eq("sender_id", user.id),
        supabase.from("friendships").select("*").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
      ]);

      const data = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile: profileRes.data,
        matches: matchesRes.data,
        conversations: convosRes.data,
        messages: messagesRes.data,
        friendships: friendsRes.data,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `matchgaming-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dados exportados com sucesso!");
    } catch {
      toast.error("Erro ao exportar dados");
    } finally {
      setDownloading(false);
    }
  };

  const totalPages = Math.ceil(blockedTotal / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl pt-24 pb-12 px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/profile")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
            CONFIGURAÇÕES
          </h1>
        </div>

        <div className="space-y-6">
          {/* Preferências */}
          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground">Preferências</h2>
            </div>
            <div className="px-5 py-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-primary/70" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Tema</p>
                    <p className="text-xs text-muted-foreground">Escolha a aparência da aplicação</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(["dark", "light"] as const).map((th) => (
                    <button
                      key={th}
                      onClick={() => setTheme(th)}
                      className={`clip-angle-sm px-4 py-2 font-display text-xs tracking-wider transition-all ${
                        theme === th
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                      }`}
                    >
                      {th === "dark" ? "Escuro" : "Claro"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundOn ? <Volume2 className="h-5 w-5 text-primary/70" /> : <VolumeX className="h-5 w-5 text-primary/70" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">Sons de notificação</p>
                    <p className="text-xs text-muted-foreground">Sons ao encontrar match, aceitar e receber mensagens</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`clip-angle-sm px-4 py-2 font-display text-xs tracking-wider transition-all ${
                    soundOn
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  {soundOn ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </section>

          {/* Preferências de Rota */}
          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground flex items-center gap-2">
                <Map className="h-4 w-4" />
                Preferências de Rota
              </h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Defina suas rotas preferidas para pré-preencher automaticamente no matchmaking ranqueado.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-display tracking-wider">SUA ROTA PRINCIPAL</label>
                  <Select
                    value={preferredRole ?? "any"}
                    onValueChange={(v) => setPreferredRole(v === "any" ? null : v as Role)}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue>
                        {preferredRole ? (
                          <span className="flex items-center gap-2">
                            <RoleIcon role={preferredRole} size="sm" />
                            {ROLE_LABELS[preferredRole]}
                          </span>
                        ) : "Qualquer"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer</SelectItem>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <span className="flex items-center gap-2">
                            <RoleIcon role={role.value} size="sm" />
                            {role.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-display tracking-wider">ROTA DO DUO</label>
                  <Select
                    value={preferredDuoRole ?? "any"}
                    onValueChange={(v) => setPreferredDuoRole(v === "any" ? null : v as Role)}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue>
                        {preferredDuoRole ? (
                          <span className="flex items-center gap-2">
                            <RoleIcon role={preferredDuoRole} size="sm" />
                            {ROLE_LABELS[preferredDuoRole]}
                          </span>
                        ) : "Qualquer"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer</SelectItem>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <span className="flex items-center gap-2">
                            <RoleIcon role={role.value} size="sm" />
                            {role.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveRoles}
                  disabled={savingRoles}
                  className="clip-angle-sm bg-primary px-5 py-2 font-display text-xs tracking-wider text-primary-foreground hover:box-glow-primary transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingRoles && <Loader2 className="h-3 w-3 animate-spin" />}
                  Salvar
                </button>
              </div>
            </div>
          </section>

          {/* Usuários Bloqueados */}
          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground flex items-center gap-2">
                <ShieldBan className="h-4 w-4" />
                Usuários Bloqueados
                <span className="text-xs text-muted-foreground/60">({blockedTotal}/{MAX_BLOCKED})</span>
              </h2>
            </div>
            <div className="px-5 py-4">
              {loadingBlocked ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário bloqueado.</p>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-display text-sm font-bold text-primary shrink-0">
                        {b.profile?.avatar_url ? (
                          <img src={b.profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          b.profile?.username?.slice(0, 2).toUpperCase() ?? "??"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{b.profile?.username ?? "Jogador"}</p>
                      </div>
                      <button
                        onClick={() => handleUnblock(b.id)}
                        disabled={unblockingId === b.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
                      >
                        {unblockingId === b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                        <span className="font-display tracking-wide">Desbloquear</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                  <button
                    onClick={() => setBlockedPage((p) => Math.max(0, p - 1))}
                    disabled={blockedPage === 0}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {blockedPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setBlockedPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={blockedPage >= totalPages - 1}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Privacidade */}
          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground">Privacidade</h2>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-primary/70" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Baixar meus dados</p>
                    <p className="text-xs text-muted-foreground">Exporte todos os seus dados em formato JSON (LGPD)</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadData}
                  disabled={downloading}
                  className="clip-angle-sm bg-primary px-4 py-2 font-display text-xs tracking-wider text-primary-foreground hover:box-glow-primary transition-all disabled:opacity-50"
                >
                  {downloading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Gerando...
                    </span>
                  ) : (
                    "Baixar dados"
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Conta */}
          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground">Conta</h2>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-destructive/70" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Excluir Conta</p>
                    <p className="text-xs text-muted-foreground">Excluir permanentemente sua conta e todos os dados</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="clip-angle-sm border border-destructive/50 px-4 py-2 font-display text-xs tracking-wider text-destructive hover:bg-destructive/10 transition-all"
                >
                  Excluir minha conta
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Conta</DialogTitle>
            <DialogDescription>Esta ação é irreversível. Todos os seus dados serão permanentemente deletados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Digite <span className="font-bold text-foreground">{confirmWord}</span> para confirmar:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={confirmWord}
              className="bg-muted border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={deleteConfirm !== confirmWord || deleting} onClick={handleDeleteAccount}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
