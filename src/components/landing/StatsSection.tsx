import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Rocket, Users, GraduationCap, TrendingUp } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { 
    icon: Rocket, 
    value: 500, 
    suffix: "+", 
    label: "Startups", 
    description: "Innovative ventures launched" 
  },
  { 
    icon: GraduationCap, 
    value: 50, 
    suffix: "+", 
    label: "Universities", 
    description: "Partner institutions" 
  },
  { 
    icon: Users, 
    value: 1000, 
    suffix: "+", 
    label: "Founders", 
    description: "Active entrepreneurs" 
  },
  { 
    icon: TrendingUp, 
    value: 10, 
    prefix: "$", 
    suffix: "M+", 
    label: "Raised", 
    description: "Total funding secured" 
  },
];

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered card entrance
      gsap.fromTo(
        cardRefs.current.filter(Boolean),
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      // Counter animations
      counterRefs.current.forEach((counter, index) => {
        if (!counter) return;
        
        const stat = stats[index];
        const obj = { value: 0 };

        gsap.to(obj, {
          value: stat.value,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: counter,
            start: "top 85%",
            once: true,
          },
          onUpdate: () => {
            counter.textContent = `${stat.prefix || ""}${Math.round(obj.value)}${stat.suffix || ""}`;
          },
        });
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-white relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-light/30 via-transparent to-teal-light/20 pointer-events-none" />
      
      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <div
                key={stat.label}
                ref={(el) => (cardRefs.current[index] = el)}
                className="group relative p-6 md:p-8 rounded-3xl bg-white border border-border/30 shadow-soft hover:shadow-soft-lg transition-all duration-500 hover:-translate-y-1"
              >
                {/* Icon */}
                <div className="mb-4 p-3.5 rounded-2xl bg-primary/8 w-fit group-hover:bg-primary/12 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                
                {/* Counter */}
                <span
                  ref={(el) => (counterRefs.current[index] = el)}
                  className="block text-3xl md:text-4xl font-bold text-foreground mb-1"
                >
                  {stat.prefix || ""}0{stat.suffix || ""}
                </span>
                
                {/* Label */}
                <span className="block text-lg font-semibold text-foreground mb-1">
                  {stat.label}
                </span>
                
                {/* Description */}
                <span className="text-sm text-muted-foreground">
                  {stat.description}
                </span>

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
