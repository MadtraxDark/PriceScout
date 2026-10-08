"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { catalogApi } from "@/utils/api/services";
import { ApiError } from "@/utils/api/client";
import type { ActivityItem } from "@/utils/api/contracts";
import { mergeActivities } from "@/utils/display/activity";
import { changeFiltersKey, changeQuery, filtersFromParams, type ChangeFilters } from "@/utils/display/changes";

export function useCatalogChanges(filters: ChangeFilters, revision = 0) {
  const filterKey = changeFiltersKey(filters);
  const requestKey = `${filterKey}:${revision}`;
  const queryFilters = useMemo(() => filtersFromParams(new URLSearchParams(filterKey)), [filterKey]);
  const [state, setState] = useState({ items: [] as ActivityItem[], nextCursor: null as string | null,
    displayFilters: queryFilters, loadedKey: null as string | null,
    attemptedKey: null as string | null, loading: true, error: "" });
  const active = useRef<AbortController | null>(null);

  const requestPage = useCallback((cursor: string | null) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setState((previous) => ({ ...previous, attemptedKey: requestKey, loading: true, error: "" }));
      return catalogApi.listChanges({ query: changeQuery(queryFilters), cursor, signal: controller.signal });
    }).then((page) => {
      if (!page || controller.signal.aborted || active.current !== controller) return;
      setState((previous) => ({ items: mergeActivities(cursor ? previous.items : [], page.items),
        nextCursor: page.next_cursor, displayFilters: queryFilters, loadedKey: requestKey,
        attemptedKey: requestKey, loading: false, error: "" }));
    }).catch((cause: unknown) => {
      if (controller.signal.aborted || active.current !== controller) return;
      const error = cause instanceof ApiError
        ? cause.status === 403 ? "Sua conta não tem permissão para consultar este histórico."
          : cause.status === 422 ? "Revise os filtros: use até oito termos e um período válido."
          : cause.status === 429 ? "A API pediu uma pausa. Aguarde antes de tentar novamente."
          : "Não foi possível carregar as alterações."
        : cause instanceof Error ? cause.message : "Não foi possível carregar as alterações.";
      setState((previous) => ({ ...previous, attemptedKey: requestKey, loading: false, error }));
    }).finally(() => {
      if (active.current === controller) active.current = null;
    });
  }, [queryFilters, requestKey]);

  useEffect(() => {
    requestPage(null);
    return () => { active.current?.abort(); active.current = null; };
  }, [requestPage]);

  function loadMore() {
    requestPage(state.loadedKey === requestKey ? state.nextCursor : null);
  }

  const loading = state.loading || state.attemptedKey !== requestKey;
  return { ...state, loading, isInitialLoading: loading && state.loadedKey === null,
    isFetching: loading, hasData: state.loadedKey !== null, loadMore };
}
