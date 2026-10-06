# Decisão 0005: acompanhar Match Runs pelo snapshot HTTP persistente

## Estado

Aceita em 2026-10-06.

## Contexto

Uma Match Run é iniciada por `POST /products/{id}/match-runs` e tem um identificador persistente. Consultar somente `/products/{id}/match-runs/active` e o resumo de `/match-runs/{id}` informa a execução geral, mas não fornece à tela os snapshots parciais por loja. A oferta pode já estar persistida na API e ainda não aparecer até que a lista do produto seja consultada novamente.

O contrato integrado expõe `GET /match-runs/{id}/live`, com status geral, lojas, decisões e observações parciais. A API também permite recuperar uma execução ativa após reload. Por isso a atualização por polling pode ser recuperada sem depender da memória do componente.

## Decisão

Manter a Match Run durável e consultar o snapshot `/live` por HTTP enquanto a execução estiver ativa. O cliente inicia a Run uma vez, guarda seu ID na sessão do componente, consulta o snapshot a cada quatro segundos, mescla resultados por identidade e mantém a observação provisória separada do valor canônico do catálogo.

Na montagem, recuperar primeiro uma execução ativa e, quando necessário, uma Run recente para exibir o estado terminal. Ao observar ausência de Run ou estado terminal, encerrar timers e listeners. Um novo início ou pedido explícito de refresh cria um observador novo. O cleanup do React aborta a requisição de observação e remove listeners sem cancelar a execução persistida no backend.

## Alternativas descartadas

- SSE ou WebSocket: a API já oferece snapshots duráveis em HTTP, inclusive após reload; outro canal exigiria infraestrutura sem cobrir uma necessidade ausente.
- Polling contínuo depois de terminal: causa requisições sem utilidade; o cliente encerra a observação no terminal.
- Usar somente `/active`/resumo: não atualiza estado de cada loja nem ofertas parciais na interface.
- Atualizar o preço canônico diretamente com observações parciais: conflita com a autoridade do registro canônico da API.

## Consequências

- O hook usa no máximo um ciclo de polling ativo, pausa em aba oculta, respeita abort/backoff e reinicia após um novo comando ou recuperação.
- O merge mantém ofertas estáveis e não duplica resultados no handoff entre parcial e persistido.
- O backend precisa manter `GET /match-runs/{id}/live` coerente com o contrato versionado em `utils/api/contracts.ts`.
- Se uma futura versão da API exigir entrega push, reavaliar a decisão com base no contrato e no ciclo durável, sem retirar recuperação por identificador.

## Fontes

- `utils/api/contracts.ts` e `utils/api/services.ts`: contrato e chamada HTTP do frontend.
- `hooks/useProductMatchRun.ts` e `utils/visible-polling.ts`: ciclo de início, recuperação, polling e cleanup.
- React, `useEffect`: https://react.dev/reference/react/useEffect
- MDN, `AbortController`: https://developer.mozilla.org/docs/Web/API/AbortController
