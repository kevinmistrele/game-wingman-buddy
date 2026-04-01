import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  title: string;
  image: string;
  accentClass: "primary" | "secondary";
  description: string;
}

const GameCard = ({ title, image, accentClass, description }: GameCardProps) => {
  const navigate = useNavigate();

  const glowClass = accentClass === "primary" ? "box-glow-primary" : "box-glow-secondary";
  const textClass = accentClass === "primary" ? "text-primary" : "text-secondary";
  const borderClass = accentClass === "primary" ? "border-primary/30 hover:border-primary/60" : "border-secondary/30 hover:border-secondary/60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -8 }}
      className={`group relative cursor-pointer overflow-hidden border ${borderClass} clip-angle transition-all duration-300 hover:${glowClass}`}
      onClick={() => navigate("/matchmaking")}
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        {/* Scan line effect */}
        <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity group-hover:opacity-20">
          <div className="absolute inset-x-0 h-px bg-primary animate-scan-line" />
        </div>
      </div>

      <div className="relative p-6">
        <h3 className={`font-display text-2xl font-bold tracking-wider ${textClass}`}>
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${accentClass === "primary" ? "bg-primary" : "bg-secondary"} animate-pulse-glow`} />
          <span className="font-display text-xs tracking-widest text-muted-foreground">
            QUEUE AVAILABLE
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
