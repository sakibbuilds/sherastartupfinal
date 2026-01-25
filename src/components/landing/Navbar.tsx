import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/common/NotificationBell";
import { Rocket, Menu, X, LayoutDashboard, LogOut, ChevronDown, Users, Building2, GraduationCap, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";

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
          stagger: 0.08,
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

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "#" },
    { label: "Features", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "Testimonials", href: "#" },
    { label: "Help", href: "#" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-border/50 shadow-sm py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container px-4 md:px-6">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link ref={logoRef} to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-dark flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Shera<span className="text-accent">Startup</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div ref={linksRef} className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <Link 
                key={link.label}
                to={link.href} 
                className={cn(
                  "text-sm font-medium transition-colors",
                  i === 0 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <Button variant="ghost" className="font-medium" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="font-medium text-muted-foreground hover:text-foreground" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button className="font-medium px-6 rounded-xl bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25" asChild>
                  <Link to="/auth">
                    Free Trial
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden mt-4 py-6 border-t border-border overflow-hidden"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.label}
                    to={link.href} 
                    className="text-foreground font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                  {user ? (
                    <>
                      <Button className="w-full bg-accent hover:bg-accent/90" asChild>
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
                      <Button className="w-full bg-accent hover:bg-accent/90" asChild>
                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                          Free Trial
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
