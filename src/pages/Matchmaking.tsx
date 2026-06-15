import Navbar from "@/components/Navbar";
import MatchmakingQueue from "@/components/MatchmakingQueue";

const Matchmaking = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-12">
        <MatchmakingQueue />
      </div>
    </div>
  );
};

export default Matchmaking;
