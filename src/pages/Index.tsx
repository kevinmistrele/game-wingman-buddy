import { motion } from "framer-motion";
import GameCard from "@/components/GameCard";
import Navbar from "@/components/Navbar";
import { useI18n } from "@/contexts/I18nContext";
import lolHero from "@/assets/lol-hero.jpg";
import valorantHero from "@/assets/valorant-hero.jpg";
import { Zap, Users, MessageSquare } from "lucide-react";

const Index = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 gradient-hero" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(hsl(175 85% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(175 85% 50% / 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-5xl font-bold tracking-wider text-foreground md:text-7xl">
              {t("home_title_1")}
              <span className="block text-primary text-glow-primary">{t("home_title_2")}</span>
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
                <p className="font-display text-[10px] tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
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
    </div>
  );
};

export default Index;
