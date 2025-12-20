import { useState } from "react";
import { cn } from "@/lib/utils";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    quote: "CampusLaunch helped me find my co-founder in just 2 weeks. We've since raised $2M and are scaling fast.",
    author: "Sarah Chen",
    role: "Co-founder, EcoTrack",
    university: "Stanford University",
    avatar: "SC",
    rating: 5,
  },
  {
    quote: "The quality of startups on this platform is incredible. I've already invested in 3 companies that I discovered here.",
    author: "Michael Rodriguez",
    role: "Angel Investor",
    university: "Y Combinator",
    avatar: "MR",
    rating: 5,
  },
  {
    quote: "Being able to mentor students through the platform has been incredibly rewarding. The booking system is seamless.",
    author: "Dr. Emily Watson",
    role: "Professor of Entrepreneurship",
    university: "MIT",
    avatar: "EW",
    rating: 5,
  },
  {
    quote: "Our university's startup ecosystem has grown 300% since implementing CampusLaunch. It's a game-changer.",
    author: "James Thompson",
    role: "Director of Innovation",
    university: "UC Berkeley",
    avatar: "JT",
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
    <section className="py-24 md:py-32 bg-foreground text-background overflow-hidden">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Loved by <span className="text-mint">founders</span>
          </h2>
          <p className="text-lg text-background/70">
            Join thousands of entrepreneurs building their dreams
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial */}
          <div className="relative bg-background/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-background/10">
            <Quote className="w-12 h-12 text-mint/30 mb-6" />
            
            <div 
              key={currentIndex}
              className="animate-fade-in"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-mint fill-mint" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-2xl md:text-3xl font-medium mb-8 leading-relaxed">
                "{testimonials[currentIndex].quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-mint/20 flex items-center justify-center text-lg font-bold text-mint">
                  {testimonials[currentIndex].avatar}
                </div>
                <div>
                  <p className="font-semibold text-lg">{testimonials[currentIndex].author}</p>
                  <p className="text-background/60">{testimonials[currentIndex].role}</p>
                  <p className="text-sm text-mint">{testimonials[currentIndex].university}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={prev}
              className="text-background hover:bg-background/10 hover:text-background"
            >
              <ChevronLeft className="w-6 h-6" />
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
                      ? "bg-mint w-8" 
                      : "bg-background/30 hover:bg-background/50"
                  )}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              className="text-background hover:bg-background/10 hover:text-background"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* University Logos */}
        <div className="mt-20">
          <p className="text-center text-sm text-background/50 mb-8">
            TRUSTED BY TOP UNIVERSITIES
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
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
