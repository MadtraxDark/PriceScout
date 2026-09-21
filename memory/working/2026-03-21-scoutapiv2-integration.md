---
title: Integração ScoutApiV2 — PriceScout
date: 2026-03-21
status: completed
tags: [integration, scoutapiv2, auth, products, match]
---

# Integração PriceScout ↔ ScoutApiV2

## Objetivo

Fazer o PriceScout consumir o ScoutApiV2 real (sem mocks), alinhando auth Bearer +
refresh HttpOnly, produtos, crawl, match com progresso SSE, stores e ofertas.

## Checklist

- [x] Audit backend (OpenAPI localhost:8000)
- [x] Audit frontend (utils/api + pages)
- [x] Matriz de integração (`docs/integration/pricescout.md` no backend)
- [x] CORS + endpoints backend faltantes
- [x] API client FE (Bearer, single-flight refresh)
- [x] Auth Google + callback fragment
- [x] Products / crawl / import / search
- [x] Match + stream
- [x] Stores read-only; images obsolete
- [x] Lint/build FE; testes BE; E2E parcial browser
- [x] Docs / README

## Decisões

Ver matriz canônica no ScoutApiV2: `docs/integration/pricescout.md`.

Access token: memória. Refresh: cookie HttpOnly. Admin UI: autenticado (não role).

## Validação E2E (browser)

- Frontend `localhost:3000` + API `localhost:8000`
- `/admin` com `AUTH_REQUIRED=false` (dev-bypass)
- Lista de produtos reais carregou (PS5, Hikvision, smoke)
- Detalhe de produto carregou com listings KaBuM
- CORS OPTIONS PATCH/DELETE OK
- Product Match live multi-store: validado por contrato/SSE; execução live longa
  não repetida nesta sessão (custo/tempo)

## Problemas corrigidos

- Prefixo legado `/api/v1/**`
- Compose sem variáveis CORS/auth/Supabase
- URLs OAuth apontando para rotas Next inexistentes
- `NEXT_PUBLIC_API_BASE_URL` em porta errada
- `listProducts` com `limit=200` (API max 100 → 422)
- Contratos FE desalinhados do ProductPriceItem/MatchHit reais

## Pendências restantes

Nenhuma bloqueante aberta no índice ScoutApiV2 para esta integração.
Limitação aceita: CRUD de imagens Drive não existe no ScoutApiV2.
