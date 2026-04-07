import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import OnboardingModal from "@/components/OnboardingModal";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import Index from "./pages/Index.tsx";
import Matchmaking from "./pages/Matchmaking.tsx";
import Chat from "./pages/Chat.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";
import Auth from "./pages/Auth.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const OnboardingGuard = () => {
  const { user, needsOnboarding, completeOnboarding } = useAuth();
  useOnlineStatus();
  if (!needsOnboarding || !user) return null;

  const defaultUsername = user.email?.split("@")[0] ?? "";
  return (
    <OnboardingModal
      userId={user.id}
      defaultUsername={defaultUsername}
      onComplete={completeOnboarding}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <OnboardingGuard />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/matchmaking" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
