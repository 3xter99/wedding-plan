"use client";

import { useEffect } from "react";

export function usePolling(
  onPoll: () => void,
  enabled: boolean,
  intervalMs = 15000
) {
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(onPoll, intervalMs);
    return () => clearInterval(id);
  }, [onPoll, enabled, intervalMs]);
}
