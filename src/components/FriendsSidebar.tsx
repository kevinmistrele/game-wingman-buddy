import { MessageSquare } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  online: boolean;
  game: "lol" | "valorant";
}

const mockFriends: Friend[] = [
  { id: "1", name: "PlayerRogue", initials: "PR", lastMessage: "Let's go!", online: true, game: "lol" },
  { id: "2", name: "NightBlade", initials: "NB", lastMessage: "GG, that was close", online: true, game: "valorant" },
  { id: "3", name: "ShadowFox", initials: "SF", lastMessage: "See you tomorrow", online: false, game: "lol" },
  { id: "4", name: "AceShot", initials: "AS", lastMessage: "What rank are you?", online: false, game: "valorant" },
];

const FriendsSidebar = () => {
  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-display text-sm font-bold tracking-widest text-muted-foreground">
          FRIENDS
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockFriends.map((friend) => (
          <button
            key={friend.id}
            className="flex w-full items-center gap-3 border-b border-border/50 p-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-display text-sm font-bold text-primary">
                {friend.initials}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                  friend.online ? "bg-primary" : "bg-muted-foreground/50"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold tracking-wide text-foreground">
                {friend.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{friend.lastMessage}</p>
            </div>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default FriendsSidebar;
