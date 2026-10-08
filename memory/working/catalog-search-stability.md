---
id: mem_catalog_search_stability_20261007
type: working
status: validated
confidence: 0.98
source: user
sources:
  - https://react.dev/reference/react/useEffect
  - https://nextjs.org/docs/app/getting-started/linking-and-navigating
created_at: 2026-10-07
updated_at: 2026-10-07
expires_at: null
related:
  - docs/catalog-changes.md
  - memory/working/incremental-catalog-search.md
---

Objetivo: eliminar colapso transitório da busca incremental.
- completed: reproduzir e medir a causa no Chrome com resposta real atrasada.
- completed: preservar dados e container durante refetch, separar loading inicial.
- completed: testes de estados, layout, concorrência e gates; documentação atualizada.
- completed: regressão final do harness isolado e encerramento da revisão.

Diagnóstico: `CatalogChangeResults` usava key de filtros/revision; nova consulta
remontava hook com items=[], loading=true. Altura medida 6018,5 -> 230,19 ->
6009,08px, 25 -> 0 -> 25 itens. Container recriado, formulário preservado.
Indicador pending também inseria parágrafo e removia o rodapé entre estados.
Sem router.replace, animação de altura ou fallback Suspense durante a request.
Ferramentas: PowerShell direto, Playwright CLI e PerformanceObserver; sem Cursor.
Skills: frontend-ui-engineering e debugging-and-error-recovery.
Documentação oficial React/Next consultada. Primeiro path local do guia Next
não existia; localizar com rg. Nenhuma dependência nova será instalada.

Implementação: sem key variável nos resultados; hook reage a critérios/revision,
aborta request anterior e conserva última resposta aceita. Substituição atômica
de dados/cursor/highlights; loading inicial separado de refetch. Aviso e retry
discretos; rodapé preservado e paginação desabilitada durante atualização.
Status usa linhas reservadas; corpo sem dados usa min-height 160px, sem height fixa.

Conferência Chrome real: 6067,28px antes e durante refetch, 25 itens e contador
preservados, mesmos elementos region/list/form, scroll=120 e posição do input
idênticos. Nenhum layout-shift no intervalo medido. Mobile 320px: 8329,16px
antes/durante, mesma posição do input, erro de atualização sem mudar altura.
Zero erro JavaScript. Sucesso vazio substitui a lista; sem dados vazios transitórios.
Regressão incremental anterior passou IME, URL, voltar/avançar, concorrência,
cursor e filtros. 23 testes direcionados, lint, typecheck e build aprovados.
Novo teste foi formatado e aprovado no Ruff após corrigir linhas longas.
Não foi medido ganho de CPU/renderizações; identidade DOM e geometria verificadas.

Conferência final: sequência 580/5800/5800x/5800x3/5800x3d com teclado passou.
Harness isolado PostgreSQL/Chrome passou paginação 25->34, filtro para 1 evento,
highlights, URL, navegação e retry em 16,55s; banco/API temporários removidos.
Teste versionado: `ScoutApiV2/tests/e2e/catalog_changes_stability_browser.py`.
Documentation impact review: docs/catalog-changes.md e contrato de interface
docs/matching/catalog-changes.md atualizados. Sem alteração em API, schema,
dependências, configuração ou arquitetura, sem novo ADR necessário.
Limitações: quantidades/conteúdo novos e expansão de evidências podem mudar a
altura após sucesso. CLS global não foi benchmarkado; somente o intervalo de
refetch controlado ficou sem novos shifts. Não se promete redução de renders.
Tarefa concluída, sem pendências. Execução integral sem Cursor.
