import { useCallback, useEffect, useRef, useState } from "react";

// Observe once so scrolling back never hides content the reader has already seen.
export function useIntersectionReveal(disabled = false) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const reveal = useCallback(() => setVisible(true), []);

  useEffect(() => {
    if (visible) return;
    if (disabled || typeof window.IntersectionObserver !== "function") {
      reveal();
      return;
    }

    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      // A tall output card should still reveal without needing most of it on screen.
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, reveal, visible]);

  return { ref, visible: visible || disabled, reveal };
}
