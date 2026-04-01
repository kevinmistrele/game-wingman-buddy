import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, X, Check, Clock } from "lucide-react";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MatchmakingQueueProps {
  game: "lol" | "valorant";
}

const MatchmakingQueue = ({ game }: MatchmakingQueueProps) => {
  const navigate = useNavigate();
  const { status, matchedProfile, joinQueue, cancelQueue, respondToMatch } = useMatchmaking(game);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (status !== "searching") {
      setTimer(0);
      return;
    }
    const interval = setInterval(() => setTimer((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const handleStart = async () => {
    try {
      await joinQueue();
    } catch (e: any) {
      toast.error(e.message || "Failed to join queue");
    }
  };

  const handleRespond = async (accepted: boolean) => {
    await respondToMatch(accepted);
    if (accepted) {
      toast.success("Match accepted! Opening chat...");
      setTimeout(() => navigate("/chat"), 1500);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const initials = matchedProfile?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-2 border-primary/30 gradient-card flex items-center justify-center">
                <Crosshair className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold tracking-wider text-foreground">
                READY TO MATCH
              </h2>
              <p className="mt-2 text-muted-foreground">
                {game === "lol" ? "League of Legends" : "Valorant"} queue
              </p>
            </div>
            <button
              onClick={handleStart}
              className="clip-angle bg-primary px-10 py-4 font-display text-lg font-bold tracking-widest text-primary-foreground transition-all hover:box-glow-primary"
            >
              FIND MATCH
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
                SEARCHING
              </h2>
              <p className="mt-2 font-display text-xl tracking-widest text-muted-foreground">
                {formatTime(timer)}
              </p>
            </div>
            <button
              onClick={cancelQueue}
              className="flex items-center gap-2 border border-destructive/50 bg-transparent px-8 py-3 font-display text-sm tracking-wider text-destructive transition-all hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
              CANCEL
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
                MATCH FOUND
              </h2>
              <p className="mt-2 text-muted-foreground">A player wants to connect!</p>
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="clip-angle border border-primary/30 gradient-card p-6 w-80"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center font-display text-xl font-bold text-primary">
                  {matchedProfile?.avatar_url ? (
                    <img src={matchedProfile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <p className="font-display text-lg font-semibold tracking-wide text-foreground">
                    {matchedProfile?.username ?? "Player"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {matchedProfile?.rank ?? "Unranked"} •{" "}
                    {matchedProfile?.preferred_game === "lol" ? "LoL" : matchedProfile?.preferred_game === "valorant" ? "Valorant" : "All Games"}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleRespond(true)}
                  className="flex-1 clip-angle-sm bg-primary py-3 font-display text-sm font-bold tracking-wider text-primary-foreground hover:box-glow-primary transition-all"
                >
                  ACCEPT
                </button>
                <button
                  onClick={() => handleRespond(false)}
                  className="flex-1 clip-angle-sm border border-muted-foreground/30 py-3 font-display text-sm tracking-wider text-muted-foreground hover:border-destructive hover:text-destructive transition-all"
                >
                  DECLINE
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
