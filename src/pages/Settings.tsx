import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Palette, Trash2, Download, Loader2, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { isSoundEnabled, setSoundEnabled } from "@/lib/soundUtils";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const confirmWord = "DELETAR";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl pt-24 pb-12">
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
          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground">
                Preferências
              </h2>
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

          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground">
                Conta
              </h2>
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

          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground">
                Privacidade
              </h2>
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
