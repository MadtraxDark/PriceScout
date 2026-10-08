"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { catalogApi } from "@/utils/api/services";
import type { ActivityItem } from "@/utils/api/contracts";
import { mergeActivities } from "@/utils/display/activity";

export function useCatalogActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(false);

  const requestPage = useCallback((cursor: string | null) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    return catalogApi.listActivity({ cursor, limit: 15, signal: controller.signal }).then((page) => {
      if (!mounted.current || controller.signal.aborted) return;
      setItems((previous) => mergeActivities(cursor ? previous : [], page.items));
      setNextCursor(page.next_cursor);
      setError("");
    }).catch(() => {
      if (mounted.current && !controller.signal.aborted) setError("Não foi possível carregar a atividade recente.");
    }).finally(() => {
      if (active.current === controller) active.current = null;
      if (mounted.current && !controller.signal.aborted) setLoading(false);
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    void requestPage(null);
    return () => {
      mounted.current = false;
      active.current?.abort();
      active.current = null;
    };
  }, [requestPage]);

  const loadMore = () => {
    if (active.current) return;
    setLoading(true);
    setError("");
    void requestPage(nextCursor);
  };

  return { items, nextCursor, loading, error, loadMore };
}
