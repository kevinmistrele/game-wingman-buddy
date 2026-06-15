import { useNavigate } from "react-router-dom";
import { Settings, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { BlockedUsersSection } from "@/components/settings/BlockedUsersSection";
import { AccountSection } from "@/components/settings/AccountSection";

function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl pt-24 pb-12 px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/profile")}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
            CONFIGURAÇÕES
          </h1>
        </div>

        <div className="space-y-6">
          <PreferencesSection />
          <BlockedUsersSection />
          <AccountSection />
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
