import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/common/NotificationBell";
import { Rocket, Menu, X, LayoutDashboard, LogOut, ChevronDown, Users, Building2, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { gsap } from "gsap";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const logoRef = useRef<HTMLAnchorElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Animate navbar elements on mount
    const ctx = gsap.context(() => {
      gsap.from(logoRef.current, {
        opacity: 0,
        x: -20,
        duration: 0.6,
        ease: "power3.out",
      });

      if (linksRef.current) {
        gsap.from(linksRef.current.children, {
          opacity: 0,
          y: -10,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.2,
        });
      }
    });

    return () => ctx.revert();
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

  const services = [
    { icon: Rocket, label: "Startups", desc: "Launch & grow your venture" },
    { icon: Users, label: "Mentorship", desc: "Connect with experts" },
    { icon: Building2, label: "Investors", desc: "Find funding partners" },
    { icon: GraduationCap, label: "Universities", desc: "Campus innovation hubs" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-border/50 shadow-soft py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container px-4 md:px-6">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link ref={logoRef} to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-purple transition-transform group-hover:scale-105">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Shera<span className="text-primary">Startup</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div ref={linksRef} className="hidden lg:flex items-center gap-8">
            {/* Services Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-medium"
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
              >
                Services
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              
              <div 
                className={`absolute top-full left-0 pt-4 transition-all duration-300 ${
                  servicesOpen ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
              >
                <div className="bg-white rounded-2xl shadow-soft-lg p-4 min-w-[280px] border border-border/50">
                  {services.map((item) => (
                    <Link
                      key={item.label}
                      to="/dashboard"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors group/item"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              How it works
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              About us
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Agents
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Projects
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <Button className="rounded-full bg-gradient-primary shadow-purple hover:shadow-purple hover:-translate-y-0.5 transition-all" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="rounded-full font-medium" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button className="rounded-full bg-gradient-primary shadow-purple hover:shadow-purple hover:-translate-y-0.5 transition-all font-medium px-6" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"
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
          <div className="lg:hidden mt-4 py-6 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link to="/dashboard" className="text-foreground font-medium py-2">
                Services
              </Link>
              <Link to="/dashboard" className="text-foreground font-medium py-2">
                How it works
              </Link>
              <Link to="/dashboard" className="text-foreground font-medium py-2">
                About us
              </Link>
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                {user ? (
                  <>
                    <Button className="w-full rounded-full bg-gradient-primary shadow-purple" asChild>
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
                        Sign In
                      </Link>
                    </Button>
                    <Button className="w-full rounded-full bg-gradient-primary shadow-purple" asChild>
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
