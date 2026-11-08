---
id: mem_semantic_product_identity_resolution
type: semantic
status: validated
confidence: 0.9
source: agent
sources:
  - ../ScoutApi/docs/adr/0054-registration-canonical-identity-resolution.md
  - docs/decisions/0007-product-identity-resolution-on-import.md
  - ../ScoutApi/tests/unit/test_product_registration_dedup.py
  - ../ScoutApi/tests/integration/test_product_registration_concurrency.py
created_at: 2026-11-08
updated_at: 2026-11-08
expires_at: null
related:
  - memory/working/product-duplicate-registration-fix-2026-11-08.md
  - docs/decisions/0003-persisted-product-preview.md
---

# Duplicidade de produto e decidida pela ScoutApi

A prevencao de `CanonicalProduct` duplicado acontece na ScoutApi (`CanonicalIdentityResolver`), nunca no frontend.

- Ordem de evidencia: listing da mesma loja, GTIN, confirmacao do usuario, identidade (marca + `canonical_model_key` + `MatchingEngine.score`).
- `POST /products` devolve `resolution`: `existing_listing`, `existing_product_new_listing`, `needs_review` (como `409 PRODUCT_IDENTITY_REVIEW_REQUIRED`) ou `new_product`.
- `POST /products/resolve` e somente leitura e orienta a tela de adicionar produto antes da aprovacao.
- Produto em outra loja vira nova `StoreListing` do canonico existente; nao e duplicidade.
- Concorrencia entre lojas sem GTIN e serializada por `pg_advisory_xact_lock` por chave de identidade.

Evidencia: testes unitarios de cadastro (12 casos) e teste de concorrencia em PostgreSQL que falha quando o lock e desativado.

Observacao: a ADR 0003 descreve um contrato antigo de `409 existing_product`; nao use como referencia para duplicidade.
