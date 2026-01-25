import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Rocket, Mail, Twitter, Linkedin, Instagram, Youtube, ArrowRight, ArrowUp, Heart } from "lucide-react";
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
        ".footer-column",
        { opacity: 0, y: 30 },
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
    "Product": [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Integrations", href: "#" },
      { label: "Changelog", href: "#" },
    ],
    "Company": [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
    "Resources": [
      { label: "Blog", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Community", href: "#" },
      { label: "Tutorials", href: "#" },
    ],
    "Earn Money": [
      { label: "Become Partner", href: "#" },
      { label: "Refer Friends", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer ref={footerRef} className="bg-slate-50 border-t border-border/30">
      {/* Main Footer Content */}
      <div ref={contentRef} className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-6 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 footer-column">
            <Link to="/" className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-dark flex items-center justify-center shadow-lg">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Shera<span className="text-accent">Startup</span>
              </span>
            </Link>

            <p className="text-muted-foreground mb-6 leading-relaxed max-w-sm">
              Connect with investors, mentors, and co-founders. The ultimate platform for university entrepreneurs to build and scale.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-white border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="footer-column">
              <h4 className="font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-border/30">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Subscribe to our newsletter</h4>
              <p className="text-sm text-muted-foreground">Get the latest updates and startup tips delivered to your inbox.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Input 
                type="email" 
                placeholder="Enter your email..." 
                className="bg-white border-border/50 rounded-xl min-w-[250px]"
              />
              <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white px-6">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/30">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              © {new Date().getFullYear()} SheraStartup. Made with 
              <Heart className="w-3 h-3 text-red-500 fill-red-500" /> 
              in Bangladesh
            </p>

            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>

            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to top
              <span className="w-8 h-8 rounded-lg bg-white border border-border/50 flex items-center justify-center group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all">
                <ArrowUp className="w-3 h-3" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
