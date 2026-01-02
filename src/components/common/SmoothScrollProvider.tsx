import { createContext, useContext, ReactNode } from "react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

interface SmoothScrollContextType {
  scrollTo: (target: string | number | HTMLElement, options?: {
    offset?: number;
    duration?: number;
    immediate?: boolean;
  }) => void;
  stop: () => void;
  start: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType | null>(null);

export const SmoothScrollProvider = ({ children }: { children: ReactNode }) => {
  const { scrollTo, stop, start } = useSmoothScroll();

  return (
    <SmoothScrollContext.Provider value={{ scrollTo, stop, start }}>
      {children}
    </SmoothScrollContext.Provider>
  );
};

export const useSmoothScrollContext = () => {
  const context = useContext(SmoothScrollContext);
  if (!context) {
    throw new Error("useSmoothScrollContext must be used within a SmoothScrollProvider");
  }
  return context;
};
