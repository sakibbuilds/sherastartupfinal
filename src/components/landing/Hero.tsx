import { Button } from "@/components/ui/button";
import { ArrowRight, Play, LayoutDashboard, Star, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Hero() {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-accent/30 to-background" />
      
      {/* Animated Blobs */}
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-light/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-pink/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-4s' }} />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="text-left">
            {/* Trustpilot Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm mb-8 animate-fade-in">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">Trustpilot</span>
              <span className="text-sm font-bold text-primary">4.8</span>
              <span className="text-xs text-muted-foreground">★★★★★</span>
            </div>

            {/* Headline */}
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 animate-fade-in-up leading-tight"
              style={{ animationDelay: '0.1s' }}
            >
              Maximize Your{" "}
              <span className="text-gradient">Productivity</span>
            </h1>

            {/* Subheadline */}
            <p 
              className="text-lg text-muted-foreground max-w-lg mb-8 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              Conquer Your Tasks and Take Control with Our Task Manager App. 
              Connect with investors, find co-founders, and scale your startup.
            </p>

            {/* CTAs */}
            <div 
              className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              {user ? (
                <Button
                  size="lg"
                  className="bg-gradient-purple shadow-purple hover:shadow-purple-lg transition-all duration-300 text-white px-8"
                  asChild
                >
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-gradient-purple shadow-purple hover:shadow-purple-lg transition-all duration-300 text-white px-8 group"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  asChild
                >
                  <Link to="/auth">
                    Learn More
                    <ArrowRight 
                      className={`w-5 h-5 ml-2 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} 
                    />
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" className="gap-2 px-6 border-2">
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Features */}
            <div 
              className="flex flex-wrap items-center gap-6 mt-10 animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              {['No credit card', 'Free trial', 'Cancel anytime'].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Right - App Preview Card */}
          <div 
            className="relative animate-fade-in-up lg:pl-8"
            style={{ animationDelay: '0.4s' }}
          >
            {/* Main App Card */}
            <div className="relative bg-card rounded-3xl shadow-purple-lg border border-border/50 p-6 overflow-hidden">
              {/* App Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">SheraStartup</p>
                    <p className="text-xs text-muted-foreground">Dashboard</p>
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-purple text-white">
                  Start
                </Button>
              </div>

              {/* Task List Preview */}
              <div className="space-y-3 mb-6">
                {[
                  { title: 'Brand New Website Design', status: 'In Progress', color: 'bg-primary' },
                  { title: 'Review Investor Pitch', status: 'Pending', color: 'bg-coral' },
                  { title: 'Team Meeting', status: 'Completed', color: 'bg-mint' },
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                    <div className={`w-2 h-2 rounded-full ${task.color}`} />
                    <span className="text-sm font-medium flex-1">{task.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'Completed' ? 'bg-mint/20 text-mint' :
                      task.status === 'In Progress' ? 'bg-primary/20 text-primary' :
                      'bg-coral/20 text-coral'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-purple-light rounded-xl p-4">
                  <p className="text-2xl font-black text-primary">29M+</p>
                  <p className="text-xs text-muted-foreground">Installed over the time</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-2xl font-black">100M+</p>
                  <p className="text-xs text-muted-foreground">Total tasks completed</p>
                </div>
              </div>

              {/* Team Avatars */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-xs font-semibold"
                      style={{ 
                        background: i % 2 === 0 
                          ? 'linear-gradient(135deg, hsl(245 58% 51%), hsl(280 60% 55%))' 
                          : 'hsl(var(--secondary))',
                        color: i % 2 === 0 ? 'white' : 'inherit'
                      }}
                    >
                      {String.fromCharCode(65 + i - 1)}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-card bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    5+
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Downloaded more than</p>
                  <p className="text-sm font-semibold">5M+ in a year 🚀</p>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-card-hover p-3 border border-border animate-float">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-mint/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-mint" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Custom Workflow</p>
                  <p className="text-[10px] text-muted-foreground">Auto-sync enabled</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-card-hover p-3 border border-border animate-float" style={{ animationDelay: '-3s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Multi-team projects</p>
                  <p className="text-[10px] text-muted-foreground">Collaborate easily</p>
                </div>
              </div>
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
              <p className="text-3xl md:text-4xl font-black text-gradient">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}