import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import lolHero from "@/assets/lol-hero.jpg";
import {
  Zap, Users, MessageSquare, UserPlus, Search, Handshake, Gamepad2,
  Shield, Cpu, MessagesSquare, Swords, CheckCircle2,
} from "lucide-react";

const MOCK_PLAYERS = [
  { name: "ShadowKnight", rank: "Gold II", avatar: "SK" },
  { name: "IronFist99", rank: "Diamond IV", avatar: "IF" },
  { name: "ArcticWolf", rank: "Gold I", avatar: "AW" },
  { name: "StormBreaker", rank: "Platinum III", avatar: "SB" },
  { name: "DarkFlame", rank: "Silver I", avatar: "DF" },
  { name: "LunarBlade", rank: "Emerald II", avatar: "LB" },
];

const FloatingParticle = ({ delay, x, size }: { delay: number; x: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size, left: `${x}%` }}
    initial={{ y: "100vh", opacity: 0 }}
    animate={{ y: "-10vh", opacity: [0, 0.6, 0] }}
    transition={{ duration: 8 + Math.random() * 6, delay, repeat: Infinity, ease: "linear" }}
  />
);

const Index = () => {
  const { user, loading } = useAuth();
  const [activityIndex, setActivityIndex] = useState(0);
  const [matchStep, setMatchStep] = useState(0);

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const activities = [
    "🎮 Match iniciado agora — Gold II vs Gold III",
    "⚡ Jogador encontrado em 8s — Platina I",
    "🔥 +1 jogador entrou na fila — Diamante IV",
    "🎯 Match aceito — Prata III vs Prata II",
    "✨ Novo jogador se cadastrou — bem-vindo!",
    "⚔️ Duo formado — Ouro I + Ouro II",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActivityIndex((i) => (i + 1) % activities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activities.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMatchStep((s) => (s + 1) % 2);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { icon: UserPlus, title: "Crie sua conta", desc: "Cadastre-se e vincule seu Riot ID" },
    { icon: Search, title: "Entre na fila", desc: "Escolha o modo de matchmaking" },
    { icon: Handshake, title: "Encontre seu par", desc: "Nosso sistema encontra jogadores compatíveis" },
    { icon: Gamepad2, title: "Jogue junto", desc: "Converse pelo chat e dominem juntos" },
  ];

  const highlights = [
    { icon: Cpu, title: "Matchmaking Inteligente", desc: "Sistema baseado em elo para encontrar jogadores do seu nível" },
    { icon: Shield, title: "Integração Riot", desc: "Rank e estatísticas obtidos automaticamente via Riot API" },
    { icon: MessagesSquare, title: "Chat Direto", desc: "Converse com seus matches em tempo real dentro da plataforma" },
    { icon: MessageSquare, title: "Integração Discord", desc: "Compartilhe e copie tags Discord facilmente para jogar" },
  ];

  const particles = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 1.2,
    x: Math.random() * 100,
    size: 3 + Math.random() * 4,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 gradient-hero" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(hsl(175 85% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(175 85% 50% / 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {particles.map((p, i) => (
          <FloatingParticle key={i} {...p} />
        ))}

        <div className="relative z-10 container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-5xl font-bold tracking-wider text-foreground md:text-7xl">
              ENCONTRE SEU
              <motion.span
                className="block text-primary text-glow-primary"
                animate={{ opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                PRÓXIMO TEAMMATE
              </motion.span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Conecte-se com jogadores que combinam com seu estilo. Entre na fila, encontre seu par e dominem juntos.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mt-10 flex max-w-md items-center justify-center gap-8"
          >
            {[
              { icon: Users, value: "2.4K", label: "Online" },
              { icon: Zap, value: "< 30s", label: "Fila Média" },
              { icon: MessageSquare, value: "12K", label: "Matches Hoje" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto h-5 w-5 text-primary/60" />
                <p className="mt-1 font-display text-xl font-bold text-foreground">{stat.value}</p>
                <p className="font-display text-xs tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-10"
          >
            <Link
              to={user ? "/matchmaking" : "/auth"}
              className="group clip-angle-sm relative inline-block bg-primary px-10 py-3.5 font-display text-sm font-semibold tracking-wider text-primary-foreground transition-all hover:box-glow-primary hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">{user ? "COMEÇAR AGORA" : "ENTRAR"}</span>
              <motion.span
                className="absolute inset-0 bg-primary/30 clip-angle-sm"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mx-auto mt-8 h-8 max-w-sm overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={activityIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-xs text-muted-foreground/70"
              >
                {activities[activityIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <section className="container py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-sm tracking-[0.3em] text-muted-foreground">
            O QUE É O MATCHGAMING?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/80">
            Uma plataforma que conecta jogadores de League of Legends com base em elo e preferências, para que você encontre o parceiro ideal.
          </p>
        </motion.div>
      </section>

      <section className="container py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground mb-10"
        >
          PREVIEW DE MATCH
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-lg clip-angle border border-border gradient-card p-8"
        >
          <div className="flex items-center justify-between">
            <motion.div
              className="text-center flex-1"
              animate={{ x: matchStep === 1 ? 10 : 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="mx-auto h-14 w-14 rounded-full border-2 border-primary/40 bg-muted flex items-center justify-center font-display text-lg font-bold text-primary">
                SK
              </div>
              <p className="mt-2 font-display text-sm font-bold text-foreground">ShadowKnight</p>
              <p className="text-xs text-primary">Gold II</p>
            </motion.div>

            <div className="flex-shrink-0 mx-4 text-center">
              <AnimatePresence mode="wait">
                {matchStep === 0 ? (
                  <motion.div
                    key="searching"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <motion.div
                      className="h-12 w-12 mx-auto rounded-full border-2 border-primary/30 border-t-primary"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="mt-2 font-display text-xs tracking-widest text-muted-foreground">
                      BUSCANDO...
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="found"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.6, repeat: 2 }}
                    >
                      <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
                    </motion.div>
                    <p className="mt-2 font-display text-xs font-bold tracking-wider text-primary text-glow-primary">
                      MATCH ENCONTRADO!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              className="text-center flex-1"
              animate={{ x: matchStep === 1 ? -10 : 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="mx-auto h-14 w-14 rounded-full border-2 border-secondary/40 bg-muted flex items-center justify-center font-display text-lg font-bold text-secondary">
                IF
              </div>
              <p className="mt-2 font-display text-sm font-bold text-foreground">IronFist99</p>
              <p className="text-xs text-secondary">Gold III</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="container py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground mb-12"
        >
          COMO FUNCIONA
        </motion.h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="clip-angle border border-border gradient-card p-6 text-center cursor-default group"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-display text-xs tracking-[0.2em] text-muted-foreground mb-1">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground mb-12"
        >
          POR QUE MATCHGAMING?
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              className="border border-border bg-card/50 rounded-lg p-6 text-center cursor-default group"
            >
              <h.icon className="mx-auto h-8 w-8 text-primary/70 mb-3 transition-colors group-hover:text-primary" />
              <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
                {h.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground mb-10"
        >
          JOGADORES NA PLATAFORMA
        </motion.h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {MOCK_PLAYERS.map((player, i) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex items-center gap-3 border border-border bg-card/50 rounded-lg p-4 cursor-default"
            >
              <div className="h-10 w-10 flex-shrink-0 rounded-full border border-primary/30 bg-muted flex items-center justify-center font-display text-sm font-bold text-primary">
                {player.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-bold text-foreground truncate">{player.name}</p>
                <p className="text-xs text-muted-foreground">League of Legends</p>
              </div>
              <div className="text-right">
                <p className="font-display text-xs font-semibold text-primary">{player.rank}</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-online animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Game Selection - Only LoL */}
      <section className="container py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground"
        >
          NOSSO JOGO
        </motion.h2>
        <div className="mt-8 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -8 }}
            className="group relative cursor-pointer overflow-hidden border border-primary/30 hover:border-primary/60 clip-angle transition-all duration-300"
            onClick={() => window.location.href = user ? "/matchmaking" : "/auth"}
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={lolHero}
                alt="League of Legends"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </div>
            <div className="relative p-6">
              <h3 className="font-display text-2xl font-bold tracking-wider text-primary">
                LEAGUE OF LEGENDS
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">Encontre seu duo partner. Subam juntos no ranking.</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                <span className="font-display text-xs tracking-widest text-muted-foreground">
                  FILA DISPONÍVEL
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Swords className="mx-auto h-10 w-10 text-primary/40 mb-4" />
          <h2 className="font-display text-3xl font-bold tracking-wider text-foreground md:text-4xl">
            ENCONTRE SEU{" "}
            <span className="text-primary text-glow-primary">PRÓXIMO TEAMMATE</span>
          </h2>
          <div className="mt-8">
            <Link
              to={user ? "/matchmaking" : "/auth"}
              className="group clip-angle-sm relative inline-block bg-primary px-12 py-4 font-display text-sm font-semibold tracking-wider text-primary-foreground transition-all hover:box-glow-primary hover:scale-105 active:scale-95"
            >
              {user ? "COMEÇAR AGORA" : "ENTRAR"}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
