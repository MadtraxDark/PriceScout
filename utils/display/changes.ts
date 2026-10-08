import type { ActivityItem, ActivityType } from "../api/contracts";
import { activityTitle } from "./activity";
import { searchTerms } from "./change-search";

export const changeLabels: Record<ActivityType, string> = {
  product_added: "Produto adicionado",
  new_offer: "Nova oferta",
  price_changed: "Preço alterado",
  promotion_activated: "Promoção ativada",
  promotion_expired: "Promoção expirada",
  promotion_updated: "Promoção alterada",
  availability_changed: "Disponibilidade alterada",
  out_of_stock: "Sem estoque",
  offer_removed: "Oferta removida",
  seller_changed: "Vendedor alterado",
  gtin_learned: "Identificador do produto registrado",
  scrape_failed: "Falha na atualização da oferta",
  unchanged: "Observação sem alteração",
  other: "Outro evento registrado",
};

export function changeLabel(type: string): string {
  return changeLabels[type as ActivityType] ?? "Outro evento registrado";
}

export function changeDescription(item: ActivityItem): string {
  return activityTitle(item) ?? changeLabel(item.type);
}

export function availabilityLabel(value: string | null | undefined): string {
  switch (value) {
    case "available": return "Disponível";
    case "out_of_stock": return "Sem estoque";
    case "unavailable": return "Indisponível";
    case "preorder": return "Pré-venda";
    default: return "Não informada";
  }
}

export type ChangeFilters = { q: string; event_type: string; store: string; from: string; to: string; product_id: string };

export function changeFiltersKey(filters: ChangeFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value.trim()) params.set(key, value.trim());
  return params.toString();
}

export function changeFilterError(filters: ChangeFilters): string {
  try {
    changeQuery(filters);
    if (filters.q.length > 200) return "Use até 200 caracteres na busca.";
    if (searchTerms(filters.q).length > 8) return "Use até oito termos na busca.";
    return "";
  } catch (cause) {
    return cause instanceof Error ? cause.message : "Revise os filtros.";
  }
}

export function filtersFromParams(params: { get: (name: string) => string | null }): ChangeFilters {
  return { q: params.get("q") ?? "", event_type: params.get("event_type") ?? "", store: params.get("store") ?? "", from: params.get("from") ?? "", to: params.get("to") ?? "", product_id: params.get("product_id") ?? "" };
}

function localDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Informe uma data válida.");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error("Informe uma data válida.");
  return date;
}

export function changeQuery(filters: ChangeFilters): Record<string, string | undefined> {
  const start = filters.from ? localDate(filters.from) : null;
  const end = filters.to ? localDate(filters.to) : null;
  if (start && end && start > end) throw new Error("A data inicial deve ser anterior ou igual à final.");
  if (end) end.setDate(end.getDate() + 1);
  return { q: filters.q.trim() || undefined, event_type: filters.event_type || undefined, store: filters.store || undefined, product_id: filters.product_id || undefined, started_at: start?.toISOString(), ended_at: end?.toISOString() };
}
