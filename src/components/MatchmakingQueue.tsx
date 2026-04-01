import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, X, Check, Clock } from "lucide-react";

type QueueState = "idle" | "searching" | "found";

const MatchmakingQueue = () => {
  const [state, setState] = useState<QueueState>("idle");
  const [timer, setTimer] = useState(0);

  const startQueue = () => {
    setState("searching");
    setTimer(0);
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    // Simulate match found after 5 seconds
    setTimeout(() => {
      clearInterval(interval);
      setState("found");
    }, 5000);
  };

  const cancelQueue = () => {
    setState("idle");
    setTimer(0);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {state === "idle" && (
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
                Find your next teammate
              </p>
            </div>
            <button
              onClick={startQueue}
              className="clip-angle bg-primary px-10 py-4 font-display text-lg font-bold tracking-widest text-primary-foreground transition-all hover:box-glow-primary"
            >
              FIND MATCH
            </button>
          </motion.div>
        )}

        {state === "searching" && (
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
              {/* Ripple rings */}
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

        {state === "found" && (
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
              <p className="mt-2 text-muted-foreground">
                A player wants to connect!
              </p>
            </div>
            {/* Match request card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="clip-angle border border-primary/30 gradient-card p-6 w-80"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center font-display text-xl font-bold text-primary">
                  PR
                </div>
                <div>
                  <p className="font-display text-lg font-semibold tracking-wide text-foreground">
                    PlayerRogue
                  </p>
                  <p className="text-xs text-muted-foreground">Diamond II • Top Lane</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setState("idle")}
                  className="flex-1 clip-angle-sm bg-primary py-3 font-display text-sm font-bold tracking-wider text-primary-foreground hover:box-glow-primary transition-all"
                >
                  ACCEPT
                </button>
                <button
                  onClick={() => setState("idle")}
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
