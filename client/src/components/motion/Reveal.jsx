import { createElement } from "react";
import useInView from "./useInView";

// Fades and slides its children in when they scroll into view.
export default function Reveal({ as = "div", delay = 0, className = "", children, ...rest }) {
  const [ref, inView] = useInView();

  return createElement(
    as,
    {
      ref,
      style: { transitionDelay: inView ? `${delay}ms` : "0ms" },
      className: `motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
        inView ? "translate-y-0 opacity-100" : "motion-safe:translate-y-8 motion-safe:opacity-0"
      } ${className}`,
      ...rest,
    },
    children
  );
}
