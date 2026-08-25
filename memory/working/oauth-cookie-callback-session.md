---
id: working_oauth_cookie_callback_session
type: working
status: completed
confidence: 0.99
source: agent
sources:
  - app/auth/callback/page.tsx
  - utils/api/client.ts
  - utils/api/services.ts
  - C:/Users/ThyagoAz/Desktop/Scrapper de valor/app/main.py
created_at: 2026-08-25
updated_at: 2026-08-25
expires_at: null
related:
  - docs/decisions/0001-frontend-fastapi-api-boundary.md
---

# Correcao do callback OAuth com cookie HttpOnly

## Objetivo

Concluir o login Google no frontend somente depois que a API FastAPI criar e validar a sessao por cookie.

## Diagnostico

A rota `/auth/callback` esperava `code` ou tokens na URL e persistia tokens em `localStorage`. O backend corrigido redireciona para essa rota sem tokens, pois ja cria `ps_access_token` e `ps_refresh_token` como cookies HttpOnly.

## Alteracoes

- `/auth/callback` agora aceita o retorno sem parametros de token, chama `authApi.me()` e redireciona para `next` apenas após `200`.
- O caminho legado com `code` continua encaminhando o codigo ao callback JSON da API.
- Tokens nao sao mais gravados no armazenamento do navegador.
- O cliente HTTP envia `credentials: "include"` e nao recupera Bearer de storage.
- Login, cadastro e refresh nao persistem tokens no frontend.

## Validacao

- `npm run lint`: concluido com exit code 0; existem warnings preexistentes em scripts e telas fora do fluxo.
- `npm run build`: concluido com sucesso.

## Checklist

- [completed] Inspecionar callback, cliente HTTP e servicos de autenticacao
- [completed] Alinhar callback ao cookie HttpOnly
- [completed] Remover persistencia e reanexo de tokens no storage
- [completed] Executar lint e build
- [completed] Confirmar que o endpoint rejeita resultados parciais e só aceita sucesso completo
