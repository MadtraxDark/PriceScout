import { CatalogChangeRow } from "@/components/CatalogChangeRow";
import { useCatalogChanges } from "@/hooks/useCatalogChanges";
import { changeFiltersKey, type ChangeFilters } from "@/utils/display/changes";
import styles from "./CatalogChanges.module.css";

export function CatalogChangeResults({ filters, pending, revision }: { filters: ChangeFilters; pending: boolean; revision: number }) {
  const { items, nextCursor, loading, error, loadMore, displayFilters, isInitialLoading, hasData, loadedKey } = useCatalogChanges(filters, revision);
  const updating = pending || loading;
  const stale = loadedKey !== `${changeFiltersKey(filters)}:${revision}`;
  return <section className={styles.results} aria-labelledby="changes-results-heading" aria-busy={loading || pending}>
    <div className={styles.resultsHeading}><h2 id="changes-results-heading">Histórico registrado</h2><span aria-live="polite">{hasData ? `${items.length} ${items.length === 1 ? "evento carregado" : "eventos carregados"}` : loading ? "Carregando..." : "Nenhum evento carregado"}</span></div>
    <div className={styles.updateStatus}>
      <p className={styles.help} role={error && hasData ? "alert" : "status"}>{error && hasData ? <>Não foi possível atualizar os resultados. <button type="button" className="text-button" onClick={loadMore} disabled={updating}>Tentar novamente</button></> : updating && hasData ? "Atualizando resultados..." : ""}</p>
      <p className={styles.appliedQuery} title={displayFilters.q ? `Correspondências destacadas para “${displayFilters.q}”.` : undefined}>{displayFilters.q ? `Correspondências destacadas para “${displayFilters.q}”.` : ""}</p>
    </div>
    <div className={styles.resultsBody}>
    {isInitialLoading && <div className={styles.empty} role="status">Carregando alterações...</div>}
    {error && !hasData && <div className={styles.empty} role="alert"><p>{error}</p><button type="button" className="text-button" onClick={loadMore} disabled={updating}>Tentar novamente</button></div>}
    {!loading && !pending && !error && items.length === 0 && <div className={styles.empty}><h3>Nenhuma alteração encontrada</h3><p>Revise os termos e os filtros ou amplie o período pesquisado.</p></div>}
    {items.length > 0 && <ul className={styles.list}>{items.map((item) => <CatalogChangeRow key={item.id} item={item} query={displayFilters.q} />)}</ul>}
    </div>
    {nextCursor && <button className={styles.more} type="button" onClick={loadMore} disabled={updating || stale}>{loading && !stale ? "Carregando..." : "Carregar mais eventos"}</button>}
    {hasData && items.length > 0 && !nextCursor && <p className={styles.end}>Fim dos resultados desta pesquisa.</p>}
  </section>;
}
