# Working memory — Match Run persistente (sem SSE)

Data: 2026-09-22

## Mudança

"Buscar preços em outras lojas" deixou de usar `POST /match/stream` (SSE).

Novo fluxo PriceScout:

1. `POST /products/{id}/match-runs` (202)
2. Banner + timer local a partir de `started_at`
3. Polling ~4s em `GET /match-runs/{id}` / active
4. Toast (`react-hot-toast`) + som local + central `/notifications`
5. Histórico/detalhe via `MatchRunHistory`

## Arquivos-chave FE

- `hooks/useProductMatchRun.ts`
- `hooks/useNotifications.ts`
- `components/ProductMatchBanner.tsx`
- `components/MatchRunHistory.tsx`
- `components/NotificationPanel.tsx`
- `components/AppToaster.tsx`
- `utils/match-sound.ts`
- `public/sounds/notification.wav`
- `public/sounds/match-complete.wav`

## Não fazer

- Reintroduzir EventSource/SSE neste fluxo
- Usar `alert`/`confirm`/`prompt`
- Cancelar Match Run ao desmontar a página
