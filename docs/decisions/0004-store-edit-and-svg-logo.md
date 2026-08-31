# Decisão: edição de lojas e logo SVG

## Contexto

A aba de lojas precisava editar nome, domínio, país, moeda e logo sem quebrar registros existentes.

## Decisão

- O frontend usa um modal alinhado ao padrão administrativo existente.
- País e moeda são escolhidos como uma combinação retornada por `GET /api/v1/catalog/store-markets`; o fallback mostra apenas a combinação já persistida da loja quando a API antiga ainda não expõe o catálogo.
- O SVG é lido como texto no navegador e enviado no mesmo `PATCH` autenticado da loja. O backend limita o tamanho a 1 MB, exige o elemento `svg` e rejeita script, `foreignObject`, handlers de evento e `javascript:`.
- A migração adiciona `country`, `currency` e `logo_svg` com defaults `BR`/`BRL`, preservando lojas antigas.

## Alternativas descartadas

- `multipart/form-data` foi descartado nesta etapa porque a API já aceita JSON, o SVG é um artefato textual e isso evita nova dependência no backend.
- Supabase Storage foi deixado para uma etapa posterior; o campo textual mantém o escopo pequeno e a persistência transacional junto dos dados da loja.

## Fontes consultadas

- [PostgreSQL: constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), para as restrições ISO no banco.
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), para manter alterações atrás da API autenticada e migração reproduzível.

