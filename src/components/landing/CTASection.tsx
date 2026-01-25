import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Rocket, TrendingUp, CheckCircle, Sparkles, DollarSign } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

export const CTASection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Main content animation
      gsap.from(".cta-content", {
        scrollTrigger: {
          trigger: ".cta-content",
          start: "top 80%",
        },
        opacity: 0,
        y: 60,
        duration: 1,
        ease: "power3.out",
      });

      // Visual side animation
      gsap.from(".cta-visual", {
        scrollTrigger: {
          trigger: ".cta-visual",
          start: "top 80%",
        },
        opacity: 0,
        x: 60,
        duration: 1,
        ease: "power3.out",
      });

      // Floating cards
      gsap.from(".cta-float", {
        scrollTrigger: {
          trigger: ".cta-visual",
          start: "top 75%",
        },
        opacity: 0,
        scale: 0.8,
        stagger: 0.15,
        duration: 0.7,
        ease: "back.out(1.7)",
      });

      gsap.to(".cta-float", {
        y: -10,
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { value: "$50M+", label: "Funding raised" },
    { value: "10K+", label: "Active founders" },
    { value: "500+", label: "Universities" },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      {/* Dot pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Left Content */}
          <div className="cta-content">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Upfront cash flow to fund your growth</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
              <span className="text-gradient-accent">Upfront cash flow</span> to fund<br />
              your growth
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Receive up to a year of upfront capital immediately, giving you the flexible 
              funding you need to grow your business and scale.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-4 bg-white rounded-2xl border border-border/40 shadow-sm">
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <Link to="/auth">
              <Button variant="hero" size="lg" className="group">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Right Visual */}
          <div className="cta-visual relative">
            {/* Main card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-border/40 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Your Runway</p>
                  <h3 className="text-3xl font-bold text-foreground">$850,000</h3>
                </div>
                <div className="px-3 py-1.5 bg-accent/10 rounded-full">
                  <span className="text-sm font-medium text-accent">+24% MoM</span>
                </div>
              </div>

              {/* Progress visualization */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Funding Progress</span>
                  <span className="text-sm font-medium text-foreground">85%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-accent rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "85%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-3">
                {[
                  { icon: "✓", text: "Seed round closed", status: "complete" },
                  { icon: "🎯", text: "Series A target", status: "progress" },
                  { icon: "🚀", text: "Global expansion", status: "upcoming" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                    item.status === 'complete' ? 'bg-emerald-50 border border-emerald-100' :
                    item.status === 'progress' ? 'bg-amber-50 border border-amber-100' :
                    'bg-slate-50 border border-slate-100'
                  }`}>
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                    {item.status === 'complete' && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                    )}
                  </div>
                ))}
              </div>

              {/* Background decoration */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/5 rounded-full" />
            </div>

            {/* Floating elements */}
            <div className="cta-float absolute -top-4 -right-4 bg-gradient-dark rounded-2xl p-4 text-white shadow-xl">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold">+127%</span>
              </div>
              <p className="text-xs text-white/70 mt-1">Growth rate</p>
            </div>

            <div className="cta-float absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Revenue</p>
                  <p className="text-xs text-muted-foreground">$1.2M ARR</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA strip */}
        <motion.div 
          className="mt-24 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-gradient-dark rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Forget about paying large bills. <span className="text-accent">Spread the payments.</span>
              </h3>
              <p className="text-white/70 mb-8 max-w-lg mx-auto">
                Join thousands of founders who are scaling smarter with SheraStartup.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2 w-full sm:w-auto">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-0 bg-transparent text-white placeholder:text-white/50 focus:ring-0 focus-visible:ring-0 min-w-[200px]"
                  />
                  <Button className="bg-accent hover:bg-accent/90 text-white rounded-lg px-6">
                    Get Started
                  </Button>
                </div>
              </div>
            </div>

            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
