import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/common/NotificationBell";
import { Rocket, Menu, X, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navLinks = [
  { label: "Services", href: "#features", hasDropdown: true },
  { label: "How it works", href: "#how-it-works" },
  { label: "About us", href: "#about" },
];

const rightNavLinks = [
  { label: "Agents", href: "#agents" },
  { label: "Projects", href: "#projects" },
  { label: "Affiliates", href: "#affiliates" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-card/95 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container px-4 md:px-6">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Left Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
              >
                {link.label}
                {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
              </a>
            ))}
          </div>

          {/* Logo - Center */}
          <Link to="/" className="flex items-center gap-2 group lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            <div className="w-9 h-9 rounded-xl bg-gradient-purple flex items-center justify-center transition-transform group-hover:scale-105 shadow-purple">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">SheraStartup</span>
          </Link>

          {/* Right Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {rightNavLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
              >
                {link.label}
              </a>
            ))}
            
            {user ? (
              <div className="flex items-center gap-2 ml-4">
                <NotificationBell />
                <Button size="sm" className="bg-gradient-purple text-white shadow-sm" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button size="sm" className="bg-gradient-purple text-white shadow-sm" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in bg-card">
            <div className="flex flex-col gap-2">
              {[...navLinks, ...rightNavLinks].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                {user ? (
                  <>
                    <Button className="justify-start bg-gradient-purple text-white" asChild>
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
                    <Button className="bg-gradient-purple text-white" asChild>
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started
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