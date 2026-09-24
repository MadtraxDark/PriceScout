---
title: Integração câmbio PriceScout UI
date: 2026-09-22
status: done
objective: Exibir BRL convertido como preço principal e corrigir MENOR PREÇO/sorting
---

## Done

- Contratos TS + mapper `listingToCatalogOffer` com campos FX do ScoutApiV2
- `utils/money.ts`: `formatMoney`, `comparablePriceBrl`, `sortOffersByComparableBrl`
- `components/OfferPrice.tsx`: BRL principal / original secundário
- Cards em "Compare onde comprar" + badge Menor preço normalizado
- Testes `npm run test:money` (11 pass)
- typecheck/build OK
- Backend local: migration 0027 + refresh; produto real com USD/PYG convertidos

## Validação live (produto S25 Ultra)

- Amazon USD 857.30 → converted 4543.69 (MENOR PREÇO)
- Best Buy USD 1099.99 → 5829.95
- Shopping China PYG 6274000 → 5401.78
- KaBuM/Magalu BRL pix 5399 (sem linha duplicada)
