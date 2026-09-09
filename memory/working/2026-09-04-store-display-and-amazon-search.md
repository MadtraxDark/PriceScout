---
id: working_2026_09_04_store_display_amazon_search
type: working
status: completed
confidence: 0.95
source: agent
sources:
  - Docker logs do container scoutapi em 2026-09-04
  - https://github.com/browser-use/browser-harness/blob/main/agent-workspace/domain-skills/amazon/product-search.md
  - https://stackoverflow.com/questions/56965738/scrape-a-tag-from-amazon
created_at: 2026-09-04
updated_at: 2026-09-04
expires_at: null
related:
  - memory/working/2026-09-04-cross-store-search-hardening.md
---

# Nome amigavel de lojas e descoberta Amazon

## Objetivo

Separar identificador tecnico de loja e nome exibido na interface, e corrigir a selecao Amazon sem reduzir a precisao de matching.

## Checklist

- [completed] Inspecionar usos de nomes de loja no frontend.
- [completed] Rastrear logs reais da Amazon e identificar causas-raiz (ambiguidade por condicao de seminovo e extracao de HTML estatico no scraper HTTP impersonado).
- [completed] Pesquisar referencias tecnicas de scraping Amazon sem API oficial (anuncios patrocinados, atributos data-asin, extracao via seletores).
- [completed] Centralizar `store_id` e `display_name` no frontend (`utils/store-display.ts`, `contracts.ts`, `services.ts`, `app/admin/produtos/[id]/page.tsx`).
- [completed] Centralizar `store_id` e `display_name` nos contratos e serializacao da ScoutApi.
- [completed] Adicionar distincao de condicao (novo vs seminovo/usado/recondicionado) no matching para eliminar falsa ambiguidade.
- [completed] Adicionar extracao de fallback via HTML/BeautifulSoup na `AmazonInstruction` para atender coletas por `http_impersonated`.
- [completed] Aplicar alteracoes na API e executar suite de testes no container Docker.
- [completed] Validar consulta real da API externa com o produto Galaxy S24 Ultra.
- [completed] Validar exibicao amigavel de Magazine Luiza e Amazon no frontend.

## Evidencias e causas-raiz identificadas

1. **Nomes tecnicos de loja na interface**:
   - `OtherStorePrice` expunha apenas `store`, contendo identificadores como `magazine_luiza` e `mercado_livre`.
   - Criado utilitario centralizado `utils/store-display.ts` com normalizacao e mapa legivel de todas as lojas suportadas (`Magazine Luiza`, `Mercado Livre`, `KaBuM!`, `Amazon`, `Pichau`, `TerabyteShop`).
   - Contratos de frontend atualizados para separar `storeId` e `displayName`.

2. **Falha da Amazon - Causa 1: Ambiguidade indevida com anuncio Seminovo**:
   - Logs de 2026-09-04 comprovam que a busca Amazon retornou o candidato novo correto (`B0CQD9VK7X`, score 80.05) e um candidato seminovo (`B0FTMSQX5Z`, score 79.68).
   - Como o normalizador de atributos nao extraia `condition` (`seminovo`, `recondicionado`, `usado`), ambos foram aceitos como identicos, gerando margem de 0.37 (inferior ao limite minimo de 2.0).
   - O pipeline descartou ambos os candidatos com `decision=ambiguous` sem alcancar o enriquecimento da PDP.
   - Solucao: extrair atributo `condition` no `product_matcher.py`. Como o produto de referencia do catalogo e novo por padrao, qualquer oferta com `seminovo`/`usado`/`recondicionado` gera conflito critico (`novo != seminovo`) e e rejeitada, eliminando a ambiguidade.

3. **Falha da Amazon - Causa 2: Extracao ausente para HTTP Impersonated na PDP**:
   - Teste isolado no container Docker com `http_impersonated` na PDP `https://www.amazon.com.br/dp/B0CQD9VK7X` retornou HTTP 200 com 2.16 MB de HTML valido.
   - Porem, `AmazonInstruction` so extraia dados atraves do script JS executado em navegadores com DOM, dependendo de `raw_data`. Como `http_impersonated` nao executa JS, `raw_data` ficava nulo e `normalize_observation` retornava produto vazio com `name=None` e precos nulos, abortando a etapa como `empty-observation`.
   - Solucao: implementar fallback de extracao HTML via BeautifulSoup em `AmazonInstruction` para extrair titulo (`#productTitle`), preco (`.priceToPay`, `.a-price .a-offscreen`), condicoes e disponibilidade diretamente do HTML estatico, e rejeitar observacao vazia no `observation_is_valid` para forcar escalonamento caso o HTML nao contenha informacoes essenciais.

## Fontes e decisao

O guia de `browser-use/browser-harness` e repositorios abertos recomendam resultados ancorados em `[data-component-type="s-search-result"]`, ASIN em `data-asin`, URL canonica `/dp/{ASIN}` e descarte/depriorizacao de patrocinados por `.puis-sponsored-label-text`. A decisao e aproveitar exclusivamente esses padroes publicos no HTML sem APIs oficiais nem endpoints privados.

## Resultados e validacao

1. **Suite de testes automatizados**:
   - `test_product_search_pipeline.py`: 7/7 passaram no container Docker (exit code 0).
   - Testes especificos adicionados:
     - Rejeicao de oferta de condicao seminovo quando o produto de referencia e novo.
     - Presenca e integridade de `store_id` e `display_name` nos modelos e payload.
     - Extracao HTML de fallback da Amazon via BeautifulSoup sem depender de DOM JS.

2. **Validacao real ponta a ponta com o produto Galaxy S24 Ultra (`51aa8d7c-1ab4-44d6-9b17-93b8d40bd830`)**:
   - Endpoint: `POST /api/v1/catalog/products/51aa8d7c-1ab4-44d6-9b17-93b8d40bd830/other-store-prices`
   - Retorno: HTTP 200 OK com oferta confirmada da Amazon:
     - `store`: `amazon`
     - `store_id`: `amazon`
     - `display_name`: `Amazon`
     - `url`: `https://amazon.com.br/dp/B0CQD9VK7X`
     - `pixPrice`: `5399.00`
     - `cardPrice`: `5999.88`
     - `originalPrice`: `5998.89`
     - `installments`: 12x de R$ 499,99
     - `availability`: `in_stock`
     - `matching`: `accepted: true`, score 82.28, razao `titulo e atributos compativeis`.

3. **Frontend Next.js**:
   - Typecheck `npx tsc --noEmit`: passou sem erros (exit code 0).
   - Build de producao `npm run build`: passou com sucesso em todas as rotas (Next.js 16.3.2 Turbopack).
   - Exibicao amigavel: o componente agora exibe `price.displayName` ("Amazon", "Magazine Luiza", etc.) em vez de chaves tecnicas.
