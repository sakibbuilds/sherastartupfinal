import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-purple" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />

      <div className="container relative px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Phone Mockup */}
          <div className="relative flex justify-center lg:justify-start">
            {/* Phone Frame */}
            <div className="relative">
              <div className="w-[280px] md:w-[320px] bg-white/10 backdrop-blur-xl rounded-[40px] p-3 border border-white/20 shadow-2xl">
                <div className="bg-card rounded-[32px] overflow-hidden">
                  {/* Phone Header */}
                  <div className="bg-gradient-purple-light p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-primary">Brand New</span>
                      <span className="text-xs text-muted-foreground">9:41</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">Website Design</h3>
                    <p className="text-sm text-muted-foreground">Complete project overview</p>
                  </div>

                  {/* Phone Content */}
                  <div className="p-4 space-y-3">
                    {[
                      { task: 'Todo', count: 12, color: 'bg-coral' },
                      { task: 'In Progress', count: 8, color: 'bg-primary' },
                      { task: 'Completed', count: 24, color: 'bg-mint' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm font-medium">{item.task}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.count} tasks</span>
                      </div>
                    ))}
                    
                    <Button className="w-full bg-gradient-purple text-white mt-4">
                      Complete
                    </Button>
                  </div>
                </div>
              </div>

              {/* Floating Card */}
              <div className="absolute -right-8 top-1/3 bg-card rounded-2xl shadow-purple-lg p-4 border border-border animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-mint" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Task Done!</p>
                    <p className="text-xs text-muted-foreground">24 completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="text-white text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 animate-fade-in-up">
              Ready? Let's Start with{" "}
              <span className="text-white/90">SheraStartup</span>
              <br />
              and Get{" "}
              <span className="text-mint">Awesome Experience</span>
            </h2>

            <p className="text-lg text-white/70 max-w-lg mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Define unique value stories for each team. Use can define the steps, 
              rules and actions that make up their custom workflow.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-lg px-8 group"
                asChild
              >
                <Link to="/auth">
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-10 text-sm text-white/60 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-mint" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-mint" />
                Free forever for students
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-mint" />
                Setup in 2 minutes
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}