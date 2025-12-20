import { useState } from "react";
import { Bell, MessageCircle, Heart, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

const typeIcons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  video: Video,
};

const typeColors: Record<string, string> = {
  like: "text-pink-500 bg-pink-500/10",
  comment: "text-blue-500 bg-blue-500/10",
  video: "text-green-500 bg-green-500/10",
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAllAsRead, 
    handleNotificationClick 
  } = useNotifications();

  const handleClick = (notification: typeof notifications[0]) => {
    handleNotificationClick(notification);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-full transition-all duration-200",
          "hover:bg-secondary",
          isOpen && "bg-secondary"
        )}
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold animate-scale-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-96 bg-card rounded-xl border border-border shadow-elevated-lg z-50 animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  const colorClass = typeColors[notification.type] || "text-foreground bg-secondary";
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleClick(notification)}
                      className={cn(
                        "group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                        "hover:bg-secondary/50",
                        !notification.is_read && "bg-primary/5"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                          colorClass
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            !notification.is_read ? "font-semibold" : "font-medium"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}