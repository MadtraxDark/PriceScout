id: mem_20261006_progressive_offer_card_fix
type: working
status: draft
confidence: 0.9
source: user
sources:
  - ../../../../ScoutApiV2/tasks/plan.md
  - https://react.dev/learn/conditional-rendering
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Basic_concepts
created_at: 2026-10-06
updated_at: 2026-10-06
expires_at: null
related:
  - 2026-10-05-other-store-search-refresh-and-redesign.md
  - 2026-10-05-progressive-match.md
---
# Corrigir cards de ofertas parciais

## Objetivo

Renderizar resultados encontrados durante a busca em tempo real na mesma estrutura visual dos cards normais de oferta.

## Checklist

- [completed] Investigar inserção/renderização progressiva e comparar com o card persistido.
- [in_progress] Ajustar estrutura reutilizando as áreas visuais do card canônico.
- [pending] Validar tipos, lint, layout responsivo e sequência de resultados; revisar alterações.

## Etapa 1 — investigação

- Horário: 2026-10-06 America/Sao_Paulo.
- Ferramentas: leitura de arquivos, `rg`, `git status`, CLI `impeccable.cmd context`, documentação local do Next.js e pesquisa web.
- Fontes: `app/admin/produtos/[id]/page.tsx`, `components/ProductMatchResults.tsx`, `components/ProductMatchResults.module.css`, `app/globals.css`, contratos API, documentação oficial de React/MDN e guia Next.js 16 CSS.
- Resultado: `mergeMatchOffers` adiciona resultados confirmados ainda sem oferta catalogada como `{ offer: null, partial }`; a tela escolhe `ProgressiveOfferRow`. O contrato parcial não inclui imagem nem metadados do catálogo. A linha atual tem duas colunas e não possui slot de imagem ou painel da loja. A linha normal possui três áreas via `.persisted-offer-row`: imagem de 82px, bloco principal flexível e área de loja/ação de 190–220px. A discrepância da árvore e da grade explica espaço vazio e elementos desalinhados.
- Decisão: manter dados parciais como evidência, sem forjar `CatalogOffer`; estruturar o estado parcial nas mesmas três áreas e usar imagem principal persistida do produto, marca neutra de loja e link atual da observação. Envolver resultados sem variante na mesma lista de cards.
- Limitações: as imagens anexadas são evidência visual sem arquivo local para inspeção pixel a pixel. CUA/MCP disponíveis; a visualização local poderá ser inspecionada se a aplicação estiver ativa.
- Próximo passo: editar componente de resultado parcial e chamada na página de detalhe.
## Etapa 2 — implementação

- Estado: concluída.
- Arquivos de código: `components/ProductMatchResults.tsx`, `components/ProductMatchResults.module.css`, `app/admin/produtos/[id]/page.tsx`.
- Alterações: o card progressivo agora usa os mesmos slots `.persisted-offer-image`, `.persisted-offer-main`, `.persisted-offer-store` e botão `.store-offer-link` da oferta normal. A imagem primária já persistida do produto é usada como imagem do resultado parcial, sem inventar produto/imagem; título e evidência continuam identificados como resultado da busca. A remoção da regra CSS própria de duas colunas deixa a geometria global canônica prevalecer. Produtos sem variantes agora também agrupam os resultados numa lista normal com separadores.
- Dados: nenhuma transformação de observação em `CatalogOffer`; preço, moeda, URL, título, status e conversão vêm do resultado parcial da API. Campos ausentes de oferta permanecem omitidos.
- Próximo passo: typecheck, lint e inspeção da saída/renderização.
## Etapa 3 — validação e conclusão

- Estado: concluída.
- `npm run typecheck`: passou após atualizar os dois callsites do componente.
- `npx eslint components/ProductMatchResults.tsx app/admin/produtos/[id]/page.tsx`: passou.
- `git diff --check`: passou. Avisos do Git apenas informam conversão LF/CRLF conforme configuração local.
- Chrome: página local do produto aberta; árvore de acessibilidade e screenshot confirmam que ofertas persistidas existentes continuam com imagem, bloco de preço, identificação da loja e botão “Ir à loja”. Não havia resultado parcial visível nem busca ativa; não foi iniciada nova coleta de ofertas para evitar efeito colateral no backend. Assim, o resultado progressivo foi validado por typecheck e revisão da árvore JSX/CSS, mas não por chegada ao vivo nesta rodada.
- Revisão: o resultado parcial agora participa da mesma grade de três colunas e da lista separada por bordas; múltiplos resultados iteram pela mesma estrutura e recebem a chave de identidade já definida pelo fluxo de merge.
- Limitação de inspeção auxiliar: uma asserção manual procurava texto com grafia incorreta (“Preço canônico”) e falhou por isso; não indicou falha de encoding. A inspeção do diff confirmou que as únicas alterações na página são os dois pontos de renderização descritos.
- Checklist: investigação `completed`; implementação `completed`; validação/revisão `completed`.
- Trabalho restante: nenhum. A validação visual em uma busca ativa pode ser feita em uma coleta futura, sem ser necessária para compilação do fluxo corrigido.
