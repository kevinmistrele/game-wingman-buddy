import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useAuth } from "@/contexts/AuthContext";
import { QueueForm } from "@/components/matchmaking/QueueForm";
import { SearchingView } from "@/components/matchmaking/SearchingView";
import { MatchFoundView } from "@/components/matchmaking/MatchFoundView";
import { parseApiError } from "@/lib/errors";
import { type QueueMode, type Role } from "@/lib/eloUtils";
import { toast } from "sonner";

function MatchmakingQueue() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    status, matchedPlayer, myRank, myRankSource, queueCounts,
    otherAccepted, acceptedConvoId, searchPhase,
    joinQueue, cancelQueue, respondToMatch,
  } = useMatchmaking();

  const [timer, setTimer] = useState(0);
  const [selectedMode, setSelectedMode] = useState<QueueMode>("normal");
  const [selectedMyRole, setSelectedMyRole] = useState<Role | null>(null);
  const [selectedDesiredRole, setSelectedDesiredRole] = useState<Role | null>(null);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [respondingMatch, setRespondingMatch] = useState<"accept" | "decline" | null>(null);

  // Pre-fill role preferences from profile
  useEffect(() => {
    if (!profile) return;
    setSelectedMyRole((profile.preferred_role as Role) ?? null);
    setSelectedDesiredRole((profile.preferred_duo_role as Role) ?? null);
  }, [profile]);

  // Timer while searching
  useEffect(() => {
    if (status !== "searching") { setTimer(0); return; }
    setJoiningQueue(false);
    const interval = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status === "found") setJoiningQueue(false);
    if (status === "idle") setRespondingMatch(null);
  }, [status]);

  // Navigate to chat when both accepted
  useEffect(() => {
    if (!acceptedConvoId) return;
    toast.success("Match aceito! Abrindo chat...");
    setTimeout(() => navigate(`/chat?convo=${acceptedConvoId}`), 800);
  }, [acceptedConvoId, navigate]);

  // Reset roles when switching mode
  const isRanked = ["solo_duo", "flex"].includes(selectedMode);
  useEffect(() => {
    if (!isRanked) {
      setSelectedMyRole(null);
      setSelectedDesiredRole(null);
    } else if (profile) {
      setSelectedMyRole((profile.preferred_role as Role) ?? null);
      setSelectedDesiredRole((profile.preferred_duo_role as Role) ?? null);
    }
  }, [isRanked, profile]);

  async function handleStart() {
    setJoiningQueue(true);
    try {
      await joinQueue(selectedMode, selectedMyRole, selectedDesiredRole);
    } catch (e) {
      toast.error(parseApiError(e));
      setJoiningQueue(false);
    }
  }

  async function handleRespond(accepted: boolean) {
    setRespondingMatch(accepted ? "accept" : "decline");
    try {
      const convoId = await respondToMatch(accepted);
      if (accepted && convoId) {
        toast.success("Match aceito! Abrindo chat...");
        setTimeout(() => navigate(`/chat?convo=${convoId}`), 400);
      }
    } catch {
      setRespondingMatch(null);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {status === "idle" && !joiningQueue && (
          <QueueForm
            myRank={myRank}
            myRankSource={myRankSource}
            queueCounts={queueCounts}
            selectedMode={selectedMode}
            selectedMyRole={selectedMyRole}
            selectedDesiredRole={selectedDesiredRole}
            onModeChange={setSelectedMode}
            onMyRoleChange={setSelectedMyRole}
            onDesiredRoleChange={setSelectedDesiredRole}
            onStart={handleStart}
          />
        )}

        {status === "idle" && joiningQueue && (
          <motion.div
            key="joining"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6"
          >
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="font-display text-sm tracking-widest text-muted-foreground">ENTRANDO NA FILA...</p>
          </motion.div>
        )}

        {status === "searching" && (
          <SearchingView
            timer={timer}
            selectedMode={selectedMode}
            selectedMyRole={selectedMyRole}
            selectedDesiredRole={selectedDesiredRole}
            myRank={myRank}
            searchPhase={searchPhase}
            onCancel={cancelQueue}
          />
        )}

        {status === "found" && (
          <MatchFoundView
            matchedPlayer={matchedPlayer}
            otherAccepted={otherAccepted}
            respondingMatch={respondingMatch}
            onAccept={() => handleRespond(true)}
            onDecline={() => handleRespond(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MatchmakingQueue;
