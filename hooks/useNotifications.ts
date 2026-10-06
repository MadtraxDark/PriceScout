"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startVisiblePolling } from "@/utils/visible-polling";
import { ApiError } from "@/utils/api/client";
import { notificationsApi } from "@/utils/api/services";
import type { NotificationView } from "@/utils/api/contracts";
import { playNotificationSound } from "@/utils/match-sound";

const POLL_MS = 20000;

export function useNotifications() {
  const [items, setItems] = useState<NotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof startVisiblePolling> | null>(null);

  const load = useCallback(async (signal: AbortSignal) => {
    try {
      const result = await notificationsApi.list({ limit: 30, signal });
      signal.throwIfAborted();
      setError("");
      setItems(result.items);
      setUnreadCount(result.unread_count);
      if (!primedRef.current) {
        for (const item of result.items) seenIdsRef.current.add(item.id);
        primedRef.current = true;
      } else {
        for (const item of result.items) {
          if (seenIdsRef.current.has(item.id)) continue;
          seenIdsRef.current.add(item.id);
          if (
            item.read_at == null &&
            item.type === "PRODUCT_MATCH_COMPLETED" &&
            item.match_run_id
          ) {
            void playNotificationSound(`match-run:${item.match_run_id}`);
          }
        }
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await pollingRef.current?.refresh();
  }, []);

  useEffect(() => {
    const polling = startVisiblePolling(load, () => POLL_MS, (error) => {
      setError(error instanceof ApiError && error.status === 429
        ? "A atualização das notificações foi pausada pela API e será retomada automaticamente."
        : "Não foi possível atualizar as notificações. Uma nova tentativa será feita automaticamente.");
    });
    pollingRef.current = polling;
    return () => {
      polling.stop();
      if (pollingRef.current === polling) pollingRef.current = null;
    };
  }, [load]);

  async function markRead(notificationId: string) {
    const updated = await notificationsApi.markRead(notificationId);
    setItems((current) =>
      current.map((item) => (item.id === notificationId ? updated : item)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    return updated;
  }

  async function markAllRead() {
    const updated = await notificationsApi.markAllRead();
    setUnreadCount(updated.unread_count);
    const result = await notificationsApi.list({ limit: 30 });
    setItems(result.items);
    setUnreadCount(result.unread_count);
  }

  return { items, unreadCount, loading, error, refresh, markRead, markAllRead };
}
