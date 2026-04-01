import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Users, MessageSquare, Crosshair, User, LogOut, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isSoundEnabled, setSoundEnabled } from "@/lib/soundUtils";

const navItems = [
  { label: "Home", path: "/", icon: Crosshair },
  { label: "Matchmaking", path: "/matchmaking", icon: Users },
  { label: "Chat", path: "/chat", icon: MessageSquare },
  { label: "Profile", path: "/profile", icon: User },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="MatchGaming" className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-wider text-primary">
            MATCHGAMING
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 font-display text-sm tracking-wide transition-all ${
                  isActive
                    ? "text-primary text-glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="font-display text-sm tracking-wide text-foreground hidden sm:inline">
              {profile?.username ?? user.email?.split("@")[0]}
            </span>
            <button
              onClick={handleSignOut}
              className="clip-angle-sm bg-muted px-4 py-2 font-display text-sm font-semibold tracking-wider text-foreground transition-all hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="clip-angle-sm bg-primary px-5 py-2 font-display text-sm font-semibold tracking-wider text-primary-foreground transition-all hover:box-glow-primary"
          >
            SIGN IN
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
