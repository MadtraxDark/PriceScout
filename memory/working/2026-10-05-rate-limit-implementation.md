---
id: mem_20261005_rate_limit_implementation
type: working
status: draft
confidence: 0.8
source: agent
sources: [docs/rate-limit-recommendation.md, https://react.dev/reference/react/useEffect, https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal, https://www.rfc-editor.org/rfc/rfc9110.html]
created_at: 2026-10-05
updated_at: 2026-10-05
expires_at: null
related: [mem_20261005_rate_limit_research]
---

# Implementacao do controle de chamadas

Objetivo autorizado: implementar a recomendacao no frontend disponivel, preservando alteracoes locais existentes.
Inicio: 2026-10-05, Sao Paulo.

## Checklist

- completed: ler regras, codigo atual, guia local Next.js, fontes oficiais e inventario de ferramentas.
- completed: implementar coordenacao GET, Retry-After e polling sequencial.
- completed: reduzir consultas de autenticacao por navegacao e apresentar espera acessivel.
- completed: executar testes de regressao, typecheck, lint e revisar superficie afetada.
- completed: documentar resultado e limites.
- blocked: cotas, token bucket e filas no backend externo; repositorio e acesso operacional nao disponiveis nesta sessao.

Decisoes: nenhuma dependencia nova; coordenacao restrita ao navegador e sessao, sem cache de respostas. Cooldown conservador por metodo e caminho, pois API ainda nao informa contrato confiavel de escopo global. Mutacoes nao recebem retries automaticos. Polling com cancelamento, pausa de visibilidade e reagendamento depois da resposta.
Ferramentas disponiveis: node, npm, git, rg e web. MCPs inventariados; nenhum necessario para editar codigo local, nenhum acesso ao backend estabelecido. Skill aplicada: full-output-enforcement. Fontes comparadas: React, MDN e RFC, junto da pesquisa anterior OWASP/Redis/AWS. Guia Next lido: server-and-client-components.
Erros: nenhum nesta etapa. Proximo passo: implementar e testar.

## Etapa 2

Cliente e polls implementados; primeira verificacao TypeScript passou. GETs idênticos compartilham somente a Promise em voo, com cancelamento independente e isolamento por revisao da sessao. Cooldown local por metodo/caminho evita novas chamadas sem repetir mutacoes. Polls de notificacoes, match e logos usam timer sequencial e AbortSignal. Match sem atividade consulta em intervalo maior para detectar execucoes externas.
Erro de ferramenta: Get-Content recebeu caminho posicional junto com LiteralPath; leitura nao executada, sem alteracao de arquivo. Corrigido usando somente LiteralPath.
Proximo passo: autenticacao e testes de cancelamento, 429 e timers.

## Etapa 3

Autenticacao sem dependencia do pathname; revalidacao periodica e ao foco, mantendo painel confirmado em falha transitoria. Espera de 429 apresentada com botao desabilitado e retomada automatica. Refresh preserva token em 429, 5xx e rede; respostas de sessao antiga sao descartadas. Mutacoes invalidam chave de compartilhamento de GETs em voo para que leituras posteriores nao reutilizem consultas anteriores a gravacao.
Validacao inicial: treze testes novos passaram via TypeScript local compilado e node --test. Typecheck passou. Lint encontrou erro anterior de set-state-in-effect em app/admin/page.tsx e avisos anteriores; trechos novos sem erros apontados.
Erros do runner: npx tsx falhou com EACCES de rede/cache; tsx em cache falhou com uv_os_get_passwd ENOMEM; primeira tentativa de --import com caminho Windows exigiu URL file. Alternativa usada: compilar somente os testes com TypeScript local em .next/request-tests e executar com Node, sem rede e sem nova dependencia.
Erro de codificacao: pipeline PowerShell/Python substituiu acentos em duas mensagens; corrigido com apply_patch e revisao textual.
Revisao de dados: removida data operacional inventada ao marcar todas as notificacoes; estado agora vem da resposta e lista canonica da API. Fixtures existem somente em arquivos de teste.
Proximo passo: regressao dos adaptadores e revisao final do diff e documentacao.

## Etapa 4 e encerramento

Regressao: suite completa de sessenta e um testes passou com tsx em cache via execucao local autorizada fora do sandbox; nenhum download. Caso adicional de 429 apos renovacao foi implementado e a suite do cliente passou novamente com onze testes, totalizando sessenta e dois casos validados. Typecheck passou depois do ajuste. Build Next de producao passou. Lint dos arquivos novos e alterados de controle de chamadas, hooks, layout, painel e detalhe de produto passou. Lint ampliado em services e pagina principal permanece com avisos anteriores e erro anterior de setIncludeImages em efeito; nao foi alterado fora do escopo.
Revisao final: diff sem erros de whitespace; superficie nova sem dados ficticios, dialogs nativos ou credenciais persistidas. Alteracoes preexistentes de imagens preservadas. docs/rate-limit-recommendation.md atualizado com implementacao e limites. Erro adicional de apply_patch: contexto documental nao encontrado; patch nao aplicado e reaplicado com contexto correto.
Limitacoes: sem verificacao contra API de producao e sem coordenacao entre abas. Backend externo permanece blocked por ausencia do repositorio/acesso; necessario para cotas por operacao, token bucket, filas, CORS e telemetria. Nenhuma etapa de frontend pendente. Proximo passo fora do escopo local: implementar a politica no backend externo quando disponivel.
