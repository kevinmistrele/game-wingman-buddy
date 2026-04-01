import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Gamepad2, Mail, Lock, User, Chrome, Crosshair } from "lucide-react";
import logo from "@/assets/logo.png";

const RIOT_ID_REGEX = /^.{3,16}#[A-Za-z0-9]{3,5}$/;

const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [riotId, setRiotId] = useState("");
  const [riotIdError, setRiotIdError] = useState("");

  const validateRiotId = (value: string) => {
    if (!value) {
      setRiotIdError("");
      return true;
    }
    if (!RIOT_ID_REGEX.test(value)) {
      setRiotIdError("Formato inválido. Use Nome#TAG (ex: Player#BR1, Gamer#1234)");
      return false;
    }
    setRiotIdError("");
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && riotId && !validateRiotId(riotId)) return;
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, riot_id: riotId || undefined },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.", {
          duration: 6000,
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            toast.error("Email não confirmado. Verifique sua caixa de entrada.");
          } else {
            throw error;
          }
          return;
        }
        toast.success("Bem-vindo de volta!");
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

      if (result.redirected) {
        return;
      }

      // Session set — redirect
      toast.success("Login com Google realizado!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Falha no login com Google");
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
            {isSignUp ? "CRIAR CONTA" : "ENTRAR"}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {isSignUp ? "Entre na arena e encontre seus teammates" : "Bem-vindo de volta, jogador"}
          </p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant="outline"
          className="w-full mb-6 gap-2 border-border hover:bg-muted"
        >
          <Chrome className="h-4 w-4" />
          Continuar com Google
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-display tracking-widest">ou</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username" className="font-display text-xs tracking-wider text-muted-foreground">
                  NOME DE USUÁRIO
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="SeuGamertag"
                    className="pl-10 bg-muted border-border"
                    required={isSignUp}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riotId" className="font-display text-xs tracking-wider text-muted-foreground">
                  RIOT ID <span className="text-muted-foreground/60">(opcional)</span>
                </Label>
                <div className="relative">
                  <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="riotId"
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
                {riotIdError && (
                  <p className="text-xs text-destructive">{riotIdError}</p>
                )}
                <p className="text-[10px] text-muted-foreground/60">
                  Formato: Nome#TAG (3-5 caracteres alfanuméricos após #)
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-display text-xs tracking-wider text-muted-foreground">
              EMAIL
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jogador@exemplo.com"
                className="pl-10 bg-muted border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-display text-xs tracking-wider text-muted-foreground">
              SENHA
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 bg-muted border-border"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full clip-angle-sm font-display tracking-wider"
          >
            <Gamepad2 className="h-4 w-4 mr-2" />
            {loading ? "CARREGANDO..." : isSignUp ? "CRIAR CONTA" : "ENTRAR"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline font-medium"
          >
            {isSignUp ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
