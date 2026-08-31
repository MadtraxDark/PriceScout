---
title: Integração de edição de lojas
date: 2026-08-31
type: working
status: in_progress
confidence: medium
sources:
  - frontend: PriceScout
  - backend: ScoutApi
---

# Objetivo

Adicionar edição de lojas cadastradas no frontend e backend, incluindo nome, domínio, país, moeda e logo SVG, preservando lojas existentes.

# Checklist

- [completed] Ler skills e mapear os repositórios
- [completed] Inspecionar contratos, rotas, modelos e persistência
- [completed] Implementar backend
- [completed] Implementar frontend
- [completed] Validar testes, build e fluxo visual
- [completed] Registrar limitações e próximos passos

## Validação final

- Frontend: `npm run lint`, `npx tsc --noEmit`, `npm run build` concluídos com sucesso.
- Frontend visual: Chrome confirmou a listagem, o ícone de lápis, abertura do modal, campos e estado vazio de logo.
- Backend: diff revisado e arquivos Python inspecionados; execução de `compileall`/`pytest` bloqueada porque o ambiente não possui `python` nem `py`.
- Navegador integrado: indisponível nesta sessão.
- Próximo passo operacional: aplicar a migração `20260831143000_add_catalog_store_editable_fields.sql` no projeto Supabase antes de publicar o backend/frontend.

## Ajuste posterior

- Extraído o formulário para `components/StoreConfigurationForm.tsx`, com props de loja, mercados e callbacks de salvar, cancelar e upload de logo.
- O preview SVG agora usa container fixo, padding, centralização, `object-fit: contain`, limites explícitos e `overflow: hidden`.
- Validação desta etapa: `npx tsc --noEmit`, `npm run lint`, `npm run build` e `git diff --check` concluídos sem erros.
- Ajuste visual posterior: a grade da lista foi corrigida para cinco colunas no desktop e quatro no mobile; o container da logo passou a 40x40px e a mídia a 32x32px, mantendo a linha em 70px.
- QA visual final no Chrome: logo, nome, domínio, metadados, lápis e link externo permanecem na mesma linha; `object-fit: contain` e `overflow: hidden` confirmados no DOM.

# Registro

- Início: 2026-08-31, America/Sao_Paulo.
- Skills de interface, pesquisa, conselho e navegadores solicitadas foram lidas.
- `impeccable` confirmou que a interface existente e `DESIGN.md` são a autoridade visual; não há `PRODUCT.md`.
- Próximo passo: localizar a tela de lojas e o contrato atual da API.
- Implementação: `CatalogStoreUpdateRequest`, `PATCH /api/v1/catalog/stores/{id}`, `GET /api/v1/catalog/store-markets`, migração de campos da loja, preview SVG e modal de edição.
- Pesquisa: consultadas as documentações oficiais de PostgreSQL e Supabase; escolhida persistência textual do SVG com validação no backend.
- QA visual: Chrome conectado; tela de lojas e modal verificados por DOM e screenshot. Navegador integrado não estava disponível.
- Limitação: Python/py não estão instalados no ambiente, portanto não foi possível executar compileall ou pytest do backend.
- Ajuste tipográfico: reduzido o peso dos rótulos, valores dos campos, seleção de país/moeda, upload e cancelamento; título e ação principal permanecem como pontos de hierarquia.
