interface OnlineIndicatorProps {
  lastSeen?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export const isUserOnline = (lastSeen?: string | null): boolean => {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 2 * 60 * 1000; // 2 minutes
};

const OnlineIndicator = ({ lastSeen, size = "sm", className = "" }: OnlineIndicatorProps) => {
  const online = isUserOnline(lastSeen);
  const sizeClasses = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`absolute bottom-0 right-0 block ${sizeClasses} rounded-full border-2 border-card ${
        online ? "bg-green-500" : "bg-muted-foreground/40"
      } ${className}`}
    />
  );
};

export default OnlineIndicator;
