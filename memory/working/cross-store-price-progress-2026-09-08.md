---
id: mem_frontend_cross_store_price_progress_20260908
type: working
status: completed
confidence: 0.96
source: agent
sources:
  - app/admin/produtos/[id]/page.tsx
  - components/PriceSearchProgress.tsx
  - utils/api/services.ts
  - docs/decisions/0047-cross-store-search-progress-sse.md
created_at: 2026-09-08
updated_at: 2026-09-08
expires_at: null
related:
  - memory/working/other-store-price-search-audit-2026-08-31.md
---

# Objetivo atual

Ajustar a representação frontend do progresso de busca de preços em outras lojas para manter cards de loja com altura fixa, sem scrollbar, com janela visível de eventos recentes e shine somente no evento em execução.

# Checklist

- [completed] Inspecionar prompt, componente, integração SSE e estilos existentes.
- [completed] Implementar janela visível e geometria fixa no painel.
- [completed] Corrigir acomodação das linhas da grade e deduplicação visual consecutiva.
- [completed] Validar TypeScript, lint e revisão visual no navegador.
- [completed] Revisar limitações e concluir o registro.
- [completed] Corrigir o foco da janela para manter sempre o evento mais recente no rodapé.

# Resultado anterior

A tela de detalhe do produto consome o stream SSE real da API, acumula eventos por loja e preserva os cards de ofertas ao final. O botao fica desabilitado durante a busca e o `AbortController` cancela a conexao ao desmontar a tela.

# Resultado desta execução

O estado completo de cada loja continua em `events`. O componente renderiza somente uma janela dos cinco eventos mais recentes, substituindo o primeiro item da janela pelo evento `running` quando necessário. Cada card mantém 192px de altura, o painel mantém altura fixa e as áreas internas usam `overflow: hidden`, sem scrollbar. Eventos novos entram com uma transição curta; o `ShinyText` é usado somente para o último item `running` enquanto a loja está em execução, com fallback para `prefers-reduced-motion`. Estados finais continuam congelados e visíveis pelo status do card.

# Ajuste desta execução

O painel deixou de ter altura máxima fixa: ele acomoda todas as linhas necessárias para a quantidade atual de lojas, sem crescer por causa do histórico de eventos. A grade usa 4 colunas em desktop grande, 3 em desktop médio, 2 em tablet e 1 em mobile. Os cards continuam com 192px fixos e o viewport interno segue ocultando o excesso. Eventos consecutivos visualmente idênticos são agregados apenas na apresentação; `events` permanece intacto.

# Ajuste de foco desta execução

A exceção que substituía o primeiro item da janela por um evento `running` antigo foi removida. A janela agora é sempre `displayEvents.slice(-VISIBLE_EVENT_COUNT)`, preservando a ordem de chegada e garantindo que o evento mais recente permaneça no último item visível. O evento `running` mais recente continua recebendo shine somente quando a loja ainda está em execução; estados finais não recebem animação.

O contrato disponível não fornece `sequence`, `event_id` ou timestamp de ordenação para esses eventos. Portanto, o frontend preserva a ordem de chegada do SSE por loja e usa uma chave derivada de `stage` e índice original, que permanece estável enquanto a janela desliza. Não foi adicionada ordenação por `stage` nem alteração no backend.

# Validação desta execução

- `npx tsc --noEmit --incremental false`: passou.
- `npm run lint`: passou sem erros; há 770 avisos preexistentes no projeto.
- `git diff --check`: sinalizou apenas uma linha em branco preexistente no fim de `utils/api/services.ts`; nenhum arquivo desse fluxo foi alterado.
- Navegador, estado real em andamento: 7 lojas renderizadas, eventos atualizados em paralelo e botão desabilitado durante a execução.
- Navegador, estado final real: 7 cards com 192px de altura, grade de 4 colunas, 0 cards `running` e 0 elementos `shiny-text` ativos.
- Navegador, nova busca real: a janela acompanhou eventos intermediários em paralelo; o último evento permaneceu no rodapé da lista e a busca terminou com 7 de 7 lojas concluídas.

# Limitações

Não foi executado `npm run build` nesta execução. O histórico de execução anterior registrava bloqueio do build por `EPERM` em `.next/trace` causado por outro processo do Next.js. A validação visual foi feita em uma busca real no navegador local, incluindo estados intermediários e finais.

# Ajuste visual posterior

O painel agora mantém altura fixa, limita a rolagem ao conteúdo interno e ordena lojas e eventos ativos antes dos estados finalizados. Eventos em execução recebem shimmer discreto; estados pendente, sucesso, aviso, erro e sem resultado continuam com distinção visual própria.

# Arquivos

- `components/PriceSearchProgress.tsx`: painel reutilizavel de resumo e etapas.
- `app/globals.css`: geometria fixa, rolagem interna e destaque visual do estado em execução.
- `utils/api/services.ts`: leitura SSE autenticada e normalizacao do resultado final.
- `utils/api/contracts.ts`: contrato TypeScript dos eventos.
- `app/admin/produtos/[id]/page.tsx`: integracao do fluxo e atualizacao somente da loja afetada.

# Validacao

`npx tsc --noEmit --incremental false` passou. `npm run lint` terminou sem erros, com avisos preexistentes no projeto. `npm run build` ficou bloqueado antes da compilacao por `EPERM` ao abrir `.next/trace`, provavelmente mantido por outro processo do Next.js; nao houve erro de TypeScript reportado.
