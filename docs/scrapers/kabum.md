# Scraper de produtos KaBuM

O scraper está em [utils/scraping/kabum.ts](../../utils/scraping/kabum.ts). Ele expõe `extractKabumProduct` para uma página Playwright e `crawlKabumProducts` para executar uma fila de URLs com `PlaywrightCrawler`.

## Execução

Instale os navegadores do Playwright uma vez no ambiente de execução:

```bash
npx playwright install chromium
```

Depois execute:

```bash
npm run scrape:kabum -- https://www.kabum.com.br/produto/<id>/<slug>
```

O resultado é JSON com os campos de identidade, marca, preços, parcelamento, disponibilidade, estoque, vendedor e imagens. `cardPrice` é o total das parcelas quando a página não fornece outro preço de cartão. Campos não encontrados permanecem `null` e a disponibilidade pode ser `unknown`.

As imagens são limitadas à galeria do produto pelo ID da URL. Variantes que compartilham o mesmo caminho-base são agrupadas e a maior versão observada é mantida; `_gg` e `_g` têm prioridade sobre `_m` e `_p`.

O scraper também retorna `taxonomy`, uma lista ordenada de `{ level, name, slug }` extraída dos links do breadcrumb. O prefixo “Você está em:” e o código do produto não fazem parte do resultado. Após a aprovação da prévia, a rota de servidor chama `upsert_product_taxonomy`, que reutiliza categorias por pai e slug e grava os vínculos do produto.

Estados especiais são retornados separadamente em `special_status` e `shipping_from`. O primeiro aceita rótulos reconhecidos como `Pré-venda`, `Em breve`, `Lançamento`, `Sob encomenda` e `Reposição`; o segundo captura a data exibida em “Envio a partir de ...”. Esses campos não são misturados com disponibilidade ou vendedor.

O resultado do scraper é uma observação externa. A atualização do produto canônico deve passar pela validação definida na arquitetura do PriceScout. Para persistir a taxonomia, configure `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente do servidor.
