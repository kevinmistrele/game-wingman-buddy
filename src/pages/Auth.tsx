import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";
import { Gamepad2, Mail, Lock, User, Chrome, Crosshair } from "lucide-react";
import logo from "@/assets/logo.png";

const RIOT_ID_REGEX = /^.{3,16}#[A-Za-z0-9]{3,5}$/;

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [riotId, setRiotId] = useState("");
  const [riotIdError, setRiotIdError] = useState("");

  const validateRiotId = (value: string) => {
    if (!value) { setRiotIdError(""); return true; }
    if (!RIOT_ID_REGEX.test(value)) {
      setRiotIdError(t("auth_riot_id_invalid"));
      return false;
    }
    setRiotIdError("");
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !validateRiotId(riotId)) return;
    if (isSignUp && !riotId.trim()) {
      toast.error(t("auth_riot_id_required"));
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: existingUser } = await supabase
          .from("profiles").select("id").eq("username", username.trim()).maybeSingle();
        if (existingUser) {
          toast.error(t("profile_username_taken"));
          setLoading(false);
          return;
        }

        if (riotId) {
          const { data: existingRiot } = await supabase
            .from("profiles").select("id").eq("riot_id", riotId.trim()).maybeSingle();
          if (existingRiot) {
            toast.error(t("profile_riot_id_taken"));
            setLoading(false);
            return;
          }
        }

        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { username: username.trim(), riot_id: riotId.trim() || undefined },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success(t("auth_signup_success"), { duration: 6000 });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            toast.error(t("auth_email_not_confirmed"));
          } else {
            throw error;
          }
          return;
        }
        toast.success(t("auth_welcome_back"));
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      toast.success(t("auth_google_success"));
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || t("auth_google_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="clip-angle border border-border gradient-card p-8 max-w-md w-full"
      >
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src={logo} alt="MatchGaming" className="h-12 w-12" />
          <h1 className="font-display text-2xl font-bold tracking-wider text-primary">
            {isSignUp ? t("auth_create_account") : t("auth_sign_in")}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {isSignUp ? t("auth_subtitle_signup") : t("auth_subtitle_signin")}
          </p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant="outline"
          className="w-full mb-6 gap-2 border-border hover:bg-muted"
        >
          <Chrome className="h-4 w-4" />
          {t("auth_google")}
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-display tracking-widest">{t("auth_or")}</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username" className="font-display text-xs tracking-wider text-muted-foreground">
                  {t("auth_username")}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="SeuGamertag" className="pl-10 bg-muted border-border" required={isSignUp} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riotId" className="font-display text-xs tracking-wider text-muted-foreground">
                  {t("auth_riot_id")} *
                </Label>
                <div className="relative">
                  <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="riotId" value={riotId}
                    onChange={(e) => { setRiotId(e.target.value); if (riotIdError) validateRiotId(e.target.value); }}
                    onBlur={() => validateRiotId(riotId)}
                    placeholder="Player#BR1"
                    className={`pl-10 bg-muted border-border ${riotIdError ? "border-destructive" : ""}`}
                    required />
                </div>
                {riotIdError && <p className="text-xs text-destructive">{riotIdError}</p>}
                <p className="text-[10px] text-muted-foreground/60">{t("auth_riot_id_format")}</p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-display text-xs tracking-wider text-muted-foreground">
              {t("auth_email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="jogador@exemplo.com" className="pl-10 bg-muted border-border" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-display text-xs tracking-wider text-muted-foreground">
              {t("auth_password")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="pl-10 bg-muted border-border" required minLength={6} />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full clip-angle-sm font-display tracking-wider">
            <Gamepad2 className="h-4 w-4 mr-2" />
            {loading ? t("auth_loading") : isSignUp ? t("auth_create_account") : t("auth_sign_in")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? t("auth_has_account") : t("auth_no_account")}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
            {isSignUp ? t("auth_switch_signin") : t("auth_switch_signup")}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
