---
id: work_match_run_duration_display_20260924
type: working
status: draft
confidence: 1.0
source: user
sources:
  - components/MatchRunHistory.tsx
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat
created_at: 2026-09-24
updated_at: 2026-09-24
expires_at: null
related: []
---

# Ajustar duração no histórico de buscas

## Objetivo

Exibir durações do log como `mm:ss` e, acima de uma hora, `hh:mm:ss`, em vez de segundos decimais.

## Checklist

- [x] Localizar a origem da duração no cartão do histórico.
- [x] Conferir instruções locais, esquema de memória e documentação local do Next.js.
- [completed] Atualizar o formatador compartilhado pelo histórico e registrar a decisão.
- [completed] Revisar a alteração e a checklist final.

## Decisão e evidências

- `MatchRunHistory` centraliza os valores de tempo em `formatDurationMs`; o formato atual usa segundos decimais a partir de 1000 ms.
- Será mantida a conversão manual, sem adicionar biblioteca ou depender de `Intl.DurationFormat`, para garantir a forma fixa `mm:ss` / `hh:mm:ss` solicitada.
- Referência consultada: MDN documenta `Intl.DurationFormat` como formatter localizado de duração; a necessidade aqui é uma forma compacta e fixa.
- Exemplo esperado: `552100 ms` -> `09:12`; `3661000 ms` -> `01:01:01`.

## Etapas, ferramentas e resultado

- Início: 2026-09-24.
- Busca local via `rg`, leitura dos componentes e contratos da API: cartão detalhado e resumo compartilham o formatador em `components/MatchRunHistory.tsx`.
- Documentação local consultada: `node_modules/next/dist/docs/01-app` e `memory/schema/memory-entry.md`.
- Pesquisa web consultada: MDN `Intl.DurationFormat`.
- Alteração: durações abaixo de uma hora agora aparecem como `mm:ss`; durações a partir de uma hora aparecem como `hh:mm:ss`. Frações de segundo são descartadas.
- Revisão final: diff contém somente o formatador do histórico e este registro de execução; nenhuma etapa pendente.
- Validação automatizada não executada, pois não foi solicitada.
