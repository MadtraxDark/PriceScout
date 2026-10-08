"use client";

import styles from "./ProductMatchResults.module.css";
import { memo } from "react";
import { ImageWithState } from "@/components/ImageViewer";
import type { CatalogOffer, MatchRunStatusView, MatchStoreLiveView } from "@/utils/api/contracts";
import { finitePositive } from "@/utils/match-run-offers";
import { formatMoney } from "@/utils/money";
import { getStoreDisplayName } from "@/utils/store-display";
import { matchStoreStatusLabel } from "@/utils/display";

type StoreStatusClass = "pending" | "running" | "match" | "no_match" | "error" | "review" | "refresh_updated" | "refresh_unchanged" | "refresh_out_of_stock" | "refresh_removed" | "refresh_failed" | "refresh_deferred";
const indicatorClasses: Record<StoreStatusClass, string> = {
  pending: styles.storeIndicator_pending,
  running: styles.storeIndicator_running,
  match: styles.storeIndicator_match,
  no_match: styles.storeIndicator_no_match,
  error: styles.storeIndicator_error,
  review: styles.storeIndicator_review,
  refresh_updated: styles.storeIndicator_match,
  refresh_unchanged: styles.storeIndicator_match,
  refresh_out_of_stock: styles.storeIndicator_no_match,
  refresh_removed: styles.storeIndicator_no_match,
  refresh_failed: styles.storeIndicator_error,
  refresh_deferred: styles.storeIndicator_running,
};
const statusClasses: Record<StoreStatusClass, string> = {
  pending: styles.storeStatus_pending,
  running: styles.storeStatus_running,
  match: styles.storeStatus_match,
  no_match: styles.storeStatus_no_match,
  error: styles.storeStatus_error,
  review: styles.storeStatus_review,
  refresh_updated: styles.storeStatus_match,
  refresh_unchanged: styles.storeStatus_match,
  refresh_out_of_stock: styles.storeStatus_no_match,
  refresh_removed: styles.storeStatus_no_match,
  refresh_failed: styles.storeStatus_error,
  refresh_deferred: styles.storeStatus_running,
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
  const completed = storesCompleted ?? stores.filter((store) => store.status !== "pending" && store.status !== "running").length;
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

export const ProgressiveOfferRow = memo(function ProgressiveOfferRow({ result, run, imageUrl, productName }: {
  result: MatchStoreLiveView;
  run: MatchRunStatusView | null;
  imageUrl: string | null;
  productName: string;
}) {
  const price = finitePositive(result.matched_price);
  const converted = finitePositive(result.converted_price_brl);
  const url = publicUrl(result.matched_canonical_url ?? result.matched_url);
  const interrupted = run?.status === "failed" || run?.status === "cancelled";
  const storeName = getStoreDisplayName(result.store, result.matched_url, result.store_display_name);
  return <article className="persisted-offer-row">
    <div className="persisted-offer-image">
      <ImageWithState src={imageUrl ?? ""} alt={productName} />
    </div>
    <div className="persisted-offer-main">
      <div className="persisted-offer-price-line">
        <strong>{price == null ? "Preço não informado" : formatMoney(price, result.matched_currency)}</strong>
        {converted != null && <span>Referência em BRL: {formatMoney(converted, "BRL")}{result.exchange_rate_status === "stale" ? " · Conversão aproximada" : ""}</span>}
      </div>
      <div className="persisted-offer-meta">
        {result.matched_title && <span>{result.matched_title}</span>}
        <span className={styles.label}>{interrupted ? "Busca interrompida · resultado não confirmado no catálogo" : run?.status === "completed" ? "Resultado ainda não reconciliado com o catálogo" : "Resultado parcial · encontrado nesta busca"}</span>
      </div>
    </div>
    <div className="persisted-offer-store">
      <div className="persisted-store-identity">
        <span className="persisted-store-mark" aria-hidden="true">{storeName.slice(0, 2).toLocaleUpperCase("pt-BR")}</span>
        <strong>{storeName}</strong>
      </div>
      {url && <a className="store-offer-link" href={url} target="_blank" rel="noopener noreferrer">
        Ir à loja
        <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </a>}
    </div>
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
