---
id: working_catalog_products_source_2026_08_25
type: working
status: completed
confidence: 1.0
source: user
sources:
  - utils/api/services.ts
  - app/admin/page.tsx
  - http://localhost:8080/api/v1/catalog/products
created_at: 2026-08-25
updated_at: 2026-08-25
expires_at: null
related: []
---

# Origem dos produtos exibidos no catálogo

## Checklist

- [completed] Consultar diretamente o endpoint de produtos.
- [completed] Comparar os nomes com a captura da tela.
- [completed] Identificar registros de teste aparentes.

## Resultado

`GET /api/v1/catalog/products` respondeu HTTP 200 com os seis produtos exibidos. Os registros vêm da API/backend. Dois produtos têm URLs de imagem com aparência de teste e quatro têm `image_url: null`; a tela mostra o estado de imagem indisponível conforme esses dados.
