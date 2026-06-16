import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, ArrowLeft, RefreshCw, ExternalLink, Crosshair, MessageCircle, Trophy } from "lucide-react";
import logo from "@/assets/game-matching-vertical-original-transparent.png";

const COOLDOWN_SECONDS = 30;

const highlights = [
  {
    icon: Crosshair,
    title: "Matchmaking inteligente",
    description: "Encontre duos do seu rank e na sua rota preferida.",
  },
  {
    icon: MessageCircle,
    title: "Chat em tempo real",
    description: "Converse com seu duo antes mesmo de entrar na partida.",
  },
  {
    icon: Trophy,
    title: "Players do seu nível",
    description: "Partidas equilibradas com jogadores compatíveis.",
  },
];

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email;
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast.success("Email reenviado com sucesso!");
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: any) {
      toast.error(err.message || "Falha ao reenviar email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background effects — same as Auth */}
      <div className="absolute inset-0 gradient-hero" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(175 85% 50% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(175 85% 50% / 0.4) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent/5 blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/5 p-8 sm:p-10">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <motion.img
              src={logo}
              alt="Game Matching"
              className="h-14 w-14"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            />

            {/* Animated mail icon */}
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 150 }}
              className="relative"
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary/40"
              />
            </motion.div>

            <h1 className="font-display text-2xl font-bold tracking-wider text-primary text-glow-primary text-center">
              QUASE LÁ, JOGADOR!
            </h1>
            <p className="text-muted-foreground text-center text-sm max-w-xs">
              Sua conta foi criada. Confirme seu email para entrar na arena.
            </p>
          </div>

          {/* Email display */}
          {email ? (
            <div className="bg-muted/50 border border-border/50 rounded-lg px-4 py-3 mb-6 text-center">
              <p className="text-xs text-muted-foreground font-display tracking-wider mb-1">
                ENVIAMOS UM EMAIL PARA
              </p>
              <p className="text-sm font-semibold text-foreground break-all">{email}</p>
            </div>
          ) : (
            <div className="bg-muted/50 border border-border/50 rounded-lg px-4 py-3 mb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Verifique o email cadastrado na sua conta.
              </p>
            </div>
          )}

          {/* Spam tip */}
          <p className="text-xs text-muted-foreground/70 text-center mb-6">
            💡 Não encontrou? Verifique a pasta de <span className="text-foreground font-medium">spam</span> ou{" "}
            <span className="text-foreground font-medium">lixo eletrônico</span>.
          </p>

          {/* Actions */}
          <div className="space-y-3 mb-8">
            <Button
              asChild
              className="w-full h-12 font-display text-base tracking-wider clip-angle-sm hover:box-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <a href={email ? `https://mail.google.com` : `mailto:`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-5 w-5 mr-2" />
                ABRIR MEU EMAIL
              </a>
            </Button>

            <Button
              variant="outline"
              onClick={handleResend}
              disabled={cooldown > 0 || resending || !email}
              className="w-full h-11 gap-2 border-border/60 hover:bg-muted/80 hover:border-primary/30 transition-all font-display tracking-wider"
            >
              <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
              {cooldown > 0
                ? `REENVIAR EM ${cooldown}s`
                : resending
                ? "REENVIANDO..."
                : "REENVIAR EMAIL"}
            </Button>
          </div>

          {/* Product highlights */}
          <div className="border-t border-border/40 pt-6 mb-6">
            <p className="font-display text-xs tracking-widest text-muted-foreground text-center mb-4">
              O QUE TE ESPERA
            </p>
            <div className="grid gap-3">
              {highlights.map((h, i) => (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3 bg-muted/30 border border-border/30 rounded-lg p-3"
                >
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <h.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold tracking-wide text-foreground">
                      {h.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{h.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Back to login */}
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-full"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
