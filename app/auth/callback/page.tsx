"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api/client";
import { authApi } from "@/utils/api/services";
import type { AuthSessionData } from "@/utils/api/services";

function getSafeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/admin";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState("Concluindo autenticacao com Google...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function processAuth() {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const nextTarget = getSafeNext(searchParams.get("next") || hashParams.get("next"));

      try {
        const error =
          searchParams.get("error_description") ||
          hashParams.get("error_description") ||
          searchParams.get("error") ||
          hashParams.get("error");

        if (error) throw new Error(error);

        // Compatibilidade com retornos antigos que ainda contenham code. O
        // callback nao recebe redirect_frontend_url para retornar JSON e
        // permitir que o backend grave o cookie nesta requisicao.
        const code = searchParams.get("code");
        if (code) {
          setStatusText("Validando codigo de autorizacao na API...");
          const callbackQuery = new URLSearchParams({ code });
          const state = searchParams.get("state");
          if (state) callbackQuery.set("state", state);
          await api.get<AuthSessionData>(
            `/api/v1/auth/google/callback?${callbackQuery.toString()}`
          );
        }

        // A sessao e um cookie HttpOnly criado pelo backend. Nao ler nem
        // persistir access_token/refresh_token no armazenamento do browser.
        setStatusText("Confirmando sessao na API...");
        await authApi.me();

        if (!active) return;
        setStatusText("Sessao confirmada. Redirecionando...");
        window.location.replace(nextTarget);
      } catch (err: unknown) {
        if (!active) return;
        const msg =
          err instanceof Error ? err.message : "Erro ao processar retorno da autenticacao.";
        setErrorMessage(msg);
        setStatusText("Falha na autenticacao.");
        setTimeout(() => {
          if (active) router.replace("/login?auth=error");
        }, 3500);
      }
    }

    void processAuth();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main
      className="login-shell"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}
    >
      <section
        className="form-panel"
        style={{ maxWidth: 480, width: "100%", padding: "2.5rem", borderRadius: "1rem", textAlign: "center" }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          {errorMessage ? "Nao foi possivel entrar" : "Autenticando..."}
        </h2>
        <p style={{ color: errorMessage ? "#ef4444" : "#94a3b8", marginBottom: "1.5rem" }}>
          {errorMessage || statusText}
        </p>
        {errorMessage && (
          <button className="primary-button" type="button" onClick={() => router.replace("/login")} style={{ marginTop: "1rem" }}>
            Voltar para o Login
          </button>
        )}
      </section>
    </main>
  );
}
