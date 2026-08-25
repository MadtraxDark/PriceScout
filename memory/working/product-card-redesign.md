---
type: working
status: in_progress
created: 2026-08-25
updated: 2026-08-25
confidence: high
---

# Redesign do quadro de produto

## Objetivo

Reorganizar o quadro de exibição de produto para melhorar hierarquia, comparação de preços e leitura da galeria, removendo ID, GTIN/EAN e porcentagem de confiança.

## Checklist

- [completed] Ler skills e contexto do projeto
- [completed] Auditar implementação atual
- [completed] Pesquisar boas práticas e registrar fontes
- [completed] Implementar alterações
- [completed] Validar desktop/mobile e acessibilidade
- [completed] Revisar limitações e concluir

## Decisões iniciais

- Preservar a identidade visual clara e o comportamento existente.
- Usar o título do produto como principal âncora textual; marca como rótulo secundário.
- Dar maior peso ao preço Pix, com preço original e parcelado em blocos de comparação.
- Manter a galeria como coluna independente, com legenda natural e controles acessíveis.

## Pesquisa e critérios aplicados

- Baymard Institute: preço e desconto precisam ser imediatamente localizáveis; o preço atual deve ter maior peso visual que o preço original, que deve ser distinguido por tratamento como tachado. Fonte: https://baymard.com/blog/product-page-price-discounts
- W3C WAI: galerias/carrosséis devem ter controles operáveis por teclado, foco compreensível e comunicação do item atual. Fonte: https://www.w3.org/WAI/tutorials/carousels/
- Baymard Institute: excesso de opções ou informações de pagamento simultâneas aumenta ruído; a apresentação deve manter as alternativas claras e comparáveis. Fonte: https://baymard.com/learn/payment-ux

## Implementação realizada

- Removidos da prévia: ID, GTIN/EAN e porcentagem de confiança.
- Marca reduzida a um rótulo secundário abaixo do título.
- Preços renomeados e redistribuídos para explicitar referência, Pix, cartão e economia.
- Preço original passou a ser tachado e secundário; Pix permanece como foco coral.
- Legenda da galeria passou a usar “imagens do produto encontradas”.
- Mantidos miniaturas, navegação por setas, foco visível e ampliação por clique.

## Validação final

- `npm run lint`: concluído sem erros.
- `npm run build`: concluído com sucesso.
- Busca estática: nenhum uso restante de “alta resolução”, GTIN/EAN, confiança ou ID no quadro de prévia.
- A skill de browser foi carregada e a disponibilidade foi verificada. O runtime ofereceu apenas Chrome via extensão, enquanto a solicitação nomeou o navegador in-app; por essa restrição, a inspeção visual automatizada não foi executada.

## Limitação e próximo passo

O quadro foi validado por compilação, lint, inspeção do DOM/estilos e regras de responsividade existentes. Recomenda-se uma conferência visual manual em 1440px e 390px quando o navegador in-app estiver disponível.

## Ferramentas/fontes a consultar

- Skills locais: impeccable, design-taste-frontend, browser.
- Pesquisa web: documentação e referências atuais sobre cartões de produto, preços e galerias.
- Validação: inspeção local e navegador quando disponível.

## Próximo passo

Localizar os componentes e estilos responsáveis pelo quadro de produto.
