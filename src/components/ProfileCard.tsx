import { motion } from "framer-motion";
import { Copy, ExternalLink, Gamepad2, Shield, Swords } from "lucide-react";

const ProfileCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="clip-angle border border-border gradient-card p-8 max-w-md w-full"
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-5">
        <div className="h-20 w-20 rounded-full border-2 border-primary/40 bg-muted flex items-center justify-center font-display text-2xl font-bold text-primary box-glow-primary">
          GX
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold tracking-wider text-foreground">
            GAMERX_PRO
          </h2>
          <p className="text-sm text-muted-foreground">Diamond II • Top Lane</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: "MATCHES", value: "342", icon: Swords },
          { label: "WIN RATE", value: "58%", icon: Shield },
          { label: "FRIENDS", value: "47", icon: Gamepad2 },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon className="mx-auto h-5 w-5 text-primary/60" />
            <p className="mt-1 font-display text-xl font-bold text-foreground">{stat.value}</p>
            <p className="font-display text-[10px] tracking-widest text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Discord */}
      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-sm">🎮</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Discord</p>
              <p className="text-sm font-medium text-foreground">GamerX#1234</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground transition-colors hover:text-primary">
              <Copy className="h-4 w-4" />
            </button>
            <button className="p-2 text-muted-foreground transition-colors hover:text-primary">
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
