# Decisao de Arquitetura 0008: Importacao com falha fechada e identidade por URL canonica

## Status

Accepted (2026-11-08). Substitui a regra da ADR 0007 que dizia que uma falha em `POST /products/resolve` avisa mas nao bloqueia a aprovacao.

## Contexto

Ao reimportar um produto ja cadastrado, a tela exibia "Nao foi possivel verificar o catalogo agora" e mantinha "Aprovar previa" habilitado. Reproducao em 2026-11-08: a instancia local da API em execucao nao expunha `POST /products/resolve` (resposta 405; o `openapi.json` da instancia listava apenas `POST /products`), embora o codigo em disco tivesse a rota. A consulta falhava e o frontend, por desenho, liberava a aprovacao.

No backend, `TRACKING_KEYS` nao incluia `utm_id` nem `gclsrc`, e `url`/`canonical_url` recebidos nao eram canonicalizados. Sem marca/modelo ou GTIN nao havia lock de concorrencia; o perdedor de uma corrida recebia 409 de integridade em vez de resposta idempotente.

## Decisao

- Frontend, falha fechada: `evaluateImportGate` (`utils/display/import-gate.ts`) e a fonte unica de liberacao. So libera com consulta concluida e resultado `new_product`, `existing_product_new_listing` ou `needs_review` com decisao do usuario. `idle`, `loading`, erro, indisponibilidade, conflito e `existing_listing` bloqueiam. Indisponibilidade mostra mensagem honesta e "Tentar novamente".
- A consulta de identidade usa timeout de 15 s com `AbortController`; respostas antigas sao descartadas.
- Backend (ScoutApi) segue como unica autoridade de identidade; o frontend nao normaliza URL. A ScoutApi canonicaliza `url` e `canonical_url` uma vez no servico de cadastro, amplia os parametros de rastreamento (`utm_*`, `gclsrc`, `dclid`, `msclkid`, `mc_cid`, `mc_eid`, `igshid`) e adquire advisory lock por identidade de loja antes do lock de identidade canonica.
- Em conflito de unicidade (`IntegrityError`), o backend faz rollback e reavalia: se o listing ja existe, responde de forma idempotente (`created=false`); caso contrario mantem 409. Falha de banco continua 503 e nunca vira sucesso.

## Fontes consultadas

Nesta etapa foram reaproveitadas as fontes ja registradas em `memory/working/product-duplicate-registration-fix-2026-11-08.md` (documentacao e artigos sobre `pg_advisory_xact_lock` e get-or-create). Nao foi feita pesquisa nova na internet nesta sessao; essa lacuna fica registrada como pendencia.

## Alternativas descartadas

- Normalizar URL no frontend: duplicaria regra de negocio entre camadas.
- Manter fail-open e confiar so no 409 do `POST /products`: a decisao do usuario e nao permitir persistencia sem validacao de identidade.
- Migracao automatica de `canonical_url` antigos: poderia colidir com a unicidade existente.

## Consequencias e limites

- Listings antigos gravados com URL crua so sao achados por `product_id` ou `sku`.
- Duplicatas ja existentes no banco nao sao unificadas.
- Os testes de concorrencia em Postgres passaram, mas continuaram passando com o novo lock desativado; o comportamento de recuperacao de corrida e comprovado apenas pelo teste unitario que simula `IntegrityError`.
- E preciso reiniciar a API para que a rota `POST /products/resolve` exista na instancia em uso.
