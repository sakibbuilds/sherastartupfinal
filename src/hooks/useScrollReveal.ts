import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  y?: number;
  x?: number;
  scale?: number;
  opacity?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
  start?: string;
  scrub?: boolean | number;
  once?: boolean;
}

export const useScrollReveal = <T extends HTMLElement>(
  options: ScrollRevealOptions = {}
) => {
  const ref = useRef<T>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const {
      y = 40,
      x = 0,
      scale = 0.95,
      opacity = 0,
      duration = 0.8,
      delay = 0,
      stagger = 0,
      ease = "power3.out",
      start = "top 85%",
      scrub = false,
      once = true,
    } = options;

    // Set initial state
    gsap.set(element, { y, x, scale, opacity });

    // Create animation
    animationRef.current = gsap.to(element, {
      y: 0,
      x: 0,
      scale: 1,
      opacity: 1,
      duration,
      delay,
      stagger,
      ease,
      scrollTrigger: {
        trigger: element,
        start,
        scrub,
        once,
        toggleActions: once ? "play none none none" : "play reverse play reverse",
      },
    });

    return () => {
      animationRef.current?.kill();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [options]);

  return ref;
};

export const useStaggerReveal = <T extends HTMLElement>(
  options: ScrollRevealOptions & { childSelector?: string } = {}
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const {
      childSelector = "> *",
      y = 30,
      x = 0,
      scale = 0.98,
      opacity = 0,
      duration = 0.6,
      delay = 0,
      stagger = 0.1,
      ease = "power3.out",
      start = "top 85%",
      once = true,
    } = options;

    const children = container.querySelectorAll(childSelector);

    gsap.set(children, { y, x, scale, opacity });

    gsap.to(children, {
      y: 0,
      x: 0,
      scale: 1,
      opacity: 1,
      duration,
      delay,
      stagger,
      ease,
      scrollTrigger: {
        trigger: container,
        start,
        once,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === container) {
          trigger.kill();
        }
      });
    };
  }, [options]);

  return ref;
};

export const useParallax = <T extends HTMLElement>(
  speed: number = 0.5,
  options: { start?: string; end?: string } = {}
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const { start = "top bottom", end = "bottom top" } = options;

    gsap.fromTo(
      element,
      { y: -100 * speed },
      {
        y: 100 * speed,
        ease: "none",
        scrollTrigger: {
          trigger: element,
          start,
          end,
          scrub: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [speed, options]);

  return ref;
};
