"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationTypeLabel } from "@/utils/display";

function IconBell() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </svg>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/**
 * Sino + painel da central persistente de notificações (topbar admin).
 */
export function NotificationPanel() {
  const { items, unreadCount, loading, refresh, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    setActionError("");
    if (next) await refresh();
  }

  async function markOne(id: string) {
    try {
      await markRead(id);
      setActionError("");
    } catch {
      setActionError("Não foi possível marcar a notificação como lida.");
    }
  }

  async function markAll() {
    try {
      await markAllRead();
      setActionError("");
    } catch {
      setActionError("Não foi possível marcar todas como lidas.");
    }
  }

  return (
    <div className="notification-panel-root" ref={panelRef}>
      <button
        className="icon-action notification-bell"
        type="button"
        aria-label={unreadCount > 0 ? `Notificações (${unreadCount} não lidas)` : "Notificações"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => void toggleOpen()}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section className="notification-panel" role="dialog" aria-label="Central de notificações">
          <header className="notification-panel-heading">
            <div>
              <p className="eyebrow">Notificações</p>
              <strong>{unreadCount > 0 ? `${unreadCount} não lida(s)` : "Tudo lido"}</strong>
            </div>
            {unreadCount > 0 && (
              <button className="text-button" type="button" onClick={() => void markAll()}>
                Marcar todas
              </button>
            )}
          </header>
          {actionError && <p className="error-notice" role="alert">{actionError}</p>}
          {loading && items.length === 0 ? (
            <p className="notification-empty">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="notification-empty">Nenhuma notificação por enquanto.</p>
          ) : (
            <ul className="notification-list">
              {items.map((item) => {
                const unread = !item.read_at;
                const title =
                  item.title?.trim() || notificationTypeLabel(item.type);
                const body = (
                  <>
                    <strong>{title}</strong>
                    <span>{item.message}</span>
                    <small>{formatWhen(item.created_at)}</small>
                  </>
                );
                return (
                  <li key={item.id} className={unread ? "is-unread" : undefined}>
                    {item.product_id ? (
                      <Link
                        href={`/admin/produtos/${item.product_id}`}
                        onClick={() => {
                          if (unread) void markOne(item.id);
                          setOpen(false);
                        }}
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (unread) void markOne(item.id);
                        }}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
