import { useState } from "react";
import Navbar from "@/components/Navbar";
import MatchmakingQueue from "@/components/MatchmakingQueue";

const Matchmaking = () => {
  const [selectedGame, setSelectedGame] = useState<"lol" | "valorant">("lol");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-12">
        {/* Game selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedGame("lol")}
            className={`clip-angle-sm px-6 py-3 font-display text-sm font-bold tracking-wider transition-all ${
              selectedGame === "lol"
                ? "bg-primary text-primary-foreground box-glow-primary"
                : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
            }`}
          >
            LEAGUE OF LEGENDS
          </button>
          <button
            onClick={() => setSelectedGame("valorant")}
            className={`clip-angle-sm px-6 py-3 font-display text-sm font-bold tracking-wider transition-all ${
              selectedGame === "valorant"
                ? "bg-secondary text-secondary-foreground box-glow-secondary"
                : "border border-border text-muted-foreground hover:text-foreground hover:border-secondary/50"
            }`}
          >
            VALORANT
          </button>
        </div>

        <MatchmakingQueue game={selectedGame} />
      </div>
    </div>
  );
};

export default Matchmaking;
