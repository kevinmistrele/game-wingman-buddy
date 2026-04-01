import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, X, Check, Clock, Users, AlertTriangle } from "lucide-react";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { QUEUE_MODES, TIER_LABELS, type QueueMode } from "@/lib/eloUtils";
import RankBadge, { TIER_COLORS } from "@/components/RankBadge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MatchmakingQueueProps {
  game: "lol" | "valorant";
}

const MatchmakingQueue = ({ game }: MatchmakingQueueProps) => {
  const navigate = useNavigate();
  const {
    status, matchedPlayer, myRank, myRankSource, queueCounts, otherAccepted,
    joinQueue, cancelQueue, respondToMatch,
  } = useMatchmaking(game);

  const [timer, setTimer] = useState(0);
  const [selectedMode, setSelectedMode] = useState<QueueMode>("normal");

  useEffect(() => {
    if (status !== "searching") { setTimer(0); return; }
    const interval = setInterval(() => setTimer((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const handleStart = async () => {
    try { await joinQueue(selectedMode); }
    catch (e: any) { toast.error(e.message || "Falha ao entrar na fila"); }
  };

  const handleRespond = async (accepted: boolean) => {
    await respondToMatch(accepted);
    if (accepted) {
      toast.success("Match aceito! Abrindo chat...");
      setTimeout(() => navigate("/chat"), 1500);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const modeInfo = QUEUE_MODES.find((m) => m.value === selectedMode)!;
  const isRanked = modeInfo.ranked;

  const initials = matchedPlayer?.profile?.username?.slice(0, 2).toUpperCase() ?? "??";
  const matchedRank = matchedPlayer?.rank;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8 w-full max-w-lg"
          >
            {/* Own rank display with emblem */}
            {myRank && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border gradient-card px-6 py-3 text-center"
              >
                <p className="font-display text-xs tracking-widest text-muted-foreground mb-2">SEU RANK</p>
                <RankBadge
                  tier={myRank.tier}
                  rank={myRank.rank}
                  lp={myRank.lp}
                  winRate={myRank.winRate}
                  size="lg"
                />
              </motion.div>
            )}

            {!myRank && isRanked && (
              <div className="border border-destructive/30 bg-destructive/5 px-6 py-3 text-center flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">Sem rank — não é possível entrar em filas ranqueadas</p>
              </div>
            )}

            {/* Mode selector */}
            <div className="w-full">
              <h3 className="font-display text-xs tracking-[0.2em] text-muted-foreground text-center mb-3">SELECIONE O MODO</h3>
              <div className="grid grid-cols-2 gap-3">
                {QUEUE_MODES.map((mode) => {
                  const count = queueCounts[mode.value] ?? 0;
                  const isSelected = selectedMode === mode.value;
                  const disabled = mode.ranked && !myRank;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => !disabled && setSelectedMode(mode.value)}
                      disabled={disabled}
                      className={`relative clip-angle-sm px-4 py-4 font-display text-sm font-bold tracking-wider transition-all text-left ${
                        disabled
                          ? "opacity-40 cursor-not-allowed border border-border text-muted-foreground"
                          : isSelected
                            ? "bg-primary text-primary-foreground box-glow-primary"
                            : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className="block">{mode.label}</span>
                      <span className="block text-[10px] font-normal tracking-normal mt-0.5 opacity-70">
                        {mode.description}
                      </span>
                      <span className="absolute top-2 right-3 flex items-center gap-1 text-[10px] font-normal opacity-60">
                        <Users className="h-3 w-3" /> {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start button */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-2 border-primary/30 gradient-card flex items-center justify-center">
                <Crosshair className="h-10 w-10 text-primary" />
              </div>
            </div>
            <button
              onClick={handleStart}
              disabled={isRanked && !myRank}
              className="clip-angle bg-primary px-10 py-4 font-display text-lg font-bold tracking-widest text-primary-foreground transition-all hover:box-glow-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ENCONTRAR MATCH
            </button>
          </motion.div>
        )}

        {status === "searching" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="h-32 w-32 rounded-full border-2 border-primary border-t-transparent"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="h-8 w-8 text-primary animate-pulse-glow" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border border-primary/30"
              />
            </div>
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold tracking-wider text-primary text-glow-primary">
                BUSCANDO
              </h2>
              <p className="mt-1 font-display text-xs tracking-widest text-muted-foreground uppercase">
                {QUEUE_MODES.find((m) => m.value === selectedMode)?.label}
              </p>
              <p className="mt-2 font-display text-xl tracking-widest text-muted-foreground">
                {formatTime(timer)}
              </p>
              {timer >= 60 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-secondary">
                  Demorando mais que o esperado...
                </motion.p>
              )}
            </div>
            <button
              onClick={cancelQueue}
              className="flex items-center gap-2 border border-destructive/50 bg-transparent px-8 py-3 font-display text-sm tracking-wider text-destructive transition-all hover:bg-destructive/10"
            >
              <X className="h-4 w-4" /> CANCELAR
            </button>
          </motion.div>
        )}

        {status === "found" && (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
              className="h-32 w-32 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center box-glow-primary"
            >
              <Check className="h-12 w-12 text-primary" />
            </motion.div>
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold tracking-wider text-primary text-glow-primary">
                MATCH ENCONTRADO
              </h2>
              <p className="mt-2 text-muted-foreground">Um jogador quer se conectar!</p>
            </div>

            {/* Matched player card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="clip-angle border border-primary/30 gradient-card p-6 w-80"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center font-display text-xl font-bold text-primary">
                  {matchedPlayer?.profile?.avatar_url ? (
                    <img src={matchedPlayer.profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-display text-lg font-semibold tracking-wide text-foreground">
                    {matchedPlayer?.profile?.username ?? "Jogador"}
                  </p>
                  {matchedRank ? (
                    <RankBadge
                      tier={matchedRank.tier}
                      rank={matchedRank.rank}
                      lp={matchedRank.lp}
                      winRate={matchedRank.winRate}
                      size="sm"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">Sem rank</p>
                  )}
                </div>
              </div>

              {otherAccepted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-3 text-center text-sm text-primary font-display">
                  ✓ O outro jogador aceitou!
                </motion.div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleRespond(true)}
                  className="flex-1 clip-angle-sm bg-primary py-3 font-display text-sm font-bold tracking-wider text-primary-foreground hover:box-glow-primary transition-all"
                >
                  ACEITAR
                </button>
                <button
                  onClick={() => handleRespond(false)}
                  className="flex-1 clip-angle-sm border border-muted-foreground/30 py-3 font-display text-sm tracking-wider text-muted-foreground hover:border-destructive hover:text-destructive transition-all"
                >
                  RECUSAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchmakingQueue;
