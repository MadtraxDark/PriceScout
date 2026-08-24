# Design System: PriceScout Admin

## Visual Theme & Atmosphere

Um cockpit de catálogo com a calma de um livro-caixa: denso o suficiente para operar, arejado o suficiente para confiar. Variance 6, density 6, motion 4. O gesto autoral é a faixa “Sinal do catálogo”, onde barras verticais representam atividade sem virar um gráfico ornamental.

## Color Palette & Roles

- Canvas — `#F7F8F4`, superfície de trabalho.
- Paper — `#FFFFFF`, formulários e painéis ativos.
- Deep Ink — `#102A2F`, navegação e leitura de alta prioridade.
- Muted Steel — `#728589`, metadados e instruções.
- Structural Line — `#DCE4E1`, separadores de baixa ênfase.
- Burnt Signal — `#DF6845`, único acento: ações, foco e alertas de revisão.

## Typography Rules

- Manrope para toda a interface, com pesos 400–800.
- DM Mono somente para métricas, timestamps, estados e pequenos rótulos de sistema.
- Títulos compactos, com tracking negativo moderado; textos explicativos em linhas curtas.

## Component Stylings

- Botões têm altura mínima de 44px, raio de 7px e feedback de elevação de 1px.
- Painéis usam uma única linguagem de profundidade: borda estrutural e superfície branca.
- Formulários têm labels acima, helper text abaixo e mensagens de sucesso inline.
- Ícones são SVGs de traço único; nenhum símbolo textual é usado como affordance.

## Layout Principles

Sidebar escura fixa em desktop, conteúdo contido em 1230px e colapso estrutural para uma coluna abaixo de 680px. A visão geral prioriza leitura em faixas e filas; criação de registros usa um split de contexto e formulário.

## Motion & Interaction

Transições curtas para estados de operação e uma pulsação lenta apenas na faixa de sinal. Respeitar `prefers-reduced-motion`.

## Anti-Patterns

- Sem emojis, gradientes, neon, glow ou preto puro.
- Sem cards iguais em grade de três colunas como estrutura principal.
- Sem texto genérico de marketing ou valores falsamente precisos.
- Sem sobreposição de conteúdo, labels flutuantes ou ícones Unicode.
- É estritamente proibido usar dados mockados, fictícios, de exemplo ou hardcoded na interface. Sem dados reais, usar estado vazio, carregamento ou configuração.

## Superfície de catálogo

- Produtos cadastrados são representados como produto-base: o card exibe somente imagem, nome e a ação discreta de informações.
- Loja, preço, disponibilidade e demais ofertas permanecem fora da listagem visual principal, preservando espaço para múltiplas ofertas futuras por produto.
- A grade usa imagem real persistida quando disponível e estado explícito de imagem ausente quando não houver mídia confirmada.

## Componentes compartilhados

- `ImageViewer` recebe somente imagens normalizadas como `{ id, src, thumbnailSrc?, alt? }` e controla modal, foco, teclado, navegação, miniaturas, contador e estados de carregamento.
- O componente não conhece produto, loja ou mecanismo de coleta. As telas devem fornecer URLs seguras retornadas pela API.
- `ImageWithState` concentra os estados visuais `loading`, `loaded` e `error` para manter o skeleton e o fallback de imagem consistentes.
