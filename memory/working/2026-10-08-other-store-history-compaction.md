---
id: work_other_store_search_history_compaction_2026_10_08
type: working
status: draft
confidence: 1.0
source: user
sources:
  - components/MatchRunHistory.tsx
  - AGENTS.md
created_at: 2026-10-08
updated_at: 2026-10-08
expires_at: null
related: []
---

# Histórico de buscas em outras lojas: expansão no frontend

## Objetivo
Manter todos os registros retornados pela API e apresentar três por padrão, com ações de expandir e recolher quando existirem itens adicionais.

## Checklist
- [completed] Registrar contexto, verificar skills, ferramentas e documentação Next.js atual do projeto.
- [completed] Adicionar expansão local da lista sem alterar carregamento ou persistência.
- [completed] Validar a lógica de apresentação para 1, 2, 3, 4 e 15 itens; conferir ordem e ausência de IDs duplicados; revisar layout responsivo existente.
- [completed] Revisar diff e atualizar este registro.

## Início e decisões
- Início: 2026-10-08, America/Sao_Paulo.
- Decisão: manter `listMatchRuns(..., { limit: 15 })`; recortar apenas na renderização quando recolhido. Nenhuma alteração de backend ou registro de buscas.
- Ferramentas disponíveis: executor PowerShell, pesquisa web e MCPs do ambiente; nenhum MCP é necessário para esta alteração local.\n- Fontes consultadas: guia local `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`; documentação oficial atual do Next.js sobre `use client` (https://nextjs.org/docs/app/api-reference/directives/use-client) e do React sobre renderização condicional (https://react.dev/learn/conditional-rendering). As fontes concordam que estado e eventos cabem no componente cliente, já existente aqui. Recortar apenas a lista JSX preserva `items` completo.
- Skill aplicável: `impeccable`, refinamento de interface existente. Instruções do skill estão em `.agents/skills/impeccable/SKILL.md`.
- Falha anterior: executor não iniciou por `setup refresh had errors`; na tentativa atual o executor iniciou normalmente. Impacto: nenhum arquivo havia sido alterado anteriormente.
- Decisão visual: usar `text-button` do sistema, abaixo da lista e fora dos itens, para a ação não parecer outro registro; conservar cartões, espaçamento e responsividade existentes.\n- Implementação: `historyExpanded` controla a exibição; compactado usa `items.slice(0, 3)`, expandido usa `items`. `Ver mais`/`Ver menos` aparece somente com mais de três itens, fora da lista, e indica estado com `aria-expanded`. A expansão é recolhida após nova carga. Cartões e informações individuais preservam o JSX original.\n- Validação: `npm run typecheck` passou; `npm run lint -- components/MatchRunHistory.tsx` passou; `git diff --check` passou. Verificação isolada com Node passou para 1, 2, 3, 4 e 15 itens, cobrindo limite visível, expandido, ordem e identidade única.\n- Responsividade: nenhuma estrutura dos cards foi modificada; o controle fica fora da lista e utiliza a regra mobile existente do histórico. Não foi possível inspecionar a página real com histórico ao vivo nesta sessão; a validação visual ficou limitada à revisão da CSS/componente.\n- Ferramentas/fontes: PowerShell, git, Node/npm, skill `impeccable` (contexto e craft floor), docs locais Next.js e pesquisa nas documentações oficiais Next.js/React. Nenhum MCP era necessário.\n- Limitação/continuidade: não houve teste visual em navegador com dados reais; os casos de cardinalidade foram validados isoladamente contra a lógica de recorte implementada.


