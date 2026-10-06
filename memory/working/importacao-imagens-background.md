---
id: mem_importacao_imagens_background_20261005
type: working
status: draft
confidence: 0.95
source: agent
sources: [utils/api/services.ts, app/admin/page.tsx]
created_at: 2026-10-05
updated_at: 2026-10-05
expires_at: null
related: []
---

Objetivo: concluir a importação após persistir produto e referências de imagens.

- completed: localizar espera sequencial em importProduct, após POST /products.
- completed: enviar imagens aprovadas no mesmo POST, sem aguardar uploads individuais.
- completed: informar processamento em segundo plano.
- completed: TypeScript e 10 testes direcionados passaram; catálogo e galeria reais inspecionados.
- completed: API e recovery validados em testes backend e benchmark com Drive real.
- limitation: lint global contém set-state-in-effect preexistente no admin; acompanhar pendência canônica.

A API registra pending e utiliza a fila PostgreSQL existente. A galeria recebe
display_url da origem enquanto o original é preservado; AVIF pronta tem prioridade.
Nenhum timeout foi aumentado. Medições e recovery estão documentados no ScoutApiV2 em docs/performance/import-images-2026-10-05.md.

- completed: preview real com 25 URLs; envio limitado às primeiras 20 URLs únicas
  com mensagem explícita, conforme limite atual do catálogo. Teste cobre excedentes.
- limitation: preview frio real levou 61,3 s; cache 51 ms, sem efeitos no catálogo
  ou Drive. ScoutApiV2 PENDING-030 acompanha a duração do browser_fetch.
