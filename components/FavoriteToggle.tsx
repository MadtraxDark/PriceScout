"use client";

import { useState } from "react";
import { catalogApi } from "@/utils/api/services";

export function FavoriteToggle({ productId, initialFavorite }: { productId: string; initialFavorite: boolean }) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (saving) return;
    const previous = favorite;
    setFavorite(!previous);
    setSaving(true);
    setError("");
    try {
      if (previous) await catalogApi.removeFavorite(productId);
      else await catalogApi.putFavorite(productId);
      window.dispatchEvent(new CustomEvent("pricescout:favorites-changed"));
    } catch {
      setFavorite(previous);
      setError("Não foi possível salvar o favorito.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <button className={`favorite-toggle${favorite ? " is-favorite" : ""}`} type="button"
      aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorite} aria-busy={saving} disabled={saving} onClick={() => void toggle()}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill={favorite ? "currentColor" : "none"}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
      </svg>
    </button>
    {error && <span className="favorite-toggle-error" role="status">{error}</span>}
  </>;
}
