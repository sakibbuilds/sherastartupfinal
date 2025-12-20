import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { useState } from "react";

export function Hero() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), 
                             linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mint/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-mint" />
            <span className="text-sm font-medium">Now connecting 500+ universities</span>
          </div>

          {/* Headline */}
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            Where{" "}
            <span className="text-gradient">startups</span>
            <br />
            take flight
          </h1>

          {/* Subheadline */}
          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            Connect with investors, find co-founders, and get mentored by industry leaders. 
            Your university startup journey starts here.
          </p>

          {/* CTAs */}
          <div 
            className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Button
              variant="hero"
              size="xl"
              className="group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Get Started Free
              <ArrowRight 
                className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} 
              />
            </Button>
            <Button variant="hero-outline" size="xl" className="group">
              <Play className="w-5 h-5 mr-1" />
              Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div 
            className="flex items-center gap-8 mt-16 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-semibold"
                  style={{ 
                    background: i % 2 === 0 ? 'hsl(var(--mint) / 0.1)' : 'hsl(var(--sky) / 0.1)',
                    animationDelay: `${i * 0.1}s`
                  }}
                >
                  {String.fromCharCode(65 + i - 1)}
                </div>
              ))}
            </div>
            <div className="text-left">
              <p className="font-semibold">12,000+ founders</p>
              <p className="text-sm text-muted-foreground">already building</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-20 max-w-4xl mx-auto animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          {[
            { value: "$50M+", label: "Raised by startups" },
            { value: "500+", label: "Universities" },
            { value: "2,000+", label: "Active investors" },
            { value: "15,000+", label: "Connections made" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-black">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
        </div>
      </div>
    </section>
  );
}
