---
id: pricescout_mercadolivre_anti_blocking_20260904
type: working
status: draft
confidence: 0.55
source: user and agent
sources:
  - AGENTS.md
  - memory/working/2026-09-04-cross-store-search-hardening.md
  - https://developers.mercadolivre.com.br/pt_br/usuarios-e-aplicativos/rate-limit-erro-429
  - https://github.com/LuisOcp2/mercado-libre-scraper
  - https://www.reddit.com/r/CharruaDevs/comments/1n9f803/scraping_a_mercado_libre/
created_at: 2026-09-04
updated_at: 2026-09-04
expires_at: null
related:
  - memory/working/2026-09-04-cross-store-search-hardening.md
---

# Estabilidade da coleta no Mercado Livre

## Objetivo

Pesquisar bloqueios de coleta no Mercado Livre, comparar as abordagens com a API atual e implementar uma cascata de baixo impacto, instrumentada e validada em paginas reais.

## Checklist

- [completed] Consultar instrucoes locais, skills aplicaveis e implementacao atual.
- [completed] Pesquisar documentacao oficial e referencias praticas de comunidade e codigo aberto.
- [completed] Implementar politica especifica de baixa frequencia, ordem de estrategias e logs de fallback.
- [completed] Executar testes unitarios no container Docker da API.
- [completed] Reiniciar a API e testar paginas reais de produtos distintos.
- [completed] Registrar resultados, limites e decisao arquitetural.

## Pesquisa inicial

- A documentacao oficial do Mercado Livre recomenda backoff exponencial com jitter, menos concorrencia e consolidacao de chamadas quando ocorre 429. Ela e uma boa referencia para comportamento de carga, mas os endpoints oficiais exigem autorizacao e nao sao elegiveis nesta API por sua politica local.
- O projeto aberto `LuisOcp2/mercado-libre-scraper` usa API oficial como fonte primaria e Playwright apenas para dados que faltam; o principio aplicavel sem API e extrair primeiro o estado publico incorporado na PDP, usando browser apenas quando necessario.
- Discussao no Reddit relata que requisicoes HTTP simples tendem a receber pagina de verificacao e que um navegador com JavaScript, cookies e espera pelo conteudo reduz esse problema. Esse relato nao prova uma garantia nem justifica burlar CAPTCHA.
- Camoufox documenta suporte a contexto e cache; o scraper atual abre e descarta um navegador por tentativa, portanto nao reaproveita a sessao nem o cache entre coletas.

## Vulnerabilidades observadas no fluxo atual

- A politica generica tenta HTTP impersonado antes do browser. Para Mercado Livre, isso ja produziu Account Verification, seguido de 403 em Patchright; Camoufox recebe pouco tempo restante.
- A concorrencia do HTTP e 20 e nao existe ritmo compartilhado por loja. Isso permite picos simultaneos no mesmo host.
- Cada tentativa Camoufox cria um browser novo. Nao ha sessao/cookies reaproveitados entre URLs nem telemetria que explicite a transicao entre estrategias.
- O scraper ja le JSON no DOM e intercepta respostas JSON; esta e a fonte publica mais estavel disponivel, mas so e alcancada apos navegacao bem-sucedida.

## Decisao em implementacao

Para Mercado Livre: serializar coletas por processo, aplicar intervalo minimo configuravel, iniciar por Camoufox e limitar a cascata a duas estrategias. A primeira estrategia preserva JavaScript, localidade e navegacao de browser; a segunda fica como fallback de baixo custo para HTML ou dados estruturados publicos. CAPTCHA e verificacao de conta serao classificados e encerrarao a tentativa, nunca resolvidos automaticamente.

## Implementacao aplicada na API externa

- `StrategyPolicy` agora usa `Camoufox -> HTTP impersonado` para Mercado Livre e limita a duas tentativas. Patchright continua disponivel para outras lojas, mas deixa de receber uma tentativa que ja demonstrou 403 neste fluxo.
- `StoreRequestPacer` serializa tentativas Mercado Livre no processo e aplica intervalo minimo de 1,5 s, configuravel por `SCRAPER_MERCADOLIVRE_MIN_INTERVAL_SECONDS`.
- O orchestrator emite `event=scrape_pacing` quando aguardou o ritmo e `event=scrape_fallback` com estrategia de origem, destino e motivo. A telemetria persistida ja preservava cada tentativa, estrategia, bloqueio e falha.
- Foram adicionados testes unitarios para a policy Mercado Livre e o pacer. A proxima etapa e compilacao e execucao no container oficial.

## Resultado da validacao

- O codigo atualizado foi copiado para o container `scoutapi`, compilado e a API foi reiniciada. O healthcheck retornou todas as cinco engines registradas.
- A bateria selecionada retornou `41 passed, 1 deselected`. O caso desmarcado e um teste legado assincorno que exige `pytest-asyncio`, plugin ausente na imagem; quando incluido, a falha e de infraestrutura (`async def functions are not natively supported`), nao da policy nova. Os testes novos de policy e pacing passaram.
- A imagem persistente foi reconstruida como `scoutapi:mercadolivre-low-impact-20260904`.
- PDP catalogo S24 Ultra `MLB37346312`: sucesso por Camoufox em 10,32 s, resposta total 12,16 s. Extraiu titulo, preco BRL 5.721,00 e 12 parcelas de BRL 549,88 com juros. A pagina nao exibiu Pix explicito, portanto Pix foi normalizado para o preco corrente com desconto zero, sem inventar promocao.
- PDP catalogo S24 Ultra `MLB44247855`: sucesso por Camoufox em 9,62 s, resposta total 10,57 s. Extraiu titulo, preco BRL 5.825,00 e 12 parcelas de BRL 559,88 com juros.
- A mesma PDP `MLB37346312`, forcada no HTTP impersonado apenas para diagnostico, retornou bloqueio `Mercado Livre Account Verification` em 391 ms. Isso reproduz o bloqueio que a policy anterior tentava primeiro.
- Os logs reais mostram `event=scrape_attempt` e `event=scrape_completed`; o novo caminho produz `event=scrape_fallback` quando uma tentativa falha e ainda existe estrategia posterior, e `event=scrape_pacing` quando ha espera por intervalo.

## Comparacao de abordagens

| Abordagem | Evidencia e decisao |
| --- | --- |
| Browser com JS | Camoufox foi a unica estrategia validada com sucesso nas duas PDPs. E a primaria. |
| HTTP com UA/headers | O curl com impersonation recebeu Account Verification na PDP testada. Fica apenas como fallback de baixo custo. |
| Patchright/Playwright/Puppeteer/Selenium | Patchright ja havia recebido 403. Playwright, Puppeteer e Selenium nao sao evasoes por si; nao foram adicionados como complexidade extra. |
| Cookies/sessao | O scraper ainda abre contexto novo. Persistir cookies entre usuarios aumentaria o risco de privacidade; foi descartado enquanto a coleta publica funciona sem login. |
| Delays e limites | Implementado: serializacao e intervalo minimo de 1,5 s por processo. |
| Proxies e rotacao de IP | Descartados: custo e complexidade sem evidencia de necessidade para o volume moderado. |
| CAPTCHA | Classificado e registrado, sem tentativa de resolucao automatica. |
| DOM, JSON-LD e estado incorporado | Mantidos como fontes de extracao. O resultado real confirmou JSON-LD e o estado Nordic como evidencia comercial. |

## Limitacoes finais

- A estabilidade foi demonstrada para duas PDPs, nao garante disponibilidade futura nem cobertura de todas as condicoes regionais de pagamento.
- O fallback completo apos um bloqueio da primeira tentativa esta coberto pela policy e pelos logs; neste lote real Camoufox foi bem-sucedido na primeira tentativa, portanto nao foi necessario acioná-lo. O HTTP forcado confirmou a classificacao do bloqueio que a mudanca evita.
- Se a taxa de bloqueios crescer, o proximo passo seguro e medir a telemetria de tentativas antes de considerar infraestrutura externa; nao e recomendado automatizar CAPTCHA.

## Revisao do projeto mercado-libre-scraper

### Checklist

- [completed] Inspecionar diretamente o codigo do repositorio publico, ignorando seus caminhos de API oficial.
- [completed] Comparar Playwright, separacao de servicos, cache e fallbacks com o ScoutApi.
- [completed] Corrigir a classificacao de falha de extracao para nao confundi-la com bloqueio anti-bot.
- [completed] Executar a bateria Docker da API e documentar o resultado.

### Achados

- O `PlaywrightService` do projeto mantem uma unica instancia de browser iniciada no ciclo de vida do servidor, mas cria e descarta um contexto por busca. Sua coleta de busca faz `goto`, uma rolagem, espera fixa e avalia seletores de cards. A PDP usa seletores diretos de titulo, estoque e avaliacoes. Nao ha deteccao estruturada de bloqueio, cache de resultados de scraping, nem fallback entre fontes de dados da pagina.
- A separacao `router -> service de fonte -> service de analise` e clara, mas a fonte primaria e a API oficial; essa parte foi descartada integralmente pela regra do ScoutApi. O TTLCache de cinco minutos tambem protege apenas respostas de pesquisa da API, nao a navegacao do browser.
- O ScoutApi ja e mais resiliente na extracao: isola instrucoes por loja, usa estado Nordic, JSON-LD, metadados e DOM contextual, preserva evidencia e executa uma cascata de engines. A melhoria aplicavel e distinguir um bloqueio real de uma observacao invalida causada por mudanca de markup, permitindo que a telemetria e o roteamento adaptativo tomem decisoes corretas.

### Implementacao e validacao

- `CamoufoxScraper` agora retorna `failure_kind=blocked` somente quando ha sinal concreto de CAPTCHA, WAF, redirecionamento de verificacao ou status de bloqueio. Se a pagina foi carregada mas nao contem titulo, identidade e oferta ativa suficientes, retorna `failure_kind=invalid_observation`, sem `block_detected`. A cascata continua para a proxima estrategia em ambos os casos.
- Foi adicionado teste isolado do Camoufox com uma PDP simulada que passa pela deteccao de bloqueio, mas falha na validacao da oferta. Ele garante que mudanca de estrutura nao contamine a taxa de bloqueios.
- Bateria Docker: `42 passed, 1 deselected`. A exclusao permanece o teste legado dependente de `pytest-asyncio`, indisponivel na imagem. Uma primeira fixture curta foi corretamente classificada pelo guard generico como HTML insuficiente; ela foi expandida para representar uma PDP realista e a validacao final passou.

### Arquitetura recomendada sem API oficial

1. Descoberta: pagina de busca da loja, links, JSON-LD, scripts e respostas JSON ja carregadas pelo browser.
2. Validacao: normalizacao de URL, ranking e matching antes de acessar a PDP.
3. Coleta: estado estruturado da PDP, JSON-LD, metadados e somente depois DOM contextual da oferta.
4. Recuperacao: classificar bloqueio real, observacao invalida, timeout e capacidade separadamente; aplicar a proxima engine limitada pela policy e pelo pacing.
5. Observabilidade: registrar estrategia, motivo, camada de evidencia e resultado; usar historico apenas para ordenar estrategias comprovadamente mais estaveis.

Sessao persistente de usuario, cookies de login, proxies, rotacao de IP e resolucao de CAPTCHA permanecem descartados. O repositorio citado nao oferece uma implementacao segura ou mais robusta para esses pontos; seu ganho prático aplicavel foi manter o browser no ciclo de vida do servico, que exigiria uma mudanca maior no modelo de loops do ScoutApi e nao e necessaria enquanto o contexto publico e efemero funciona.

### Entrega

- API reconstruida como `scoutapi:mercadolivre-scraping-layers-20260904` e reiniciada.
- Healthcheck confirmado na porta configurada do container, `8080`: `status=online`, com todas as engines prontas.
- A primeira verificacao usou incorretamente a porta 8000 e recebeu conexao recusada; os logs mostraram que o container publica Uvicorn em 8080. O diagnostico foi registrado e a verificacao correta passou.
