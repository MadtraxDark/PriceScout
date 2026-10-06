---
id: mem_20261005_other_store_search_refresh
type: working
status: validated
confidence: 0.95
source: user
sources:
  - C:/Users/Thyago/.codex/attachments/f17c377a-9e2d-43e7-ae10-9c177ce6d7e5/Pasted text.txt
  - https://react.dev/reference/react/useEffect
  - https://developer.mozilla.org/docs/Web/API/AbortController
created_at: 2026-10-05
updated_at: 2026-10-06
expires_at: null
related:
  - 2026-10-05-progressive-match.md
  - 2026-09-22-match-run-polling.md
---
# Busca em outras lojas: atualização e apresentação

## Objetivo

Investigar o fluxo de busca de ofertas em outras lojas, corrigir/confirmar atualização automática sem F5 e organizar visualmente progresso por loja e resultados provisórios, preservando a implementação local preexistente.

## Checklist

- [completed] Ler brief, instruções do repositório, skills aplicáveis e estado do Git.
- [completed] Investigar inicialização, identificador durável, endpoints, polling, recuperação e renderização dos resultados.
- [completed] Registrar direção visual e ajustar estados de progresso/resultados em coerência com DESIGN.md.
- [completed] Validar tipo/lint, testes executáveis e interação desktop/mobile; registrar limites do runner de testes.
- [completed] Executar duas buscas reais, observar atualização e concluir uma; recarregar a página durante a outra e confirmar recuperação.
- [completed] Revisar diff desta alteração e registrar limitações.

## Investigação antes de editar

- A árvore já tinha alterações não commitadas extensas antes desta tarefa. Em particular, `hooks/useProductMatchRun.ts`, `utils/match-run-live.ts`, `utils/visible-polling.ts`, `components/ProductMatchResults.tsx` e o componente de detalhe do produto já estavam modificados/criados.
- `startMatchRun` faz POST em `/products/{id}/match-runs`, recebendo ID de Match Run durável.
- Ao iniciar, o hook associa imediatamente o ID e atualiza o snapshot; o polling lê `/match-runs/{id}/live` a cada 4 s durante execução.
- Sem ID em memória, o hook consulta `/products/{id}/match-runs/active` e, uma vez, o histórico recente, permitindo recuperação após reload.
- `startVisiblePolling` serializa requests, evita chamadas em aba escondida, atualiza ao voltar foco/visibilidade, aplica backoff e aborta requests/listeners/timers no cleanup.
- `/live` é HTTP polling; contratos e services explicitamente indicam que substitui SSE. Não há WebSocket/SSE nesse fluxo.
- O snapshot inclui estados e resultados parciais; `reconcileLiveSnapshot` retém referências iguais e `mergeMatchOffers` preserva IDs/keys e evita duplicatas no handoff persistido.
- `MatchRunHistory` recupera detalhes pelo endpoint de histórico. Página monta banner, progresso, resultados e histórico.
- A UI recém-adicionada usa uma lista textual simples e CSS genérico com tokens que não correspondem ao DESIGN.md. Resultado parcial aproveita classes persistidas e não mostra claramente a distinção de estado por loja.
- Fonte visual existente: `DESIGN.md` (Manrope, DM Mono em métricas/estados, canvas claro, tinta profunda, linha estrutural e sinal queimado; filas sobre cartões decorativos).
- Não havia `PRODUCT.md`; o launcher impecável identificou inicialização obrigatória apenas para novo mundo/superfície. Esta é extensão estreita da tela atual; contexto visual incumbente e brief bastam, sem substituir identidade.

## Direção de design

Manter as cores, tipografia, controles e superfícies de `DESIGN.md`; transformar lojas em uma grade de linhas operacionais alinhadas com nome/estado/indicador, com contagem resumida no cabeçalho. Resultados progressivos mantêm preço, conversão, produto, loja e link em faixa responsiva; distinguir observação provisória do catálogo canônico com texto explícito. Sem dados de exemplo, sem novos adornos, sem expor enums.

## Pesquisa técnica

- React recomenda Effects simétricos: limpar timers e listeners e abortar requests no cleanup/unmount ou mudança de dependência; isso é compatível com o polling existente.
- MDN documenta `AbortController.abort()` para cancelar fetch e produzir `AbortError`.
- Decisão: manter polling com Match Run persistente e endpoint live; não acrescentar SSE/WebSocket. É a solução já contratada e recuperável após reload.

## Ferramentas e limitações iniciais

- Skills carregadas: impeccable, design-taste-frontend e frontend-design.
- CLI local: Node, npm/npx e Git disponíveis; launcher `impeccable.cmd context --target app` executado.
- CUA e Playwright MCP disponíveis; browser conectado ao PriceScout local e API configurada.
- Documentação local de Next.js 16 encontrada em `node_modules/next/dist/docs/01-app/`; deve ser lida antes de editar.
- Fontes web consultadas: React `useEffect`, MDN `AbortController`.
- Decisão durável registrada em `docs/decisions/0005-match-run-live-polling.md`.

## Implementação da apresentação

- O resumo do progresso mostra lojas concluídas/total, alinhado ao `MatchRunStatusView` quando disponível.
- Cada loja agora tem indicador visual com status mapeado explicitamente; o nome e o label de status mantêm as camadas de apresentação atuais. Revisão continua identificada como tal.
- Resultados parciais agora são linhas responsivas com loja, preço, conversão BRL, título do resultado, natureza provisória e link seguro “Ir à loja”. A fonte canônica não é substituída.
- Arquivos tocados nesta etapa: `components/ProductMatchResults.tsx`, `components/ProductMatchResults.module.css`, `app/admin/produtos/[id]/page.tsx`.
- A atualização automática já existia no diff de usuário; nenhuma substituição de polling foi feita. O polling ativo atual usa GET sem cache no endpoint `/live` com `AbortSignal`.
- Revisão do ciclo identificou polling residual de 60 s após término. Hook ajustado para parar timer/listeners após snapshot terminal ou busca inexistente e criar um observador novo quando a página inicia/solicita recuperação de uma Run.
- Browser Chrome local: duas buscas reais no produto cadastrado. Primeira completou em 2m13s, 11/11 lojas, sete ofertas; evolução visível de 2/11 para 3/11, 6/11 e 8/11 sem F5. A segunda foi recarregada durante execução e recuperou a mesma Match Run com 3/11 e progresso por loja.
- Limitação visual: captura de screenshot da aba via CUA deu timeout em `Page.captureScreenshot`; árvore de acessibilidade confirmou conteúdo e estrutura renderizados, mas não substitui inspeção por pixels.
- `npm run typecheck` passou após o ajuste final do hook.
- ESLint direcionado passou para o hook, componente, página e utilitários envolvidos.
- `node --test utils/match-run-live.test.ts`: 3/3 passaram. A suíte com `visible-polling` e `match-run-offers` não ficou executável no ambiente: `npx tsx` tentou acessar registry e recebeu EACCES; tentativa com loader temporário Node falhou ao resolver URL `C:` no Windows. Não alterei dependências do projeto para contornar a restrição.
- Duas buscas reais concluíram em 2m13s e 1m46s, ambas 11/11 lojas e sete ofertas. Os snapshots progrediram sem F5. A segunda busca foi recarregada ainda ativa e recuperou o mesmo estado do backend. Histórico recuperou a Run finalizada após reload.
- Request log depois da conclusão, incluindo janela adicional de 8 s: uma consulta de recuperação active, histórico e uma consulta live; nenhuma repetição de `/live` após estado terminal. Isso confirma que o loop encerra.
- Screenshots Playwright: painel/progresso desktop e estados mobile; avaliação a 390 px sem overflow horizontal. Console do browser sem erros ou warnings.
- Screenshot inicial por CUA expirou em `Page.captureScreenshot`; a captura Playwright dedicada foi usada para a inspeção final.
- Em teste mobile, uma linha da revisão revelou coluna vazia e nome truncado. Correção final adicionou indicador, nome legível e linha em largura total, com reorganização abaixo de 480 px; screenshot desktop/mobile confirmou.

## Causa observada e resolução

No fluxo anterior representado pelo código base, o polling consultava `/active` e, em seguida, apenas o estado sumário de `/match-runs/{id}`. As ofertas já persistidas eram carregadas na montagem da tela e não eram substituídas por snapshots parciais durante a Run; após reload a consulta inicial mostrava o que o backend persistiu. No trabalho local pré-existente desta sessão, o endpoint durável `/match-runs/{id}/live` e reconciliação progressiva já tinham sido adicionados para preencher essa lacuna. A presente tarefa manteve esse contrato, redesenhou as vistas e removeu polling residual de 60 s após terminal/ausência de busca.

## Arquivos tocados nesta tarefa

- `components/ProductMatchResults.tsx`
- `components/ProductMatchResults.module.css`
- `app/admin/produtos/[id]/page.tsx`
- `hooks/useProductMatchRun.ts`
- `docs/decisions/0005-match-run-live-polling.md`
- `memory/working/2026-10-05-other-store-search-refresh-and-redesign.md`

## Evidência visual

- `.playwright-mcp/element-2026-10-06T03-02-54-657Z.png`: progresso por loja em largura mobile.
- `.playwright-mcp/element-2026-10-06T03-03-13-609Z.png`: oferta responsiva em largura mobile.
- `.playwright-mcp/element-2026-10-06T03-06-34-036Z.png` e `.playwright-mcp/element-2026-10-06T03-06-55-506Z.png`: revisão alinhada em desktop e mobile.

## Limitações

- A suíte completa de polling/deduplicação não pôde ser executada por falta local de `tsx` com acesso ao registry bloqueado. Typecheck, lint, três testes de reconciliação live e duas buscas reais cobrem os comportamentos centrais neste ambiente.
- A execução real usou o produto cadastrado Apple iPhone 17 e produziu duas novas entradas persistentes de histórico; isso foi solicitado pelo brief de validação. Nenhum registro foi apagado ou alterado manualmente.
