import { useEffect, useRef, useState } from "react";
import { playbackDuration } from "./animation";
import type { CombatEvent } from "./combat-events";
export function useReducedMotion() {
  const [value, setValue] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setValue(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  return value;
}
/** One clock controls motion, impacts and queue advancement. Pausing never resets its position. */
export function usePlayback(
  event: CombatEvent | undefined,
  fast: boolean,
  paused: boolean,
  enabled: boolean,
  onComplete: () => void,
) {
  const [state, setState] = useState({ id: 0, progress: 0 });
  const clock = useRef({ id: 0, progress: 0 });
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    if (!event) {
      clock.current = { id: 0, progress: 0 };
      setState({ id: 0, progress: 0 });
      return;
    }
    if (clock.current.id !== event.id) {
      clock.current = { id: event.id, progress: 0 };
      setState({ id: event.id, progress: 0 });
    }
    if (paused || !enabled) return;
    let frame = 0,
      last = performance.now(),
      cancelled = false;
    const duration = playbackDuration(event, fast);
    const tick = (now: number) => {
      if (cancelled) return;
      clock.current.progress = Math.min(
        1,
        clock.current.progress + (now - last) / duration,
      );
      last = now;
      setState({ id: event.id, progress: clock.current.progress });
      if (clock.current.progress >= 1) complete.current();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [event?.id, fast, paused, enabled]);
  return state.id === event?.id ? state.progress : 0;
}
