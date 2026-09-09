---
id: pricescout_cross_store_search_hardening_20260904
type: working
status: draft
confidence: 0.35
source: user and agent
sources:
  - AGENTS.md
  - memory/working/cross-store-price-search-2026-08-31.md
  - memory/working/other-store-price-search-audit-2026-08-31.md
created_at: 2026-09-04
updated_at: 2026-09-04
expires_at: null
related:
  - memory/working/cross-store-price-search-2026-08-31.md
  - memory/working/other-store-price-search-audit-2026-08-31.md
---

# Investigacao e robustecimento da busca entre lojas

## Objetivo

Investigar e melhorar, sem regras especificas para um produto, o fluxo de descoberta, matching e extracao de condicoes comerciais usando o Galaxy S24 Ultra 256 GB como caso real.

## Checklist

- [completed] Mapear a integracao e os registros previos no frontend.
- [completed] Localizar a API externa e rastrear o fluxo de busca atual.
- [completed] Pesquisar fontes tecnicas relevantes e registrar a decisao arquitetural.
- [completed] Implementar estrategias de descoberta, fallback, matching e extracao na API em escopo.
- [completed] Executar o caso real e registrar candidatos, decisoes e condicoes por loja.
- [completed] Validar testes e documentar limitacoes.

## Estado inicial e evidencia

- O frontend chama `POST /api/v1/catalog/products/{id}/other-store-prices` e normaliza somente loja, URL, moeda, preco original, Pix e cartao.
- O contrato do frontend nao tem campos de desconto Pix, quantidade/valor de parcelas, juros, candidatos ou diagnostico por loja; portanto, ainda que a API os retornasse, a tela os descartaria.
- O registro de 2026-08-31 descreve a primeira versao como reconsulta de URLs ja presentes no catalogo, sem descoberta por paginas de resultado. O registro de 2026-09-03 observou divergencia entre a API em execucao e a implementacao local daquela API.
- A API configurada no frontend e `http://localhost:8080`; ela esta fora deste repositorio e ainda precisa ser localizada/consultada.
- A API em execucao respondeu em `http://localhost:8080`: ScoutApi 1.0.0, com endpoint especifico de outras lojas e um contrato interno `StorePriceResult` que ja declara `priceConditions` e `installments`.
- O produto real esta no catalogo com ID `51aa8d7c-1ab4-44d6-9b17-93b8d40bd830`, origem KaBuM, e preco Pix canonico de BRL 5.399,00. A listagem tambem revelou registros de teste na API externa, fora da superficie deste frontend; nenhum dado desse tipo sera criado ou usado pela alteracao.
- O codigo da API esta em `C:/Users/Thyago/Documents/Visual Studio Code/ScoutApi`, separado do repositorio atual. A autorizacao do usuario abrange o diagnostico e a implementacao do fluxo de API externo; a leitura e edicao serao estritamente limitadas a esse projeto.
- A imagem ativa `scoutapi:kabum-image-fix` esta desatualizada frente ao codigo local: seus logs usam um fluxo monolitico anterior, enquanto o diretorio contem `ProductSearchPipeline` ainda nao incluido na imagem. O teste real do endpoint ativo retornou `prices=0` na ultima execucao por essa divergencia.
- Logs do container em 2026-09-04 mostram que Amazon encontrou e aceitou o card correto de 256 GB, mas a PDP extraida por `http_impersonated` foi rejeitada na validacao final por conflito de identidade. Magazine Luiza encontrou a PDP correta; `http_impersonated` e Patchright foram bloqueados e Camoufox concluiu a navegacao, mas a extracao final foi rejeitada por identidade/preco incompleto. Mercado Livre concluiu por Camoufox em uma execucao anterior, com BRL 5.825,00 nos tres campos, mas o contrato de resposta eliminou parcelas, juros, desconto e evidencia comercial.
- A politica da API proibe APIs oficiais e endpoints privados das lojas. A melhoria ficara restrita a navegacao de paginas publicas, DOM, JSON-LD, estados incorporados e respostas ja carregadas pelo navegador.
- O pipeline atualizado preserva desconto Pix, parcelas, condicoes comerciais, disponibilidade e vendedor na oferta selecionada. Foi incluido teste unitario para garantir que esses campos nao sejam truncados. O frontend passou a normalizar desconto Pix e parcelas no contrato HTTP.
- A validacao inicial no host falhou por ambiente: `pytest` nao esta instalado e a API nao contem `package.json`. A proxima validacao usara a imagem Docker da API; o lint sera executado no repositorio frontend correto.
- A API atualizada foi copiada para o container ja configurado, compilada e validada com `3 passed` em `test_product_search_pipeline.py`; em seguida, o container foi reiniciado. O lint do frontend foi iniciado no repositorio correto, sem diagnostico de erro retornado no intervalo da ferramenta.
- Reexecucao real com o novo pipeline: a consulta gerou titulo completo, identidade compacta, marca/modelo e modelo/capacidade. A descoberta conseguiu candidatos equivalentes no Mercado Livre, Amazon e Magazine Luiza, e rejeitou corretamente S22/S23/S25/S26, 512 GB, 8 GB RAM, notebooks, TVs e itens sem titulo. A execucao confirmou que a baixa cobertura nao e causada pelo matching de cards.
- Falha exata no Magazine Luiza: HTTP impersonado e Patchright recebem bloqueio; Camoufox acessa a PDP, mas a observacao normalizada vem com `name` vazio e todos os valores comerciais nulos. A validacao final a rejeita corretamente como evidencia insuficiente. O proximo fallback deve corrigir a extracao da PDP renderizada, e nao relaxar o threshold.
- Falha atual no Mercado Livre: o card equivalente e selecionado, mas a PDP recebe Account Verification no HTTP, 403 no Patchright e a tentativa Camoufox excedeu o timeout de enriquecimento. O pipeline passa ao proximo candidato, incluindo recondicionado, o que prolonga a resposta. Deve limitar tentativas de PDP apos bloqueio e classificar condicao (novo/usado/recondicionado) como atributo critico.
- Correcao adicional aplicada: o JavaScript do scraper Magazine Luiza usava escapes duplicados em expressoes regulares, por exemplo `\\s` e `\\d`, que procuravam barras literais em vez de espacos e digitos. O normalizador e os fallbacks de preco/Pix/parcela foram corrigidos e implantados no container; a API foi compilada e reiniciada.
- O endpoint passou a devolver `stores`, com diagnostico estruturado de estrategia, candidatos, resultado do matching, URL selecionada, erro e duracao. A API conserva, em cada oferta confirmada, preco normal, Pix, percentual de desconto, parcela, condicoes, disponibilidade e vendedor. O frontend passou a preservar desconto Pix e parcelas no contrato normalizado.
- Testes no container atualizado: `9 passed` (pipeline e regressao de precos). Inclui teste de preservacao de Pix/parcelas e de deduplicacao Amazon por ASIN.
- Novo teste real apos reinicio, com `timeout_per_store=12`: Amazon descobriu 15 candidatos; o S24 Ultra 256 GB novo foi candidato valido, mas dois anuncios distintos ficaram com 80.05 e 79.68, margem 0.37 menor que o limite de 2.0. Foi rejeitado como ambiguo para nao escolher uma variacao incorreta. A deduplicacao por ASIN removeu os duplicados da mesma PDP entre consultas; o restante representa variantes reais e requer identidade adicional ou selecao assistida, nao reducao global do threshold.
- Magazine Luiza descobriu 15 candidatos e selecionou a PDP oficial `238093700`; HTTP impersonado e Patchright foram bloqueados. Camoufox abriu a pagina, mas retornou titulo e todos os campos comerciais vazios, mesmo apos a correcao de regex; a oferta foi descartada como `empty-observation`. A falha exata e de extracao da PDP renderizada/estado comercial por regiao, nao de descoberta ou card matching.
- Mercado Livre descobriu 10 candidatos; cards de S24 Ultra 256/12 GB foram aceitos e variantes como S23, S24+, S25/S26, 512 GB e recondicionado foram rejeitadas ou ficam fora da selecao. Nas PDPs, HTTP recebeu verificacao de conta ou observacao invalida, Patchright recebeu 403 e Camoufox excedeu o tempo. Nenhuma oferta foi confirmada no teste atual. O problema e bloqueio/navegacao de PDP, nao descoberta.
- Pichau retornou zero candidatos aproveitaveis; Terabyte retornou 15, todos rejeitados por identidade. KaBuM foi pulada por ser a loja de origem do registro canonico, conforme regra de nao duplicar a mesma oferta.

## Ferramentas e fontes consultadas

- Inspecao local: PowerShell, `rg` e arquivos do frontend.
- Documentacao local do Next.js: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.
- Documentacao oficial Playwright: https://playwright.dev/python/docs/network (monitoramento de respostas XHR/fetch ja feitas pela pagina).
- Documentacao oficial Google Search: https://developers.google.com/search/docs/appearance/structured-data/product-snippet (Product/Offer com preco, moeda e disponibilidade) e Schema.org: https://schema.org/Offer.

## Encerramento e limitacoes

Autorizacao do usuario foi usada para atualizar e reiniciar a API. A imagem Docker persistente `scoutapi:cross-store-hardening-20260904` foi reconstruida com sucesso a partir do codigo atualizado. Proximo trabalho seguro: incluir o fallback de extracao Magazine Luiza a partir do estado/JSON carregado na PDP e estabelecer identidade adicional para desempatar variantes Amazon sem reduzir thresholds. Nenhuma observacao falha substituiu o registro canonico.
