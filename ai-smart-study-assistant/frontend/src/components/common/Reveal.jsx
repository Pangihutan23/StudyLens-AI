import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { useIntersectionReveal } from "../../hooks/useIntersectionReveal";

const MotionLink = motion.create(Link);
const elements = {
  div: motion.div,
  section: motion.section,
  footer: motion.footer,
  link: MotionLink,
};

export default function Reveal({
  as = "div",
  children,
  className = "",
  delay = 0,
  distance = as === "link" ? 0 : 18,
  onFocusCapture,
  ...props
}) {
  const reduced = useReducedMotion();
  const { ref, visible, reveal } = useIntersectionReveal(!!reduced);
  const Element = elements[as] || motion.div;

  return (
    <Element
      {...props}
      ref={ref}
      className={`reveal ${className}`}
      data-reveal={visible ? "visible" : "pending"}
      initial={reduced ? false : { opacity: 0, y: distance }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      transition={{
        duration: reduced ? 0 : 0.55,
        delay: reduced ? 0 : Math.min(Math.max(delay, 0), 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      onFocusCapture={(event) => {
        // Keyboard users can reach links even before an observer notification.
        reveal();
        onFocusCapture?.(event);
      }}
    >
      {children}
    </Element>
  );
}
