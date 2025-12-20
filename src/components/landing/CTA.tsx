import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background" />
      
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-mint/5 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-sky/10 rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-pink/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '-2s' }} />

      <div className="container relative px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 border border-mint/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-mint" />
            <span className="text-sm font-medium text-mint">Free for students with .edu email</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 animate-fade-in-up">
            Ready to launch your
            <br />
            <span className="text-gradient">startup journey?</span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Join thousands of university entrepreneurs, investors, and mentors 
            building the future together.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="mint" size="xl" className="group min-w-[200px]">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="xl" className="min-w-[200px]">
              Schedule Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint" />
              Free forever for students
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint" />
              Setup in 2 minutes
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
