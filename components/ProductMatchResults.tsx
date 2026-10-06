"use client";

import styles from "./ProductMatchResults.module.css";
import { memo } from "react";
import type { CatalogOffer, MatchRunStatusView, MatchStoreLiveView } from "@/utils/api/contracts";
import { finitePositive } from "@/utils/match-run-offers";
import { formatMoney } from "@/utils/money";
import { getStoreDisplayName } from "@/utils/store-display";
import { matchStoreStatusLabel } from "@/utils/display";

type StoreStatusClass = "pending" | "running" | "match" | "no_match" | "error" | "review";
const indicatorClasses: Record<StoreStatusClass, string> = {
  pending: styles.storeIndicator_pending,
  running: styles.storeIndicator_running,
  match: styles.storeIndicator_match,
  no_match: styles.storeIndicator_no_match,
  error: styles.storeIndicator_error,
  review: styles.storeIndicator_review,
};
const statusClasses: Record<StoreStatusClass, string> = {
  pending: styles.storeStatus_pending,
  running: styles.storeStatus_running,
  match: styles.storeStatus_match,
  no_match: styles.storeStatus_no_match,
  error: styles.storeStatus_error,
  review: styles.storeStatus_review,
};

function publicUrl(value: string | null): string | null {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

type StoreProgressProps = {
  stores: MatchStoreLiveView[];
  recovering: boolean;
  storesCompleted?: number;
  storesTotal?: number;
};

export function ProductMatchStoreProgress({ stores, recovering, storesCompleted, storesTotal }: StoreProgressProps) {
  if (!stores.length) return null;
  const completed = storesCompleted ?? stores.filter((store) => store.status === "match" || store.status === "no_match" || store.status === "error").length;
  const total = storesTotal ?? stores.length;

  return <section className={styles.progress} aria-label="Progresso da busca por loja">
    <header className={styles.progressHeading}>
      <h3>Progresso da busca</h3>
      <span className={styles.progressCount}>{completed} de {total} lojas concluídas</span>
    </header>
    {recovering && <p className={styles.recovering} role="status">Aguardando recuperação da busca. Os resultados encontrados foram preservados.</p>}
    <ul className={styles.storeList}>{stores.map((store) => {
      const needsReview = store.matched_decision === "review";
      const status = needsReview ? "review" : store.status;
      return <li className={styles.storeRow} key={store.id}>
        <span className={`${styles.storeIndicator} ${indicatorClasses[status]}`} aria-hidden="true" />
        <strong className={styles.storeName}>{getStoreDisplayName(store.store, store.matched_url, store.store_display_name)}</strong>
        <span className={`${styles.storeStatus} ${statusClasses[status]}`}>
          {needsReview ? "Requer revisão" : matchStoreStatusLabel(store.status)}
        </span>
      </li>;
    })}</ul>
  </section>;
}

export const ProgressiveOfferRow = memo(function ProgressiveOfferRow({ result, run }: { result: MatchStoreLiveView; run: MatchRunStatusView | null }) {
  const price = finitePositive(result.matched_price);
  const converted = finitePositive(result.converted_price_brl);
  const url = publicUrl(result.matched_canonical_url ?? result.matched_url);
  const interrupted = run?.status === "failed" || run?.status === "cancelled";
  return <article className={`persisted-offer-row ${styles.result}`}>
    <div className={styles.resultMain}>
      <div className={styles.resultPriceBlock}>
        <span className={styles.resultStore}>{getStoreDisplayName(result.store, result.matched_url, result.store_display_name)}</span>
        <strong className={styles.price}>{price == null ? "Preço não informado" : formatMoney(price, result.matched_currency)}</strong>
        {converted != null && <span className={styles.conversion}>Referência em BRL: {formatMoney(converted, "BRL")}{result.exchange_rate_status === "stale" ? " · Conversão aproximada" : ""}</span>}
      </div>
      <div className={styles.resultProduct}>
        <p>{result.matched_title || "Produto encontrado"}</p>
        <span className={styles.label}>{interrupted ? "Busca interrompida · resultado não confirmado no catálogo" : run?.status === "completed" ? "Resultado ainda não reconciliado com o catálogo" : "Resultado parcial · encontrado nesta busca"}</span>
      </div>
    </div>
    {url && <a className={styles.storeLink} href={url} target="_blank" rel="noopener noreferrer">Ir à loja</a>}
  </article>;
});

export function ReviewOffers({ offers }: { offers: CatalogOffer[] }) {
  if (!offers.length) return null;
  return <aside className={styles.progress} aria-label="Ofertas em revisão">
    <h3>Ofertas que exigem revisão</h3>
    <ul className={`${styles.storeList} ${styles.reviewList}`}>{offers.map((offer) => {
      const url = publicUrl(offer.canonical_url);
      return <li className={styles.storeRow} key={offer.id}>
        <span className={`${styles.storeIndicator} ${styles.storeIndicator_review}`} aria-hidden="true" />
        <strong className={styles.storeName}>{getStoreDisplayName(offer.source, offer.canonical_url, offer.store?.name, offer.country)}</strong>
        <span className={styles.storeStatus}>Correspondência em revisão</span>
        {url && <a className={styles.reviewLink} href={url} target="_blank" rel="noopener noreferrer">Consultar oferta</a>}
      </li>;
    })}</ul>
  </aside>;
}
