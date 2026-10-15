"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { catalogApi } from "@/utils/api/services";
import type { FavoriteView } from "@/utils/api/contracts";
import { ImageWithState } from "@/components/ImageViewer";
import { getStoreDisplayName } from "@/utils/store-display";

function money(value: string | null, currency: string | null): string {
  if (value === null || currency === null) return "Preço indisponível";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Preço indisponível";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount);
}

export function FavoritesPage() {
  const [items, setItems] = useState<FavoriteView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await catalogApi.listFavorites();
      setItems(response.items);
      setError("");
    } catch {
      setError("Não foi possível carregar seus favoritos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
    const changed = () => void load();
    window.addEventListener("pricescout:favorites-changed", changed);
    return () => window.removeEventListener("pricescout:favorites-changed", changed);
  }, [load]);

  async function toggleAlert(item: FavoriteView) {
    try {
      const updated = await catalogApi.setFavoritePriceAlert(item.product_id, !item.notify_price_drop);
      setItems((current) => current.map((row) => row.product_id === item.product_id
        ? { ...row, notify_price_drop: updated.notify_price_drop, email_available: updated.email_available }
        : row));
    } catch {
      setError("Não foi possível atualizar o alerta de preço.");
    }
  }

  return <div className="catalog-page favorites-page">
    <div className="page-intro"><div><p className="eyebrow">Acompanhamento</p><h1>Favoritos</h1><p className="intro-copy">Produtos que você acompanha e alertas de queda de preço.</p></div></div>
    {error && <p className="error-notice" role="alert">{error}</p>}
    {loading ? <section className="empty-state" aria-busy="true"><h2>Carregando favoritos...</h2></section> : items.length === 0 ? (
      <section className="empty-state"><h2>Você ainda não possui produtos favoritos.</h2><p>Adicione um produto aos favoritos para acompanhar quedas de preço.</p><Link className="outline-button" href="/admin?view=products">Ver produtos</Link></section>
    ) : <section className="favorites-list" aria-label="Produtos favoritos">
      {items.map((item) => <article className="favorite-row" key={item.id}>
        <div className="favorite-product">
          <Link href={`/admin/produtos/${item.product_id}`} className="favorite-image">
            {item.primary_image_url ? <ImageWithState src={item.primary_image_url} alt="" showFallbackLabel={false} allowRetry={false} /> : <span aria-hidden="true">Imagem indisponível</span>}
          </Link>
          <div className="favorite-product-copy">
            <Link href={`/admin/produtos/${item.product_id}`}><h2>{item.title}</h2></Link>
            <strong className="favorite-offer-count">{item.offers_count} {item.offers_count === 1 ? "oferta monitorada" : "ofertas monitoradas"}</strong>
          </div>
        </div>
        <section className="favorite-offers-panel" aria-label={`Preços por loja para ${item.title}`}>
          <h3>Preços por loja</h3>
          {item.offers.length ? <ul className="favorite-offers">{item.offers.map((offer) => <li key={offer.listing_id}><span>{getStoreDisplayName(offer.store, offer.listing_url)}</span><strong>{money(offer.price, offer.currency)}</strong></li>)}</ul> : <p className="favorite-no-offers">Sem oferta disponível no momento</p>}
        </section>
        <div className="favorite-watch">
          {item.last_updated_at && <span className="favorite-updated">Atualizado {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.last_updated_at))}</span>}
          <div className="favorite-alerts">
            <label className="favorite-alert-option"><input type="checkbox" checked={item.notify_price_drop} onChange={() => void toggleAlert(item)} />Notificar quando o preço cair</label>
            {item.notify_price_drop && !item.email_available && <small>Alertas internos continuarão disponíveis, mas não foi possível ativar e-mail.</small>}
          </div>
        </div>
      </article>)}
    </section>}
  </div>;
}
