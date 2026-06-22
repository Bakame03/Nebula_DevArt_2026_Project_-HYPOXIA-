import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getInitial(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

/**
 * True when the OS-level "reduce motion" accessibility setting is on. Used to
 * suppress the most vestibular-triggering effects (screen glitch, chromatic
 * aberration, camera shake, the heartbeat pulse) for visitors who ask for it.
 *
 * Reads the initial value lazily (so there's no synchronous setState in an
 * effect) and only subscribes for later changes.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getInitial);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
