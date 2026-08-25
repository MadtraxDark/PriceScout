---
id: working_google_api_login_check_2026_08_25
type: working
status: blocked
confidence: 1.0
source: user
sources:
  - utils/api/services.ts
  - app/login/page.tsx
  - http://localhost:8080/api/v1/auth/google/login
created_at: 2026-08-25
updated_at: 2026-08-25
expires_at: null
related: []
---

# Verificação do login Google pela API

## Checklist

- [completed] Confirmar que o frontend monta a URL da API.
- [completed] Confirmar o endpoint FastAPI usado.
- [completed] Testar o endpoint com `redirect_frontend_url`.
- [blocked] Completar o redirecionamento OAuth.

## Resultado

O frontend usa `/api/v1/auth/google/login` da API configurada. O endpoint respondeu HTTP 500 no teste; a causa está no backend ou na configuração OAuth e não no endereço da API do frontend.
