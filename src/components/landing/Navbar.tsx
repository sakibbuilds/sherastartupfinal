import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/common/NotificationBell";
import { Rocket, Menu, X, LayoutDashboard, LogOut, HelpCircle, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        isScrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border"
          : "bg-background"
      )}
    >
      <div className="container px-4 md:px-6">
        <nav className="flex items-center justify-between h-14">
          {/* Logo - Left */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-sm font-medium text-muted-foreground">VC</span>
            <span className="text-base font-bold tracking-tight text-foreground">shera/startups</span>
          </Link>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
              <HelpCircle className="w-4 h-4" />
              Help
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Sort
            </Button>
            
            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <NotificationBell />
                <Button size="sm" className="bg-primary text-primary-foreground" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground" asChild>
                  <Link to="/auth">Submit Startup</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="justify-start gap-2">
                <HelpCircle className="w-4 h-4" />
                Help
              </Button>
              <Button variant="ghost" className="justify-start gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Sort
              </Button>
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                {user ? (
                  <>
                    <Button className="justify-start bg-primary text-primary-foreground" asChild>
                      <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button className="bg-primary text-primary-foreground" asChild>
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        Submit Startup
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
