---
id: mem_20261005_rate_limit_research
type: working
status: draft
confidence: 0.8
source: agent
sources: [utils/api/client.ts, hooks/useProductMatchRun.ts, app/admin/layout.tsx]
created_at: 2026-10-05
updated_at: 2026-10-05
expires_at: null
related: []
---

# Pesquisa de limites de requisicoes

Objetivo: pesquisar uma protecao que nao prejudique o uso normal do PriceScout.
Inicio: 2026-10-05, horario de Sao Paulo.

## Checklist

- completed: consultar indice e schema de memoria, localizar tratamento de 429 e chamadas periodicas.
- completed: consultar fontes oficiais independentes e comparar alternativas.
- completed: registrar recomendacao, limites da evidencia e prioridades.
- completed: revisar resultado e informar ao usuario.

## Etapa 1

Ferramentas: PowerShell, rg, leitura de arquivos e inventario de ferramentas MCP.
CLIs disponiveis: node, npm, git e rg. Conectores disponiveis incluem GitHub e Supabase; nenhum acesso ao backend externo foi estabelecido. Pesquisa web disponivel.
Skills revisadas no catalogo: fastapi e api-security-review. O backend nao esta neste repositorio; a auditoria completa de seguranca excede a pesquisa solicitada. Nenhuma dessas skills foi aplicada.
Evidencias: polling de match a cada quatro segundos, sem pausa quando nao ha run; intervalo nao aguarda conclusao da chamada; AbortController nao e passado ao request; backoff limita Retry-After a sessenta segundos. Cliente interpreta somente segundos com parseInt e nao coordena cooldown. Layout consulta auth/me a cada mudanca de pathname.
Limite: sao fatores capazes de amplificar chamadas, nao prova da causa do limite; configuracao do limiter e logs do backend nao foram acessados.
Erros: nenhum ate esta etapa.
Proximo passo: fontes oficiais sobre politica de limites, Retry-After e controle de carga.

## Etapa 2

Fontes oficiais consultadas via web: Redis (algoritmos e coordenacao distribuida), OWASP API4 (limites por necessidade de negocio), RFC 9110 (Retry-After), AWS (retries e jitter).
Confirmado tambem: notificacoes usam intervalo de vinte segundos e atualizacoes por foco, visibilidade e pathname; logos em processamento consultam lojas a cada tres segundos. Esses fluxos nao coordenam backoff entre si.
Decisao proposta: token bucket por identidade autenticada e classe de operacao, com protecao adicional de borda por IP; leituras nao devem consumir a mesma cota das coletas. Reduzir polling e coordenar cooldown no cliente antes de calibrar cotas com logs.
Alternativas: aumentar limite global apenas mascara amplificacao; remover limites elimina protecao; janela fixa tem problemas nas bordas; sliding window e alternativa para quotas estritas; SSE depende de suporte e operacao do backend, nao e primeiro passo.
Ferramentas: web, PowerShell e rg. Nenhuma chamada a API de producao ou teste de carga realizado. Existem alteracoes locais preexistentes; nao foram modificadas.
Proximo passo: documento revisavel de recomendacao e fechamento da checklist.

## Etapa 3 e encerramento

Resultado: docs/rate-limit-recommendation.md registra achados, proposta, alternativas, fontes e validacao futura. Revisao realizada contra os arquivos lidos e as fontes; recomendacoes separadas de fatos locais. Nenhuma mudanca no comportamento da aplicacao, dependencia ou backend.
Limitacao: causa exata e cotas adequadas exigem logs e configuracao da API externa. Implementacao e validacao operacional sao trabalho futuro, fora do pedido de pesquisa. Checklist da pesquisa concluida; sem etapas pendentes ou erros registrados.
