import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Bell, Users, TrendingUp } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const CTASection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate content
      gsap.from(".cta-content", {
        scrollTrigger: {
          trigger: ".cta-content",
          start: "top 80%",
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
      });

      // Animate phone mockup
      gsap.from(".cta-phone", {
        scrollTrigger: {
          trigger: ".cta-phone",
          start: "top 80%",
        },
        opacity: 0,
        x: -60,
        rotation: -5,
        duration: 1,
        ease: "power2.out",
      });

      // Animate floating elements
      gsap.from(".cta-float", {
        scrollTrigger: {
          trigger: ".cta-phone",
          start: "top 70%",
        },
        opacity: 0,
        scale: 0.8,
        stagger: 0.15,
        duration: 0.6,
        ease: "back.out(1.7)",
      });

      // Continuous float animation
      gsap.to(".cta-float", {
        y: -8,
        duration: 2.5,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.2,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-subtle relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Phone Mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="cta-phone phone-mockup w-[320px] mx-auto transform -rotate-6">
              <div className="phone-screen aspect-[9/19] p-4">
                {/* App UI */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Rocket className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Bell className="w-4 h-4 text-foreground" />
                    </div>
                  </div>
                </div>

                {/* Brand New Card */}
                <div className="bg-gradient-to-br from-green-400 to-cyan-500 rounded-2xl p-4 mb-4 text-white">
                  <p className="text-sm opacity-90">Brand New</p>
                  <h3 className="font-bold text-lg">Website Design</h3>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-white/50 bg-white/30"
                        />
                      ))}
                    </div>
                    <span className="text-xs opacity-80">+12 more</span>
                  </div>
                </div>

                {/* Progress Card */}
                <div className="bg-white rounded-2xl p-4 shadow-soft border border-border/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-medium text-primary">75%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-gradient-primary h-2 rounded-full w-3/4" />
                  </div>
                </div>

                {/* Complete Button */}
                <div className="mt-4">
                  <button className="w-full py-3 bg-gradient-primary rounded-xl text-white font-medium shadow-purple">
                    Complete
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="cta-float absolute top-0 -right-4 bg-white rounded-2xl p-3 shadow-soft-lg border border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Growth</p>
                  <p className="font-bold text-sm text-foreground">+24.5%</p>
                </div>
              </div>
            </div>

            <div className="cta-float absolute bottom-20 -right-8 bg-gradient-primary rounded-2xl p-4 shadow-purple text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-bold">2.4k</span>
              </div>
              <p className="text-xs opacity-80 mt-1">Active users</p>
            </div>
          </div>

          {/* Right - Content */}
          <div className="cta-content order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
              Ready? Let's Start with{" "}
              <span className="text-gradient">SheraStartup</span>{" "}
              and Get Awesome Experience
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Define unique value states for each team. User can define the steps, rules 
              and actions that make up their custom workflow. User can define the stages, 
              steps, and actions that make up their custom workflow.
            </p>

            <Link to="/auth">
              <Button size="lg" className="rounded-full bg-gradient-accent shadow-orange hover:shadow-orange hover:-translate-y-0.5 transition-all text-lg px-8 h-14">
                Learn More
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
