---
id: working_product_detail_redesign_20260924
type: working
status: validated
confidence: 1.0
source: user
sources:
  - Pasted text.txt (brief supplied by user)
  - app/admin/produtos/[id]/page.tsx
  - DESIGN.md
created_at: 2026-09-24
updated_at: 2026-09-24
expires_at: null
related: []
---

# Reformulação da área central do produto

## Objetivo

Reorganizar a tela administrativa de detalhes do produto e remover apenas Variação exibida, Taxonomia e Preços e condições, preservando dados, ações e integrações fora desse escopo.

## Checklist

- [x] Ler briefing, regras do projeto e skills invocadas.
- [x] Registrar estado inicial do Git e identificar mudanças preexistentes relevantes.
- [x] Inspecionar a composição atual, tokens e documentação instalada do Next.js.
- [x] Definir e implementar a reorganização visual sem sobrescrever trabalho preexistente.
- [x] Validar visualmente desktop e mobile e revisar os requisitos do briefing.
- [x] Executar verificações disponíveis solicitadas pelo briefing e registrar resultados.

## Início e decisões

- Início: 2026-09-24.
- A página é uma interface operacional. Manter o sistema PriceScout existente: Manrope, verde-petróleo e coral, superfícies brancas, bordas estruturais e foco em leitura.
- A mudança fica restrita à composição da tela de detalhes do produto e CSS correspondente.
- A árvore já tinha edições locais em `app/admin/produtos/[id]/page.tsx` e `app/globals.css`, incluindo apresentação de logos reais de lojas em ofertas persistidas. Preservar esses hunks.
- Skills consultadas: impeccable (contexto, craft floor, modo Operate), frontend-design e design-taste-frontend. A última declara painéis operacionais densos fora do escopo recomendado; aplicar só sua leitura de briefing e evitar regras de marketing.
- Ferramentas consultadas: PowerShell, Git, `rg`, documentação local do projeto. MCP/CLI adicionais ainda a verificar.
- Estrutura encontrada: painel de comparação e histórico acima da edição; informações gerais e galeria separadas do resumo de imagem e metadados; busca duplicada no cabeçalho e no painel de ofertas.
- Mudanças aplicadas: metadados agregados à seção geral; imagem principal incorporada à galeria; separação das ofertas por registro mantida sem expor o rótulo de variação; botões de busca/edição/exclusão agrupados por finalidade; removidas as caixas Taxonomia e Preços e condições.
- Referências técnicas verificadas: CSS Grid e `minmax()` em [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout) e [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/minmax); convenções de CSS global e página no guia local Next.js 16.3.2 (`node_modules/next/dist/docs/01-app/01-getting-started/11-css.md` e `03-layouts-and-pages.md`). Como a implementação mantém CSS global já usado pelo produto e CSS Grid nativo, sem trocar biblioteca, não foi necessária decisão arquitetural adicional.
- Validação visual com navegador e dados reais do catálogo: capturas desktop (1440 px) e móvel (390 px), conferência do histórico detalhado, ausência de overflow horizontal e ausência de rótulos/seções descontinuados. Corrigido um overflow existente no layout de campos do histórico detalhado em telas móveis.
- `npm run build` passou antes do ajuste final do agrupamento de ofertas; após o ajuste, `npm run typecheck` e lint isolado da página passaram e o Next atualizou a página no navegador sem erros de console. Não repeti build durante o servidor Next existente para evitar competir pelo diretório `.next`.
- `npm run lint` global reporta três violações `react-hooks/set-state-in-effect` em `app/admin/page.tsx` (2) e `components/ImageViewer.tsx` (1), arquivos não alterados nesta tarefa; lint isolado da página alterada passou.
- Os quatro scripts `npm run test:*` tentaram baixar `tsx` e foram bloqueados pelo acesso a `registry.npmjs.org` (EACCES). Com executor nativo do Node 26, os 20 testes de `money` e `match-run` passaram. O lote com os demais arquivos falhou em 3 casos porque o executor nativo não resolve os aliases `@/` e alguns imports sem extensão; 20 passaram e 3 não puderam ser avaliados por essa limitação do executor.
- Limite: o build completo passou antes das últimas alterações apenas na estrutura JSX; o typecheck e a compilação HMR do navegador confirmaram essa última mudança.

## Próximo passo

Checklist revisada; resultados e limitações registrados. Nenhuma etapa pendente.
