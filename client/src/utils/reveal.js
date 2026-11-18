const prefersReducedMotion = () =>
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

// Brings an element that just appeared (for example answer feedback, which renders below
// the answer and often off screen) into view after React has painted it.
export const revealElement = (id) => {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView?.({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  });
};

export const scrollToTop = () => {
  window.scrollTo?.({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
};
