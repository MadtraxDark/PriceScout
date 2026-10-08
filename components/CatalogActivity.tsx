"use client";

import Link from "next/link";
import { ImageWithState } from "@/components/ImageViewer";
import { useCatalogActivity } from "@/hooks/useCatalogActivity";
import type { ActivityItem } from "@/utils/api/contracts";
import { activityContext, activityHref, activityTime, activityTitle } from "@/utils/display/activity";

export type CatalogActivityViewProps = {
  items: ActivityItem[];
  loading: boolean;
  error: string;
  nextCursor: string | null;
  loadMore: () => void;
};

export function CatalogActivityView({ items, loading, error, nextCursor, loadMore }: CatalogActivityViewProps) {
  const visible = items.filter((item) => activityTitle(item) !== null);
  return (
    <section className="overview-panel overview-activity" aria-labelledby="catalog-activity-heading" aria-busy={loading}>
      <div className="section-heading"><div><p className="eyebrow">Catálogo e ofertas</p><h2 id="catalog-activity-heading">Atividade recente</h2></div><Link href="/admin/catalogo/alteracoes" className="text-button">Pesquisar alterações</Link></div>
      {error && <p className="overview-muted activity-error" role="status">{error} <button type="button" className="text-button" onClick={loadMore} disabled={loading}>Tentar novamente</button></p>}
      {loading && visible.length === 0 && <p className="overview-muted" role="status">Carregando atividades...</p>}
      {!loading && !error && visible.length === 0 && <p className="overview-muted">Nenhuma atividade registrada no catálogo.</p>}
      {visible.length > 0 && <ul className="overview-list activity-list">{visible.map((item) => {
        const when = activityTime(item.occurred_at);
        return <li key={item.id}><Link href={activityHref(item)} className={`activity-row ${item.offer?.price_direction === "decreased" ? "activity-price-down" : item.offer?.price_direction === "increased" ? "activity-price-up" : ""}`}>
          <span className="overview-product-image activity-thumbnail"><ImageWithState src={item.product.primary_image_url || ""} alt="" showFallbackLabel={false} allowRetry={false} /></span>
          <span className="activity-copy"><strong title={activityTitle(item) || undefined}>{activityTitle(item)}</strong><small title={activityContext(item)}>{activityContext(item)}</small></span>
          <time dateTime={item.occurred_at} title={when.full}>{when.label}</time>
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </Link></li>;
      })}</ul>}
      {nextCursor && !error && <button className="text-button activity-more" type="button" onClick={loadMore} disabled={loading}>{loading ? "Carregando..." : "Ver mais"}</button>}
    </section>
  );
}

export function CatalogActivity() {
  return <CatalogActivityView {...useCatalogActivity()} />;
}
