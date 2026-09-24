---
id: working_product_match_start_confirmation_2026_09_23
type: working
status: draft
confidence: 0.9
source: agent
sources:
  - hooks/useProductMatchRun.ts
  - utils/match-run.ts
  - ScoutApiV2/src/scout_api/modules/matching/router.py
  - ScoutApiV2/src/scout_api/modules/matching/match_run_service.py
created_at: 2026-09-23
updated_at: 2026-09-23
expires_at: null
related: []
---

# Product Match: confirmação de início

## Objetivo

Investigar e corrigir a divergência entre o estado visual de início do
Product Match no PriceScout e a confirmação emitida pelo ScoutApiV2.

## Checklist

- [x] Rastrear clique, request, resposta e polling no frontend.
- [x] Rastrear criação persistente e despacho para o worker no backend.
- [x] Distinguir estado de solicitação pendente de busca confirmada.
- [x] Validar a confirmação antes de ativar a busca na UI.
- [x] Proteger início contra cliques concorrentes no mesmo hook.
- [x] Executar testes e typecheck do frontend.
- [x] Validar API, persistência e worker em ambiente Docker real.
- [x] Confirmar recuperação do estado ativo após recarga.
- [ ] Exercitar visualmente indisponibilidade, erro/timeout, request lento,
  múltiplos cliques e interrupção do worker em ambiente controlado.

## Evidências

- `POST /products/{id}/match-runs` cria uma linha `pending` e responde 202;
  o worker `match-runner` consome a fila persistente em separado.
- O hook só recebe uma Run após o POST ou polling; antes disso, a página usa
  `isStarting` e apresentava o mesmo banner de “em andamento”.
- `PriceScout/.env` aponta a base para `http://localhost:8000` (nenhuma
  credencial foi registrada aqui).
- Alterações da tarefa: validação de ID/produto/status, lock síncrono contra
  cliques rápidos, e texto visual de solicitação até a resposta da API.
- `tests/unit/test_match_runs.py`: 21 passaram.
- Frontend: 9 testes de `utils/match-run.test.ts` passaram; `tsc --noEmit
  --incremental false` e ESLint direcionado passaram.
- Smoke real: `POST /products/{id}/match-runs` respondeu 202; polling após
  recarga respondeu 200; banco mostrou a Run em `running`, attempt 1, lease
  válida e atividade recente. Foi iniciada uma busca real, que continua em
  background após a validação.
- O banner anterior rotulava o período do POST como “em andamento”; isso
  causava a impressão de busca antes da confirmação. Nenhuma falha de request
  ou despacho foi observada no smoke real.
- O acesso inicial ao Docker Engine foi negado pelo sandbox; a consulta foi
  repetida com acesso aprovado e permitiu inspecionar o worker e o PostgreSQL.
- Os smoke tests de falha restantes estão registrados em
  `ScoutApiV2/docs/pending/PENDING-019-pricescout-match-start-failure-smoke.md`.

## Próximos passos

O smoke da matriz de falhas segue aberto em PENDING-019. A Run iniciada durante
o smoke normal continua rodando em background e concluirá pelo lifecycle
normal do worker.
