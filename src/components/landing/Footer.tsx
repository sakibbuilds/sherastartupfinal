import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Rocket, Mail, Twitter, Linkedin, Instagram, Youtube, ArrowRight, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current?.querySelectorAll(":scope > *") || [],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            once: true,
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    gsap.to(window, { duration: 1, scrollTo: 0, ease: "power3.inOut" });
  };

  const footerLinks = {
    "Products": [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Integrations", href: "#" },
      { label: "Changelog", href: "#" },
    ],
    "Company": [
      { label: "About us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact us", href: "#" },
    ],
    "Resources": [
      { label: "Blog", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Community", href: "#" },
      { label: "Tutorials", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer ref={footerRef} className="bg-foreground text-white pt-20 pb-8">
      <div ref={contentRef} className="container mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                Shera<span className="text-primary">Startup</span>
              </span>
            </Link>

            <p className="text-white/60 mb-8 max-w-sm leading-relaxed">
              Connect with investors, mentors, and co-founders. The ultimate platform for university entrepreneurs.
            </p>

            {/* Newsletter */}
            <div className="mb-8">
              <h4 className="font-semibold mb-3">Quick Notice & Updates</h4>
              <p className="text-white/60 text-sm mb-4">Get our latest updates, offers and tips right in your inbox.</p>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email..." 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full"
                />
                <Button className="rounded-full bg-gradient-accent shadow-orange px-6">
                  Get it Now
                </Button>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-6">{title}</h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      className="text-white/60 hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>

          {/* Legal */}
          <div className="flex items-center gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">Privacy policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms & condition</a>
          </div>

          {/* Scroll to top */}
          <button
            onClick={scrollToTop}
            className="group flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Back to top
            <span className="p-1.5 rounded-lg bg-white/10 group-hover:bg-primary transition-colors">
              <ArrowUp className="w-3 h-3" />
            </span>
          </button>
        </div>

        {/* Copyright */}
        <div className="text-center mt-8 pt-8 border-t border-white/5">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} SheraStartup. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
