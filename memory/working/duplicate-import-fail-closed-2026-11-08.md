---
id: mem_working_duplicate_import_fail_closed_2026_11_08
type: working
status: active
confidence: 0.8
source: agent
sources:
  - C:/Users/Thyago/.claude/plans/witty-floating-quiche.md
  - docs/decisions/0007-product-identity-resolution-on-import.md
  - memory/working/product-duplicate-registration-fix-2026-11-08.md
created_at: 2026-11-08
updated_at: 2026-11-08
expires_at: null
related:
  - memory/semantic/product-identity-resolution.md
  - memory/working/product-duplicate-registration-fix-2026-11-08.md
---

# Importacao duplicada: falha fechada e identidade por URL

## Objetivo

Impedir que a tela de importacao permita "Aprovar previa" quando a verificacao de catalogo falha ou o produto ja existe, e endurecer o backend (ScoutApi, pasta irma) contra duplicidade por URL com rastreamento e por concorrencia. Caso de teste: MSI A520M-A PRO na KaBuM!.

## Causa raiz

- Reproduzida em 2026-11-08: a API local em execucao nao expoe `POST /products/resolve` (resposta 405; o `openapi.json` da instancia lista apenas `POST /products`). O codigo em disco do ScoutApi tem a rota; o processo em execucao e uma versao antiga. O frontend recebe erro, mostra "Nao foi possivel verificar o catalogo agora" e, por desenho fail-open (ADR 0007, linha 44; `page.tsx` `blocked` e `approvePreview`), libera a aprovacao.
- Frontend: `blocked` so considera `duplicateProduct` e `needs_review`; estados `error`, `loading`, `idle` e resolucao nula nao bloqueiam.
- Backend: `TRACKING_KEYS` sem `utm_id` e `gclsrc`; `url` e `canonical_url` do request nao sao canonicalizados; sem lock quando faltam marca/modelo e GTIN; perdedor de corrida recebe 409 de integridade em vez de resposta idempotente.

## Checklist

- [completed] Reproduzir contra a API local (somente leitura, `POST /products/resolve`)
- [completed] Backend ScoutApi: canonicalizacao, lock por loja, idempotencia, testes. Revisado: 47 passed (idempotency, dedup, registration, kabum); agente reportou 1290 passed, 2 skipped na suite unit completa
- [completed] Frontend: gate fail-closed, retry, labels, testes. Revisado: test:import 18 passed, typecheck sem erros; agente reportou test:display 20 passed
- [completed] ADR 0008 e INDEX
- [blocked] Repetir a reproducao contra a API atualizada: depende de reiniciar a API do usuario (nao reiniciada por mim)
- [pending] Pesquisa tecnica nova na internet (AGENTS.md): nao feita nesta sessao; ADR 0008 reaproveita fontes anteriores e registra a lacuna

## Decisoes

- Regra de identidade fica somente no backend; o frontend nao normaliza URL.
- Falha ou indisponibilidade da verificacao bloqueia a aprovacao (decisao do usuario, substitui ADR 0007).
- Nao reiniciar o processo da API do usuario sem pedido; informar que precisa reiniciar.

## Erros

- Nenhum ate agora.

## Proximo passo

Aguardar os dois agentes, revisar diffs, rodar testes e validar.
