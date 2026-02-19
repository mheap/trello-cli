import { useEffect, useRef } from "react";
import { useTrello } from "../state/TrelloContext";

export function usePeriodicSync(intervalMs: number) {
  const { syncCache, state } = useTrello();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalMs <= 0) return;

    timerRef.current = setInterval(async () => {
      if (!state.loading) {
        try {
          await syncCache();
        } catch {
          // Silently fail - user will see stale data at worst
        }
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [intervalMs, syncCache, state.loading]);
}
