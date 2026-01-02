import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Ease presets
export const eases = {
  smooth: "power2.out",
  snappy: "power3.out",
  elastic: "elastic.out(1, 0.5)",
  bounce: "bounce.out",
  expo: "expo.out",
  circ: "circ.out",
};

// Duration presets
export const durations = {
  micro: 0.2,
  fast: 0.4,
  medium: 0.6,
  slow: 0.8,
  cinematic: 1.2,
};

// Stagger presets
export const staggers = {
  fast: 0.05,
  medium: 0.1,
  slow: 0.15,
  cascade: {
    each: 0.08,
    from: "start",
  },
};

// Common animation configurations
export const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
};

// GSAP ScrollTrigger defaults
export const scrollTriggerDefaults = {
  start: "top 85%",
  end: "bottom 15%",
  toggleActions: "play none none reverse",
};

// Create a reveal animation with ScrollTrigger
export const createScrollReveal = (
  element: gsap.TweenTarget,
  options: {
    y?: number;
    x?: number;
    scale?: number;
    opacity?: number;
    duration?: number;
    delay?: number;
    stagger?: number | gsap.StaggerVars;
    ease?: string;
    start?: string;
    end?: string;
    scrub?: boolean | number;
    markers?: boolean;
  } = {}
) => {
  const {
    y = 40,
    x = 0,
    scale = 1,
    opacity = 0,
    duration = durations.medium,
    delay = 0,
    stagger = 0,
    ease = eases.smooth,
    start = scrollTriggerDefaults.start,
    end = scrollTriggerDefaults.end,
    scrub = false,
    markers = false,
  } = options;

  return gsap.fromTo(
    element,
    { y, x, scale: scale === 1 ? 0.95 : scale, opacity },
    {
      y: 0,
      x: 0,
      scale: 1,
      opacity: 1,
      duration,
      delay,
      stagger,
      ease,
      scrollTrigger: {
        trigger: element as gsap.DOMTarget,
        start,
        end,
        scrub,
        markers,
        toggleActions: scrub ? undefined : scrollTriggerDefaults.toggleActions,
      },
    }
  );
};

// Split text into spans for letter animation
export const splitTextIntoSpans = (text: string): string => {
  return text
    .split("")
    .map((char) =>
      char === " "
        ? '<span class="inline-block">&nbsp;</span>'
        : `<span class="inline-block opacity-0">${char}</span>`
    )
    .join("");
};

// Animate split text letters
export const animateSplitText = (
  container: HTMLElement,
  options: {
    duration?: number;
    stagger?: number;
    ease?: string;
    delay?: number;
  } = {}
) => {
  const {
    duration = 0.05,
    stagger = 0.03,
    ease = "power2.out",
    delay = 0,
  } = options;

  const chars = container.querySelectorAll("span");

  return gsap.fromTo(
    chars,
    { opacity: 0, y: 20, filter: "blur(8px)" },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration,
      stagger,
      ease,
      delay,
    }
  );
};

// Magnetic button effect
export const createMagneticEffect = (
  element: HTMLElement,
  strength: number = 0.3
) => {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(element, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
  };

  element.addEventListener("mousemove", handleMouseMove);
  element.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    element.removeEventListener("mousemove", handleMouseMove);
    element.removeEventListener("mouseleave", handleMouseLeave);
  };
};

// Parallax effect
export const createParallax = (
  element: gsap.TweenTarget,
  speed: number = 0.5,
  options: { start?: string; end?: string } = {}
) => {
  const { start = "top bottom", end = "bottom top" } = options;

  return gsap.fromTo(
    element,
    { y: -100 * speed },
    {
      y: 100 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: element as gsap.DOMTarget,
        start,
        end,
        scrub: true,
      },
    }
  );
};

// Counter animation
export const animateCounter = (
  element: HTMLElement,
  endValue: number,
  options: {
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  } = {}
) => {
  const { duration = 2, prefix = "", suffix = "", decimals = 0 } = options;

  const obj = { value: 0 };

  return gsap.to(obj, {
    value: endValue,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = `${prefix}${obj.value.toFixed(decimals)}${suffix}`;
    },
  });
};

export { gsap, ScrollTrigger };
