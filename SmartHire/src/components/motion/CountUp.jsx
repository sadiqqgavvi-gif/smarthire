import { useEffect, useState } from "react";
import useInView, { prefersReducedMotion } from "./useInView";

// Animates the number inside a value like "30,000+" or "20+" when it becomes visible.
export default function CountUp({ value, duration = 1600 }) {
  const match = String(value).match(/^([\d,]+)(.*)$/);
  const target = match ? Number(match[1].replace(/,/g, "")) : null;
  const suffix = match ? match[2] : "";
  const [ref, inView] = useInView({ threshold: 0.4 });
  const [current, setCurrent] = useState(target === null || prefersReducedMotion() ? target : 0);

  useEffect(() => {
    if (target === null || !inView || prefersReducedMotion()) {
      setCurrent(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration]);

  if (target === null) return <span ref={ref}>{value}</span>;
  return (
    <span ref={ref} className="tabular-nums">
      {current.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
