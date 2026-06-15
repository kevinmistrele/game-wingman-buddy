import { motion } from "framer-motion";
import { X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import RoleIcon from "@/components/RoleIcon";
import { QUEUE_MODES, TIER_LABELS, type QueueMode, type Role } from "@/lib/eloUtils";
import type { ResolvedRank } from "@/types/riot";
import type { SearchPhase } from "@/types/matchmaking";

interface SearchingViewProps {
  timer: number;
  selectedMode: QueueMode;
  selectedMyRole: Role | null;
  selectedDesiredRole: Role | null;
  myRank: ResolvedRank | null;
  searchPhase: SearchPhase;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function SearchingView({
  timer, selectedMode, selectedMyRole, selectedDesiredRole,
  myRank, searchPhase, onCancel,
}: SearchingViewProps) {
  const isRanked = QUEUE_MODES.find(m => m.value === selectedMode)?.ranked ?? false;
  const modeLabel = QUEUE_MODES.find(m => m.value === selectedMode)?.label ?? selectedMode;

  return (
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
        <p className="mt-1 font-display text-xs tracking-widest text-muted-foreground uppercase">{modeLabel}</p>
        <p className="mt-2 font-display text-xl tracking-widest text-muted-foreground">{formatTime(timer)}</p>

        {isRanked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Mesmo nível {myRank ? `(${TIER_LABELS[myRank.tier] ?? myRank.tier})` : ""}</span>
            </div>
            {searchPhase === "strict" ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {selectedMyRole || selectedDesiredRole ? (
                  <span className="flex items-center gap-1">
                    Rota desejada
                    {selectedMyRole && <RoleIcon role={selectedMyRole} size="sm" showLabel className="text-primary" />}
                  </span>
                ) : (
                  <span>Qualquer rota</span>
                )}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-xs text-secondary"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Qualquer rota (busca expandida)</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {timer >= 60 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-secondary">
            Demorando mais que o esperado...
          </motion.p>
        )}
      </div>

      <button
        onClick={onCancel}
        className="flex items-center gap-2 border border-destructive/50 bg-transparent px-8 py-3 font-display text-sm tracking-wider text-destructive transition-all hover:bg-destructive/10"
      >
        <X className="h-4 w-4" /> CANCELAR
      </button>
    </motion.div>
  );
}
