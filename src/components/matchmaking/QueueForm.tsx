import { motion } from "framer-motion";
import { Crosshair, AlertTriangle, Users } from "lucide-react";
import { motionConfig } from "@/design-system/tokens";
import RankBadge from "@/components/RankBadge";
import RoleSelect from "@/components/RoleSelect";
import { QUEUE_MODES, type QueueMode, type Role } from "@/lib/eloUtils";
import type { ResolvedRank, RankSource } from "@/types/riot";

interface QueueFormProps {
  myRank: ResolvedRank | null;
  myRankSource: RankSource | null;
  queueCounts: Record<string, number>;
  selectedMode: QueueMode;
  selectedMyRole: Role | null;
  selectedDesiredRole: Role | null;
  onModeChange: (mode: QueueMode) => void;
  onMyRoleChange: (role: Role | null) => void;
  onDesiredRoleChange: (role: Role | null) => void;
  onStart: () => void;
}

export function QueueForm({
  myRank, myRankSource, queueCounts,
  selectedMode, selectedMyRole, selectedDesiredRole,
  onModeChange, onMyRoleChange, onDesiredRoleChange, onStart,
}: QueueFormProps) {
  const isRanked = QUEUE_MODES.find(m => m.value === selectedMode)?.ranked ?? false;

  return (
    <motion.div
      key="idle"
      {...motionConfig.scaleIn}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-8 w-full max-w-lg"
    >
      {myRank && (
        <motion.div
          {...motionConfig.fadeUp}
          className="border border-border gradient-card px-6 py-3 text-center"
        >
          <p className="font-display text-xs tracking-widest text-muted-foreground mb-2">SEU RANK</p>
          <RankBadge tier={myRank.tier} rank={myRank.rank} winRate={myRank.winRate} size="lg" />
          {myRankSource === "manual" && (
            <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3" /> Rank definido manualmente
            </p>
          )}
        </motion.div>
      )}

      {!myRank && isRanked && (
        <div className="border border-destructive/30 bg-destructive/5 px-6 py-3 text-center flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">Sem rank — não é possível entrar em filas ranqueadas</p>
        </div>
      )}

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
                onClick={() => !disabled && onModeChange(mode.value)}
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
                <span className="block text-xs font-normal tracking-normal mt-0.5 opacity-70">{mode.description}</span>
                {count > 0 && (
                  <span className="absolute top-2 right-3 flex items-center gap-1 text-xs font-normal opacity-60">
                    <Users className="h-3 w-3" /> {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isRanked && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full"
        >
          <h3 className="font-display text-xs tracking-[0.2em] text-muted-foreground text-center mb-3">PREFERÊNCIA DE ROTA</h3>
          <div className="grid grid-cols-2 gap-3">
            <RoleSelect label="SUA ROTA" value={selectedMyRole} onChange={onMyRoleChange} />
            <RoleSelect label="ROTA DO DUO" value={selectedDesiredRole} onChange={onDesiredRoleChange} />
          </div>
        </motion.div>
      )}

      <div className="h-24 w-24 rounded-full border-2 border-primary/30 gradient-card flex items-center justify-center">
        <Crosshair className="h-10 w-10 text-primary" />
      </div>

      <button
        onClick={onStart}
        disabled={isRanked && !myRank}
        className="clip-angle bg-primary px-10 py-4 font-display text-lg font-bold tracking-widest text-primary-foreground transition-all hover:box-glow-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ENCONTRAR MATCH
      </button>
    </motion.div>
  );
}
