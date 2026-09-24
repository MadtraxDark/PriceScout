---
title: Match Run polling (substituir SSE)
date: 2026-09-22
status: completed
---

# Objetivo

Remover SSE de "Buscar preços em outras lojas" e usar MatchRun persistente + polling + toast + notificações + som + histórico.

## Checklist

- [x] Auditar contratos backend e código SSE
- [x] Contratos + services MatchRun/notifications
- [x] Hook useProductMatchRun + toast/sound
- [x] UI produto (banner, botão, histórico)
- [x] Notification center no admin
- [x] Remover SSE / PriceSearchProgress
- [x] AppToaster + react-hot-toast
- [x] Testes + typecheck + lint (erros introduzidos)

## Decisões

- Polling de status a cada 4s; timer de elapsed local a cada 1s.
- Toast/som só em transição observada RUNNING/PENDING → COMPLETED/FAILED na sessão, dedupe por run_id.
- AbortController no unmount cancela só o fetch de polling; nunca cancela a Match Run no backend.
- NotificationPanel no topbar de `/admin` e slot fixo em `/admin/produtos/*`.
