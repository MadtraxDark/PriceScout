---
id: mem_working_product_duplicate_registration_fix_2026_11_08
type: working
status: validated
confidence: 0.9
source: agent
sources:
  - C:/Users/Thyago/.claude/plans/pasted-content-id-5020-investiga-o-pure-fog.md
  - ../ScoutApi/docs/adr/0054-registration-canonical-identity-resolution.md
  - docs/decisions/0007-product-identity-resolution-on-import.md
created_at: 2026-11-08
updated_at: 2026-11-08
expires_at: null
related:
  - memory/semantic/product-identity-resolution.md
  - memory/working/2026-08-28-product-preview-persistence.md
  - docs/decisions/0003-persisted-product-preview.md
---

# Correcao: cadastro duplicado de produtos

## Objetivo

Impedir que um produto ja cadastrado gere outro `CanonicalProduct`, mantendo a adicao de novas `StoreListing` de outras lojas ao canonico existente.

## Causa raiz (investigacao concluida)

- A: `ProductRegistrationService.register` so reconhecia produto existente por listing da mesma loja ou GTIN; sem GTIN, `get_or_create_canonical` sempre criava.
- B: backend respondia 200 `created=false`; frontend so tratava 409 `existing_product` (inexistente). Mensagem de sucesso ignorava `created` quando havia imagens.
- C: o pre-check por URL no frontend foi removido em `bdefe44`.

## Checklist

- [completed] Backend: resolver de identidade canonica (`modules/matching/canonical_resolver.py`)
- [completed] Backend: `resolution`/`matched_by`/`match_confidence`; reimportacao do mesmo listing sem imagens/snapshot
- [completed] Backend: backfill de GTIN (`_learn_gtin`)
- [completed] Backend: `POST /products/resolve` somente leitura; 409 `PRODUCT_IDENTITY_REVIEW_REQUIRED` com `existing_product`
- [completed] Backend: lock transacional por chave de identidade (Postgres; no-op em SQLite)
- [completed] Backend: testes unitarios (`test_product_registration_dedup.py`, 13 casos) e integracao Postgres (`test_product_registration_concurrency.py`)
- [completed] Backend: suite unit completa: 1268 passed, 2 skipped
- [completed] Frontend: `resolveProduct`, tipos, labels (`utils/display/product-resolution.ts`)
- [completed] Frontend: pagina bloqueia (`existing_listing`), avisa (`existing_product_new_listing`), pede decisao (`needs_review`)
- [completed] Frontend: testes (`import-product.test.ts` 4, `display-labels.test.ts` 20), `tsc`, `npm run build`
- [completed] Docs: ScoutApi ADR 0054, `docs/integration/pricescout.md`, PriceScout ADR 0007, nota na ADR 0003, memoria semantica
- [blocked] Frontend: `npm run lint` (ver Erros)
- [pending] Validacao manual na UI com API e scraping reais (nao executada nesta sessao)

## Decisoes

- Concorrencia entre lojas sem GTIN: `pg_advisory_xact_lock(hashtextextended(chave, 0))` com chave `canonical-identity:{marca}|{modelo}`, adquirida antes da busca por identidade e mantida ate o commit. Um unico lock por transacao (sem risco de ordem/deadlock). Unique constraint em `canonical_products` descartada: nao ha chave natural confiavel sem GTIN.
  Fontes: <https://hakibenita.com/postgresql-get-or-create>, <https://www.netguru.com/codestories/advisory-locks>, <https://forum.elixirforum.com/t/how-to-do-get-or-insert-by-in-ecto-without-race-condition/22160>, <https://chat2db.ai/resources/blog/postgres-advisory-locks-guide>, <https://www.postgresql.org/message-id/CAKAnmmJoX%3DKJyH2g8tWtbSoqJp7nnyeBChaLgF6bbGv1zGLzwg%40mail.gmail.com>
- Resolver reaproveita `identity_reference_item` + `identity_from_price_item` + `MatchingEngine.score` (mesmo criterio do `/match`); pre-filtro por marca normalizada e `canonical_model_key`.
- `auto_match` reutiliza; `review` exige decisao explicita (`target_product_id` ou `create_new_product`); candidato com listing ativo da mesma loja e rebaixado para `review`; empate entre candidatos tambem.
- Atributos estruturados (`edition`, `color`, `storage`...) completam a identidade quando o titulo nao os traz.
- Reimportar o mesmo listing nao registra imagens nem semeia snapshot; apenas aprende GTIN ausente.
- `changeProductUrl` deixou de limpar o bloqueio de duplicidade enquanto ha preview na tela (o bloqueio se perdia ao escolher "Manter produto").

## Erros

- Regressao detectada na suite completa: `test_product_search_model_without_variant_returns_all_editions` (edicoes Dual OC e Prime OC com titulos curtos viravam `needs_review`). Causa: o resolver descartava `attributes.edition`. Correcao: atributos estruturados passam a compor a identidade. Teste de regressao adicionado.
- `test_reimport_same_listing_learns_gtin`: colecao `identifiers` desatualizada na sessao apos inserir GTIN. Correcao: `session.expire(product, ["identifiers"])`.
- `npm run lint` quebrado antes desta tarefa: o commit `b796d05` trocou `eslint-config-next` 16.3.2 por `^15.5.29`, cujo pacote nao tem `exports` (o import `eslint-config-next/core-web-vitals` falha) e cujo `@typescript-eslint` e incompativel com ESLint 9.39. Alternativa usada: config temporaria com `FlatCompat` + `next/core-web-vitals` nos arquivos alterados; sem erros de hooks/Next. Dependencias nao foram alteradas.
- Teste Postgres: banco descartavel `postgres:16-alpine` via Docker (porta 55432), removido ao final. Controle negativo (lock desativado) gera `CanonicalProduct` duplicado; com lock, 1 canonico.

## Limitacoes e trabalho futuro

- Duplicatas ja existentes no banco nao foram unificadas.
- Resolver varre ate 5000 canonicos visiveis; catalogos maiores podem exigir coluna/indice de chave de modelo normalizada.
- Sem marca/modelo identificaveis no scraper, o comportamento continua sendo produto novo.
- Corrigir a configuracao de lint do PriceScout (alinhar `eslint-config-next` com Next 16).
- Nenhum commit foi criado.

## Proximo passo

Validar manualmente na UI com a API local: reimportar a mesma URL (bloqueio), importar o mesmo produto de outra loja (nova oferta) e um caso ambiguo (decisao).
