import { useEffect, useRef } from "react";
import { Database, Paperclip, Users2, Calendar, Clock, Shield, Zap, Globe } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const FeaturesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".features-heading", {
        scrollTrigger: {
          trigger: ".features-heading",
          start: "top 80%",
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: ".features-grid",
          start: "top 75%",
        },
        opacity: 0,
        y: 50,
        stagger: 0.15,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.from(".features-mockup", {
        scrollTrigger: {
          trigger: ".features-mockup",
          start: "top 80%",
        },
        opacity: 0,
        x: -50,
        duration: 1,
        ease: "power2.out",
      });

      gsap.from(".features-float-card", {
        scrollTrigger: {
          trigger: ".features-mockup",
          start: "top 70%",
        },
        opacity: 0,
        scale: 0.8,
        stagger: 0.2,
        duration: 0.6,
        ease: "back.out(1.7)",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Verified Network",
      description: "Connect with verified founders, mentors, and investors from top universities.",
    },
    {
      icon: Zap,
      title: "Smart Matching",
      description: "AI-powered matching connects you with the right people for your startup journey.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access a network of entrepreneurs and investors from 500+ universities worldwide.",
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Mockup */}
          <div className="features-mockup relative">
            {/* Phone mockup */}
            <div className="phone-mockup w-[300px] mx-auto lg:mx-0">
              <div className="phone-screen aspect-[9/19] p-4 flex flex-col">
                {/* Task Cards */}
                <div className="space-y-3 flex-1">
                  <div className="bg-accent/10 rounded-xl p-3 border border-accent/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-accent flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-xs font-medium text-foreground">Pitch Deck Review Complete</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>AI Startup</span>
                      <div className="flex -space-x-1">
                        {[1, 2, 3].map((i) => (
                          <div 
                            key={i}
                            className="w-5 h-5 rounded-full border border-card"
                            style={{ backgroundColor: `hsl(${160 + i * 20} 60% 45%)` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-3 shadow-soft border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xs">◆</span>
                      </div>
                      <span className="text-xs font-medium text-foreground">Investor Meeting Scheduled</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Tomorrow at 2:00 PM</p>
                  </div>

                  <div className="bg-card rounded-xl p-3 shadow-soft border border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                        <span className="text-accent text-xs">★</span>
                      </div>
                      <span className="text-xs font-medium text-foreground">New Mentor Connection</span>
                    </div>
                  </div>
                </div>

                {/* Mini chart at bottom */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-end gap-1 h-12">
                    {[40, 60, 35, 80, 55, 75, 45, 65, 50, 70].map((h, i) => (
                      <div 
                        key={i}
                        className="flex-1 bg-gradient-accent rounded-sm opacity-70"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="features-float-card absolute -right-4 top-20 bg-card rounded-2xl p-4 shadow-soft-lg border border-border w-52">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-semibold text-sm text-foreground">Mentor Session</p>
                  <p className="text-xs text-muted-foreground">Today at 3:00 PM</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-accent/10 rounded-full text-xs font-medium text-accent">Growth Strategy</span>
                <span className="text-xs text-muted-foreground">3 Topics</span>
              </div>
            </div>

            <div className="features-float-card absolute -right-8 bottom-24 bg-card rounded-2xl p-4 shadow-soft-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Connections</p>
                  <p className="font-bold text-xl text-foreground">1,248 <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">+24%</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <div className="features-heading mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Everything You Need to{" "}
                <span className="text-gradient-accent">Launch & Scale</span>
              </h2>
            </div>

            <div className="features-grid space-y-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="feature-card flex items-start gap-4 p-5 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors border border-border/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-dark flex items-center justify-center shrink-0 shadow-navy">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
