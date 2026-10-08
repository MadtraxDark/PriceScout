"use client";

import { useCallback, useEffect, useState } from "react";
import { changeFilterError, changeFiltersKey, type ChangeFilters } from "@/utils/display/changes";

export const CHANGE_SEARCH_DELAY_MS = 300;

export function useCatalogChangeFilters(filters: ChangeFilters) {
  const urlKey = changeFiltersKey(filters);
  const [state, setState] = useState({ draft: filters, urlKey, publishedKey: urlKey });
  const [revision, setRevision] = useState(0);
  const [composing, setComposing] = useState(false);

  // External navigation restores its filters; our URL publication preserves
  // characters typed after publication, without remounting the focused input.
  if (state.urlKey !== urlKey) {
    setState({
      ...state,
      urlKey,
      publishedKey: urlKey,
      draft: state.publishedKey === urlKey ? state.draft : filters,
    });
  }

  const draft = state.draft;
  const draftKey = changeFiltersKey(draft);
  const validation = changeFilterError(draft);
  const pending = composing || (!validation && draftKey !== urlKey);

  const publish = useCallback((values: ChangeFilters, method: "replace" | "push") => {
    if (changeFilterError(values)) return;
    const nextKey = changeFiltersKey(values);
    setState((previous) => ({ ...previous, draft: values, publishedKey: nextKey }));
    const href = `/admin/catalogo/alteracoes${nextKey ? `?${nextKey}` : ""}`;
    if (nextKey === urlKey) setRevision((previous) => previous + 1);
    else if (method === "replace") window.history.replaceState(null, "", href);
    else window.history.pushState(null, "", href);
  }, [urlKey]);

  useEffect(() => {
    if (composing || validation || draftKey === urlKey) return;
    const timer = window.setTimeout(() => publish(draft, "replace"), CHANGE_SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [composing, validation, draftKey, urlKey, draft, publish]);

  function update(name: keyof ChangeFilters, value: string) {
    setState((previous) => ({ ...previous, draft: { ...previous.draft, [name]: value } }));
  }

  function submit() {
    if (!composing) publish(draft, "push");
  }

  function clear() {
    publish({ q: "", event_type: "", store: "", from: "", to: "", product_id: "" }, "push");
  }

  return { draft, validation, pending, revision, update, submit, clear, setComposing };
}
