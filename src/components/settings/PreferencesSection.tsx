import { useState, useEffect } from "react";
import { Palette, Volume2, VolumeX, Map, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RoleIcon, { ROLE_LABELS } from "@/components/RoleIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { isSoundEnabled, setSoundEnabled } from "@/lib/soundUtils";
import { supabase } from "@/integrations/supabase/client";
import { ROLES, type Role } from "@/lib/eloUtils";
import { toast } from "sonner";

export function PreferencesSection() {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [preferredRole, setPreferredRole] = useState<Role | null>(null);
  const [preferredDuoRole, setPreferredDuoRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPreferredRole((profile.preferred_role as Role) ?? null);
    setPreferredDuoRole((profile.preferred_duo_role as Role) ?? null);
  }, [profile]);

  function handleToggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }

  async function handleSaveRoles() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_role: preferredRole, preferred_duo_role: preferredDuoRole })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao salvar preferências de rota");
    } else {
      toast.success("Preferências de rota salvas!");
      await refreshProfile();
    }
    setSaving(false);
  }

  return (
    <>
      <section className="border border-border rounded-lg overflow-hidden">
        <div className="border-b border-border px-5 py-3 bg-muted/30">
          <h2 className="font-display text-sm tracking-widest text-muted-foreground">Preferências</h2>
        </div>

        <div className="px-5 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-primary/70" />
              <div>
                <p className="text-sm font-medium text-foreground">Tema</p>
                <p className="text-xs text-muted-foreground">Escolha a aparência da aplicação</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(["dark", "light"] as const).map((th) => (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  className={`clip-angle-sm px-4 py-2 font-display text-xs tracking-wider transition-all ${
                    theme === th
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  {th === "dark" ? "Escuro" : "Claro"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundOn
                ? <Volume2 className="h-5 w-5 text-primary/70" />
                : <VolumeX className="h-5 w-5 text-primary/70" />}
              <div>
                <p className="text-sm font-medium text-foreground">Sons de notificação</p>
                <p className="text-xs text-muted-foreground">Sons ao encontrar match, aceitar e receber mensagens</p>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`clip-angle-sm px-4 py-2 font-display text-xs tracking-wider transition-all ${
                soundOn
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              {soundOn ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </section>

      <section className="border border-border rounded-lg overflow-hidden">
        <div className="border-b border-border px-5 py-3 bg-muted/30">
          <h2 className="font-display text-sm tracking-widest text-muted-foreground flex items-center gap-2">
            <Map className="h-4 w-4" />
            Preferências de Rota
          </h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Defina suas rotas preferidas para pré-preencher automaticamente no matchmaking ranqueado.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <RoleSelect label="SUA ROTA PRINCIPAL" value={preferredRole} onChange={setPreferredRole} />
            <RoleSelect label="ROTA DO DUO" value={preferredDuoRole} onChange={setPreferredDuoRole} />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveRoles}
              disabled={saving}
              className="clip-angle-sm bg-primary px-5 py-2 font-display text-xs tracking-wider text-primary-foreground hover:box-glow-primary transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Salvar
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

interface RoleSelectProps {
  label: string;
  value: Role | null;
  onChange: (role: Role | null) => void;
}

function RoleSelect({ label, value, onChange }: RoleSelectProps) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5 font-display tracking-wider">{label}</label>
      <Select value={value ?? "any"} onValueChange={(v) => onChange(v === "any" ? null : v as Role)}>
        <SelectTrigger className="bg-background border-border">
          <SelectValue>
            {value ? (
              <span className="flex items-center gap-2">
                <RoleIcon role={value} size="sm" />
                {ROLE_LABELS[value]}
              </span>
            ) : "Qualquer"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Qualquer</SelectItem>
          {ROLES.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              <span className="flex items-center gap-2">
                <RoleIcon role={role.value} size="sm" />
                {role.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
