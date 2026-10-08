---
id: mem_incremental_catalog_search_20261007
type: working
status: validated
confidence: 0.98
source: user
sources:
  - https://nextjs.org/docs/app/getting-started/linking-and-navigating
  - https://react.dev/reference/react/useEffect
created_at: 2026-10-07
updated_at: 2026-10-07
expires_at: null
related:
  - docs/catalog-changes.md
  - memory/working/catalog-change-explorer.md
---

Objetivo: busca incremental em Alterações do catálogo.

- completed: investigar formulário, URL, cancelamento, documentação Next/React e skills.
- completed: debounce 300ms, formulário persistente, cancelamento e sincronização com navegação.
- completed: verificar foco, digitação rápida, respostas fora de ordem, filtros e paginação.
- completed: lint/typecheck/build, documentação e revisão final.

Ferramentas: PowerShell direto, apply_patch, documentação oficial/local e Playwright CLI.
Skills: frontend-ui-engineering, git-workflow-and-versioning e browser-testing-with-devtools,
já utilizadas nesta conversa. Cursor não utilizado.
Decisão: manter formulário montado e remontar somente resultados pela chave da consulta.
History API do Next sincroniza URL sem navegação de servidor; alterações automáticas
usam replaceState. Enter/Pesquisar aplicam imediatamente. Composição IME espera confirmação.
Limpar cancela busca pendente e restaura todos os filtros. Erros locais não enviam request.
Sem alterações no backend, schema, scraping, dependências ou configuração.

Validação em 2026-10-07:
- 23 testes direcionados aprovados (318 ms); lint, typecheck e build aprovados.
- Chrome com catálogo real: debounce, uma consulta por sequência de digitação,
  foco/caret, lojas reutilizadas, URL sem entrada por tecla, voltar/avançar,
  reload, IME, texto inválido, limpar pendente, resposta antiga atrasada,
  reinício de cursor, filtros preservados e viewport 320px; zero erro JavaScript.
- Harness versionado `ScoutApiV2/tests/e2e/catalog_changes_browser.py` ampliado
  para digitação sem envio manual, foco/caret e reinício de cursor. PostgreSQL
  isolado + Chrome aprovados em 15,54s, com limpeza do banco/API temporários.
- Evidência: `.tmp/catalog-changes-browser/incremental-mobile.png` no backend.

Revisão de documentação: contratos de interface atualizados nos dois projetos;
API e decisão arquitetural existentes permanecem aplicáveis, sem novo ADR.
Revisão de código: efeitos cancelam timers, resultados antigos são descartados,
nenhum fetch foi introduzido nos componentes, sem dependências adicionais.
Execução direta por PowerShell/Playwright funcionou sem Cursor; continuar usando
esse caminho, conforme o registro canônico nas instruções do repositório.
Tarefa concluída, sem pendências.
