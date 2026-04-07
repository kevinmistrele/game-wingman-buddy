import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Users, MessageSquare, Crosshair, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicNavItems = [
    { label: "Início", path: "/", icon: Crosshair },
  ];

  const authNavItems = [
    { label: "Início", path: "/", icon: Crosshair },
    { label: "Matchmaking", path: "/matchmaking", icon: Users },
    { label: "Chat", path: "/chat", icon: MessageSquare },
  ];

  const navItems = user ? authNavItems : publicNavItems;

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between relative">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MatchGaming" className="h-10 w-10" />
            <span className="font-display text-lg font-bold tracking-wider text-primary">
              MATCHGAMING
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
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
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-3 py-2 font-display text-sm tracking-wide transition-all ${
                    location.pathname === "/profile"
                      ? "text-primary text-glow-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>{profile?.username ?? user.email?.split("@")[0]}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="clip-angle-sm bg-muted px-4 py-2 font-display text-sm font-semibold tracking-wider text-foreground transition-all hover:bg-destructive hover:text-destructive-foreground"
                >
                  SAIR
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="clip-angle-sm bg-primary px-5 py-2 font-display text-sm font-semibold tracking-wider text-primary-foreground transition-all hover:box-glow-primary"
              >
                ENTRAR
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="container py-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-display text-sm tracking-wide transition-all ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-display text-sm tracking-wide transition-all ${
                      location.pathname === "/profile"
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>{profile?.username ?? user.email?.split("@")[0]}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg font-display text-sm tracking-wide text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 clip-angle-sm bg-primary px-5 py-3 font-display text-sm font-semibold tracking-wider text-primary-foreground text-center transition-all hover:box-glow-primary"
                >
                  ENTRAR
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
