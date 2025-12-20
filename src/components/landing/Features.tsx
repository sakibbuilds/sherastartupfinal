import { 
  Rocket, 
  Users, 
  TrendingUp, 
  Video, 
  Calendar, 
  Zap,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const features = [
  {
    icon: Video,
    title: "Spark Feed",
    description: "TikTok-style pitch videos. Get discovered by investors in 60 seconds or less.",
    color: "mint",
    gradient: "from-mint/20 to-mint/5",
  },
  {
    icon: Users,
    title: "Match Matrix",
    description: "Tinder-style discovery. Swipe to connect with co-founders, investors, and mentors.",
    color: "sky",
    gradient: "from-sky/20 to-sky/5",
  },
  {
    icon: Rocket,
    title: "Idea Lab",
    description: "Collaborate on ideas in real-time. Build your startup with the right team.",
    color: "pink",
    gradient: "from-pink/20 to-pink/5",
  },
  {
    icon: Calendar,
    title: "Mentor Connect",
    description: "Book 1:1 sessions with industry experts. Get the guidance you need.",
    color: "mint",
    gradient: "from-mint/20 to-mint/5",
  },
  {
    icon: TrendingUp,
    title: "Deal Flow",
    description: "Track investments with Kanban boards. From pitch to portfolio.",
    color: "sky",
    gradient: "from-sky/20 to-sky/5",
  },
  {
    icon: Zap,
    title: "Real-time",
    description: "Live notifications, instant messaging, and real-time collaboration.",
    color: "pink",
    gradient: "from-pink/20 to-pink/5",
  },
];

const colorClasses = {
  mint: "text-mint group-hover:shadow-glow-mint",
  sky: "text-sky group-hover:shadow-glow-sky",
  pink: "text-pink",
};

export function Features() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Everything you need to{" "}
            <span className="text-gradient">launch</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete ecosystem for university entrepreneurs. Connect, pitch, and grow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;
            
            return (
              <div
                key={feature.title}
                className={cn(
                  "group relative p-8 rounded-2xl bg-card border border-border/50",
                  "transition-all duration-500 cursor-pointer",
                  "hover:border-border hover:shadow-elevated-lg hover:-translate-y-1",
                  "animate-fade-in-up"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Gradient Background */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
                    `bg-gradient-to-br ${feature.gradient}`,
                    isHovered && "opacity-100"
                  )}
                />

                <div className="relative">
                  {/* Icon */}
                  <div 
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-6",
                      "bg-secondary/50 transition-all duration-300",
                      colorClasses[feature.color as keyof typeof colorClasses],
                      isHovered && "scale-110"
                    )}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>

                  {/* Arrow */}
                  <div 
                    className={cn(
                      "flex items-center gap-2 mt-4 text-sm font-medium",
                      colorClasses[feature.color as keyof typeof colorClasses],
                      "opacity-0 translate-x-2 transition-all duration-300",
                      isHovered && "opacity-100 translate-x-0"
                    )}
                  >
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
