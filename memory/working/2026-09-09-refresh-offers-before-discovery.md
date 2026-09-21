---
id: mem_working_refresh_offers_before_discovery_20260909
type: working
status: draft
confidence: 0.95
source: user
sources:
  - pasted-text.txt
  - components/PriceSearchProgress.tsx
  - app/admin/produtos/[id]/page.tsx
  - ../ScoutApi/app/services/other_store_prices.py
created_at: 2026-09-09
updated_at: 2026-09-09
expires_at: null
related:
  - 2026-09-09-persisted-product-offers.md
---

# Sincronizacao antes da descoberta

## Objetivo

O progresso do botao de busca deve mostrar a fase de atualizacao das ofertas existentes antes da fase de descoberta de novas lojas.

## Decisoes

- O frontend continua consumindo o stream SSE existente.
- Eventos `search_progress` atualizam o titulo da fase; eventos por loja continuam alimentando os cards existentes.
- A lista final continua sendo recarregada pelo detalhe persistido depois da operacao.

## Checklist

- [completed] Investigar o stream e o pipeline atual.
- [completed] Integrar a fase de sincronizacao no backend.
- [completed] Exibir a fase no painel de progresso do frontend.
- [completed] Validar backend no Docker e frontend com lint/build.

## Resultado

O stream agora informa a transicao entre `Atualizando ofertas existentes` e `Buscando novas ofertas`. A lista de ofertas continua sendo recarregada do detalhe persistido ao final da sincronizacao.
