import { useEffect, useRef } from "react";
import { Database, Paperclip, Users2, Calendar, Clock } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const FeaturesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate heading
      gsap.from(".features-heading", {
        scrollTrigger: {
          trigger: ".features-heading",
          start: "top 80%",
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
      });

      // Animate feature cards
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: ".features-grid",
          start: "top 75%",
        },
        opacity: 0,
        y: 50,
        stagger: 0.15,
        duration: 0.7,
        ease: "power3.out",
      });

      // Animate mockup
      gsap.from(".features-mockup", {
        scrollTrigger: {
          trigger: ".features-mockup",
          start: "top 80%",
        },
        opacity: 0,
        x: -50,
        duration: 1,
        ease: "power2.out",
      });

      // Animate floating elements
      gsap.from(".features-float-card", {
        scrollTrigger: {
          trigger: ".features-mockup",
          start: "top 70%",
        },
        opacity: 0,
        scale: 0.8,
        stagger: 0.2,
        duration: 0.6,
        ease: "back.out(1.7)",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: Database,
      title: "Data Sync and Backup",
      description: "Users' tasks and app settings are synchronized across multiple devices.",
    },
    {
      icon: Paperclip,
      title: "Task Attachments",
      description: "Users can attach files, documents, or links to tasks, providing additional context.",
    },
    {
      icon: Users2,
      title: "Task Collaboration",
      description: "Users can collaborate with other users on tasks, allowing them to work together.",
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Mockup */}
          <div className="features-mockup relative">
            {/* Phone mockup */}
            <div className="phone-mockup w-[300px] mx-auto lg:mx-0">
              <div className="phone-screen aspect-[9/19] p-4 flex flex-col">
                {/* Task Cards */}
                <div className="space-y-3 flex-1">
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-xs font-medium text-foreground">Create Smart Style Guide Brand</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Know Website</span>
                      <div className="flex -space-x-1">
                        {[1, 2, 3].map((i) => (
                          <div 
                            key={i}
                            className="w-5 h-5 rounded-full border border-white bg-gradient-primary"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 shadow-soft border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
                        <span className="text-accent text-xs">◆</span>
                      </div>
                      <span className="text-xs font-medium text-foreground">Create Smart Style Guide Brand</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Know Website</p>
                  </div>

                  <div className="bg-white rounded-xl p-3 shadow-soft border border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-xs font-medium text-foreground">Website Design Review</span>
                    </div>
                  </div>
                </div>

                {/* Mini chart at bottom */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-end gap-1 h-12">
                    {[40, 60, 35, 80, 55, 75, 45, 65, 50, 70].map((h, i) => (
                      <div 
                        key={i}
                        className="flex-1 bg-gradient-primary rounded-sm opacity-60"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="features-float-card absolute -right-4 top-20 bg-white rounded-2xl p-4 shadow-soft-lg border border-border/30 w-52">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm text-foreground">Create Task</p>
                  <p className="text-xs text-muted-foreground">11 August 2022</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary">App Design</span>
                <span className="text-xs text-muted-foreground">5 Comments</span>
              </div>
            </div>

            <div className="features-float-card absolute -right-8 bottom-24 bg-white rounded-2xl p-4 shadow-soft-lg border border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Working Hours</p>
                  <p className="font-bold text-xl text-foreground">64:52:00 <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Live</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <div className="features-heading mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Comprehensive Feature Set{" "}
                <span className="text-gradient">of a Startup Platform</span>
              </h2>
            </div>

            <div className="features-grid space-y-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="feature-card flex items-start gap-4 p-5 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-purple">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
