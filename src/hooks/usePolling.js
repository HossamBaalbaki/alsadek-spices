import { useEffect, useRef } from "react";

export function usePolling(fn, intervalMs) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const tick = () => fnRef.current();
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}
