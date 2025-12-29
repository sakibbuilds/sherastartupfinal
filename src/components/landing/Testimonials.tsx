import { useState } from "react";
import { cn } from "@/lib/utils";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    quote: "We had an excellent experience working with XYZ Web Design Agency. Their team delivered a visually stunning and user-friendly website that exceeded our expectations.",
    author: "Alex Walker",
    role: "Senior Executive, The Ford",
    avatar: "AW",
    rating: 5,
  },
  {
    quote: "SheraStartup helped me find my co-founder in just 2 weeks. We've since raised $2M and are scaling fast.",
    author: "Sarah Chen",
    role: "Co-founder, EcoTrack",
    avatar: "SC",
    rating: 5,
  },
  {
    quote: "The quality of startups on this platform is incredible. I've already invested in 3 companies that I discovered here.",
    author: "Michael Rodriguez",
    role: "Angel Investor",
    avatar: "MR",
    rating: 5,
  },
  {
    quote: "Being able to mentor students through the platform has been incredibly rewarding. The booking system is seamless.",
    author: "Dr. Emily Watson",
    role: "Professor of Entrepreneurship",
    avatar: "EW",
    rating: 5,
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 md:py-32 bg-secondary/30 overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Testimonial Card */}
          <div className="relative">
            <div className="bg-card rounded-3xl shadow-card-hover border border-border p-8 md:p-10">
              {/* Quote Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Quote className="w-6 h-6 text-primary" />
              </div>
              
              <div 
                key={currentIndex}
                className="animate-fade-in"
              >
                {/* Quote */}
                <blockquote className="text-xl md:text-2xl font-medium mb-8 leading-relaxed text-foreground">
                  "{testimonials[currentIndex].quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-purple flex items-center justify-center text-lg font-bold text-white shadow-purple">
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{testimonials[currentIndex].author}</p>
                    <p className="text-muted-foreground">{testimonials[currentIndex].role}</p>
                  </div>
                </div>

                {/* Trustpilot */}
                <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border">
                  <Star className="w-5 h-5 text-green-500 fill-green-500" />
                  <span className="text-sm font-medium">Trustpilot</span>
                  <div className="flex gap-0.5 ml-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-green-500 fill-green-500" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                className="rounded-full border-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      i === currentIndex 
                        ? "bg-primary w-8" 
                        : "bg-border hover:bg-muted-foreground"
                    )}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={next}
                className="rounded-full border-2"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Right - Feature Preview */}
          <div className="relative">
            {/* Main Feature Card */}
            <div className="bg-card rounded-3xl shadow-card border border-border p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center shadow-purple">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Create Task</p>
                  <p className="text-sm text-muted-foreground">App Design</p>
                </div>
                <span className="ml-auto text-xs text-muted-foreground px-3 py-1 bg-secondary rounded-full">
                  5 members
                </span>
              </div>

              {/* Project Card */}
              <div className="bg-gradient-purple rounded-2xl p-6 text-white mb-6">
                <p className="text-sm text-white/60 mb-2">Project Overview</p>
                <p className="text-sm text-white/80 mb-4">
                  Design a modern and user-friendly website that enhances user experience.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60">Total Working Hours</p>
                    <p className="text-xl font-bold">64:52:00</p>
                  </div>
                  <Button size="sm" className="bg-white/20 text-white hover:bg-white/30">
                    View
                  </Button>
                </div>
              </div>

              {/* Task Warning */}
              <div className="bg-coral/10 border border-coral/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-coral/20 flex items-center justify-center">
                  <span className="text-coral font-bold text-sm">!</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Warning Hours</p>
                  <p className="text-lg font-bold text-coral">84:52:00</p>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-4 -right-4 bg-mint text-white rounded-full px-4 py-2 text-sm font-medium shadow-lg animate-float">
              Well Designed
            </div>
          </div>
        </div>

        {/* University Logos */}
        <div className="mt-20">
          <p className="text-center text-sm text-muted-foreground mb-8">
            TRUSTED BY TOP UNIVERSITIES
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-40">
            {["Stanford", "MIT", "Harvard", "Yale", "Princeton", "Berkeley"].map((uni) => (
              <div key={uni} className="text-xl font-bold tracking-wide">
                {uni}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}