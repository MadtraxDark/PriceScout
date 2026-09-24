---
id: mem_working_other_store_prices_fix_20260921
type: working
status: active
confidence: 0.95
source: agent
created_at: 2026-09-21
updated_at: 2026-09-21
expires_at: null
related:
  - 2026-09-09-refresh-offers-before-discovery.md
  - 2026-09-09-persisted-product-offers.md
---

# Correção — buscar preços em outras lojas

## Causa raiz (reproduzida na UI)

1. `POST /products` não criava `OfferSnapshot` → ofertas com preço `null` ("Não informado").
2. O botão dizia "Atualizando ofertas existentes" mas **não** chamava `POST /offers/refresh`.
3. Referência usava `variants[0].offers[0]` sem critério.
4. Match incluía a própria loja de referência na descoberta.
5. `SEARCH_UNSUPPORTED` ia também para `unmatched_stores` (deveria ser só ERROR).
6. Integração `/match/stream` em si funcionava (auth/CORS/SSE OK).

## Correções

### ScoutApiV2
- Seed de snapshot no register quando `price`/`pix_price`/`original_price` vêm no body.
- Match exclui a loja de referência.
- `SEARCH_UNSUPPORTED` só em `errors[]`.

### PriceScout
- `selectReferenceUrl()` com score (URL, disponibilidade, preço, loja origem).
- `streamOtherStorePrices`: refresh → `/match/stream` (execução única).
- Import envia preços do preview.
- UI trata `search_result`, AbortError e diagnostics.

## Checklist

- [completed] Reproduzir na UI + network
- [completed] Teste direto `POST /match`
- [completed] Correções backend + frontend
- [completed] Testes unitários backend (16 passed)
- [completed] Validação browser pós-fix (refresh → stream → preços visíveis)
- [completed] tsc frontend OK
- [completed] Docs integração atualizados

## Nota de performance

Match completo em todas as lojas implementadas continua lento (dezenas de minutos).
Isso é esperado com browser/Camoufox por loja; não é falha de integração.
Pendência possível: filtrar por país da referência ou paralelismo controlado.
