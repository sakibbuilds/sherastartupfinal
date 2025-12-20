import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import { usePresence } from "@/hooks/usePresence";

interface UserCardProps {
  userId?: string;
  name: string;
  university: string;
  role: "founder" | "investor" | "mentor" | "admin";
  avatarUrl?: string;
  isConnected?: boolean;
  compatibilityScore?: number;
  className?: string;
  onClick?: () => void;
}

const roleColors = {
  founder: "bg-mint/10 text-mint border-mint/20",
  investor: "bg-sky/10 text-sky border-sky/20",
  mentor: "bg-pink/10 text-pink border-pink/20",
  admin: "bg-foreground/10 text-foreground border-foreground/20",
};

const roleLabels = {
  founder: "Founder",
  investor: "Investor",
  mentor: "Mentor",
  admin: "Admin",
};

export function UserCard({
  userId,
  name,
  university,
  role,
  avatarUrl,
  isConnected = false,
  compatibilityScore,
  className,
  onClick,
}: UserCardProps) {
  const [connected, setConnected] = useState(isConnected);
  const [isLoading, setIsLoading] = useState(false);
  const { isOnline } = usePresence();
  const online = userId ? isOnline(userId) : false;

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setConnected(true);
    setIsLoading(false);
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-5 rounded-xl bg-card border border-border/50",
        "transition-all duration-300 cursor-pointer",
        "hover:shadow-elevated-lg hover:-translate-y-1 hover:border-border",
        className
      )}
    >
      {/* Compatibility Score */}
      {compatibilityScore && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint/10 text-mint text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse-ring" />
            {compatibilityScore}% match
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold text-secondary-foreground">
              {initials}
            </div>
          )}
          {/* Online Indicator */}
          <span
            className={cn(
              "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card",
              online ? "bg-mint" : "bg-muted-foreground/40"
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-mint transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{university}</p>
          <Badge
            variant="outline"
            className={cn("mt-2 text-xs font-medium", roleColors[role])}
          >
            {roleLabels[role]}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
        {connected ? (
          <>
            <Button variant="secondary" size="sm" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Message
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Check className="w-4 h-4 text-mint" />
            </Button>
          </>
        ) : (
          <Button
            variant="mint"
            size="sm"
            className="flex-1"
            onClick={handleConnect}
            loading={isLoading}
          >
            {!isLoading && <UserPlus className="w-4 h-4 mr-1.5" />}
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
