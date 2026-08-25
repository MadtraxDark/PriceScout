"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/utils/api/client";
import { authApi } from "@/utils/api/services";

type AccessState = "checking" | "allowed" | "error";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    // Se houver tokens no hash ou query da URL (retorno de OAuth), armazena imediatamente
    if (typeof window !== "undefined") {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search.substring(1));
        const token = hashParams.get("access_token") || searchParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");
        if (token) {
          localStorage.setItem("access_token", token);
          if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
          sessionStorage.setItem("access_token", token);
        }
      } catch {
        // Ignora erro de parsing
      }
    }

    void authApi.me().then((identity) => {
      if (!active) return;
      if (!identity.is_admin) {
        router.replace("/forbidden");
        return;
      }
      setAccess("allowed");
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && error.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        router.replace("/forbidden");
        return;
      }
      setMessage(error instanceof Error ? error.message : "Não foi possível validar seu acesso.");
      setAccess("error");
    });

    return () => { active = false; };
  }, [attempt, pathname, router]);

  function retryAccess() {
    setAccess("checking");
    setMessage("");
    setAttempt((current) => current + 1);
  }

  if (access === "checking") {
    return <main className="product-admin-shell"><p className="eyebrow">Autenticação</p><h1>Validando acesso...</h1></main>;
  }

  if (access === "error") {
    return <main className="product-admin-shell"><section className="empty-state"><h1>API indisponível</h1><p>{message}</p><button className="primary-button" type="button" onClick={retryAccess}>Tentar novamente</button></section></main>;
  }

  return children;
}
