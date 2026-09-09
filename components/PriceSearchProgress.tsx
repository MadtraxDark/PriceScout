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

function getDisplayEvents(events: PriceSearchEvent[]): EventEntry[] {
  return events.reduce<EventEntry[]>((displayEvents, event, index) => {
    const previous = displayEvents.at(-1);
    if (previous && previous.event.stage === event.stage && previous.event.status === event.status && previous.event.message === event.message) return displayEvents;
    displayEvents.push({ event, index });
    return displayEvents;
  }, []);
}

function getVisibleEvents(events: EventEntry[]) {
  return events.slice(-VISIBLE_EVENT_COUNT);
}

function getLatestRunningIndex(events: PriceSearchEvent[]) {
  return getDisplayEvents(events).reduce((latest, { event, index }) => event.status === "running" ? index : latest, -1);
}

export function PriceSearchProgress({ stores, active }: { stores: StoreProgress[]; active: boolean }) {
  const completed = stores.filter((store) => ["success", "warning", "error", "no_result"].includes(store.status)).length;
  const offers = stores.filter((store) => store.status === "success").length;
  const orderedStores = useMemo(() => [...stores].sort((left, right) => {
    const leftActive = terminalStatuses.has(left.status) ? 1 : 0;
    const rightActive = terminalStatuses.has(right.status) ? 1 : 0;
    return leftActive - rightActive || left.displayName.localeCompare(right.displayName, "pt-BR");
  }), [stores]);
  return <section className="price-search-progress" aria-live="polite" aria-busy={active}>
    <div className="price-search-progress-summary"><div><p className="eyebrow">Progresso da busca</p><strong>{active ? "Busca em andamento" : "Busca concluida"}</strong></div><span>{completed} de {stores.length} lojas concluidas, {offers} com oferta</span></div>
    <div className="price-search-progress-stores">{orderedStores.map((store) => { const displayEvents = getDisplayEvents(store.events); const activeEventIndex = store.status === "running" ? getLatestRunningIndex(store.events) : -1; return <article key={store.store} className={`price-search-store price-search-store--${store.status}`}><div className="price-search-store-heading"><strong>{store.displayName}</strong><span>{statusLabel[store.status]}</span></div><ol aria-label={`Etapas de ${store.displayName}`}>{getVisibleEvents(displayEvents).map(({ event, index }) => <li key={`${event.stage}-${index}`} className={`price-search-stage price-search-stage--${event.status}`}><span aria-hidden="true" />{event.status === "running" && index === activeEventIndex ? <ShinyText text={event.message} speed={1.8} color="#416c8f" shineColor="#d7e8f1" spread={120} direction="left" pauseOnHover={false} disabled={false} /> : <div><strong>{event.message}</strong>{event.candidate_count != null && <small>{event.candidate_count} candidatos</small>}</div>}</li>)}</ol></article>; })}</div>
  </section>;
}
