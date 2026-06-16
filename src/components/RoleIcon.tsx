import { Shield, Trees, Target, Crosshair, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  top: Shield,
  jungle: Trees,
  mid: Target,
  adc: Crosshair,
  support: Heart,
};

export const ROLE_LABELS: Record<string, string> = {
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  adc: "ADC",
  support: "Suporte",
};

interface RoleIconProps {
  role: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

function RoleIcon({ role, size = "md", showLabel = false, className }: RoleIconProps) {
  const Icon = ROLE_ICON_MAP[role];
  if (!Icon) return null;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Icon className={sizeClasses[size]} />
      {showLabel && <span>{ROLE_LABELS[role] ?? role}</span>}
    </span>
  );
}

export default RoleIcon;
