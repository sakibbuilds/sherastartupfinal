import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Sparkles, 
  Cpu, 
  Briefcase, 
  HeartHandshake, 
  Palette, 
  Code2, 
  ShoppingBag, 
  GraduationCap,
  Gamepad2,
  Stethoscope,
  Banknote,
  Rocket,
  ArrowRight
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { label: "All", icon: Sparkles, active: true },
  { label: "AI-Native", icon: Cpu },
  { label: "Productivity", icon: Briefcase },
  { label: "Community", icon: HeartHandshake },
  { label: "Design", icon: Palette },
  { label: "DevTools", icon: Code2 },
  { label: "E-commerce", icon: ShoppingBag },
  { label: "Education", icon: GraduationCap },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Health", icon: Stethoscope },
  { label: "Finance", icon: Banknote },
];

export function Hero() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { user } = useAuth();
  
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for coordinated entrance
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Badge entrance
      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6 },
        0.2
      );

      // Split headline animation - letter by letter with blur
      if (headlineRef.current) {
        const text = headlineRef.current.innerText;
        headlineRef.current.innerHTML = text
          .split("")
          .map((char) =>
            char === " "
              ? '<span class="inline-block">&nbsp;</span>'
              : `<span class="inline-block">${char}</span>`
          )
          .join("");

        const chars = headlineRef.current.querySelectorAll("span");
        
        tl.fromTo(
          chars,
          { opacity: 0, y: 40, filter: "blur(10px)", rotateX: -90 },
          { 
            opacity: 1, 
            y: 0, 
            filter: "blur(0px)", 
            rotateX: 0,
            duration: 0.8,
            stagger: 0.02,
            ease: "back.out(1.7)"
          },
          0.3
        );
      }

      // Subhead entrance
      tl.fromTo(
        subheadRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.8
      );

      // Pills staggered entrance
      if (pillsRef.current) {
        const pills = pillsRef.current.querySelectorAll("button");
        tl.fromTo(
          pills,
          { opacity: 0, y: 20, scale: 0.9 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.5, 
            stagger: 0.05,
            ease: "back.out(1.5)"
          },
          1
        );
      }

      // Floating orbs with parallax
      gsap.to(orb1Ref.current, {
        y: -30,
        x: 20,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb2Ref.current, {
        y: 20,
        x: -30,
        duration: 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1,
      });

      gsap.to(orb3Ref.current, {
        y: -20,
        x: 15,
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 0.5,
      });

      // Parallax on scroll for orbs
      gsap.to(orb1Ref.current, {
        y: 100,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.to(orb2Ref.current, {
        y: 150,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Magnetic effect for pills
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(button, {
      x: x * 0.2,
      y: y * 0.2,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
  };

  return (
    <section ref={heroRef} className="relative pt-24 pb-12 overflow-hidden bg-gradient-hero">
      {/* Gradient Orbs - Soft blue tones */}
      <div
        ref={orb1Ref}
        className="absolute top-20 left-[10%] w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(200 70% 70% / 0.3) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        ref={orb2Ref}
        className="absolute top-40 right-[15%] w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(195 60% 75% / 0.4) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        ref={orb3Ref}
        className="absolute bottom-0 left-[40%] w-[450px] h-[450px] rounded-full opacity-25 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(210 50% 80% / 0.4) 0%, transparent 70%)",
          filter: "blur(75px)",
        }}
      />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="container relative z-10 px-4 md:px-6">
        {/* Header */}
        <div className="text-center py-8 md:py-16 max-w-4xl mx-auto">
          <div ref={badgeRef}>
            <Badge 
              variant="secondary" 
              className="mb-6 px-5 py-2.5 text-sm font-medium bg-white text-primary border border-border/50 shadow-soft hover:shadow-soft-md transition-all cursor-default rounded-full"
            >
              <Rocket className="w-4 h-4 mr-2 text-primary" />
              Curated directory of vibe-coded startups
              <ArrowRight className="w-3 h-3 ml-2 text-muted-foreground" />
            </Badge>
          </div>
          
          <h1 
            ref={headlineRef}
            className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground leading-[1.1]"
            style={{ perspective: "1000px" }}
          >
            Discover University Startups
          </h1>
          
          <p 
            ref={subheadRef}
            className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl leading-relaxed"
          >
            Explore innovative startups built by university entrepreneurs. 
            Connect with founders, investors, and mentors in one place.
          </p>
        </div>

        {/* Category Pills - Horizontal Scrollable */}
        <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
          <div ref={pillsRef} className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide justify-start md:justify-center flex-wrap md:flex-nowrap">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.label;
              
              return (
                <button
                  key={category.label}
                  onClick={() => setActiveCategory(category.label)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className={`
                    group flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-medium 
                    transition-all duration-300 whitespace-nowrap shrink-0 relative overflow-hidden
                    ${isActive 
                      ? "bg-primary text-white shadow-navy" 
                      : "bg-white text-muted-foreground hover:text-foreground border border-border/50 shadow-soft hover:shadow-soft-md"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "" : "group-hover:scale-110"}`} />
                  <span className="relative z-10">{category.label}</span>
                  
                  {/* Hover glow effect */}
                  {!isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Fade edges on mobile */}
          <div className="absolute right-0 top-0 bottom-6 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
          <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none md:hidden" />
        </div>
      </div>
    </section>
  );
}
