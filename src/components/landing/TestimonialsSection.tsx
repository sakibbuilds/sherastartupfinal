import { useEffect, useRef } from "react";
import { Star, Quote } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const TestimonialsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate content
      gsap.from(".testimonial-content", {
        scrollTrigger: {
          trigger: ".testimonial-content",
          start: "top 80%",
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
      });

      // Animate rating card
      gsap.from(".rating-card", {
        scrollTrigger: {
          trigger: ".rating-card",
          start: "top 80%",
        },
        opacity: 0,
        x: -40,
        duration: 0.8,
        ease: "power3.out",
      });

      // Continuous float for decorative elements
      gsap.to(".testimonial-float", {
        y: -12,
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Rating Card */}
          <div className="rating-card relative">
            <div className="bg-white rounded-3xl p-8 shadow-soft-lg border border-border/30 max-w-md mx-auto lg:mx-0">
              {/* Trustpilot Badge */}
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-6 h-6 fill-green-500 text-green-500" />
                <span className="font-bold text-foreground">Trustpilot</span>
                <div className="flex items-center gap-1 ml-2">
                  <span className="font-bold text-foreground">4.8</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-green-500 text-green-500" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Star Rating Visualization */}
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto relative">
                  {/* Central star */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Star className="w-16 h-16 fill-primary text-primary" />
                  </div>
                  {/* Orbiting elements */}
                  <div className="testimonial-float absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary shadow-purple" />
                  </div>
                  <div className="testimonial-float absolute bottom-0 left-0">
                    <Star className="w-6 h-6 fill-accent text-accent" />
                  </div>
                  <div className="testimonial-float absolute bottom-4 right-0">
                    <div className="w-6 h-6 rounded-full bg-green-400" />
                  </div>
                </div>
                
                {/* User avatars */}
                <div className="flex justify-center -space-x-3 mt-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-soft"
                      style={{ 
                        background: `linear-gradient(${i * 45}deg, hsl(${200 + i * 25} 60% 50%), hsl(${220 + i * 25} 70% 60%))` 
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right - Testimonial Content */}
          <div className="testimonial-content">
            {/* Quote icon */}
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Quote className="w-7 h-7 text-primary" />
            </div>

            <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed mb-8">
              "We had an excellent experience working with SheraStartup. Their platform delivered a 
              <span className="text-gradient"> visually stunning and user-friendly</span> experience that 
              exceeded our expectations."
            </blockquote>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-primary" />
              <div>
                <p className="font-bold text-foreground">Alan Walker</p>
                <p className="text-muted-foreground">Senior Executive, The Ford</p>
              </div>
            </div>

            {/* Trustpilot verification */}
            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border">
              <Star className="w-5 h-5 fill-green-500 text-green-500" />
              <span className="text-muted-foreground">Verified on</span>
              <span className="font-bold text-foreground">Trustpilot</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
