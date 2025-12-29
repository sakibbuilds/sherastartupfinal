import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Home, 
  MessageSquare, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut, 
  AlignLeft, 
  X,
  User,
  Loader2,
  Building2,
  TrendingUp,
  Check,
  Mail,
  ChevronLeft,
  ChevronRight,
  Video,
  ChevronDown,
  Plus,
  Play,
  ListVideo,
  Users,
  Shield,
  ArrowRight,
  BadgeCheck,
  Network,
  Search,
  UserPlus
} from 'lucide-react';
import { UserBadges } from '@/components/common/UserBadges';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { usePresence } from '@/hooks/usePresence';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  submenu?: { icon: React.ElementType; label: string; path: string }[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  reference_id: string | null;
  reference_type: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Home Pages",
    items: [
      { icon: Home, label: 'Feed', path: '/dashboard' }
    ]
  },
  {
    title: "Community",
    items: [
      { 
        icon: Network, 
        label: 'Network', 
        path: '/dashboard/network',
        submenu: [
          { icon: Search, label: 'Find Connections', path: '/dashboard/network' },
          { icon: Users, label: 'My Connections', path: '/dashboard/network/connections' },
          { icon: UserPlus, label: 'Connection Requests', path: '/dashboard/network/requests' },
        ]
      },
      { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages' },
      { icon: Users, label: 'Founders', path: '/dashboard/founders' },
      { icon: Building2, label: 'Startups', path: '/dashboard/startups' },
      { icon: TrendingUp, label: 'Investors', path: '/dashboard/investors' },
    ]
  },
  {
    title: "Growth",
    items: [
      { 
        icon: Video, 
        label: 'Pitches', 
        path: '/dashboard/pitches',
        submenu: [
          { icon: Play, label: 'Browse Pitches', path: '/dashboard/pitches' },
          { icon: ListVideo, label: 'My Pitches', path: '/dashboard/pitches/my' },
          { icon: Plus, label: 'Upload Pitch', path: '/dashboard/pitches/upload' },
        ]
      },
      { 
        icon: Calendar, 
        label: 'Mentorship', 
        path: '/dashboard/mentorship',
        submenu: [
          { icon: Users, label: 'My Mentors', path: '/dashboard/mentorship' },
          { icon: Users, label: 'Find a Mentor', path: '/dashboard/mentorship/find' },
          { icon: Check, label: 'Become a Mentor', path: '/dashboard/mentorship/become' },
        ]
      },
    ]
  }
];

// Flattened items for mobile/utility use
const navItems = navSections.flatMap(section => section.items);

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null; title: string | null; user_type: string | null; verified?: boolean; is_mentor?: boolean } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'rejected'>('none');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { onlineCount } = usePresence();
  const [isAdmin, setIsAdmin] = useState(false);

  const [showFabMenu, setShowFabMenu] = useState(false);

  const handleFabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFabMenu(!showFabMenu);
  };

  useEffect(() => {
    const handleClickOutside = () => setShowFabMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  useEffect(() => {
    if (user) {
      checkAdminRole();
      // Fetch verified status along with role
      const fetchVerifiedStatus = async () => {
        // 1. Get profile verification and mentor status
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          // Only redirect to onboarding if specifically no rows found (profile doesn't exist)
          if (error.code === 'PGRST116') {
             navigate('/onboarding');
          }
        } else if (profileData) {
          setProfile(profileData);
          if (!profileData.onboarding_completed) {
            navigate('/onboarding');
          }
        }

        // 2. Check for pending requests if not verified
        if (profileData && !profileData.verified) {
           const { data: requestData } = await supabase
            .from('verification_requests')
            .select('status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (requestData) {
            setVerificationStatus(requestData.status as any);
          } else {
             // Fallback to local storage check for immediate feedback
             const isPending = localStorage.getItem(`verification_pending_${user.id}`);
             if (isPending === 'true') setVerificationStatus('pending');
          }
        }
      };
      fetchVerifiedStatus();
    }
  }, [user]);

  const checkAdminRole = async () => {
    const { data } = await supabase.rpc('has_role', {
      _role: 'admin',
      _user_id: user?.id
    });
    setIsAdmin(!!data);
  };

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (data) {
          setNotifications(data);
          setUnreadNotifications(data.filter(n => !n.is_read).length);
        }
      };

      const fetchRecentMessages = async () => {
        const { data: participantData } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (participantData && participantData.length > 0) {
          const conversationIds = participantData.map(p => p.conversation_id);
          
          const { data: messagesData, count } = await supabase
            .from('messages')
            .select('*', { count: 'exact' })
            .in('conversation_id', conversationIds)
            .neq('sender_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5);

          if (messagesData) {
            const messagesWithSenders = await Promise.all(
              messagesData.map(async (msg) => {
                const { data: sender } = await supabase
                  .from('profiles')
                  .select('full_name, avatar_url')
                  .eq('user_id', msg.sender_id)
                  .maybeSingle();
                return { ...msg, sender };
              })
            );
            setRecentMessages(messagesWithSenders);
            setUnreadMessages(count || 0);
          }
        }
      };

      fetchNotifications();
      fetchRecentMessages();

      // Subscribe to real-time notifications
      const notificationChannel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev.slice(0, 9)]);
            setUnreadNotifications(prev => prev + 1);
          }
        )
        .subscribe();

      // Subscribe to real-time messages
      const messageChannel = supabase
        .channel('dashboard-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            const newMsg = payload.new as any;
            // Only process if not sender
            if (newMsg.sender_id !== user.id) {
              // Check if user is participant
              const { data: participation } = await supabase
                .from('conversation_participants')
                .select('id')
                .eq('conversation_id', newMsg.conversation_id)
                .eq('user_id', user.id)
                .maybeSingle();

              if (participation) {
                // Fetch sender info
                const { data: sender } = await supabase
                  .from('profiles')
                  .select('full_name, avatar_url')
                  .eq('user_id', newMsg.sender_id)
                  .maybeSingle();

                setRecentMessages(prev => [{
                  ...newMsg,
                  sender
                }, ...prev.slice(0, 4)]);
                setUnreadMessages(prev => prev + 1);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationChannel);
        supabase.removeChannel(messageChannel);
      };
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    
    // Navigate based on notification type and reference
    if (notification.reference_id) {
      switch (notification.reference_type) {
        case 'video_pitch':
          navigate(`/dashboard/pitches?video=${notification.reference_id}`);
          break;
        case 'startup':
          navigate(`/dashboard/startups/${notification.reference_id}`);
          break;
        case 'message':
          navigate('/dashboard/messages');
          break;
        case 'booking':
          navigate('/dashboard/mentorship');
          break;
        case 'match':
          navigate('/dashboard/network');
          break;
        case 'profile':
          navigate(`/dashboard/profile/${notification.reference_id}`);
          break;
        case 'post':
          navigate(`/dashboard/post/${notification.reference_id}`);
          break;
        default:
          if (notification.type === 'comment' || notification.type === 'like') {
            navigate(`/dashboard/pitches?video=${notification.reference_id}`);
          }
          break;
      }
    } else {
      switch (notification.type) {
        case 'message':
          navigate('/dashboard/messages');
          break;
        case 'booking':
          navigate('/dashboard/mentorship');
          break;
        case 'match':
          navigate('/dashboard/network');
          break;
        default:
          navigate('/dashboard');
          break;
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadNotifications(0);
  };

  const isPathActive = (path: string, submenu?: NavItem['submenu']) => {
    if (submenu) {
      return submenu.some(item => location.pathname === item.path) || location.pathname.startsWith(path);
    }
    return location.pathname === path;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const DesktopSidebarItem = ({ item, collapsed }: { item: NavItem; collapsed: boolean }) => {
    const isActive = isPathActive(item.path, item.submenu);
    
    if (item.submenu) {
      return (
        <HoverCard openDelay={0} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full h-auto py-2 px-2 rounded-xl hover:bg-secondary/50 group transition-all duration-200",
                collapsed ? "justify-center" : "justify-start",
                isActive && "bg-secondary/30"
              )}
              onClick={() => navigate(item.path)}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm border shrink-0",
                isActive 
                  ? "bg-primary text-primary-foreground border-primary shadow-primary/25" 
                  : "bg-card text-muted-foreground border-border/50 group-hover:text-foreground group-hover:bg-background group-hover:border-border"
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              {!collapsed && (
                <>
                  <span className={cn("flex-1 text-left font-medium ml-3 text-sm", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </>
              )}
            </Button>
          </HoverCardTrigger>
          <HoverCardContent 
            side="right" 
            align="start" 
            className="w-56 p-2 bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl" 
            sideOffset={collapsed ? 20 : 10}
          >
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-sm font-semibold text-foreground/70 border-b border-border/50 mb-1">
                {item.label}
              </div>
              {item.submenu.map((subItem) => (
                <Button
                  key={subItem.path}
                  variant={location.pathname === subItem.path ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'w-full justify-start gap-3',
                    location.pathname === subItem.path && 'bg-primary text-primary-foreground'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(subItem.path);
                  }}
                >
                  <subItem.icon className="h-4 w-4" />
                  {subItem.label}
                </Button>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }

    return collapsed ? (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full h-auto py-2 px-2 rounded-xl hover:bg-secondary/50 group transition-all duration-200 justify-center",
              isActive && "bg-secondary/30"
            )}
            onClick={() => navigate(item.path)}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm border shrink-0",
              isActive 
                ? "bg-primary text-primary-foreground border-primary shadow-primary/25" 
                : "bg-card text-muted-foreground border-border/50 group-hover:text-foreground group-hover:bg-background group-hover:border-border"
            )}>
              <item.icon className="h-5 w-5" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.label}
        </TooltipContent>
      </Tooltip>
    ) : (
      <Button
        variant="ghost"
        className={cn(
          "w-full h-auto py-2 px-2 rounded-xl hover:bg-secondary/50 group transition-all duration-200 justify-start",
          isActive && "bg-secondary/30"
        )}
        onClick={() => navigate(item.path)}
      >
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm border shrink-0",
          isActive 
            ? "bg-primary text-primary-foreground border-primary shadow-primary/25" 
            : "bg-card text-muted-foreground border-border/50 group-hover:text-foreground group-hover:bg-background group-hover:border-border"
        )}>
          <item.icon className="h-5 w-5" />
        </div>
        <span className={cn("flex-1 text-left font-medium ml-3 text-sm", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
          {item.label}
        </span>
      </Button>
    );
  };

  const MobileSidebarItem = ({ item }: { item: NavItem }) => {
    const isActive = isPathActive(item.path, item.submenu);
    const isOpen = openSubmenu === item.label;

    if (item.submenu) {
      return (
        <Collapsible
          open={isOpen}
          onOpenChange={(open) => setOpenSubmenu(open ? item.label : null)}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between py-3 h-auto rounded-xl hover:bg-secondary/50 group transition-all duration-200",
                isActive && "bg-secondary/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm border shrink-0",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/25" 
                    : "bg-card text-muted-foreground border-border/50 group-hover:text-foreground group-hover:bg-background group-hover:border-border"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className={cn("text-left font-medium text-sm", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                  {item.label}
                </span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isOpen && "transform rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 space-y-1 mt-1">
            {item.submenu.map((subItem) => (
              <Button
                key={subItem.path}
                variant={location.pathname === subItem.path ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  location.pathname === subItem.path && 'bg-primary text-primary-foreground'
                )}
                onClick={() => {
                  navigate(subItem.path);
                  setSidebarOpen(false);
                }}
              >
                <subItem.icon className="h-4 w-4" />
                {subItem.label}
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start py-3 h-auto rounded-xl hover:bg-secondary/50 group transition-all duration-200",
          isActive && "bg-secondary/30"
        )}
        onClick={() => {
          navigate(item.path);
          setSidebarOpen(false);
        }}
      >
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm border shrink-0",
          isActive 
            ? "bg-primary text-primary-foreground border-primary shadow-primary/25" 
            : "bg-card text-muted-foreground border-border/50 group-hover:text-foreground group-hover:bg-background group-hover:border-border"
        )}>
          <item.icon className="h-5 w-5" />
        </div>
        <span className={cn("flex-1 text-left font-medium ml-3 text-sm", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
          {item.label}
        </span>
      </Button>
    );
  };

  return (
    <div className="min-h-screen flex bg-transparent">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-background transition-all duration-300 z-50",
          sidebarCollapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
        <div 
          className={cn(
            "flex items-center gap-3 px-6 h-20 relative group",
            sidebarCollapsed && "justify-center px-2"
          )}
        >
          <div 
             className={cn(
               "flex items-center cursor-pointer w-full transition-all duration-300",
               sidebarCollapsed ? "justify-center" : "justify-start px-2"
             )}
             onClick={() => navigate('/dashboard')}
          >
            <img 
              src="/logo.png" 
              alt="SheraStartup" 
              className={cn(
                "object-contain transition-all duration-300",
                sidebarCollapsed ? "h-8 w-8" : "h-10 w-auto max-w-[180px]"
              )} 
            />
          </div>

          {!sidebarCollapsed && (
            <Button
              variant="secondary" 
              size="icon"
              className="h-6 w-6 absolute -right-3 top-1/2 -translate-y-1/2 rounded-full shadow-md border border-white/10 bg-background z-50"
              onClick={(e) => {
                 e.stopPropagation();
                 setSidebarCollapsed(true);
              }}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* Collapsed State Expand Button - positioned absolutely to overlap border */}
        {sidebarCollapsed && (
           <div className="absolute left-1/2 -translate-x-1/2 top-8 -translate-y-1/2 z-50">
             <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6 rounded-full shadow-md border border-white/10 bg-background"
                onClick={() => setSidebarCollapsed(false)}
             >
               <ChevronRight className="h-3 w-3" />
             </Button>
           </div>
        )}

        <nav className={cn("flex-1 py-6 overflow-y-auto", sidebarCollapsed ? "px-2" : "px-4")}>
          <div className="space-y-6">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!sidebarCollapsed && section.title && (
                  <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-2">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <DesktopSidebarItem key={item.path} item={item} collapsed={sidebarCollapsed} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="mt-6 space-y-1">
              {!sidebarCollapsed && <p className="mb-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>}
              <HoverCard openDelay={0} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-auto py-2 px-2 rounded-xl hover:bg-secondary/50 group transition-all duration-200",
                      sidebarCollapsed ? "justify-center" : "justify-start",
                      location.pathname.startsWith('/dashboard/admin') && "bg-secondary/30"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm border shrink-0",
                      location.pathname.startsWith('/dashboard/admin')
                        ? "bg-primary text-primary-foreground border-primary shadow-primary/25" 
                        : "bg-card text-muted-foreground border-border/50 group-hover:text-foreground group-hover:bg-background group-hover:border-border"
                    )}>
                      <Shield className="h-5 w-5" />
                    </div>
                    {!sidebarCollapsed && (
                      <>
                        <span className={cn("flex-1 text-left font-medium ml-3 text-sm", location.pathname.startsWith('/dashboard/admin') ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                          Admin Panel
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </>
                    )}
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent 
                  side="right" 
                  align="start" 
                  className="w-56 p-2" 
                  sideOffset={sidebarCollapsed ? 20 : 10}
                >
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-sm font-semibold text-foreground/70 border-b border-border mb-1">
                      Mentorship
                    </div>
                    <Button
                      variant={location.pathname === '/dashboard/admin/mentorships/requests' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start gap-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/dashboard/admin/mentorships/requests');
                      }}
                    >
                      <Users className="h-4 w-4" />
                      Requests
                    </Button>
                    <Button
                      variant={location.pathname === '/dashboard/admin/mentorships/all' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start gap-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/dashboard/admin/mentorships/all');
                      }}
                    >
                      <Check className="h-4 w-4" />
                      All Mentors
                    </Button>
                    <div className="px-2 py-1.5 text-sm font-semibold text-foreground/70 border-b border-border mb-1 mt-2">
                      Management
                    </div>
                    <Button
                      variant={location.pathname === '/dashboard/admin/advertisements' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start gap-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/dashboard/admin/advertisements');
                      }}
                    >
                      <ListVideo className="h-4 w-4" />
                      Advertisements
                    </Button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          )}
        </nav>

        {profile && !profile.verified && profile.user_type !== 'admin' && (
          <div className={cn("px-3 pb-2", sidebarCollapsed && "px-2")}>
             <Button
              variant="default"
              disabled={verificationStatus === 'pending'}
              className={cn(
                'w-full justify-between group relative overflow-hidden transition-all duration-300',
                verificationStatus === 'pending' 
                  ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20'
                  : 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 border border-primary/20',
                sidebarCollapsed && 'justify-center px-2'
              )}
              onClick={() => navigate('/dashboard/settings?tab=verification')}
            >
              <div className="flex items-center gap-3">
                {verificationStatus === 'pending' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <BadgeCheck className="h-5 w-5" />
                )}
                {!sidebarCollapsed && <span>{verificationStatus === 'pending' ? 'Pending...' : 'Get Verified'}</span>}
              </div>
              {!sidebarCollapsed && verificationStatus !== 'pending' && (
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
              )}
            </Button>
          </div>
        )}

        <div className={cn("p-4 border-t border-border", sidebarCollapsed && "p-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn("w-full gap-3", sidebarCollapsed ? "justify-center p-0" : "justify-start")}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex flex-col items-start text-left min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-medium">{profile?.full_name || 'User'}</span>
                      <UserBadges verified={profile?.verified} isMentor={profile?.is_mentor} size="sm" />
                    </div>
                    {profile?.title && (
                      <span className="text-xs text-muted-foreground truncate">{profile.title}</span>
                    )}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuItem onClick={() => navigate(`/dashboard/profile/${user.id}`)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Desktop Header (right of sidebar) */}
      <header 
        className={cn(
          "hidden lg:flex items-center justify-end h-16 px-6 border-b border-border bg-background/80 backdrop-blur-md fixed top-0 right-0 z-40 transition-all duration-300",
          sidebarCollapsed ? "left-20" : "left-72"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Online Users Count */}
          {onlineCount > 1 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-mint/10 to-emerald-500/10 border border-mint/20 text-mint text-sm shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-mint animate-pulse shadow-[0_0_8px_rgba(var(--mint),0.5)]" />
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{onlineCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {onlineCount} users online
              </TooltipContent>
            </Tooltip>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-card border-white/10">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="font-semibold">Notifications</span>
                {unreadNotifications > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-auto py-1"
                    onClick={markAllNotificationsAsRead}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-sm">No notifications yet</span>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'px-4 py-3 border-b border-white/10 last:border-0 cursor-pointer hover:bg-white/5 transition-colors',
                        !notification.is_read && 'bg-primary/5'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                          notification.is_read ? 'bg-muted' : 'bg-primary'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Messages */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Mail className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-popover">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold">Messages</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-auto py-1"
                  onClick={() => navigate('/dashboard/messages')}
                >
                  View all
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                {recentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-sm">No new messages</span>
                  </div>
                ) : (
                  recentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate('/dashboard/messages')}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {message.sender?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {message.sender?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-2 pr-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {profile?.full_name || 'User'}
                  </span>
                  <UserBadges verified={profile?.verified} isMentor={profile?.is_mentor} size="sm" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.title || 'Member'}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate(`/dashboard/profile/${user.id}`)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <AlignLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2" onClick={() => navigate('/dashboard')}>
            <img src="/logo.png" alt="SheraStartup" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/dashboard/messages')}>
              <Mail className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-card/95 backdrop-blur-xl border-r border-border z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2" onClick={() => navigate('/dashboard')}>
                  <img src="/logo.png" alt="SheraStartup" className="h-8 w-auto object-contain" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-medium">{profile?.full_name || 'User'}</p>
                      <UserBadges verified={profile?.verified} isMentor={profile?.is_mentor} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">{profile?.title || 'Member'}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <MobileSidebarItem key={item.path} item={item} />
                ))}
              </nav>

              <div className="p-4 border-t border-border space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    navigate(`/dashboard/profile/${user.id}`);
                    setSidebarOpen(false);
                  }}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    navigate('/dashboard/settings');
                    setSidebarOpen(false);
                  }}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}
      >
        <div className="pt-16 lg:pt-16 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation - New Modern Style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <motion.div 
          layout
          className="bg-card/95 backdrop-blur-xl border-t border-border rounded-t-[30px] shadow-elevated-lg overflow-hidden"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        >
          <AnimatePresence mode="popLayout">
            {showFabMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Top Row: Pitch Options (Buttons) */}
                <div className="flex items-center justify-between gap-2 px-4 pt-4">
                  <Button
                    variant="ghost"
                    className="flex-1 flex flex-col gap-1 h-auto py-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/dashboard/pitches/upload');
                      setShowFabMenu(false);
                    }}
                  >
                    <Video className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-medium opacity-70">Upload</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="flex-1 flex flex-col gap-1 h-auto py-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/dashboard/pitches');
                      setShowFabMenu(false);
                    }}
                  >
                    <Play className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-medium opacity-70">Watch</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex-1 flex flex-col gap-1 h-auto py-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/dashboard/pitches/my');
                      setShowFabMenu(false);
                    }}
                  >
                    <ListVideo className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-medium opacity-70">My Pitches</span>
                  </Button>
                </div>

                {/* Middle Row: Search Bar */}
                <div 
                  className="h-10 bg-secondary rounded-xl flex items-center px-4 gap-2 text-muted-foreground text-sm cursor-pointer hover:bg-secondary/80 transition-colors mx-4 mt-4 mb-2 border border-border"
                  onClick={() => {
                    navigate('/dashboard/network');
                    setShowFabMenu(false);
                  }}
                >
                  <Search className="h-4 w-4" />
                  <span className="opacity-70">Type To Search...</span>
                </div>
                
                <div className="h-px bg-border mx-4 my-1" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Row: Icons */}
          <div className="flex items-center justify-between px-6 py-3 relative">
            
            {/* Home */}
            <div className="relative">
              {location.pathname === '/dashboard' && (
                <motion.div
                  layoutId="active-nav-ring"
                  className="absolute inset-0 -m-1.5 border border-primary/50 bg-primary/10 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative z-10 hover:bg-transparent h-10 w-10", 
                  location.pathname === '/dashboard' ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => navigate('/dashboard')}
              >
                 <Home className="h-5 w-5" />
              </Button>
            </div>

            {/* Network */}
            <div className="relative">
              {location.pathname.startsWith('/dashboard/network') && (
                <motion.div
                  layoutId="active-nav-ring"
                  className="absolute inset-0 -m-1.5 border border-primary/50 bg-primary/10 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative z-10 hover:bg-transparent h-10 w-10", 
                  location.pathname.startsWith('/dashboard/network') ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => navigate('/dashboard/network')}
              >
                 <Network className="h-5 w-5" />
              </Button>
            </div>

            {/* Center FAB (Toggle Menu) */}
            <div className="relative">
               <motion.div
                 animate={{ rotate: showFabMenu ? 45 : 0 }}
                 className="relative z-10"
               >
                 <Button
                   className={cn(
                     "h-10 w-10 rounded-xl shadow-lg flex items-center justify-center transition-all",
                     showFabMenu ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
                   )}
                   onClick={handleFabClick}
                 >
                   <Plus className="h-5 w-5" />
                 </Button>
               </motion.div>
            </div>

            {/* Messages */}
            <div className="relative">
              {location.pathname.startsWith('/dashboard/messages') && (
                <motion.div
                  layoutId="active-nav-ring"
                  className="absolute inset-0 -m-1.5 border border-primary/50 bg-primary/10 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative z-10 hover:bg-transparent h-10 w-10", 
                  location.pathname.startsWith('/dashboard/messages') ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => navigate('/dashboard/messages')}
              >
                 <MessageSquare className="h-5 w-5" />
              </Button>
            </div>

            {/* Profile */}
            <div className="relative">
              {location.pathname.startsWith('/dashboard/profile') && (
                <motion.div
                  layoutId="active-nav-ring"
                  className="absolute inset-0 -m-1.5 border border-primary/50 bg-primary/10 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative z-10 hover:bg-transparent h-10 w-10", 
                  location.pathname.startsWith('/dashboard/profile') ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => navigate(`/dashboard/profile/${user.id}`)}
              >
                 <User className="h-5 w-5" />
              </Button>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardLayout;
