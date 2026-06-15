import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CONFIRM_WORD = "DELETAR";

export function AccountSection() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadData() {
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

      const blob = new Blob([JSON.stringify({
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile: profileRes.data,
        matches: matchesRes.data,
        conversations: convosRes.data,
        messages: messagesRes.data,
        friendships: friendsRes.data,
      }, null, 2)], { type: "application/json" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `game-matching-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dados exportados com sucesso!");
    } catch {
      toast.error("Erro ao exportar dados");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== CONFIRM_WORD || !user) return;
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
  }

  return (
    <>
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
                  <Loader2 className="h-3 w-3 animate-spin" /> Gerando...
                </span>
              ) : "Baixar dados"}
            </button>
          </div>
        </div>
      </section>

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

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Conta</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Todos os seus dados serão permanentemente deletados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Digite <span className="font-bold text-foreground">{CONFIRM_WORD}</span> para confirmar:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="bg-muted border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== CONFIRM_WORD || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
