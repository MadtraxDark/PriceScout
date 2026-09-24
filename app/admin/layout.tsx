"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ApiError } from "@/utils/api/client";
import { authApi } from "@/utils/api/services";

type AccessState = "checking" | "allowed" | "error";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  // Home `/admin` já tem o sino no topbar; rotas aninhadas usam slot fixo.
  const showFloatingBell = pathname.startsWith("/admin/produtos");

  useEffect(() => {
    let active = true;

    // Qualquer usuário autenticado tem acesso ao painel.
    // is_admin não é verificado — o admin UI é auth-only.
    void authApi
      .me()
      .then(() => {
        if (!active) return;
        setAccess("allowed");
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        if (error instanceof ApiError && error.status === 403) {
          router.replace("/forbidden");
          return;
        }
        setMessage(
          error instanceof Error ? error.message : "Nao foi possivel validar seu acesso.",
        );
        setAccess("error");
      });

    return () => {
      active = false;
    };
  }, [attempt, pathname, router]);

  function retryAccess() {
    setAccess("checking");
    setMessage("");
    setAttempt((current) => current + 1);
  }

  if (access === "checking") {
    return (
      <main className="product-admin-shell">
        <p className="eyebrow">Autenticacao</p>
        <h1>Validando acesso...</h1>
      </main>
    );
  }

  if (access === "error") {
    const isRateLimited = /limite|429|rate/i.test(message);
    return (
      <main className="product-admin-shell">
        <section className="empty-state">
          <h1>{isRateLimited ? "Aguarde um momento" : "Falha de autenticacao"}</h1>
          <p>{message}</p>
          <button className="primary-button" type="button" onClick={retryAccess}>
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      {showFloatingBell && (
        <div className="admin-notification-slot">
          <NotificationPanel />
        </div>
      )}
      {children}
    </>
  );
}
