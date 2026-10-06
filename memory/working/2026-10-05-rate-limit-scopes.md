---
id: mem_rate_limit_scopes_20261005
type: working
status: validated
confidence: 0.9
source: agent
sources: ["https://redis.io/docs/latest/develop/use-cases/rate-limiter/", "https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/"]
created_at: 2026-10-05
updated_at: 2026-10-05
expires_at: null
related: ["2026-10-05-rate-limit-implementation.md"]
---

Objetivo autorizado: alinhar cooldown do cliente ao escopo emitido pela API ScoutApiV2.

- completed: revisar contrato e preservar alteracoes anteriores no frontend.
- completed: adicionar classificacao de rotas e pausa compartilhada por escopo.
- completed: 21 testes frontend, typecheck, lint direcionado e build Next passaram.
- completed: revisar contratos, isolamento e compatibilidade.
- completed: API local atualizada e saudavel; headers default/poll confirmados em requests reais 200.

O contrato aditivo usa rate_limit_policy=token_bucket e rate_limit_scope.
Cooldowns de loja e respostas antigas sem politica continuam locais por rota.
Rotas desconhecidas aprendem escopo pelo header X-RateLimit-Scope.
Sem nova dependencia ou mudanca de componentes visuais. Sem repeticao automatica de mutacoes.

Backend: 46 testes direcionados passaram; Lua Redis 7 real validou 40 chamadas concorrentes com capacidade 10 e reposicao gradual. Suite ampla: 1032 passed, 8 skipped, 3 falhas Amazon preexistentes confirmadas na baseline. Mypy atual e baseline: mesmos 41 erros. Docker local esta em development, sem Match Runs ativas antes da atualizacao. Build Docker oficial em andamento; primeiro build nesta base baixou dependencias, sem alterar Dockerfile ou politica Camoufox.

Conclusao: correcao ativa localmente. Rebuild oficial encontrou fpgen sem permissao em Camoufox 0.5.7; registrada PENDING-029 no ScoutApiV2. Aplicacao local usou imagem existente e atualizou somente codigo, mantendo Camoufox 0.5.6 e FastAPI 0.142.0. Nenhum worker, banco, cache, browser ou credencial foi reconfigurado. Pendencias restantes: checks globais preexistentes, rebuild Docker e acesso Drive anteriormente registrado.
