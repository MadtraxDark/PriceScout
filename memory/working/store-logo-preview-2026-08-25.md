---
id: frontend_store_logo_preview_2026_08_25
type: working
status: validated
confidence: 0.98
source: agent
sources: [app/admin/page.tsx, app/globals.css, utils/api/contracts.ts, utils/api/client.ts, http://localhost:3000/admin?view=product, http://localhost:8080/api/v1/brands/Magazine%20Luiza/assets]
created_at: 2026-08-25
updated_at: 2026-08-25
expires_at: null
related: [memory/working/entity-identity-assets-2026-08-25.md]
---

# Logo da loja na previsualizacao

## Objetivo

Substituir o nome da loja pela logo persistida quando a API fornecer `asset_url`, mantendo o nome como fallback.

## Checklist

- [completed] Tipar o novo formato de `brand_assets` e `asset_url`.
- [completed] Normalizar o payload novo e o contrato legado no componente `EntityIdentity`.
- [completed] Resolver URLs relativas pela origem configurada da API.
- [completed] Usar `crossOrigin="use-credentials"` para assets protegidos pela API.
- [completed] Manter fallback textual quando a referencia faltar ou a imagem falhar.
- [completed] Ajustar tamanho proporcional da logo no chip da loja.
- [completed] Validar `eslint` sem erros e `tsc --noEmit --incremental false`.
- [completed] Validar a tela no Chrome com uma previsualizacao real.

## Resultado

O componente usa `product.store_assets` quando presente e, para o contrato atual da API, extrai `product.brand_assets.store.assets.logo.asset_url`. A API local atualizada respondeu corretamente com `asset_url: null` para Magazine Luiza porque o asset ainda nao esta disponivel no storage e o provedor retornou HTTP 403; a tela exibiu `Magazine Luiza`, confirmando o fallback.

## Limitacoes

O build de producao nao pode escrever `.next/trace` porque o servidor Next em execucao mantem o diretorio bloqueado. A checagem TypeScript sem incremental concluiu com sucesso. O lint apresentou apenas warnings preexistentes sobre `<img>` e variaveis nao utilizadas.
