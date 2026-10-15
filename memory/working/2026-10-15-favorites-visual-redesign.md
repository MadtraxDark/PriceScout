---
id: mem_working_favorites_visual_redesign_2026_10_15
type: working
status: draft
confidence: 1.0
source: user
sources:
  - Pasted text.txt anexado pelo usuário
  - AGENTS.md
  - DESIGN.md
created_at: 2026-10-15
updated_at: 2026-10-15
expires_at: null
related: []
---

# Redesenho da página de Favoritos e controles de coração

## Objetivo
Reorganizar visualmente a página de Favoritos e os controles de favorito nos cards de produtos, mantendo lógica, dados, notificações e identidade visual existentes.

## Etapas
- [completed] Ler o prompt, instruções do projeto, contexto visual e skills solicitadas.
- [completed] Mapear componentes, estilos, estados e documentação Next.js aplicável.
- [completed] Implementar ajustes visuais preservando comportamento e labels.
- [completed] Validar os cenários disponíveis e revisar alterações.
- [completed] Atualizar este registro com resultados e limitações.

## Decisões
- Preservar o sistema visual PriceScout Admin descrito em DESIGN.md.
- Nenhuma biblioteca nova planejada; usar componentes e CSS existentes.
- Não alterar chamadas, persistência, cálculos nem regras de notificação.

## Direção visual
- Cores: Canvas `#F7F8F4`, Paper `#FFFFFF`, Deep Ink `#102A2F`, Muted Steel `#728589`, Structural Line `#DCE4E1`, Burnt Signal `#DF6845`.
- Tipografia: Manrope para interface e DM Mono somente para os usos de medição/sistema já definidos.
- Desktop: `[produto e contagem] [preços por loja] [atualização e alerta]` em uma faixa compacta.
- Intermediário: `[produto] [atualização e alerta]` seguido por `[preços por loja ocupando a linha]`.
- Mobile: produto, preços e controle empilhados; a ordem do DOM permanece igual à leitura.
- Decisão revisada contra a especificidade do conteúdo: os preços precisam de alinhamento tabular loja/valor e a mensagem de e-mail deve ficar junto do alerta; um mosaico de cards aninhados ou uma grade ornamental repetiria padrões genéricos sem ajudar essa comparação.

## Ferramentas e fontes
- Skills locais: design-taste-frontend, frontend-design, impeccable.
- Impeccable context executado para `app/admin/favoritos/page.tsx`.
- Documentação Next.js instalada localmente: guia App Router de estrutura de projeto, consultado antes da edição.
- MCP Playwright local para capturas e inspeção em browser real; CLI Impeccable para contexto e detector de layout.
- Sem busca na internet: não houve decisão de biblioteca, arquitetura ou dependência técnica.

## Resultados e próximo passo
- O contexto indica visual existente e refinamento estreito permitido sem PRODUCT.md.
- Inspeção visual inicial em 1920px encontrou cartão de 1656px, com conteúdo concentrado no início e seis ofertas.
- A página agora agrupa identificação, preços por loja e controles em colunas responsivas; o toggle usa botão visível de 32px e ícone 15px, com área clicável estendida a 44px.
- Mantidos `getStoreDisplayName`, `money`, persistência, APIs, evento de favoritos, alertas e estados atuais.
- Em 1920px, 860px e 390px, a leitura e a ordem de conteúdo se mantiveram; o cartão real com seis ofertas ficou mais baixo e os controles permaneceram legíveis.
- Em 320px, largura do documento e do body permaneceu igual à viewport; nenhuma oferta ou controle excedeu o cartão.
- Na listagem real, foram vistos estados favorito ativo/inativo, hover, foco, alvo 44px; nenhuma mutação foi disparada.
- Console do navegador: zero erros e zero avisos.
- Typecheck e ESLint dos componentes afetados passaram; `git diff --check` sem erros e detector de layout retornou `[]`.
- Busca na superfície afetada não encontrou dados demonstrativos ou mockados.
- Limitação: a API local tem um favorito com seis ofertas e imagem; casos de uma oferta e sem imagem não foram simulados para evitar dados fictícios ou alterações em registros persistidos. Os ramos de apresentação correspondentes seguem presentes no componente.
- Ajuste após feedback: a captura confirmou que o círculo ainda parecia grande; reduzi o botão de 44px para 32px e o ícone de 17px para 15px, preservando 44px de área de interação por pseudo-elemento.
- Ajuste de alinhamento após feedback: o traçado do SVG tinha o centro óptico ligeiramente abaixo do centro do viewBox; apliquei `translateY(-.5px)` e confirmei diferença geométrica de `-.5px` entre o centro da caixa do SVG e do botão, compensando o deslocamento do desenho.
- [completed] Implementar o redesenho e o padrão compartilhado do coração.
- [completed] Validar responsividade, estados observáveis, qualidade estática e diff.
- Registro revisado; sem etapas pendentes.
