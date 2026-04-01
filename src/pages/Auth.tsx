import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";
import { Gamepad2, Mail, Lock, User, Chrome, Crosshair, Loader2 } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(175 85% 50% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(175 85% 50% / 0.4) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent/5 blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/5 p-8 sm:p-10">
          {/* Branding */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <motion.img
              src={logo}
              alt="MatchGaming"
              className="h-14 w-14"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            />
            <h1 className="font-display text-2xl font-bold tracking-wider text-primary text-glow-primary">
              MATCHGAMING
            </h1>
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? "signup" : "signin"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <p className="font-display text-lg font-semibold tracking-wide text-foreground">
                  {isSignUp ? t("auth_create_account") : t("auth_sign_in")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isSignUp ? t("auth_subtitle_signup") : t("auth_subtitle_signin")}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Google */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="w-full h-12 gap-3 border-border/60 hover:bg-muted/80 hover:border-primary/30 transition-all text-base font-medium"
          >
            <Chrome className="h-5 w-5" />
            {t("auth_google")}
          </Button>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card/80 px-3 text-sm text-muted-foreground font-display tracking-widest uppercase">
                {t("auth_or")}
              </span>
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isSignUp ? "signup-form" : "signin-form"}
              initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleEmailAuth}
              className="space-y-5"
            >
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="font-display text-sm tracking-wider text-muted-foreground">
                      {t("auth_username")}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="SeuGamertag"
                        className="h-12 pl-11 bg-muted/50 border-border/50 text-base focus:border-primary/50 focus:ring-primary/20 transition-all"
                        required={isSignUp}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riotId" className="font-display text-sm tracking-wider text-muted-foreground">
                      {t("auth_riot_id")} *
                    </Label>
                    <div className="relative">
                      <Crosshair className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                      <Input
                        id="riotId"
                        value={riotId}
                        onChange={(e) => { setRiotId(e.target.value); if (riotIdError) validateRiotId(e.target.value); }}
                        onBlur={() => validateRiotId(riotId)}
                        placeholder="Player#BR1"
                        className={`h-12 pl-11 bg-muted/50 border-border/50 text-base transition-all focus:border-primary/50 focus:ring-primary/20 ${riotIdError ? "border-destructive focus:border-destructive" : ""}`}
                        required
                      />
                    </div>
                    {riotIdError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive"
                      >
                        {riotIdError}
                      </motion.p>
                    )}
                    <p className="text-xs text-muted-foreground/60">{t("auth_riot_id_format")}</p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-display text-sm tracking-wider text-muted-foreground">
                  {t("auth_email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jogador@exemplo.com"
                    className="h-12 pl-11 bg-muted/50 border-border/50 text-base focus:border-primary/50 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-display text-sm tracking-wider text-muted-foreground">
                  {t("auth_password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 pl-11 bg-muted/50 border-border/50 text-base focus:border-primary/50 focus:ring-primary/20 transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 clip-angle-sm font-display text-base tracking-wider transition-all hover:box-glow-primary hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Gamepad2 className="h-5 w-5 mr-2" />
                )}
                {loading ? t("auth_loading") : isSignUp ? t("auth_create_account") : t("auth_sign_in")}
              </Button>
            </motion.form>
          </AnimatePresence>

          {/* Toggle */}
          <p className="mt-7 text-center text-base text-muted-foreground">
            {isSignUp ? t("auth_has_account") : t("auth_no_account")}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-semibold transition-colors"
            >
              {isSignUp ? t("auth_switch_signin") : t("auth_switch_signup")}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
