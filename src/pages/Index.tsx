import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import GameCard from "@/components/GameCard";
import Navbar from "@/components/Navbar";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import lolHero from "@/assets/lol-hero.jpg";
import valorantHero from "@/assets/valorant-hero.jpg";
import {
  Zap, Users, MessageSquare, UserPlus, Search, Handshake, Gamepad2,
  Shield, Cpu, MessagesSquare, Swords, CheckCircle2,
} from "lucide-react";

const MOCK_PLAYERS = [
  { name: "ShadowKnight", rank: "Gold II", game: "LoL", avatar: "SK" },
  { name: "NeonViper", rank: "Platinum I", game: "Valorant", avatar: "NV" },
  { name: "IronFist99", rank: "Diamond IV", game: "LoL", avatar: "IF" },
  { name: "PhoenixRush", rank: "Silver III", game: "Valorant", avatar: "PR" },
  { name: "ArcticWolf", rank: "Gold I", game: "LoL", avatar: "AW" },
  { name: "CyberBlade", rank: "Platinum III", game: "Valorant", avatar: "CB" },
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
  const { t } = useI18n();
  const { user } = useAuth();
  const [activityIndex, setActivityIndex] = useState(0);
  const [matchStep, setMatchStep] = useState(0); // 0=searching, 1=found

  const activities = [
    t("home_activity_1"), t("home_activity_2"), t("home_activity_3"),
    t("home_activity_4"), t("home_activity_5"), t("home_activity_6"),
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
    { icon: UserPlus, title: t("home_step_1_title"), desc: t("home_step_1_desc") },
    { icon: Search, title: t("home_step_2_title"), desc: t("home_step_2_desc") },
    { icon: Handshake, title: t("home_step_3_title"), desc: t("home_step_3_desc") },
    { icon: Gamepad2, title: t("home_step_4_title"), desc: t("home_step_4_desc") },
  ];

  const highlights = [
    { icon: Cpu, title: t("home_highlight_1_title"), desc: t("home_highlight_1_desc") },
    { icon: Shield, title: t("home_highlight_2_title"), desc: t("home_highlight_2_desc") },
    { icon: MessagesSquare, title: t("home_highlight_3_title"), desc: t("home_highlight_3_desc") },
    { icon: MessageSquare, title: t("home_highlight_4_title"), desc: t("home_highlight_4_desc") },
  ];

  const particles = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 1.2,
    x: Math.random() * 100,
    size: 3 + Math.random() * 4,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with particles */}
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
        {/* Floating particles */}
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
              {t("home_title_1")}
              <motion.span
                className="block text-primary text-glow-primary"
                animate={{ opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {t("home_title_2")}
              </motion.span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              {t("home_subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mt-10 flex max-w-md items-center justify-center gap-8"
          >
            {[
              { icon: Users, value: "2.4K", label: t("home_online") },
              { icon: Zap, value: "< 30s", label: t("home_avg_queue") },
              { icon: MessageSquare, value: "12K", label: t("home_matches_today") },
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

          {/* CTA with pulse */}
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
              <span className="relative z-10">{user ? t("home_cta") : t("home_cta_signin")}</span>
              <motion.span
                className="absolute inset-0 bg-primary/30 clip-angle-sm"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Link>
          </motion.div>

          {/* Live activity ticker */}
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

      {/* About */}
      <section className="container py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-sm tracking-[0.3em] text-muted-foreground">
            {t("home_about_title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/80">
            {t("home_about_desc")}
          </p>
        </motion.div>
      </section>

      {/* Match Preview Demo */}
      <section className="container py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground mb-10"
        >
          {t("home_match_preview_title")}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-lg clip-angle border border-border gradient-card p-8"
        >
          <div className="flex items-center justify-between">
            {/* Player 1 */}
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
              <p className="text-xs text-muted-foreground">LoL</p>
            </motion.div>

            {/* VS / Status */}
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
                      {t("mm_searching")}...
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
                      {t("home_match_found")}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Player 2 */}
            <motion.div
              className="text-center flex-1"
              animate={{ x: matchStep === 1 ? -10 : 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="mx-auto h-14 w-14 rounded-full border-2 border-secondary/40 bg-muted flex items-center justify-center font-display text-lg font-bold text-secondary">
                NV
              </div>
              <p className="mt-2 font-display text-sm font-bold text-foreground">NeonViper</p>
              <p className="text-xs text-secondary">Gold III</p>
              <p className="text-xs text-muted-foreground">LoL</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="container py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground mb-12"
        >
          {t("home_how_title")}
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

      {/* Highlights */}
      <section className="container py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground mb-12"
        >
          {t("home_highlights_title")}
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

      {/* Mock Players */}
      <section className="container py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground mb-10"
        >
          {t("home_mock_players_title")}
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
                <p className="text-xs text-muted-foreground">{player.game}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-xs font-semibold text-primary">{player.rank}</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Game Selection */}
      <section className="container py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-sm tracking-[0.3em] text-muted-foreground"
        >
          {t("home_select_game")}
        </motion.h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <GameCard
            title={t("mm_lol")}
            image={lolHero}
            accentClass="primary"
            description={t("home_lol_desc")}
          />
          <GameCard
            title={t("mm_valorant")}
            image={valorantHero}
            accentClass="secondary"
            description={t("home_val_desc")}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Swords className="mx-auto h-10 w-10 text-primary/40 mb-4" />
          <h2 className="font-display text-3xl font-bold tracking-wider text-foreground md:text-4xl">
            {t("home_title_1")}{" "}
            <span className="text-primary text-glow-primary">{t("home_title_2")}</span>
          </h2>
          <div className="mt-8">
            <Link
              to={user ? "/matchmaking" : "/auth"}
              className="group clip-angle-sm relative inline-block bg-primary px-12 py-4 font-display text-sm font-semibold tracking-wider text-primary-foreground transition-all hover:box-glow-primary hover:scale-105 active:scale-95"
            >
              {user ? t("home_cta") : t("home_cta_signin")}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
