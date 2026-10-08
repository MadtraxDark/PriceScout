import { Suspense } from "react";
import { CatalogChanges } from "@/components/CatalogChanges";

export default function CatalogChangesPage() {
  return <Suspense fallback={<main className="product-admin-shell" aria-busy="true"><p role="status">Carregando histórico do catálogo...</p></main>}><CatalogChanges /></Suspense>;
}
