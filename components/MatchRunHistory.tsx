"use client";

import { useCallback, useEffect, useState } from "react";
import { catalogApi } from "@/utils/api/services";
import type {
  MatchRunDetailView,
  MatchRunStatusView,
  MatchStoreRunView,
} from "@/utils/api/contracts";
import {
  matchDecisionLabel,
  matchRunFailureLabel,
  matchRunStatusLabel,
  matchStoreStatusLabel,
} from "@/utils/display";
import { getStoreDisplayName } from "@/utils/store-display";
import { formatMoney } from "@/utils/money";

function runStatusHeading(run: MatchRunStatusView): string {
  return (
    matchRunFailureLabel(run.status, run.failure_code) ?? matchRunStatusLabel(run.status)
  );
}

function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function storeName(store: MatchStoreRunView): string {
  return getStoreDisplayName(
    store.store,
    store.matched_url,
    store.store_display_name,
  );
}

function StoreDetail({ store }: { store: MatchStoreRunView }) {
  return (
    <article className={`match-run-store match-run-store--${store.status}`}>
      <header>
        <strong>{storeName(store)}</strong>
        <span>{matchStoreStatusLabel(store.status)}</span>
      </header>
      <dl>
        <div>
          <dt>Duração</dt>
          <dd>{formatDurationMs(store.duration_ms)}</dd>
        </div>
        <div>
          <dt>Consultas</dt>
          <dd>{store.queries_count}</dd>
        </div>
        <div>
          <dt>Candidatos</dt>
          <dd>
            {store.candidates_evaluated}/{store.candidates_found}
          </dd>
        </div>
        {store.matched_title && (
          <div>
            <dt>Produto</dt>
            <dd>{store.matched_title}</dd>
          </div>
        )}
        {store.matched_price != null && (
          <div>
            <dt>Preço</dt>
            <dd>
              {(() => {
                const amount =
                  typeof store.matched_price === "number"
                    ? store.matched_price
                    : Number(store.matched_price);
                return Number.isFinite(amount)
                  ? formatMoney(amount, store.matched_currency || "BRL")
                  : "—";
              })()}
            </dd>
          </div>
        )}
        {store.error_message && (
          <div>
            <dt>Erro</dt>
            <dd>{store.error_message}</dd>
          </div>
        )}
      </dl>
      {store.queries.length > 0 && (
        <div className="match-run-queries">
          <p className="eyebrow">Consultas</p>
          <ul>
            {store.queries.map((query) => (
              <li key={query}>{query}</li>
            ))}
          </ul>
        </div>
      )}
      {store.candidates.length > 0 && (
        <div className="match-run-candidates">
          <p className="eyebrow">Candidatos</p>
          <ul>
            {store.candidates.map((candidate) => (
              <li key={`${candidate.sequence}-${candidate.url || candidate.title || ""}`}>
                <strong>{candidate.title || "Sem título"}</strong>
                <span>
                  {matchDecisionLabel(candidate.decision)}
                  {candidate.confidence != null ? ` · ${candidate.confidence}` : ""}
                  {candidate.duration_ms != null
                    ? ` · ${formatDurationMs(candidate.duration_ms)}`
                    : ""}
                </span>
                {candidate.url && (
                  <a href={candidate.url} target="_blank" rel="noopener noreferrer">
                    Abrir
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="match-run-timings">
        <span>Busca: {formatDurationMs(store.search_duration_ms)}</span>
        <span>Fetch: {formatDurationMs(store.candidate_fetch_duration_ms)}</span>
      </div>
    </article>
  );
}

export function MatchRunHistory({
  productId,
  refreshKey = 0,
}: {
  productId: string;
  refreshKey?: number;
}) {
  const [items, setItems] = useState<MatchRunStatusView[]>([]);
  const [detail, setDetail] = useState<MatchRunDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const result = await catalogApi.listMatchRuns(productId, { limit: 15 });
      setItems(result.items);
      setHistoryExpanded(false);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o histórico de buscas.",
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHistory();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadHistory, refreshKey]);

  async function openDetail(runId: string) {
    setDetailLoading(true);
    setError("");
    try {
      const result = await catalogApi.getMatchRunDetails(runId);
      setDetail(result);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o detalhe da busca.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <section className="match-run-history" aria-label="Histórico de buscas">
      <div className="match-run-history-heading">
        <div>
          <p className="eyebrow">Histórico</p>
          <h3>Buscas em outras lojas</h3>
        </div>
        {detail && (
          <button className="outline-button" type="button" onClick={() => setDetail(null)}>
            Voltar ao resumo
          </button>
        )}
      </div>
      {error && <p className="error-notice" role="alert">{error}</p>}
      {detail ? (
        <div className="match-run-detail">
          <div className="match-run-detail-summary">
            <strong>{runStatusHeading(detail.run)}</strong>
            <span>
              {detail.run.matches_found} oferta(s) · {detail.run.no_matches} sem
              correspondência · {detail.run.errors} erro(s)
            </span>
            <span>
              {formatWhen(detail.run.started_at)} · {formatDurationMs(detail.run.total_duration_ms)}
            </span>
            {detail.run.failure_message && (
              <p className="error-notice" role="alert">
                {detail.run.failure_message}
              </p>
            )}
          </div>
          {detailLoading ? (
            <p>Carregando detalhe...</p>
          ) : (
            <div className="match-run-store-grid">
              {detail.stores.map((store) => (
                <StoreDetail key={store.id} store={store} />
              ))}
              {detail.stores.length === 0 && (
                <p className="overview-muted">Nenhum resultado por loja registrado.</p>
              )}
            </div>
          )}
        </div>
      ) : loading ? (
        <p>Carregando histórico...</p>
      ) : items.length === 0 ? (
        <p className="overview-muted">Nenhuma busca registrada para este produto.</p>
      ) : (
        <>
          <ul className="match-run-summary-list">
            {(historyExpanded ? items : items.slice(0, 3)).map((run) => (
              <li key={run.id}>
                <button type="button" onClick={() => void openDetail(run.id)}>
                  <strong>{runStatusHeading(run)}</strong>
                  <span>
                    {formatWhen(run.started_at)} · {run.matches_found} oferta(s) ·{" "}
                    {run.stores_completed}/{run.stores_total} lojas
                  </span>
                  <span>{formatDurationMs(run.total_duration_ms)}</span>
                </button>
              </li>
            ))}
          </ul>
          {items.length > 3 && (
            <button
              className="text-button match-run-history-toggle"
              type="button"
              aria-expanded={historyExpanded}
              onClick={() => setHistoryExpanded((expanded) => !expanded)}
            >
              {historyExpanded ? "Ver menos" : "Ver mais"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
