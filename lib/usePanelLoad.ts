"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePolling } from "@/lib/usePolling";

export function usePanelLoad<T>(
  active: boolean,
  fetcher: (signal?: AbortSignal) => Promise<T>,
  onData: (data: T) => void,
  pollIntervalMs = 15000
) {
  const [loading, setLoading] = useState(true);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetcherRef.current(signal);
      if (signal?.aborted) return;
      onDataRef.current(data);
      setLoading(false);
    } catch (err) {
      if (signal?.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [active, load]);

  usePolling(() => load(), active, pollIntervalMs);

  return { loading, reload: () => load() };
}
