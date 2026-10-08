import type { ActivityItem } from "../api/contracts";
import { formatMoney } from "../money";

function amount(value: string | null | undefined, currency: string | null | undefined): string | null {
  if (!value || !currency) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? formatMoney(parsed, currency) : null;
}

export function activityTitle(item: ActivityItem): string | null {
  const offer = item.offer;
  const oldPrice = amount(offer?.old_price, offer?.old_currency);
  const newPrice = amount(offer?.new_price, offer?.currency);
  switch (item.type) {
    case "product_added": return `${item.product.title} adicionado ao catálogo`;
    case "new_offer": return newPrice ? `Nova oferta encontrada por ${newPrice}` : "Nova oferta encontrada";
    case "price_changed": {
      const action = offer?.price_direction === "decreased" ? "caiu" : offer?.price_direction === "increased" ? "subiu" : "alterado";
      return oldPrice && newPrice ? `Preço ${action} de ${oldPrice} para ${newPrice}` : "Preço alterado";
    }
    case "offer_removed": return oldPrice ? `Oferta de ${oldPrice} removida` : "Oferta removida";
    case "out_of_stock": return oldPrice ? `Oferta de ${oldPrice} ficou sem estoque` : "Oferta ficou sem estoque";
    case "promotion_activated": return newPrice ? `Promoção ativada por ${newPrice}` : "Promoção ativada";
    case "promotion_expired": return oldPrice ? `Promoção de ${oldPrice} encerrada` : "Promoção encerrada";
    case "promotion_updated":
      return oldPrice && newPrice ? `Promoção alterada de ${oldPrice} para ${newPrice}` : newPrice ? `Promoção alterada para ${newPrice}` : "Promoção alterada";
    case "availability_changed":
      if (offer?.available === true || offer?.availability === "available") return "Oferta voltou a ficar disponível";
      if (offer?.available === false || offer?.availability === "out_of_stock") return "Oferta ficou indisponível";
      return "Disponibilidade da oferta alterada";
    default: return null;
  }
}

export function activityContext(item: ActivityItem): string {
  if (item.type === "product_added") return `${item.product.brand || "Marca não informada"} · Produto adicionado ao catálogo`;
  const prefix = `${item.store?.display_name || "Loja"} · ${item.product.title}`;
  switch (item.type) {
    case "offer_removed": return `${prefix} · Oferta não está mais disponível`;
    case "promotion_expired": return `${prefix} · Preço promocional não está mais vigente`;
    case "out_of_stock": return `${prefix} · Sem estoque`;
    default: return prefix;
  }
}

export function activityHref(item: ActivityItem): string {
  return `/admin/produtos/${encodeURIComponent(item.product.id)}`;
}

export function activityTime(iso: string, now: Date = new Date()): { label: string; full: string } {
  const event = new Date(iso);
  if (!Number.isFinite(event.getTime())) return { label: "Horário indisponível", full: "Horário indisponível" };
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(event);
  const full = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(event);
  const sameDay = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  if (sameDay(event, now)) return { label: time, full };
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(event, yesterday)) return { label: `Ontem, ${time}`, full };
  const date = new Intl.DateTimeFormat("pt-BR").format(event);
  return { label: `${date} · ${time}`, full };
}

export function mergeActivities(previous: ActivityItem[], incoming: ActivityItem[]): ActivityItem[] {
  const unique = new Map(previous.map((item) => [item.id, item]));
  for (const item of incoming) unique.set(item.id, item);
  return [...unique.values()].sort((a, b) => {
    const time = Date.parse(b.occurred_at) - Date.parse(a.occurred_at);
    return time || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
  });
}
