import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  TrendingUp, 
  GraduationCap, 
  Building2,
  ArrowRight,
  Check
} from "lucide-react";

const roles = [
  {
    id: "founder",
    icon: Lightbulb,
    title: "Student / Founder",
    description: "Build your startup with the right team and resources",
    features: [
      "60-second video pitches",
      "Find co-founders",
      "Get mentored",
      "Track funding progress",
    ],
    color: "mint",
    bgGradient: "from-mint/10 via-mint/5 to-transparent",
  },
  {
    id: "investor",
    icon: TrendingUp,
    title: "Investor",
    description: "Discover the next big thing from university innovators",
    features: [
      "Deal flow pipeline",
      "Due diligence tools",
      "Portfolio tracking",
      "Direct messaging",
    ],
    color: "sky",
    bgGradient: "from-sky/10 via-sky/5 to-transparent",
  },
  {
    id: "mentor",
    icon: GraduationCap,
    title: "Mentor / Professor",
    description: "Guide the next generation of entrepreneurs",
    features: [
      "Booking calendar",
      "Session management",
      "Impact dashboard",
      "Office hours",
    ],
    color: "pink",
    bgGradient: "from-pink/10 via-pink/5 to-transparent",
  },
  {
    id: "admin",
    icon: Building2,
    title: "University Admin",
    description: "Manage your institution's entrepreneurship ecosystem",
    features: [
      "Analytics dashboard",
      "Program management",
      "Student tracking",
      "Event coordination",
    ],
    color: "foreground",
    bgGradient: "from-secondary via-secondary/50 to-transparent",
  },
];

const colorClasses = {
  mint: {
    icon: "text-mint",
    border: "border-mint",
    bg: "bg-mint",
    check: "text-mint",
  },
  sky: {
    icon: "text-sky",
    border: "border-sky",
    bg: "bg-sky",
    check: "text-sky",
  },
  pink: {
    icon: "text-pink",
    border: "border-pink",
    bg: "bg-pink",
    check: "text-pink",
  },
  foreground: {
    icon: "text-foreground",
    border: "border-foreground",
    bg: "bg-foreground",
    check: "text-foreground",
  },
};

export function Roles() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  return (
    <section className="py-24 md:py-32">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Choose your <span className="text-gradient">role</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            CampusLaunch is built for everyone in the startup ecosystem
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {roles.map((role, index) => {
            const Icon = role.icon;
            const colors = colorClasses[role.color as keyof typeof colorClasses];
            const isSelected = selectedRole === role.id;
            const isHovered = hoveredRole === role.id;
            
            return (
              <div
                key={role.id}
                className={cn(
                  "relative p-8 rounded-2xl bg-card border-2 cursor-pointer",
                  "transition-all duration-300",
                  "hover:shadow-elevated-lg hover:-translate-y-1",
                  isSelected ? colors.border : "border-border/50 hover:border-border",
                  "animate-fade-in-up"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedRole(role.id)}
                onMouseEnter={() => setHoveredRole(role.id)}
                onMouseLeave={() => setHoveredRole(null)}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className={cn(
                    "absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center",
                    colors.bg
                  )}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Background Gradient */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
                    `bg-gradient-to-br ${role.bgGradient}`,
                    (isSelected || isHovered) && "opacity-100"
                  )}
                />

                <div className="relative">
                  {/* Icon */}
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
                    "bg-secondary/50 transition-transform duration-300",
                    colors.icon,
                    (isSelected || isHovered) && "scale-110"
                  )}>
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-2xl font-bold mb-2">{role.title}</h3>
                  <p className="text-muted-foreground mb-6">{role.description}</p>

                  {/* Features */}
                  <ul className="space-y-3">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className={cn("w-5 h-5", colors.check)} />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button 
            variant="hero" 
            size="xl" 
            disabled={!selectedRole}
            className={cn(
              "transition-all duration-300",
              !selectedRole && "opacity-50 cursor-not-allowed"
            )}
          >
            {selectedRole ? "Continue as " + roles.find(r => r.id === selectedRole)?.title : "Select a role to continue"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
