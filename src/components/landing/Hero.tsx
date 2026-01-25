import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Star, Rocket, TrendingUp, CheckCircle2, Sparkles, Play, Users, Building2 } from "lucide-react";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const floatingCardsRef = useRef<HTMLDivElement>(null);
  const brandsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Headline word animation
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.word');
        tl.from(words, {
          opacity: 0,
          y: 80,
          rotationX: -60,
          stagger: 0.08,
          duration: 1,
        });
      }

      tl.from(subtitleRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
      }, "-=0.5");

      tl.from(ctaRef.current?.children || [], {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.6,
      }, "-=0.4");

      tl.from(mockupRef.current, {
        opacity: 0,
        y: 60,
        scale: 0.95,
        duration: 1.2,
        ease: "power2.out",
      }, "-=0.6");

      if (floatingCardsRef.current) {
        const cards = floatingCardsRef.current.querySelectorAll('.floating-element');
        tl.from(cards, {
          opacity: 0,
          scale: 0.8,
          y: 40,
          stagger: 0.12,
          duration: 0.8,
          ease: "back.out(1.7)",
        }, "-=0.8");
      }

      // Brands animation
      if (brandsRef.current) {
        tl.from(brandsRef.current.children, {
          opacity: 0,
          y: 20,
          stagger: 0.1,
          duration: 0.6,
        }, "-=0.4");
      }

      // Continuous floating animation
      gsap.to(".floating-element", {
        y: -12,
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.4,
      });

      // Subtle rotation on decorative elements
      gsap.to(".rotate-element", {
        rotation: 360,
        duration: 30,
        ease: "none",
        repeat: -1,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <section ref={heroRef} className="relative min-h-screen pt-28 pb-16 overflow-hidden">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50/50" />
      
      {/* Dot pattern background */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      
      {/* Decorative circles */}
      <div className="absolute top-32 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      {/* Decorative geometric shapes */}
      <motion.div 
        className="absolute top-40 left-20 w-3 h-3 rounded-full bg-accent/40"
        animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div 
        className="absolute top-60 right-32 w-4 h-4 rounded-full bg-primary/30"
        animate={{ y: [0, 15, 0], scale: [1, 0.9, 1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />
      <motion.div 
        className="absolute bottom-40 left-1/3 w-2 h-2 rounded-full bg-accent/50"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Main Hero Content */}
        <div className="text-center max-w-5xl mx-auto mb-16">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200/60 rounded-full mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="text-sm font-medium text-emerald-700">
              Join 500+ University Founders & Investors
            </span>
          </motion.div>

          {/* Headline */}
          <h1 ref={headlineRef} className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.08] mb-8 tracking-tight">
            <span className="word inline-block">Build</span>{" "}
            <span className="word inline-block">your</span>{" "}
            <span className="word inline-block text-gradient-accent">startup</span>{" "}
            <span className="word inline-block text-gradient-accent">network</span>
            <br className="hidden md:block" />
            <span className="word inline-block">with</span>{" "}
            <span className="word inline-block">the</span>{" "}
            <span className="word inline-block">right</span>{" "}
            <span className="word inline-block font-light text-muted-foreground">people.</span>
          </h1>

          {/* Subtitle */}
          <p ref={subtitleRef} className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
            Using SheraStartup you can connect with <span className="text-foreground font-medium">investors, mentors, and co-founders</span> from 
            top universities worldwide, enabling you to build and launch successfully.
          </p>

          {/* CTA Section */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-lg border border-border/60 w-full sm:w-auto">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-0 bg-transparent focus:ring-0 focus-visible:ring-0 text-base min-w-[240px] placeholder:text-muted-foreground/60"
              />
              <Button variant="hero" className="whitespace-nowrap rounded-xl px-6" asChild>
                <Link to="/auth">
                  Try it for free
                </Link>
              </Button>
            </div>
            
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
              <span className="w-10 h-10 rounded-full bg-white shadow-md border border-border/50 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                <Play className="w-4 h-4 ml-0.5" />
              </span>
              <span className="text-sm font-medium">Watch demo</span>
            </button>
          </div>

          {/* Trust indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center justify-center gap-3 text-sm text-muted-foreground"
          >
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span>Trusted & used by the biggest community. <span className="text-foreground font-medium">10K founders</span>, to be exact.</span>
          </motion.div>
        </div>

        {/* Brand logos section */}
        <div ref={brandsRef} className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-20 opacity-60">
          {['BUET', 'BRAC University', 'NSU', 'DU', 'IUT', 'AIUB'].map((brand, i) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground/80 font-semibold text-sm tracking-wide">
              <Building2 className="w-4 h-4" />
              {brand}
            </div>
          ))}
        </div>

        {/* Hero Visual - Dashboard Mockup */}
        <div ref={mockupRef} className="relative max-w-5xl mx-auto">
          {/* Main Dashboard Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-border/40 overflow-hidden">
            {/* Browser Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-border/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-white rounded-lg text-xs text-muted-foreground border border-border/50">
                  sherastartup.app/dashboard
                </div>
              </div>
            </div>
            
            {/* Dashboard Content */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50/50 to-white">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Left Stats */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-5 shadow-soft border border-border/30">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground font-medium">Total Connections</span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">+24%</span>
                    </div>
                    <p className="text-4xl font-bold text-foreground">1,248</p>
                    <div className="flex items-end gap-1 mt-4 h-10">
                      {[40, 65, 45, 80, 55, 75, 60, 90, 70, 85].map((h, i) => (
                        <div 
                          key={i}
                          className="flex-1 bg-accent/20 rounded-sm hover:bg-accent/40 transition-colors"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-dark rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <Rocket className="w-5 h-5" />
                      <span className="font-semibold">Quick Actions</span>
                    </div>
                    <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors">
                      Upload Pitch Deck →
                    </button>
                  </div>
                </div>

                {/* Center - Activity Feed */}
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-border/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-foreground">Recent Activity</span>
                    <span className="text-xs text-accent font-medium cursor-pointer hover:underline">View all</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: "🎉", text: "Funding secured - $250K", time: "2h ago", highlight: true },
                      { icon: "👋", text: "New mentor connection", time: "5h ago" },
                      { icon: "📊", text: "Pitch viewed 150 times", time: "1d ago" },
                      { icon: "⭐", text: "Featured in top startups", time: "2d ago" },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.highlight ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-slate-50'}`}>
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.text}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right - Profile & Stats */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-5 shadow-soft border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center text-white font-bold">
                        SA
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Sakib Ahmed</p>
                        <p className="text-sm text-muted-foreground">Founder @TechStart</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <p className="text-lg font-bold text-foreground">52</p>
                        <p className="text-xs text-muted-foreground">Investors</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <p className="text-lg font-bold text-foreground">18</p>
                        <p className="text-xs text-muted-foreground">Mentors</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/10 rounded-2xl p-5 border border-accent/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-accent" />
                      <span className="font-semibold text-foreground">Trending</span>
                    </div>
                    <div className="space-y-2">
                      {['#AIStartups', '#FinTech', '#EdTech'].map((tag, i) => (
                        <span key={i} className="inline-block mr-2 px-3 py-1 bg-white rounded-full text-sm text-foreground border border-border/50">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div ref={floatingCardsRef} className="absolute inset-0 pointer-events-none">
            {/* Top right - Stats popup */}
            <div className="floating-element absolute -top-6 -right-6 md:right-8 bg-white rounded-2xl p-4 shadow-xl border border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">$29M+</p>
                  <p className="text-xs text-muted-foreground">Total funding raised</p>
                </div>
              </div>
            </div>

            {/* Left side - Users card */}
            <div className="floating-element absolute top-1/3 -left-4 md:-left-10 bg-white rounded-2xl p-4 shadow-xl border border-border/40">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: `hsl(${160 + i * 25} 60% 55%)` }}
                    />
                  ))}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Active Now</p>
                  <p className="text-xs text-muted-foreground">248 founders online</p>
                </div>
              </div>
            </div>

            {/* Bottom - Rating card */}
            <div className="floating-element absolute -bottom-4 left-1/4 bg-gradient-dark rounded-2xl p-4 shadow-xl text-white">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">4.9</span>
                <span className="text-white/70 text-sm">(2.4k reviews)</span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="rotate-element absolute top-20 right-1/4 w-16 h-16 border-2 border-dashed border-accent/20 rounded-full" />
            <div className="absolute bottom-1/4 right-10 w-3 h-3 bg-accent rounded-full opacity-50" />
          </div>
        </div>
      </div>
    </section>
  );
}
