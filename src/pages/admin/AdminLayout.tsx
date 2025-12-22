import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Rocket, 
  ShieldCheck, 
  LogOut,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

  import { supabase } from '@/integrations/supabase/client';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth !== 'true') {
      navigate('/admin/login');
    }
    
    // Fetch pending count
    const fetchPending = async () => {
      const { count } = await supabase
        .from('verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (count !== null) setPendingCount(count);
    };

    fetchPending();

    // Optional: Realtime subscription could go here
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Startups', icon: Rocket, path: '/admin/startups' },
    { label: 'Verification', icon: ShieldCheck, path: '/admin/verification' },
    { label: 'Mentors', icon: GraduationCap, path: '/admin/mentors' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 border-b border-white/10 flex items-center justify-between px-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span>Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Admin</h1>
              <span className="text-xs text-muted-foreground">Control Center</span>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-between mb-1 font-medium",
                      isActive ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    {item.label === 'Verification' && pendingCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 border-red-500/20 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)] lg:h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
