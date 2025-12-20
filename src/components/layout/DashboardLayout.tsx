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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Home, 
  MessageSquare, 
  Heart, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Rocket,
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
  ListVideo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

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

const navItems: NavItem[] = [
  { icon: Home, label: 'Feed', path: '/dashboard' },
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
  { icon: Heart, label: 'Match', path: '/dashboard/match' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages' },
  { icon: Calendar, label: 'Bookings', path: '/dashboard/bookings' },
  { icon: Building2, label: 'Startups', path: '/dashboard/startups' },
  { icon: TrendingUp, label: 'Investors', path: '/dashboard/investors' },
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [openSubmenu, setOpenSubmenu] = useState<string | null>('Pitches');
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null; title: string | null } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

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
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, title, onboarding_completed')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
          if (!data.onboarding_completed) {
            navigate('/onboarding');
          }
        } else {
          navigate('/onboarding');
        }
      };

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

      fetchProfile();
      fetchNotifications();
      fetchRecentMessages();

      const channel = supabase
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

      return () => {
        supabase.removeChannel(channel);
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card transition-all duration-300",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <div 
          className={cn(
            "flex items-center gap-2 px-4 py-4 border-b border-border cursor-pointer",
            sidebarCollapsed && "justify-center px-2"
          )}
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && <span className="text-lg font-bold">CampusLaunch</span>}
        </div>

        <nav className={cn("flex-1 py-6 space-y-1 overflow-y-auto", sidebarCollapsed ? "px-2" : "px-3")}>
          {navItems.map((item) => (
            item.submenu && !sidebarCollapsed ? (
              <Collapsible
                key={item.path}
                open={openSubmenu === item.label}
                onOpenChange={(open) => setOpenSubmenu(open ? item.label : null)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant={isPathActive(item.path, item.submenu) ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-between',
                      isPathActive(item.path, item.submenu) && 'bg-secondary'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      openSubmenu === item.label && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Button
                      key={subItem.path}
                      variant={location.pathname === subItem.path ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start gap-3',
                        location.pathname === subItem.path && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => navigate(subItem.path)}
                    >
                      <subItem.icon className="h-4 w-4" />
                      {subItem.label}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : sidebarCollapsed ? (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isPathActive(item.path, item.submenu) ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      'w-full',
                      isPathActive(item.path, item.submenu) && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => navigate(item.submenu ? item.submenu[0].path : item.path)}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  location.pathname === item.path && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            )
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>

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
                    <span className="truncate text-sm font-medium">{profile?.full_name || 'User'}</span>
                    {profile?.title && (
                      <span className="text-xs text-muted-foreground truncate">{profile.title}</span>
                    )}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
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
          "hidden lg:flex items-center justify-end h-16 px-6 border-b border-border bg-card fixed top-0 right-0 z-40 transition-all duration-300",
          sidebarCollapsed ? "left-16" : "left-64"
        )}
      >
        <div className="flex items-center gap-2">
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
            <DropdownMenuContent align="end" className="w-80 bg-popover">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
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
                        'px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors',
                        !notification.is_read && 'bg-primary/5'
                      )}
                      onClick={() => markNotificationAsRead(notification.id)}
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
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {profile?.full_name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.title || 'Member'}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-bold">CampusLaunch</span>
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
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-card z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Rocket className="h-6 w-6 text-primary" />
                  <span className="font-bold">CampusLaunch</span>
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
                    <p className="font-medium">{profile?.full_name || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{profile?.title || 'Member'}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  item.submenu ? (
                    <Collapsible
                      key={item.path}
                      open={openSubmenu === item.label}
                      onOpenChange={(open) => setOpenSubmenu(open ? item.label : null)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant={isPathActive(item.path, item.submenu) ? 'secondary' : 'ghost'}
                          className="w-full justify-between"
                        >
                          <span className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            {item.label}
                          </span>
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform",
                            openSubmenu === item.label && "rotate-180"
                          )} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Button
                            key={subItem.path}
                            variant={location.pathname === subItem.path ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                              'w-full justify-start gap-3',
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
                  ) : (
                    <Button
                      key={item.path}
                      variant={location.pathname === item.path ? 'default' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3',
                        location.pathname === item.path && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  )
                ))}
              </nav>

              <div className="p-4 border-t border-border space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    navigate('/dashboard/profile');
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
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <div className="pt-16 lg:pt-16">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.filter(item => !item.submenu).slice(0, 4).map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={cn(
                'flex-col gap-1 h-auto py-2 px-2',
                location.pathname === item.path && 'text-primary'
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex-col gap-1 h-auto py-2 px-2',
              location.pathname.startsWith('/dashboard/pitches') && 'text-primary'
            )}
            onClick={() => navigate('/dashboard/pitches')}
          >
            <Video className="h-5 w-5" />
            <span className="text-[10px]">Pitches</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;