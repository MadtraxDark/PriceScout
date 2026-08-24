# Decisão 0001: frontend isolado por uma camada HTTP para FastAPI

## Estado

Aceita em 2026-08-24.

## Contexto

O backend será mantido em uma API FastAPI externa. A interface precisa trocar a origem dos dados sem incorporar SDKs de persistência, storage, OAuth de provedores ou rotinas de coleta.

## Decisão

Todas as operações passam pelos serviços de `utils/api/services.ts`, construídos sobre o cliente único de `utils/api/client.ts`. A origem vem de `NEXT_PUBLIC_API_BASE_URL`.

A sessão é administrada pela API em cookie HTTP-only e as requisições usam `credentials: "include"`. Imagens são exibidas a partir de URLs retornadas pela API. A importação aprovada é atômica do ponto de vista do frontend: uma única requisição entrega a prévia e aguarda o resultado do servidor.

## Alternativas descartadas

- Chamadas `fetch` espalhadas pelas páginas: dificultam tratamento uniforme de erro, cookies e mudança da origem.
- Proxy por Route Handler do Next.js: reintroduziria uma responsabilidade server-side neste repositório.
- SDK gerado neste momento: a especificação OpenAPI da FastAPI não foi fornecida; os contratos manuais existentes são pequenos e ficam isolados para futura substituição.

## Consequências

- A API deve expor CORS para a origem do frontend e manter contratos compatíveis com `utils/api/contracts.ts`.
- Mudanças de endpoint ficam concentradas nos serviços.
- Segredos e regras operacionais permanecem fora do bundle público.

## Fontes

- https://fastapi.tiangolo.com/tutorial/cors/
- https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
