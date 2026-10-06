# Limites de requisicoes sem prejudicar o uso normal

Pesquisa e implementacao: 2026-10-05. Frontend integrado ao contrato de limites do ScoutApiV2 (ADR 0047). Politica canonica: docs/security/api-auth.md no repositorio da API.

## Implementacao no frontend

- `utils/api/request-control.ts`: parsing de Retry-After, backoff exponencial com jitter e compartilhamento de GETs em voo com cancelamento independente.
- `utils/api/client.ts`: coordenacao restrita ao navegador, isolamento por sessao e por gravacoes concluidas, pausa por metodo/caminho, preservacao da sessao em falhas transitorias do refresh. Sem cache de respostas e sem retries automaticos de mutacoes por 429.
- `utils/visible-polling.ts`: proximo ciclo depois da resposta, pausa em abas ocultas, retomada ao foco e respeito ao prazo completo de 429.
- Match: consulta a cada quatro segundos enquanto ativo e sessenta segundos sem atividade, permitindo descobrir execucoes iniciadas em outra sessao.
- Notificacoes e logos: ciclos sequenciais e abortaveis. Notificacoes mostram falhas de atualizacao e preservam dados confirmados; marcar todas como lidas recarrega o estado canonico, sem inventar horario.
- Layout admin: validacao inicial, ao foco e a cada cinco minutos, independente da rota; pausa acessivel com contagem e estado de processamento. Falha transitoria nao desmonta painel ja confirmado.

Coordenacao ocorre dentro de cada aba e sessao. Respostas com rate_limit_policy=token_bucket e rate_limit_scope pausam rotas do mesmo escopo (default, auth, crawler, poll), incluindo refresh de autenticacao. Rotas conhecidas seguem o contrato; outras aprendem pelo header X-RateLimit-Scope. Respostas antigas, escopos desconhecidos e upstream_cooldown continuam isolados por rota. Nao ha coordenacao entre abas; a API permanece autoridade das cotas. Sem repeticao automatica de mutacoes ou cache de respostas.

## Evidencias da pesquisa inicial (antes das correcoes)

- `hooks/useProductMatchRun.ts`: consulta a cada quatro segundos mesmo sem run ativa; intervalo pode sobrepor chamadas lentas. O AbortController do efeito nao chega a chamada HTTP. O backoff reduz esperas maiores que sessenta segundos.
- `utils/api/client.ts`: Retry-After usa parseInt, sem suporte a HTTP-date; nao existe coordenacao de cooldown entre consumidores. Refresh de token ja usa single-flight.
- `app/admin/layout.tsx`: auth/me e consultado novamente quando pathname muda; falha transitoria bloqueia a renderizacao do painel.
- `hooks/useNotifications.ts`: consultas por intervalo, foco, visibilidade e mudanca de rota podem coincidir. Erros nao alteram a frequencia.
- `app/admin/page.tsx` e `app/admin/produtos/[id]/page.tsx`: consultas de lojas a cada tres segundos durante processamento de logos, sem coordenacao com os outros consumidores.

Isso demonstra amplificacao potencial, nao comprova qual camada gera os 429. O backend FastAPI externo, gateway, configuracao de cotas e logs nao foram acessados.

## Abordagem recomendada

1. Reduzir chamadas evitaveis no cliente centralizado: deduplicar GETs equivalentes em voo por contexto de autenticacao e opcoes relevantes; invalidar dados ao trocar sessao ou concluir mutacoes. Nao compartilhar caches privados entre usuarios ou requests do servidor. Coordenar cancelamento por consumidor.
2. Polling sequencial: agendar proxima consulta depois da anterior; pausar em aba oculta; consultar frequentemente apenas enquanto ha trabalho ativo. Sem trabalho, consultar ao entrar e ao retomar foco, ou usar intervalo bem mais espaçado se necessario detectar trabalho iniciado em outra sessao. Preservar reconciliacao ao voltar para a tela.
3. Respeitar Retry-After integralmente, tanto segundos quanto data HTTP. Coordenar pausa por escopo informado pela API, sem bloquear indiscriminadamente todas as rotas. Na ausencia de prazo, usar backoff exponencial com jitter, limite de tentativas e cancelamento. Nao repetir mutacoes automaticamente sem garantia de idempotencia.
4. No backend, separar cotas de leitura, autenticacao e operacoes caras. Propor token bucket para permitir rajadas curtas de navegacao com taxa sustentada controlada. Identidade autenticada e a chave principal; protecao por IP na borda e complementar. Endpoints de login e recuperacao precisam de politica propria. Nao assumir que GET e barato: classificar pelo custo real.
5. Coletas e buscas: limitar concorrencia e custo por usuario, produto e provedor; admitir trabalho numa fila limitada e devolver identificador para acompanhamento. Evitar trabalho duplicado e definir resposta quando a fila esta cheia. Consultar o status nao deve consumir a cota de iniciar uma coleta.
6. Se houver multiplas instancias, usar armazenamento compartilhado e operacoes atomicas para cotas; Redis e uma opcao, nao uma nova dependencia obrigatoria sem verificar a infraestrutura atual. Definir degradacao quando o armazenamento falhar, sem alterar autorizacao.
7. Expor no contrato 429 o escopo atingido e o prazo de retomada; permitir leitura de Retry-After por CORS na API externa. A UI deve manter dados confirmados e explicar atraso de atualizacao, distinguindo falha transitoria de sessao invalida. Validacao e autorizacao continuam exclusivamente na API.

## Comparacao e decisao

| Alternativa | Avaliacao |
| --- | --- |
| Aumentar uma cota global | Pode aliviar temporariamente; nao corrige chamadas redundantes nem distingue custo. |
| Remover limites | Rejeitada: deixa consumo e abuso sem controle. |
| Janela fixa | Simples, mas permite concentracao de trafego nas bordas da janela. |
| Janela deslizante | Boa alternativa quando a cota temporal precisa ser mais estrita. |
| Token bucket por classe e identidade | Recomendado para navegacao com rajadas curtas e taxa media limitada. |
| SSE para progresso | Avaliar depois; exige suporte do backend, reconexao e operacao de conexoes persistentes. |

## Ordem de execucao e validacao futura

Primeiro instrumentar origem dos 429: endpoint, camada emissora, politica, escopo, prazo, volume e concorrencia, sem tokens ou dados pessoais desnecessarios. Em seguida corrigir polling e cooldown no frontend. Depois calibrar cotas e filas na API com trafego medido; nao fixar numeros sem observar uso normal e capacidade.

Validar navegacao normal, chamadas lentas, retomada de foco, multiplas abas, troca de sessao, Retry-After longo e em data, mutacoes e concorrencia distribuida. Conferir que leituras continuam disponiveis quando a cota de coleta e atingida e que abuso continua limitado. Nenhum teste de carga em producao foi executado nesta pesquisa. Nenhum dado ficticio foi inserido na aplicacao.

## Fontes

- [OWASP API4: limites ajustados ao negocio e consumo de recursos](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/).
- [Redis: comparacao de algoritmos, rajadas e atomicidade](https://redis.io/tutorials/howtos/ratelimiting/).
- [Redis: cotas distribuidas por usuario, API e tenant](https://redis.io/docs/latest/develop/use-cases/rate-limiter/).
- [AWS: backoff, jitter e riscos de retries](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/).
- [RFC 9110, secao 10.2.3: Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3).
- [RFC 6585, secao 4: 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585.html#section-4).

OWASP sustenta diferenciacao por necessidade de negocio; Redis compara algoritmos; AWS sustenta controle de repeticoes; RFCs definem o protocolo. A combinacao recomendada e uma inferencia aplicada ao codigo local, nao diagnostico confirmado do backend.

## Validacao da integracao por escopo

21 testes de controle de chamadas, cliente e polling passaram. Typecheck, lint dos arquivos alterados e build Next de producao passaram. Na API, 46 testes direcionados passaram e o Lua foi validado em Redis 7 real com concorrencia e recuperacao. A suite ampla da API tem tres falhas Amazon e 41 erros de mypy reproduzidos na baseline; registrados em PENDING-028 do ScoutApiV2. Smoke do painel mostrou consultas de sessao, catalogo, lojas e notificacoes com 200; imagens com 502 correspondem a pendencia anterior de acesso ao Drive. Nenhum teste de carga em producao foi realizado.
