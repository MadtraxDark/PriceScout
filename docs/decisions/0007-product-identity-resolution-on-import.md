# Decisao de Arquitetura 0007: Resolucao de identidade antes e durante a importacao

## Status

Accepted (2026-11-08). Substitui em parte a ADR 0003 (tratamento de `409` e bloqueio por duplicidade).

## Contexto

A tela de adicionar produto permitia concluir a importacao de um produto ja cadastrado:

- a API respondia `200 created=false` ao reaproveitar um registro, mas a interface so reconhecia duplicidade por `409 existing_product`, que a API nunca enviava;
- com imagens, a mensagem era sempre "Produto salvo", mesmo quando nada novo era criado;
- a verificacao previa por URL foi removida no commit `bdefe44`;
- no backend, o mesmo produto vindo de outra loja sem GTIN gerava um novo `CanonicalProduct`.

## Decisao

- A ScoutApi e a autoridade: `POST /products` resolve a identidade (listing da mesma loja, GTIN, correspondencia por marca, modelo e variante) e nunca cria um segundo canonico para um produto reconhecido. Ver ScoutApi ADR 0054.
- Depois do preview, o frontend consulta `POST /products/resolve` (somente leitura) por `catalogApi.resolveProduct`:
  - `existing_listing`: mostra `DuplicateProductNotice` e bloqueia a aprovacao;
  - `existing_product_new_listing`: informa que a oferta sera adicionada ao produto existente e permite aprovar;
  - `needs_review`: exige que o usuario escolha "mesmo produto" (`target_product_id`) ou "outro produto" (`create_new_product`) em componente proprio;
  - `new_product`: fluxo normal.
- Se a consulta falhar, a interface informa a limitacao e nao bloqueia o cadastro; a API continua impedindo duplicidade.
- `409 PRODUCT_IDENTITY_REVIEW_REQUIRED` em `POST /products` reabre a decisao com o candidato retornado em `existing_product`.
- A mensagem final vem de `resolution` (`productImportMessage`), nunca da presenca de imagens.
- Labels de apresentacao ficam em `utils/display/product-resolution.ts`; enums nao sao renderizados.

## Alternativas descartadas

- Restaurar a comparacao de URL com o catalogo carregado no navegador: nao reconhece o mesmo produto em outra loja e depende de uma lista paginada (limite 100).
- Bloquear qualquer `created=false`: impediria adicionar ofertas de outras lojas ao produto existente.

## Consequencias

- O mesmo anuncio nao e reimportado; o mesmo produto de outra loja vira nova oferta do canonico existente.
- A revisao do preview faz uma chamada adicional a API.
- `duplicateProductFromError` foi substituido por `reviewCandidateFromError`, alinhado ao contrato real da ScoutApi.
