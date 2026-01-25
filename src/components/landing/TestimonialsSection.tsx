import { useEffect, useRef } from "react";
import { Star, Quote, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

export const TestimonialsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".testimonial-heading", {
        scrollTrigger: {
          trigger: ".testimonial-heading",
          start: "top 85%",
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".testimonial-card", {
        scrollTrigger: {
          trigger: ".testimonial-card",
          start: "top 80%",
        },
        opacity: 0,
        x: -60,
        duration: 1,
        ease: "power3.out",
      });

      gsap.from(".testimonial-profile", {
        scrollTrigger: {
          trigger: ".testimonial-card",
          start: "top 75%",
        },
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        delay: 0.3,
        ease: "power3.out",
      });

      gsap.to(".testimonial-float", {
        y: -12,
        duration: 3.5,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.4,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Founder & CEO",
      company: "TechStart",
      avatar: null,
      rating: 5,
      quote: "SheraStartup completely transformed how we approach fundraising. Within 3 months, we connected with 15 investors and closed our seed round. The platform's network is unmatched.",
      stats: { funding: "$2.5M", connections: "150+", mentors: "8" },
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="testimonial-heading text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            What <span className="text-gradient-accent">founders</span> Say About Us:
          </h2>
        </div>

        {/* Main Testimonial */}
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            {/* Left - Testimonial Card */}
            <div className="lg:col-span-3 testimonial-card">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-border/40 relative">
                {/* Quote icon */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg">
                  <Quote className="w-5 h-5 text-white" />
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-6 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">5.0</span>
                </div>

                {/* Quote */}
                <blockquote className="text-xl md:text-2xl font-medium text-foreground leading-relaxed mb-8">
                  "SheraStartup completely transformed how we approach fundraising. Within 3 months, we 
                  <span className="text-gradient-accent"> connected with 15 investors</span> and closed our seed round. 
                  The platform's network is unmatched."
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-accent flex items-center justify-center text-white font-bold text-lg">
                      SC
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Sarah Chen</p>
                      <p className="text-muted-foreground">Founder & CEO, TechStart</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Verified</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border/30">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">$2.5M</p>
                    <p className="text-xs text-muted-foreground">Raised</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">150+</p>
                    <p className="text-xs text-muted-foreground">Connections</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-xs text-muted-foreground">Mentors</p>
                  </div>
                </div>

                {/* Navigation arrows */}
                <div className="flex items-center gap-2 mt-6">
                  <button className="w-10 h-10 rounded-full border border-border hover:bg-slate-50 flex items-center justify-center transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full border border-border hover:bg-slate-50 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="ml-auto text-sm text-muted-foreground">1 / 5</span>
                </div>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="lg:col-span-2 testimonial-profile relative">
              <div className="relative">
                {/* Main profile visual */}
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl p-8 border border-border/40 relative overflow-hidden">
                  {/* Success illustration */}
                  <div className="text-center mb-6">
                    <motion.div 
                      className="w-24 h-24 mx-auto bg-gradient-accent rounded-full flex items-center justify-center mb-4"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <span className="text-4xl">🚀</span>
                    </motion.div>
                    <h4 className="text-xl font-bold text-foreground">Success Story</h4>
                    <p className="text-muted-foreground">TechStart's Journey</p>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    {[
                      { month: "Month 1", event: "Joined platform" },
                      { month: "Month 2", event: "15 investor connections" },
                      { month: "Month 3", event: "$2.5M seed round" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          i === 2 ? 'bg-accent' : 'bg-slate-300'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{item.event}</p>
                          <p className="text-xs text-muted-foreground">{item.month}</p>
                        </div>
                        {i === 2 && <CheckCircle className="w-4 h-4 text-accent" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating elements */}
                <div className="testimonial-float absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-border/40">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-foreground">4.9</span>
                  </div>
                </div>

                <div className="testimonial-float absolute -bottom-4 -left-4 bg-gradient-dark rounded-xl p-3 text-white shadow-lg">
                  <p className="text-sm font-medium">500+ Reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <motion.div 
          className="flex flex-wrap items-center justify-center gap-8 mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {[
            { value: "4.9/5", label: "Average Rating" },
            { value: "2,400+", label: "Reviews" },
            { value: "98%", label: "Satisfaction" },
          ].map((stat, i) => (
            <div key={i} className="text-center px-6">
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
