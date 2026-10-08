# Atividade recente

A seção administrativa lê `GET /products/activity` do ScoutApiV2 pela façade
`catalogApi.listActivity`. O contrato é `ActivityListResponse` em `utils/api/contracts.ts`.
Não deriva eventos dos timestamps genéricos dos cards nem guarda atividade local.

A API reutiliza `OfferEvent`, `OfferSnapshot` e `CanonicalProduct.created_at`.
Referência canônica: ScoutApiV2 `docs/matching/catalog-activity.md` e ADR 0051.

- `CatalogActivity` carrega a primeira página de 15 itens e suporta Ver mais/retry.
- O hook aborta requests ao desmontar e protege contra resposta atrasada/requests duplos.
- `mergeActivities` mantém IDs únicos e ordenação de timestamp/ID decrescente.
- `utils/display/activity.ts` define textos pt-BR, hora local e URLs de produto.
- Moedas antiga/nova são independentes; `formatMoney` não converte USD para BRL.
- Remoção, sem estoque e expiração têm textos distintos, sem inferir causa.
- Imagem usa `ImageWithState` e `resolveMediaUrl`; URL vem do catálogo na API.
- Ausência de imagem usa o fallback atual. Não há chamadas de galeria por atividade.
- A seção carrega independentemente dos indicadores da visão geral.

Validação: `npm run test:activity`, `npm run lint`, `npm run typecheck`.
Os testes em `utils/display/activity.test.tsx` têm fixtures exclusivamente isoladas.
Navegador validado com PostgreSQL/API de teste em 2026-10-07: clique, paginação
15→24, F5, loading, vazio, erro/retry e viewport 390px sem overflow.
A imagem veio da URL persistida; apenas os bytes de mídia foram fixture de teste.

Fontes consultadas: [React useEffect](https://react.dev/reference/react/useEffect),
[SQLAlchemy UNION ALL](https://docs.sqlalchemy.org/en/20/core/selectable.html)
e guia local `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`.
A implementação reutiliza a stack existente, sem nova biblioteca ou arquitetura de estado.

Resultado: 15 testes de atividade e 94 testes da suíte frontend completa, todos aprovados; lint e typecheck globais aprovados.

A API Docker local foi atualizada e a migration 0033 aplicada; conferência final com catálogo existente e imagens reais confirmou aliases regionais e persistência após F5.
