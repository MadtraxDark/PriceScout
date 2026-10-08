import Link from "next/link";
import { ImageWithState } from "@/components/ImageViewer";
import type { ActivityItem } from "@/utils/api/contracts";
import { activityHref, activityTime } from "@/utils/display/activity";
import { availabilityLabel, changeDescription, changeLabel } from "@/utils/display/changes";
import { highlightParts } from "@/utils/display/change-search";
import { formatMoney } from "@/utils/money";
import styles from "./CatalogChanges.module.css";

export function HighlightedText({ text, query }: { text: string; query: string }) {
  return <>{highlightParts(text, query).map((part, index) => part.matched
    ? <mark className={styles.match} key={index}>{part.text}</mark>
    : <span key={index}>{part.text}</span>)}</>;
}

function historicalMoney(value: string | null | undefined, currency: string | null | undefined): string {
  const parsed = Number(value);
  return value && currency && Number.isFinite(parsed) && parsed > 0 ? formatMoney(parsed, currency) : "Não informado";
}

export function CatalogChangeRow({ item, query }: { item: ActivityItem; query: string }) {
  const offer = item.offer;
  const when = activityTime(item.occurred_at);
  const seller = offer?.old_seller || offer?.seller;
  const fields = offer ? [
    { label: "Preço", before: historicalMoney(offer.old_price, offer.old_currency), after: historicalMoney(offer.new_price, offer.currency) },
    { label: "Vendedor", before: offer.old_seller || "Não informado", after: offer.seller || "Não informado" },
    { label: "Disponibilidade", before: availabilityLabel(offer.old_availability), after: availabilityLabel(offer.availability) },
  ] : [];

  return <li className={styles.row}>
    <div className={styles.rowHeader}>
      <span className={styles.thumbnail}><ImageWithState src={item.product.primary_image_url || ""} alt="" showFallbackLabel={false} allowRetry={false} /></span>
      <div className={styles.copy}>
        <Link href={activityHref(item)} className={styles.product}><HighlightedText text={item.product.title} query={query} /></Link>
        <p className={styles.identity}><HighlightedText text={`${item.product.brand || "Marca não informada"}${item.product.model ? ` · ${item.product.model}` : ""}`} query={query} /></p>
      </div>
      <time dateTime={item.occurred_at} title={when.full}>{when.full}</time>
    </div>
    <div className={styles.event}>
      <span className={styles.badge}>{changeLabel(item.type)}</span>
      {item.store && <span><HighlightedText text={item.store.display_name} query={query} /></span>}
    </div>
    <p className={styles.description}>{changeDescription(item)}</p>
    {seller && <p className={styles.seller}>Vendedor: <HighlightedText text={offer?.old_seller || "Não informado"} query={query} /> <span aria-label="para">→</span> <HighlightedText text={offer?.seller || "Não informado"} query={query} /></p>}
    {offer && <details className={styles.details}>
      <summary>Ver evidências históricas</summary>
      <div className={styles.evidence}>
        <table><caption className={styles.visuallyHidden}>Valores históricos antes e depois do evento</caption>
          <thead><tr><th scope="col">Campo</th><th scope="col">Antes</th><th scope="col">Depois</th></tr></thead>
          <tbody>{fields.map((field) => <tr key={field.label}><th scope="row">{field.label}</th><td><HighlightedText text={field.before} query={query} /></td><td><HighlightedText text={field.after} query={query} /></td></tr>)}</tbody>
        </table>
        {offer.promotion_expires_at && <p>Expiração observada: {activityTime(offer.promotion_expires_at).full}</p>}
        <p>Valores ausentes não foram registrados no evento. Produto, marca, modelo e imagem refletem o catálogo atual.</p>
      </div>
    </details>}
  </li>;
}
