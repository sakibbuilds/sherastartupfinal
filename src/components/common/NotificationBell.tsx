import { useState, useEffect } from "react";
import { Bell, MessageCircle, UserPlus, Heart, Briefcase, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: "message" | "connection" | "like" | "investment";
  title: string;
  description: string;
  time: string;
  read: boolean;
  avatar?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "connection",
    title: "New connection request",
    description: "Sarah Chen from Stanford wants to connect",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    type: "message",
    title: "New message",
    description: "Alex: Hey, I saw your pitch and loved it!",
    time: "15m ago",
    read: false,
  },
  {
    id: "3",
    type: "like",
    title: "Your pitch is trending",
    description: "Your EcoTrack pitch received 50 new likes",
    time: "1h ago",
    read: false,
  },
  {
    id: "4",
    type: "investment",
    title: "Investment interest",
    description: "Sequoia Capital expressed interest in your startup",
    time: "3h ago",
    read: true,
  },
];

const typeIcons = {
  message: MessageCircle,
  connection: UserPlus,
  like: Heart,
  investment: Briefcase,
};

const typeColors = {
  message: "text-sky bg-sky/10",
  connection: "text-mint bg-mint/10",
  like: "text-pink bg-pink/10",
  investment: "text-foreground bg-secondary",
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [animateNew, setAnimateNew] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Simulate new notification
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7 && notifications.length < 10) {
        setAnimateNew(true);
        setTimeout(() => setAnimateNew(false), 500);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
        <Bell
          className={cn(
            "w-5 h-5 text-foreground transition-transform",
            animateNew && "animate-bounce-subtle"
          )}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-coral text-white text-xs font-semibold animate-scale-in">
            {unreadCount}
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
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = typeIcons[notification.type];
                  return (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                        "hover:bg-secondary/50",
                        !notification.read && "bg-mint/5"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                          typeColors[notification.type]
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            !notification.read ? "font-semibold" : "font-medium"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-mint flex-shrink-0 mt-2" />
                      )}

                      {/* Close button */}
                      <button
                        onClick={(e) => clearNotification(notification.id, e)}
                        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <Button variant="ghost" className="w-full text-muted-foreground">
                  View all notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
