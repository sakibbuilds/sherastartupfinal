import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
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
  Rocket
} from "lucide-react";

const categories = [
  { label: "All", icon: Sparkles, active: true },
  { label: "AI-Native Applications", icon: Cpu },
  { label: "Productivity", icon: Briefcase },
  { label: "Community", icon: HeartHandshake },
  { label: "Design Tools", icon: Palette },
  { label: "Developer Tools", icon: Code2 },
  { label: "E-commerce", icon: ShoppingBag },
  { label: "Education", icon: GraduationCap },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Health", icon: Stethoscope },
  { label: "Finance", icon: Banknote },
];

export function Hero() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { user } = useAuth();

  return (
    <section className="pt-16 pb-6 bg-background">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center py-8 md:py-12">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium">
            <Rocket className="w-3 h-3 mr-1.5" />
            Curated directory of vibe-coded startups
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 text-foreground">
            Discover University Startups
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Explore innovative startups built by university entrepreneurs. 
            Connect with founders, investors, and mentors.
          </p>
        </div>

        {/* Category Pills - Horizontal Scrollable */}
        <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.label;
              
              return (
                <button
                  key={category.label}
                  onClick={() => setActiveCategory(category.label)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium 
                    transition-all duration-200 whitespace-nowrap shrink-0
                    ${isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
          
          {/* Fade edges on mobile */}
          <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
        </div>
      </div>
    </section>
  );
}
