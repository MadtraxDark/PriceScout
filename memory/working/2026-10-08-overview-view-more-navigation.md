---
id: work_20261008_overview_view_more_navigation
type: working
status: validated
confidence: 1.0
source: user
sources:
  - User prompt
  - app/admin/page.tsx
  - app/admin/catalogo/alteracoes/page.tsx
  - components/CatalogChanges.tsx
  - components/CatalogActivity.tsx
  - utils/display/activity.test.tsx
created_at: 2026-10-08
updated_at: 2026-10-08
expires_at: null
related:
  - work_20261008_overview_redesign
  - work_20261008_overview_panel_alignment
---

# Navegacao dos resumos da visao geral

## Objetivo
Trocar as acoes locais de expansao por navegacao para as listas completas, mantendo cinco itens no resumo.

## Checklist
- [completed] Inspecionar rotas e fluxo oficial de navegacao.
- [completed] Remover expansao local e direcionar as duas acoes para destinos existentes.
- [completed] Validar destinos, limite, ausencia de expansao e verificacoes de codigo.

## Rotas oficiais identificadas
- Alteracoes: `/admin/catalogo/alteracoes`, usada pelo cabecalho e pela navegacao existente.
- Produtos: `/admin?view=products`, usada pela navegacao interna. `openView("products")` atualiza a view e a URL.

## Implementacao
- Produtos: a acao `Ver mais` usa `openView("products")`; `recent_products` continua exibindo no maximo cinco itens.
- Atividade: `Ver mais` e um link para `/admin/catalogo/alteracoes`; a lista do resumo continua exibindo no maximo cinco itens.
- Removidos os estados `productsExpanded` e `expanded`, a expansao local, `Ver menos` e os controles de paginacao local. O retry de falha de carga continua dispon?vel.
- Os dois controles usam a classe visual compartilhada `overview-more-control`.
- O teste de atividade foi atualizado para verificar o destino, a ausencia de expansao local e o limite de cinco linhas.

## Validacao
- Interface local: clicar em `Ver mais` em Produtos abriu `/admin?view=products` e exibiu `Produtos cadastrados`.
- Interface local: clicar em `Ver mais` em Atividade abriu `/admin/catalogo/alteracoes` e exibiu a pagina `Alteracoes`.
- A visao geral apresentou cinco produtos e cinco atividades antes da navegacao.
- `npm run test:activity`: 16 testes passaram.
- `npm run typecheck`: passou.
- `npm run lint -- app/admin/page.tsx components/CatalogActivity.tsx utils/display/activity.test.tsx`: passou.
- `git diff --check`: passou.
- Busca nos arquivos afetados: sem estados/handlers/classes de expansao remanescentes; ocorrencias das expressoes antigas no teste servem somente para garantir sua ausencia no HTML.

## Ferramentas e fontes
Inspecao local de rotas, componentes e navegacao; busca textual com `rg`; interface local via Chrome/CUA; testes de atividade, TypeScript, ESLint e verificacao de whitespace pelo Git. Nenhuma fonte externa foi necessaria para reutilizar rotas existentes.

## Limitacoes
Nao foi feita uma segunda verificacao em viewport mobile nesta tarefa; responsividade ja existente nao foi alterada.
