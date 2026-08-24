---
id: working_api_base_url_runtime_error
type: working
status: validated
confidence: 1.0
source: user
sources:
  - node_modules/next/dist/docs/01-app/02-guides/environment-variables.md
  - https://nextjs.org/docs/pages/guides/environment-variables
  - https://vercel.com/academy/nextjs-foundations/env-and-security
created_at: 2026-08-24
updated_at: 2026-08-24
expires_at: null
related:
  - working_frontend_only_fastapi_migration
---

# Tratamento da URL base da API ausente

## Objetivo

Impedir que a página de login falhe durante a renderização quando `NEXT_PUBLIC_API_BASE_URL` não estiver configurada e apresentar um estado de configuração acionável.

## Checklist

- [completed] Reproduzir a causa pelo stack trace e inspecionar cliente, serviço e página de login.
- [completed] Ler a skill `impeccable`, o playbook de hardening e o guia local do Next.js 16.3.2.
- [completed] Consultar documentação atual sobre variáveis públicas e substituição em build.
- [completed] Tornar a geração da URL de login segura para configuração ausente.
- [completed] Adicionar estado visual acessível sem dados fictícios ou fallback silencioso.
- [completed] Executar typecheck, lint, build sem a variável e auditorias finais.
- [pending] Executar typecheck, lint, build sem a variável e auditorias finais.

## Causa raiz

`LoginPage` chamava `authApi.signInUrl()` durante a renderização. Esse método usava `apiUrl()`, que lança uma exceção quando a variável pública não existe. Como a variável `NEXT_PUBLIC_` é incorporada durante a build, iniciar ou construir sem ela deixava a rota incapaz de renderizar.

## Decisão

- Manter requisições reais estritas: tentar chamar a API sem configuração continuará gerando erro explícito.
- Tornar apenas a composição do link de login consultável: o serviço retorna `null` quando a origem não está configurada.
- Renderizar botão desabilitado e mensagem de configuração na própria tela, sem inventar uma URL padrão.

## Ferramentas

- Skill `impeccable`, modo de hardening.
- Documentação local do Next.js 16.3.2.
- Pesquisa web em documentação do Next.js e Vercel.
- `rg`, TypeScript, ESLint e build do Next.js.

## Limitações

- `PRODUCT.md` não existe; a skill permitiu refinamento estreito usando `DESIGN.md` e a implementação existente como autoridade visual.
- A abertura direta das páginas web retornou erro de conteúdo, mas a pesquisa web recuperou os trechos relevantes das mesmas fontes.

## Próximo passo

Definir a URL real da FastAPI em `.env.local` no desenvolvimento e no ambiente de build da implantação.

## Resultado

- A página de login não chama mais uma função que lança exceção quando a configuração está ausente.
- O botão de login fica desabilitado e uma mensagem acessível explica a variável e a necessidade de reinício ou nova build.
- Valores ausentes e URLs que não usam HTTP ou HTTPS são tratados como configuração inválida.
- Requisições reais permanecem estritas e continuam recusando execução sem URL válida.

## Validação

- `npx tsc --noEmit`: passed sem a variável.
- `npm run lint -- --quiet`: passed sem a variável.
- `npm run build`: passed sem a variável no Next.js 16.3.2.
- Renderização de produção de `/login`: HTTP 200.
- Conteúdo renderizado confirmou a mensagem de configuração e a instrução com `NEXT_PUBLIC_API_BASE_URL`.
- Auditoria de chamadas nativas de diálogo: nenhuma ocorrência.
- Auditoria de requisições: `fetch` continua restrito a `utils/api/client.ts`.
- `git diff --check`: passed; somente avisos de normalização LF/CRLF.
