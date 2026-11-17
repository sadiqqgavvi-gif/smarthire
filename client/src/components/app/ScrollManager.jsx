import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Scroll behaviour for a single-page app, matching what users expect from normal websites:
//  - a link to another page opens it at the top (SPA navigation keeps the old scroll otherwise);
//  - a link with a hash, e.g. "/#practice", lands on that section, even from another page
//    or on a fresh load, where the section only exists after React has rendered it;
//  - the browser Back/Forward buttons keep the browser's own scroll restoration.
const HASH_RETRY_MS = 1500;

const scrollToHash = (hash) => {
  const id = decodeURIComponent(hash.slice(1));
  const started = performance.now();
  let frame;

  const attempt = () => {
    const target = document.getElementById(id);
    if (target) {
      // scroll-margin on the section keeps it clear of the fixed navbar.
      target.scrollIntoView({ block: "start" });
      return;
    }
    if (performance.now() - started < HASH_RETRY_MS) frame = requestAnimationFrame(attempt);
  };

  attempt();
  return () => cancelAnimationFrame(frame);
};

export default function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const firstRender = isFirstRender.current;
    isFirstRender.current = false;

    // Back/Forward: let the browser restore where the user was.
    if (navigationType === "POP" && !firstRender) return undefined;

    if (hash) return scrollToHash(hash);
    if (!firstRender) window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash, key, navigationType]);

  return null;
}
