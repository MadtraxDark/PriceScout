"use client";

import type { ReactNode } from "react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ApiError } from "@/utils/api/client";
import { authApi } from "@/utils/api/services";
import { startVisiblePolling } from "@/utils/visible-polling";

type AccessState = "checking" | "allowed" | "error";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");
  const [message, setMessage] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [isChecking, setIsChecking] = useState(false);
  const pollingRef = useRef<ReturnType<typeof startVisiblePolling> | null>(null);
  const showFloatingBell = pathname.startsWith("/admin/produtos");

  const onAccessError = useEffectEvent((error: unknown) => {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      setAccess("checking");
      router.replace(error.status === 401
        ? `/login?next=${encodeURIComponent(pathname)}` : "/forbidden");
      return;
    }
    const limited = error instanceof ApiError && error.status === 429;
    setIsRateLimited(limited);
    setRetryAt(limited && error.retry_after !== null ? Date.now() + error.retry_after * 1000 : 0);
    setNow(Date.now());
    setMessage(limited
      ? "A API pediu uma pausa. A validação será retomada automaticamente."
      : error instanceof Error ? error.message : "Não foi possível validar seu acesso.");
    setAccess((current) => current === "allowed" ? current : "error");
  });

  useEffect(() => {
    // Autorizacao de cada operacao continua na API; navegacao nao reinicia esta consulta.
    const polling = startVisiblePolling(async (signal) => {
      setIsChecking(true);
      try {
        await authApi.me({ signal });
        signal.throwIfAborted();
        setAccess("allowed");
        setMessage("");
        setIsRateLimited(false);
        setRetryAt(0);
      } finally {
        if (!signal.aborted) setIsChecking(false);
      }
    }, () => 5 * 60_000, (error) => onAccessError(error));
    pollingRef.current = polling;
    return () => {
      polling.stop();
      if (pollingRef.current === polling) pollingRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  const remainingSeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const retryButton = (
    <button className="primary-button" type="button" disabled={isChecking || remainingSeconds > 0} aria-busy={isChecking}
      onClick={() => { void pollingRef.current?.refresh(); }}>
      {isChecking ? "Validando acesso..." : remainingSeconds > 0 ? `Tentar novamente em ${remainingSeconds}s` : "Tentar novamente"}
    </button>
  );

  if (access === "checking") {
    return (
      <main className="product-admin-shell">
        <p className="eyebrow">Autenticação</p>
        <h1>Validando acesso...</h1>
      </main>
    );
  }

  if (access === "error") {
    return (
      <main className="product-admin-shell">
        <section className="empty-state" aria-live="polite">
          <h1>{isRateLimited ? "Aguarde um momento" : "Falha ao validar acesso"}</h1>
          <p>{message}</p>
          {retryButton}
        </section>
      </main>
    );
  }

  return (
    <>
      {message && (
        <section className="empty-state" role="status" aria-live="polite">
          <p>{message}</p>
          {retryButton}
        </section>
      )}
      {showFloatingBell && (
        <div className="admin-notification-slot"><NotificationPanel /></div>
      )}
      {children}
    </>
  );
}
