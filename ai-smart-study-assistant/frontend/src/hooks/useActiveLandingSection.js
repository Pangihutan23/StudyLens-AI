import { useEffect, useState } from "react";

export const landingSections = [
  { id: "home", target: "hero", label: "Home" },
  { id: "features", target: "features", label: "Features" },
  { id: "how-it-works", target: "how-it-works", label: "How It Works" },
  { id: "about", target: "about", label: "About" },
];

export function useActiveLandingSection() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    let frame = null;
    const update = () => {
      frame = null;
      const readingLine = Math.min(window.innerHeight * 0.3, 240);
      let current = "home";
      for (const { id, target } of landingSections) {
        const section = document.getElementById(target);
        if (section && section.getBoundingClientRect().top <= readingLine) {
          current = id;
        }
      }
      setActive(current);
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return [active, setActive];
}
