# Working memory — Product Match fix follow-up (2026-09-22)

## Backend (ScoutApiV2)

Corrigido nesta sessão:

- Worker não segura lock de `product_match_runs` durante o Match
- Referência prioriza Kabum/Amazon/Magalu; fallback identidade se scrape falhar
- API `MATCH_RUN_WORKER_ENABLED=false` no compose (match-runner é canônico)
- Cor: bare `Titânio` compatível com `Titânio Preto` (MISSING ≠ CONFLICT)

Live S25 Ultra: Run completed, Amazon BR `B0DSYJCY45` MATCH.

## FE

- Backoff em 429 no `useProductMatchRun` polling
- Fluxo continua: POST match-runs → poll → toast → notifications (sem SSE)

## Validar no browser

1. Abrir produto S25 Ultra
2. Buscar preços em outras lojas
3. Confirmar banner/timer, sem SSE, toast único, offers atualizam
