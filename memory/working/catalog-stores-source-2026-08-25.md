---
id: working_catalog_stores_source_2026_08_25
type: working
status: completed
confidence: 1.0
source: user
sources:
  - utils/api/services.ts
  - app/admin/page.tsx
  - http://localhost:8080/api/v1/catalog/stores
created_at: 2026-08-25
updated_at: 2026-08-25
expires_at: null
related: []
---

# Origem das lojas exibidas no catálogo

## Checklist

- [completed] Rastrear a chamada no frontend.
- [completed] Consultar diretamente o endpoint da API.
- [completed] Comparar a resposta com a captura da tela.

## Resultado

`catalogApi.listStores()` chama `/api/v1/catalog/stores` e a API em `localhost:8080` respondeu HTTP 200 com Generic, KaBuM! e Magazine Luiza. Os registros não estão hardcoded no frontend; estão sendo retornados pela API e persistidos no backend.
