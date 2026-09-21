"use client";

import { useMemo } from "react";
import ShinyText from "./ShinyText";

export type PriceSearchEvent = {
  type: "store_progress" | "store_result" | string;
  store?: string | null;
  display_name?: string | null;
  stage: string;
  status: "pending" | "running" | "success" | "warning" | "error" | "no_result";
  message: string;
  candidate_count?: number;
  sequence?: number | string | null;
  event_id?: number | string | null;
  attempt?: number | string | null;
  timestamp?: string | null;
  created_at?: string | null;
  occurred_at?: string | null;
};

export type StoreProgress = {
  store: string;
  displayName: string;
  status: PriceSearchEvent["status"];
  events: PriceSearchEvent[];
};

const statusLabel: Record<PriceSearchEvent["status"], string> = { pending: "Aguardando", running: "Em andamento", success: "Concluido", warning: "Aviso", error: "Erro", no_result: "Sem resultado" };
const terminalStatuses = new Set<PriceSearchEvent["status"]>(["success", "warning", "error", "no_result"]);
const VISIBLE_EVENT_COUNT = 5;

type EventEntry = { event: PriceSearchEvent; index: number };

function getEventIdentity(event: PriceSearchEvent): string | null {
  const identity = event.event_id ?? event.sequence ?? (event.attempt != null ? `${event.stage}:${event.attempt}` : null);
  return identity == null ? null : String(identity);
}

function getEventTimestamp(event: PriceSearchEvent): number | null {
  const timestamp = event.timestamp ?? event.created_at ?? event.occurred_at;
  if (!timestamp) return null;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? null : parsed;
}

function compareEvents(left: EventEntry, right: EventEntry): number {
  if (left.event.sequence != null && right.event.sequence != null) {
    const leftSequence = Number(left.event.sequence);
    const rightSequence = Number(right.event.sequence);
    if (Number.isFinite(leftSequence) && Number.isFinite(rightSequence) && leftSequence !== rightSequence) return leftSequence - rightSequence;
    if (String(left.event.sequence) !== String(right.event.sequence)) return String(left.event.sequence).localeCompare(String(right.event.sequence), "en");
  }
  const leftTimestamp = getEventTimestamp(left.event);
  const rightTimestamp = getEventTimestamp(right.event);
  if (leftTimestamp != null && rightTimestamp != null && leftTimestamp !== rightTimestamp) return leftTimestamp - rightTimestamp;
  if (left.event.event_id != null && right.event.event_id != null && String(left.event.event_id) !== String(right.event.event_id)) return String(left.event.event_id).localeCompare(String(right.event.event_id), "en");
  return left.index - right.index;
}

function getOrderedEvents(events: PriceSearchEvent[]): EventEntry[] {
  const seenIdentities = new Set<string>();
  const entries = events.reduce<EventEntry[]>((orderedEvents, event, index) => {
    const identity = getEventIdentity(event);
    if (identity != null) {
      const scopedIdentity = `${event.store ?? ""}:${identity}`;
      if (seenIdentities.has(scopedIdentity)) return orderedEvents;
      seenIdentities.add(scopedIdentity);
    }
    orderedEvents.push({ event, index });
    return orderedEvents;
  }, []);
  return entries.sort(compareEvents);
}

function getVisibleEvents(events: EventEntry[]) {
  return events.slice(-VISIBLE_EVENT_COUNT);
}

export function PriceSearchProgress({ stores, active, phase }: { stores: StoreProgress[]; active: boolean; phase?: string }) {
  const completed = stores.filter((store) => ["success", "warning", "error", "no_result"].includes(store.status)).length;
  const offers = stores.filter((store) => store.status === "success").length;
  const orderedStores = useMemo(() => [...stores].sort((left, right) => {
    const leftActive = terminalStatuses.has(left.status) ? 1 : 0;
    const rightActive = terminalStatuses.has(right.status) ? 1 : 0;
    return leftActive - rightActive || left.displayName.localeCompare(right.displayName, "pt-BR");
  }), [stores]);
  return <section className="price-search-progress" aria-live="polite" aria-busy={active}>
    <div className="price-search-progress-summary"><div><p className="eyebrow">{phase || "Progresso da busca"}</p><strong>{active ? "Sincronização em andamento" : "Sincronização concluída"}</strong></div><span>{completed} de {stores.length} lojas concluidas, {offers} com oferta</span></div>
    <div className="price-search-progress-stores">{orderedStores.map((store) => { const displayEvents = getOrderedEvents(store.events); const visibleEvents = getVisibleEvents(displayEvents); const currentEvent = displayEvents.at(-1)?.event; return <article key={store.store} className={`price-search-store price-search-store--${store.status}`}><div className="price-search-store-heading"><strong>{store.displayName}</strong><span>{statusLabel[store.status]}</span></div><ol aria-label={`Etapas de ${store.displayName}`}>{visibleEvents.map(({ event, index }) => { const isCurrent = store.status === "running" && event === currentEvent && event.status === "running"; return <li key={getEventIdentity(event) ?? `${event.stage}-${index}`} aria-current={isCurrent ? "step" : undefined} className={`price-search-stage price-search-stage--${event.status}${isCurrent ? " price-search-stage--current" : ""}`}><span aria-hidden="true" />{isCurrent ? <ShinyText text={event.message} speed={1.8} color="#416c8f" shineColor="#d7e8f1" spread={120} direction="left" pauseOnHover={false} disabled={false} /> : <div><strong>{event.message}</strong>{event.candidate_count != null && <small>{event.candidate_count} candidatos</small>}</div>}</li>; })}</ol></article>; })}</div>
  </section>;
}
