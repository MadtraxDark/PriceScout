---
id: working_api_base_url_question
type: working
status: completed
confidence: 1.0
source: user
sources:
  - .env
  - .env.example
  - README.md
  - utils/api/client.ts
created_at: 2026-08-25
updated_at: 2026-08-25
expires_at: null
related: []
---

# Localização da URL da API

## Objetivo

Identificar onde o frontend define o endereço da API FastAPI.

## Checklist

- [completed] Localizar a variável usada pelo cliente HTTP.
- [completed] Conferir o valor configurado no ambiente local.
- [completed] Informar o arquivo e a necessidade de reiniciar o Next.js.

## Resultado

O cliente lê `NEXT_PUBLIC_API_BASE_URL`. O `.env` atual contém `http://localhost:8000`; a documentação recomenda configurar o mesmo valor em `.env.local` para desenvolvimento local, sem barra final.
