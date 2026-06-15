import { useOnlineStatus } from "@/contexts/OnlineStatusContext";

interface OnlineIndicatorProps {
  userId?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Exibe um indicador de status online/offline para um usuário.
 * Usa Supabase Presence via OnlineStatusContext para status em tempo real.
 */
function OnlineIndicator({ userId, size = "sm", className = "" }: OnlineIndicatorProps) {
  const { isOnline } = useOnlineStatus();
  const online = userId ? isOnline(userId) : false;
  const sizeClasses = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`absolute bottom-0 right-0 block ${sizeClasses} rounded-full border-2 border-card ${
        online ? "bg-status-online" : "bg-status-offline/40"
      } ${className}`}
    />
  );
}

export default OnlineIndicator;
