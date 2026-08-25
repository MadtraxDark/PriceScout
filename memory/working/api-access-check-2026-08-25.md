---
id: working_api_access_check_2026_08_25
type: working
status: completed
confidence: 1.0
source: user
sources:
  - .env
  - http://localhost:8080
  - http://localhost:8080/openapi.json
created_at: 2026-08-25
updated_at: 2026-08-25
expires_at: null
related: []
---

# Verificação de acesso à API

## Checklist

- [completed] Confirmar `NEXT_PUBLIC_API_BASE_URL`.
- [completed] Testar a raiz da API.
- [completed] Testar o documento OpenAPI.

## Resultado

`http://localhost:8080` respondeu HTTP 200 com Swagger UI. `http://localhost:8080/openapi.json` respondeu HTTP 200 e expôs a API FastAPI, incluindo `/health`.
