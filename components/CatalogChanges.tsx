"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CatalogChangeResults } from "@/components/CatalogChangeResults";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useCatalogChangeFilters } from "@/hooks/useCatalogChangeFilters";
import { catalogApi } from "@/utils/api/services";
import type { CatalogStore } from "@/utils/api/contracts";
import { changeLabels, filtersFromParams, type ChangeFilters } from "@/utils/display/changes";
import styles from "./CatalogChanges.module.css";

function Explorer({ filters }: { filters: ChangeFilters }) {
  const { draft, validation, pending, revision, update, submit: applyFilters, clear, setComposing } = useCatalogChangeFilters(filters);
  const [stores, setStores] = useState<CatalogStore[]>([]);
  const [storeError, setStoreError] = useState(false);
  const [storeAttempt, setStoreAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    catalogApi.listStores({ signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) { setStores(result.stores); setStoreError(false); }
    }).catch(() => { if (!controller.signal.aborted) setStoreError(true); });
    return () => controller.abort();
  }, [storeAttempt]);

  function submit(event: FormEvent) {
    event.preventDefault();
    applyFilters();
  }

  return <>
    <div className={styles.heading}><p className="eyebrow">Catálogo e ofertas</p><h1>Alterações</h1><p>Pesquise o histórico de produtos e ofertas e veja onde cada termo foi encontrado.</p></div>
    <form className={styles.filters} onSubmit={submit} aria-label="Pesquisar alterações">
      <label className={styles.search}>Buscar no histórico<input type="search" value={draft.q} onChange={(event) => update("q", event.target.value)} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} maxLength={200} placeholder="Digite termos para pesquisar" aria-describedby="change-search-help" aria-invalid={Boolean(validation)} /></label>
      <label>Tipo de evento<select value={draft.event_type} onChange={(event) => update("event_type", event.target.value)}><option value="">Todos os eventos</option>{Object.entries(changeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Loja<select value={draft.store} onChange={(event) => update("store", event.target.value)} disabled={stores.length === 0}><option value="">Todas as lojas</option>{draft.store && !stores.some((store) => store.id === draft.store) && <option value={draft.store}>Loja selecionada</option>}{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label>
      <label>De<input type="date" value={draft.from} onChange={(event) => update("from", event.target.value)} /></label>
      <label>Até<input type="date" value={draft.to} min={draft.from || undefined} onChange={(event) => update("to", event.target.value)} /></label>
      <div className={styles.actions}><button className={styles.submit} type="submit" disabled={Boolean(validation)}>Pesquisar</button><button type="button" onClick={clear} className={`text-button ${styles.clear}`}>Limpar filtros</button></div>
      <p id="change-search-help" className={styles.help}>Os resultados são atualizados enquanto você digita. Busque por produto, marca, modelo, loja ou vendedor. Todos os termos devem aparecer em algum desses campos. A busca ignora maiúsculas e acentos.</p>
      {draft.product_id && <p className={styles.help}>Histórico restrito ao produto selecionado. Limpe os filtros para pesquisar todo o catálogo.</p>}
      {validation && <p className={styles.notice} role="alert">{validation}</p>}
      {storeError && <p className={styles.notice} role="status">Não foi possível carregar o filtro de lojas. <button type="button" className="text-button" onClick={() => setStoreAttempt((previous) => previous + 1)}>Tentar novamente</button></p>}
    </form>
    <CatalogChangeResults filters={filters} pending={pending} revision={revision} />
  </>;
}

export function CatalogChanges() {
  const params = useSearchParams();
  return <><header className="topbar"><nav aria-label="Caminho da página" className={styles.breadcrumb}><Link href="/admin">Catálogo e ofertas</Link><span aria-hidden="true">/</span><span>Alterações</span></nav><NotificationPanel /></header><div className={`content ${styles.content}`}><Explorer filters={filtersFromParams(params)} /></div></>;
}
