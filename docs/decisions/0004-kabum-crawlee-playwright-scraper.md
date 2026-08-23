# Decisão 0004: primeiro scraper KaBuM com Crawlee e Playwright

## Contexto

As páginas de produto da KaBuM renderizam informações comerciais e galeria no navegador. O PriceScout precisa registrar uma observação estruturada sem criar uma segunda fonte canônica para produto ou preço.

## Decisão

Implementar o scraper com `@crawlee/playwright` e `PlaywrightCrawler`. A extração combina:

- JSON-LD `Product` para nome, marca, preço PIX e disponibilidade;
- DOM orientado a texto, atributos `alt`, links de marca e rótulos visíveis para vendedor, estoque, desconto e parcelamento;
- imagens de produto filtradas pelo ID da URL e deduplicadas por caminho-base, escolhendo a variante de maior resolução.

O campo `cardPrice` representa o total calculado a partir das parcelas quando a página só expõe a forma parcelada. Se não houver parcela ou preço de cartão verificável, o campo permanece nulo.

O resultado é uma observação de coleta. Nenhum valor raspado atualiza diretamente o produto canônico no banco.

## Alternativas descartadas

- Seletores baseados nas classes Tailwind da página: frágeis diante de mudanças de apresentação.
- Scraper HTTP sem navegador: não cobre com segurança os dados renderizados após JavaScript.
- Escolher sempre a primeira imagem encontrada: mistura thumbnails e imagens de maior resolução.

## Fontes consultadas

- Playwright, locators e avaliação no DOM: https://playwright.dev/docs/locators
- Crawlee, `PlaywrightCrawler`: https://github.com/apify/crawlee/tree/master/packages/playwright-crawler
- Página de referência KaBuM: https://www.kabum.com.br/produto/985710/monitor-gamer-asus-rog-strix-oled-27-qhd-280hz-0-03ms-qd-oled-g-sync-adaptive-sync-hdr10-a-i-assistant-technology-xg27acdms
