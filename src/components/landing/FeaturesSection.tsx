import { useEffect, useRef } from "react";
import { RefreshCw, Target, Wallet, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

export const FeaturesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.from(".features-heading", {
        scrollTrigger: {
          trigger: ".features-heading",
          start: "top 85%",
        },
        opacity: 0,
        y: 60,
        duration: 1,
        ease: "power3.out",
      });

      // Feature cards stagger animation
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 80%",
        },
        opacity: 0,
        y: 80,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
      });

      // Data sync section animation
      gsap.from(".sync-content", {
        scrollTrigger: {
          trigger: ".sync-section",
          start: "top 75%",
        },
        opacity: 0,
        x: -60,
        duration: 1,
        ease: "power3.out",
      });

      gsap.from(".sync-visual", {
        scrollTrigger: {
          trigger: ".sync-section",
          start: "top 75%",
        },
        opacity: 0,
        x: 60,
        duration: 1,
        ease: "power3.out",
      });

      // Floating elements
      gsap.to(".feature-float", {
        y: -10,
        duration: 2.5,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: RefreshCw,
      title: "Sync Your Data",
      description: "You offer flexible terms, why not pay with flexibility?",
      color: "bg-blue-50 text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      icon: Target,
      title: "Be Opportunistic",
      description: "Identify the expenses that you'd prefer to pay off gradually.",
      color: "bg-amber-50 text-amber-600",
      iconBg: "bg-amber-100",
    },
    {
      icon: Wallet,
      title: "Preserve Cash",
      description: "Smooth cash flows and avoid large, immediate outlows.",
      color: "bg-emerald-50 text-emerald-600",
      iconBg: "bg-emerald-100",
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="features-heading text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            Split the payments.{" "}
            <span className="font-light text-muted-foreground">Keep the cash.</span>
          </h2>
        </div>

        {/* Feature Cards */}
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-32">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card group"
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="relative bg-white rounded-3xl p-8 border border-border/40 shadow-sm hover:shadow-xl transition-all duration-300 h-full">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.color.split(' ')[1]}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

                {/* Decorative corner */}
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-border/20 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sync Your Data Section */}
        <div className="sync-section grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Left Content */}
          <div className="sync-content">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Smart Integrations</span>
            </div>

            <h3 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
              Sync your{" "}
              <span className="text-gradient-accent">data</span>
            </h3>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We integrate with the biggest banks and accounting services so you can easily connect with us. 
              The only solution for recurring revenue companies that scales at your pace without dilution or debt.
            </p>

            {/* Checklist */}
            <ul className="space-y-4 mb-8">
              {[
                "Automatic bank reconciliation",
                "Real-time financial tracking",
                "Seamless investor updates",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <Button variant="outline" className="rounded-xl group border-accent text-accent hover:bg-accent hover:text-white">
              Learn More
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right Visual */}
          <div className="sync-visual relative">
            {/* Main visual card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 border border-border/40 relative overflow-hidden">
              {/* Integration logos */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {['Bank Connect', 'Analytics', 'Payments', 'Reports'].map((name, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-border/30 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      i % 2 === 0 ? 'bg-accent/10' : 'bg-primary/10'
                    }`}>
                      <span className="text-lg">
                        {i === 0 ? '🏦' : i === 1 ? '📊' : i === 2 ? '💳' : '📈'}
                      </span>
                    </div>
                    <span className="font-medium text-foreground text-sm">{name}</span>
                  </div>
                ))}
              </div>

              {/* Connection lines illustration */}
              <div className="relative h-40 flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center shadow-lg z-10">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                
                {/* Orbiting dots */}
                <motion.div 
                  className="absolute w-full h-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-400 rounded-full shadow-lg" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-400 rounded-full shadow-lg" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-400 rounded-full shadow-lg" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-400 rounded-full shadow-lg" />
                </motion.div>

                {/* Dashed circle */}
                <div className="absolute w-48 h-48 rounded-full border-2 border-dashed border-border/40" />
              </div>

              {/* Background decoration */}
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 rounded-tl-full" />
            </div>

            {/* Floating element */}
            <div className="feature-float absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Synced</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
