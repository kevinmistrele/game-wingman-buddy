import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Gamepad2, Shield, Swords, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PreferredGame = Database["public"]["Enums"]["preferred_game"];

const ProfileCard = () => {
  const { profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [preferredGame, setPreferredGame] = useState<PreferredGame>("both");
  const [rank, setRank] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [riotId, setRiotId] = useState("");

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setPreferredGame(profile.preferred_game);
      setRank(profile.rank ?? "");
      setDiscordUsername(profile.discord_username ?? "");
      setRiotId(profile.riot_id ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        preferred_game: preferredGame,
        rank: rank || null,
        discord_username: discordUsername || null,
        riot_id: riotId || null,
      })
      .eq("user_id", profile.user_id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      setEditing(false);
      await refreshProfile();
    }
  };

  if (!profile) return null;

  const initials = profile.username.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="clip-angle border border-border gradient-card p-8 max-w-md w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full border-2 border-primary/40 bg-muted flex items-center justify-center font-display text-2xl font-bold text-primary box-glow-primary">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            {editing ? (
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="font-display text-lg font-bold bg-muted border-border"
              />
            ) : (
              <h2 className="font-display text-2xl font-bold tracking-wider text-foreground">
                {profile.username}
              </h2>
            )}
            <p className="text-sm text-muted-foreground">
              {profile.rank ?? "Unranked"} • {profile.preferred_game === "both" ? "All Games" : profile.preferred_game === "lol" ? "League of Legends" : "Valorant"}
            </p>
          </div>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className="p-2 text-muted-foreground transition-colors hover:text-primary"
        >
          {editing ? <Save className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
        </button>
      </div>

      {editing && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="font-display text-xs tracking-wider text-muted-foreground">PREFERRED GAME</label>
            <Select value={preferredGame} onValueChange={(v) => setPreferredGame(v as PreferredGame)}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lol">League of Legends</SelectItem>
                <SelectItem value="valorant">Valorant</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-display text-xs tracking-wider text-muted-foreground">RANK</label>
            <Input value={rank} onChange={(e) => setRank(e.target.value)} placeholder="Diamond II" className="bg-muted border-border" />
          </div>
          <div>
            <label className="font-display text-xs tracking-wider text-muted-foreground">RIOT ID</label>
            <Input value={riotId} onChange={(e) => setRiotId(e.target.value)} placeholder="Player#TAG" className="bg-muted border-border" />
          </div>
          <div>
            <label className="font-display text-xs tracking-wider text-muted-foreground">DISCORD</label>
            <Input value={discordUsername} onChange={(e) => setDiscordUsername(e.target.value)} placeholder="Username#1234" className="bg-muted border-border" />
          </div>
          <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="h-3 w-3" /> Cancel
          </button>
        </div>
      )}

      {!editing && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: "MATCHES", value: "0", icon: Swords },
              { label: "WIN RATE", value: "—", icon: Shield },
              { label: "FRIENDS", value: "0", icon: Gamepad2 },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto h-5 w-5 text-primary/60" />
                <p className="mt-1 font-display text-xl font-bold text-foreground">{stat.value}</p>
                <p className="font-display text-[10px] tracking-widest text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {profile.discord_username && (
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-sm">🎮</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Discord</p>
                    <p className="text-sm font-medium text-foreground">{profile.discord_username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.discord_username!);
                      toast.success("Copied!");
                    }}
                    className="p-2 text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-muted-foreground transition-colors hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {profile.riot_id && (
            <div className="mt-3 border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="text-sm">⚔️</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Riot ID</p>
                    <p className="text-sm font-medium text-foreground">{profile.riot_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.riot_id!);
                    toast.success("Copied!");
                  }}
                  className="p-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default ProfileCard;
