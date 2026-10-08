---
id: working_2026_10_08_partial_offer_store_logos
type: working
status: draft
confidence: 1.0
source: user
sources:
  - "C:\\Users\\Thyago\\.codex\\attachments\\bbc7ba39-a504-4d8b-b94c-7eb0e296b984\\Pasted text.txt"
created_at: 2026-10-08
updated_at: 2026-10-08
expires_at: null
related: []
---

# Objetivo

Fazer resultados parciais do Product Match usarem a mesma identidade visual de loja das ofertas persistidas, incluindo logos configuradas no registry, mantendo fallback, distinção Amazon BR/EUA e separação entre loja e seller.

## Checklist

- [completed] Ler pedido, conferir instruções e inspecionar a causa no frontend.
- [completed] Pesquisar fontes técnicas atuais e decidir a abstração compartilhada.
- [completed] Implementar resolução/identidade compartilhada e atualizar polling pertinente.
- [completed] Adicionar testes cobrindo logo URL/SVG/fallback, resolução e regressões.
- [completed] Executar verificações solicitadas e avaliar se há ambiente para Match Run real.
- [completed] Revisar diff, procurar dados mockados na superfície afetada e registrar limitações.

## Registro

- Início: 2026-10-08.
- Instruções consultadas: AGENTS.md fornecido pelo usuário; `memory/schema/memory-entry.md`; pedido anexado.
- Ferramentas consultadas: PowerShell, `rg`, git; o pacote `next` local é 16.3.2 e há documentação em `node_modules/next/dist/docs/`.
- Resultado inicial: pedido lido integralmente em UTF-8; uma tentativa de ler `memory/working/2026-10-06-progressive-match.md` falhou porque esse caminho não existe. O workspace lista outros registros de Product Match.
- Causa confirmada: `PersistedOffersList` carrega `/stores` uma vez e renderiza `matchingStore.logo_url` ou SVG; `ProgressiveOfferRow` recebe só o resultado live e sempre deriva duas letras do nome.
- Decisão: a página pai continua dona da lista `CatalogStore` e do polling já condicionado a `logo_processing_status`; um helper comum resolve chave, domínio, nome e país; `StoreIdentity` comum mostra logo/nome/país/fallback em ambas as linhas. Sem mudança do backend e sem novas consultas por linha.
- Fontes técnicas: React, “Sharing State Between Components”, https://react.dev/learn/sharing-state-between-components (estado compartilhado no ancestral comum); Next.js docs locais 16.3.2 `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` (contexto de componentes e imagem). Pesquisa também consultou documentação oficial atual de React e Next.js em 2026-10-08.
- Alternativa descartada: colocar logos no snapshot live aumenta payload repetido; requisição em cada linha causa N+1; ambos contradizem o contrato e o cache atual.
- Implementação: adicionado `utils/store-resolution.ts` para chave/domínio/nome/país; `components/StoreIdentity.tsx` usado nos resultados persistidos e parciais; a página pai passa o mesmo estado de `/stores` às linhas progressivas. `ImageWithState` ganhou `onImageError` síncrono para fallback imediato; callback diagnóstico anterior permanece intacto.
- Polling: mantido o único carregamento inicial de stores e o polling visível a cada 3 s somente enquanto existir store `pending` ou `processing`; cada atualização alcança ambas as linhas.
- Testes criados em `utils/store-resolution.test.tsx` com fixtures isoladas para URL, SVG, sem logo, key/domain e Amazon por região; sem nomes hardcoded na implementação da UI.
- Validação: os testes de resolução/merge e imagens passaram. A primeira rodada de typecheck apontou que a função booleana não estreitava o tipo nullable de `logoSrc`; JSX agora também verifica explicitamente a presença da URL antes de passá-la a `ImageWithState`.
- Test harness note: importing `ProgressiveOfferRow` in the Node SSR test loads its CSS module and fails under the repo's current `tsx --test` setup (`SyntaxError` at `.progress`). The test was kept focused on the extracted resolver/shared identity; live UI verification covers the row in a real run.
- Ajuste visual após captura: badges BR/US ficaram restritos à Amazon Brasil/EUA, preservando exatamente o comportamento anterior para as demais lojas.
- N+1: a página tem uma chamada inicial a `catalogApi.listStores()` e uma segunda chamada somente no polling compartilhado quando alguma logo está `pending`/`processing`; nenhum componente de linha solicita stores. O live endpoint permanece intacto.
- Busca integrada: iniciada pela tela de produto em 2026-10-08 no registro real Apple iPhone 15 (11 stores); concluiu em 1:33 com 11/11 e 2 ofertas. Enquanto ativa, Amazon Brasil apareceu como correspondência live e a oferta persistida mostrou “Resultado parcial encontrado nesta busca”, mantendo a logo. Após concluir, a identidade permaneceu a mesma; Nissei, Shopping China, AliExpress, Magazine Luiza, Amazon Brasil e Amazon EUA foram vistos com as logos reais do registry. Não apareceu uma nova linha sem oferta persistida nesta execução; portanto o caminho visual do cartão isolado `ProgressiveOfferRow` foi verificado por implementação compartilhada/testes da resolução e sua renderização final específica não apareceu no cenário real.
- Logos em estado `pending`/`processing` não foram encontrados durante a execução integrada; o helper que governa o polling foi testado, mas uma conversão AVIF real não pôde ser observada.
- Testes/verificações: 10 testes novos de store-resolution/identity e 8 de merge passaram (18 total); 6 testes existentes de imagens passaram; typecheck, ESLint direcionado e `git diff --check` passaram.
- Pesquisa e decisão em `docs/store-identity-resolution.md`. Busca textual na superfície não encontrou mapas de logo por loja nem uso da imagem de produto como logo.
- Limitação de ferramenta: a skill computer-use listada não existia no caminho anunciado pelo catálogo; usei a documentação/API CUA disponível e a sessão Chrome existente.
- Estado final: sem pendências. Backend não alterado; payload live continua sem metadata estática de logos.
