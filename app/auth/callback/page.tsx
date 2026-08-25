"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api/client";
import type { AuthSessionData } from "@/utils/api/services";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState("Concluindo autenticacao com Google...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function processAuth() {
      if (typeof window === "undefined") return;

      try {
        const searchParams = new URLSearchParams(window.location.search.substring(1));
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const error =
          searchParams.get("error_description") ||
          hashParams.get("error_description") ||
          searchParams.get("error") ||
          hashParams.get("error");

        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        let accessToken =
          hashParams.get("access_token") || searchParams.get("access_token");
        let refreshToken =
          hashParams.get("refresh_token") || searchParams.get("refresh_token");

        const nextTarget =
          searchParams.get("next") || hashParams.get("next") || "/admin";

        const code = searchParams.get("code") || hashParams.get("code");

        // Extrai o state retornado pelo Supabase para correlacionar o PKCE verifier
        const state = searchParams.get("state") || hashParams.get("state");

        // Se recebeu Authorization Code, troca via backend FastAPI
        if (!accessToken && code) {
          setStatusText("Validando codigo de autorizacao na API...");

          const callbackQuery = new URLSearchParams();
          callbackQuery.set("code", code);
          if (state) {
            callbackQuery.set("state", state);
          }

          const res = await api.get<AuthSessionData>(
            `/api/v1/auth/google/callback?${callbackQuery.toString()}`
          );

          if (res.success && res.access_token) {
            accessToken = res.access_token;
            refreshToken = res.refresh_token;
          } else {
            throw new Error(res.error || "Falha ao validar sessao na API.");
          }
        }

        if (accessToken) {
          localStorage.setItem("access_token", accessToken);
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }
          sessionStorage.setItem("access_token", accessToken);

          if (!active) return;
          setStatusText("Sessao confirmada. Redirecionando...");
          const destination = nextTarget.startsWith("/")
            ? nextTarget
            : `/${nextTarget}`;
          window.location.replace(destination);
          return;
        }

        throw new Error(
          "Nenhum token ou codigo de autorizacao foi identificado na resposta."
        );
      } catch (err: unknown) {
        if (!active) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Erro ao processar retorno da autenticacao.";
        setErrorMessage(msg);
        setStatusText("Falha na autenticacao.");
        setTimeout(() => {
          router.replace("/login?auth=error");
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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <section
        className="form-panel"
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "2.5rem",
          borderRadius: "1rem",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          {errorMessage ? "Nao foi possivel entrar" : "Autenticando..."}
        </h2>
        <p
          style={{
            color: errorMessage ? "#ef4444" : "#94a3b8",
            marginBottom: "1.5rem",
          }}
        >
          {errorMessage || statusText}
        </p>
        {errorMessage && (
          <button
            className="primary-button"
            type="button"
            onClick={() => router.replace("/login")}
            style={{ marginTop: "1rem" }}
          >
            Voltar para o Login
          </button>
        )}
      </section>
    </main>
  );
}
