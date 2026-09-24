---
id: working_store_logo_optimization_20260924
type: working
status: in_progress
confidence: 1.0
source: user
sources:
  - ../../../ScoutApiV2/src/scout_api/modules/images/worker.py
  - ../../../ScoutApiV2/src/scout_api/modules/images/optimizer.py
  - ../../../ScoutApiV2/src/scout_api/modules/matching/store_metadata_service.py
created_at: 2026-09-24
updated_at: 2026-09-24
expires_at: null
related:
  - working_store_admin_edit_20260924
---

# Upload e otimiza??o de logos de lojas

## Objetivo

Aceitar SVG, PNG, WebP, AVIF, JPG e JPEG; exibir preview imediato e otimizar
formatos raster compat?veis para AVIF usando storage e worker das imagens de
produto.

## Checklist

- [completed] Investigar upload/worker/storage de imagem de produto.
- [completed] Implementar valida??o de conte?do, MIME, extens?o, tamanho e dimens?es.
- [completed] Persistir IDs, variante, vers?o e status no contrato de metadados.
- [completed] Agendar e executar otimiza??o via worker existente.
- [completed] Proteger contra resultado de job antigo e preservar original em falha.
- [completed] Atualizar preview e consumo de logo no frontend.
- [completed] Adicionar testes direcionados e regress?o de imagens de produto.
- [completed] Aplicar Alembic autorizado no PostgreSQL do Compose e confirmar revis?o e colunas.
- [pending] Executar smoke de persist?ncia/restart com PostgreSQL e Drive reais.
- [pending] Executar smoke visual no navegador autenticado.

## Decis?es e evid?ncias

- Os bytes raster ficam no Google Drive; o PostgreSQL guarda IDs e estado.
- SVG permanece texto sanitizado; AVIF recebido n?o ? reconvertido.
- PNG/WebP/JPEG usam `AvifOptimizer` no worker de imagens.
- `python-multipart` foi adicionado para `UploadFile`; FastAPI documenta essa
  depend?ncia para multipart. A faixa come?a em 0.0.27, que corrige o advisory
  de cabe?alhos multipart sem limite.
- `pytest` direcionado: 51 passaram; TypeScript passou; Ruff nos arquivos
  alterados passou.
- O auto-review recusou `alembic upgrade head` porque `DATABASE_URL` pode
  apontar a banco compartilhado/produ??o. Nenhum contorno foi tentado.

## Pr?ximo passo

A API e o worker ativos ainda usam uma imagem anterior. Recriar ambos com o
c?digo atualizado, executar smoke com PostgreSQL/Drive e navegador e fechar
esta mem?ria. A migration 0030 est? aplicada (`head`) no PostgreSQL do Compose.
