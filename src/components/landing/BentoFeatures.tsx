import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Video, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Sparkles, 
  GraduationCap,
  ArrowUpRight
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Video,
    title: "Pitch Videos",
    description: "Record and share 60-second elevator pitches. Get discovered by investors and mentors worldwide.",
    color: "from-rose-500/20 to-orange-500/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    span: "col-span-1 md:col-span-2",
  },
  {
    icon: Users,
    title: "Investor Network",
    description: "Connect with verified investors looking for the next big thing.",
    color: "from-blue-500/20 to-cyan-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    span: "col-span-1",
  },
  {
    icon: GraduationCap,
    title: "University Hubs",
    description: "Join your campus community and collaborate with peers.",
    color: "from-violet-500/20 to-purple-500/20",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    span: "col-span-1",
  },
  {
    icon: Briefcase,
    title: "Mentorship",
    description: "Book 1:1 sessions with experienced founders and industry experts.",
    color: "from-emerald-500/20 to-teal-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    span: "col-span-1 md:col-span-2",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Instant messaging with voice notes, reactions, and file sharing.",
    color: "from-amber-500/20 to-yellow-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    span: "col-span-1",
  },
  {
    icon: Sparkles,
    title: "Smart Matching",
    description: "AI-powered suggestions for co-founders, investors, and mentors.",
    color: "from-pink-500/20 to-rose-500/20",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-500",
    span: "col-span-1",
  },
];

export function BentoFeatures() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        headingRef.current?.querySelectorAll("*") || [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );

      // Cards staggered entrance
      gsap.fromTo(
        cardRefs.current.filter(Boolean),
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: sectionRef.current?.querySelector(".grid"),
            start: "top 80%",
            once: true,
          },
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Card hover animation
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const icon = card.querySelector(".feature-icon");
    
    gsap.to(card, {
      y: -8,
      duration: 0.3,
      ease: "power2.out",
    });

    if (icon) {
      gsap.to(icon, {
        scale: 1.1,
        rotate: 5,
        duration: 0.3,
        ease: "back.out(1.7)",
      });
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const icon = card.querySelector(".feature-icon");
    
    gsap.to(card, {
      y: 0,
      duration: 0.4,
      ease: "power2.out",
    });

    if (icon) {
      gsap.to(icon, {
        scale: 1,
        rotate: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  };

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-background relative">
      <div className="container px-4 md:px-6">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything you need to launch
          </h2>
          <p className="text-muted-foreground text-lg">
            From idea to IPO, we've got the tools to help you succeed.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <div
                key={feature.title}
                ref={(el) => (cardRefs.current[index] = el)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`
                  ${feature.span}
                  group relative p-6 md:p-8 rounded-2xl bg-card border border-border/50
                  hover:border-border transition-all duration-300 cursor-pointer
                  overflow-hidden
                `}
              >
                {/* Gradient background */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`feature-icon mb-4 p-3 rounded-xl ${feature.iconBg} w-fit`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  
                  {/* Title with arrow */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                  
                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Corner decoration */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
