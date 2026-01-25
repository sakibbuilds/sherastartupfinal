import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Star, Users, Rocket, TrendingUp, CheckCircle2, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const { user } = useAuth();
  
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const floatingCardsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.word');
        tl.from(words, {
          opacity: 0,
          y: 60,
          rotationX: -40,
          stagger: 0.1,
          duration: 0.8,
        });
      }

      tl.from(subtitleRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.6,
      }, "-=0.4");

      tl.from(ctaRef.current?.children || [], {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5,
      }, "-=0.3");

      tl.from(statsRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.5,
      }, "-=0.2");

      tl.from(mockupRef.current, {
        opacity: 0,
        x: 100,
        scale: 0.9,
        duration: 1,
        ease: "power2.out",
      }, "-=0.8");

      if (floatingCardsRef.current) {
        const cards = floatingCardsRef.current.children;
        tl.from(cards, {
          opacity: 0,
          scale: 0.8,
          y: 30,
          stagger: 0.15,
          duration: 0.6,
        }, "-=0.6");
      }

      gsap.to(".floating-card", {
        y: -10,
        duration: 2,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      
      {/* Decorative lines */}
      <div className="absolute top-40 left-10 w-32 h-32 border-l-2 border-t-2 border-primary/10 rounded-tl-3xl" />
      <div className="absolute bottom-40 right-10 w-32 h-32 border-r-2 border-b-2 border-accent/10 rounded-br-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-soft border border-border/50 mb-8">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">
                #1 University Startup Platform
              </span>
            </div>

            <h1 ref={headlineRef} className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6">
              <span className="word inline-block">Maximize</span>{" "}
              <span className="word inline-block">Your</span>{" "}
              <span className="word inline-block text-gradient">Startup</span>{" "}
              <span className="word inline-block text-gradient">Potential</span>
            </h1>

            <p ref={subtitleRef} className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
              Connect with investors, mentors, and co-founders. Launch your university startup with the tools and network you need to succeed.
            </p>

            <div ref={ctaRef} className="flex flex-wrap items-center gap-4 mb-10">
              <Link to="/auth">
                <Button variant="hero" className="group">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              {/* Trust badge */}
              <div className="flex items-center gap-3 px-5 py-3 bg-card rounded-xl shadow-soft border border-border/50">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="font-semibold text-foreground">4.9</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(2.4k reviews)</span>
              </div>
            </div>

            {/* Stats bar */}
            <div ref={statsRef} className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-medium shadow-soft"
                      style={{ 
                        backgroundColor: `hsl(${160 + i * 15} ${70 + i * 5}% ${40 + i * 5}%)`
                      }}
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-foreground">Trusted by founders at</p>
                  <p className="text-accent font-bold">500+ universities 🎉</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div ref={mockupRef} className="relative flex justify-center lg:justify-end">
            {/* Main Phone */}
            <div className="phone-mockup w-[320px] relative z-10">
              <div className="phone-screen aspect-[9/19] p-4">
                {/* App Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-dark flex items-center justify-center">
                      <Rocket className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-foreground text-sm">SheraStartup</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs">👋</span>
                  </div>
                </div>

                {/* Welcome Card */}
                <div className="bg-gradient-dark rounded-2xl p-4 mb-4 text-white">
                  <p className="text-sm opacity-90">Hello, Sakib Ahmed 👋</p>
                  <h3 className="font-bold text-lg mt-1">Your Startup Dashboard</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">Explore →</div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-card rounded-xl p-3 shadow-soft border border-border/30">
                    <p className="text-xs text-muted-foreground">Connections</p>
                    <p className="font-bold text-lg text-foreground">248</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-accent" />
                      <span className="text-xs text-accent font-medium">+12%</span>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl p-3 shadow-soft border border-border/30">
                    <p className="text-xs text-muted-foreground">Investors</p>
                    <p className="font-bold text-lg text-foreground">52</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-accent" />
                      <span className="text-xs text-accent font-medium">+8%</span>
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="bg-card rounded-2xl p-4 shadow-soft border border-border/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-foreground">Recent Activity</h4>
                    <span className="text-xs text-accent font-medium">View all</span>
                  </div>
                  {[
                    { title: "Pitch uploaded", status: "done" },
                    { title: "Mentor session", status: "pending" },
                    { title: "Investor meeting", status: "pending" },
                  ].map((task, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                      <CheckCircle2 className={`w-4 h-4 ${task.status === "done" ? "text-accent" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium text-foreground flex-1">{task.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        task.status === "done" 
                          ? "bg-accent/10 text-accent" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div ref={floatingCardsRef} className="absolute inset-0 pointer-events-none">
              {/* Custom Workflow Card */}
              <div className="floating-card absolute -left-20 top-20 bg-card rounded-2xl p-4 shadow-soft-lg border border-border/40 w-48">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">Smart Analytics</h4>
                <p className="text-xs text-muted-foreground mt-1">Track your startup growth in real-time</p>
                <div className="flex items-end gap-1 mt-3 h-8">
                  {[30, 45, 25, 60, 40, 70, 50].map((h, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-accent/20 rounded-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Multi-team Card */}
              <div className="floating-card absolute -left-16 bottom-32 bg-card rounded-2xl p-4 shadow-soft-lg border border-border/40 w-52" style={{ animationDelay: "0.3s" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-sm text-foreground">Team Network</h4>
                </div>
                <p className="text-xs text-muted-foreground">Connect with founders across universities</p>
                <div className="flex -space-x-2 mt-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-card shadow-soft"
                      style={{ 
                        backgroundColor: `hsl(${160 + i * 20} ${60 + i * 5}% ${45 + i * 5}%)`
                      }}
                    />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-card bg-accent/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-accent">5+</span>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="floating-card absolute right-0 top-8 bg-card rounded-2xl p-4 shadow-soft-lg border border-border/40" style={{ animationDelay: "0.6s" }}>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gradient-accent">29M+</p>
                  <p className="text-xs text-muted-foreground mt-1">Funding raised</p>
                </div>
              </div>

              {/* Success Card */}
              <div className="floating-card absolute right-4 bottom-20 bg-gradient-dark rounded-2xl p-4 shadow-navy text-white w-40" style={{ animationDelay: "0.9s" }}>
                <p className="text-2xl font-bold">1.2K+</p>
                <p className="text-xs opacity-90 mt-1">Startups launched successfully</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
