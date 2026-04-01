import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Globe, Palette, Trash2, Download, Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const confirmWord = t("delete_confirm_word");

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
      toast.success(locale === "pt-BR" ? "Dados exportados com sucesso!" : "Data exported successfully!");
    } catch {
      toast.error(locale === "pt-BR" ? "Erro ao exportar dados" : "Error exporting data");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/profile")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
            {t("settings_title")}
          </h1>
        </div>

        <div className="space-y-6">
          {/* Preferences Section */}
          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground">
                {t("settings_preferences")}
              </h2>
            </div>

            {/* Language */}
            <div className="px-5 py-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary/70" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("settings_language")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings_language_desc")}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(["pt-BR", "en"] as Locale[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLocale(l)}
                      className={`clip-angle-sm px-4 py-2 font-display text-xs tracking-wider transition-all ${
                        locale === l
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                      }`}
                    >
                      {l === "pt-BR" ? "PT-BR" : "EN"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Theme */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-primary/70" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("settings_theme")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings_theme_desc")}</p>
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
                      {th === "dark" ? t("settings_dark") : t("settings_light")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground">
                {t("settings_account")}
              </h2>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-destructive/70" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("settings_delete_account")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings_delete_desc")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="clip-angle-sm border border-destructive/50 px-4 py-2 font-display text-xs tracking-wider text-destructive hover:bg-destructive/10 transition-all"
                >
                  {t("settings_delete_btn")}
                </button>
              </div>
            </div>
          </section>

          {/* Privacy Section */}
          <section className="border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <h2 className="font-display text-sm tracking-widest text-muted-foreground">
                {t("settings_privacy")}
              </h2>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-primary/70" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("settings_download_data")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings_download_desc")}</p>
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
                      {t("settings_downloading")}
                    </span>
                  ) : (
                    t("settings_download_btn")
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("delete_title")}</DialogTitle>
            <DialogDescription>{t("delete_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("delete_confirm_text").replace("{word}", "")}
              <span className="font-bold text-foreground">{confirmWord}</span>
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
              {t("delete_cancel")}
            </Button>
            <Button variant="destructive" disabled={deleteConfirm !== confirmWord || deleting} onClick={handleDeleteAccount}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("delete_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
