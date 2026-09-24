"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { notificationsApi } from "@/utils/api/services";
import type { NotificationView } from "@/utils/api/contracts";
import { playNotificationSound } from "@/utils/match-sound";

const POLL_MS = 20000;

export function useNotifications() {
  const pathname = usePathname();
  const [items, setItems] = useState<NotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const result = await notificationsApi.list({ limit: 30 });
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
    } catch {
      // Keep last known state; avoid toast spam on global poll.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void refresh();
    }, 0);
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [pathname, refresh]);

  async function markRead(notificationId: string) {
    const updated = await notificationsApi.markRead(notificationId);
    setItems((current) =>
      current.map((item) => (item.id === notificationId ? updated : item)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    return updated;
  }

  async function markAllRead() {
    await notificationsApi.markAllRead();
    setItems((current) =>
      current.map((item) => ({
        ...item,
        read_at: item.read_at ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  }

  return { items, unreadCount, loading, refresh, markRead, markAllRead };
}
