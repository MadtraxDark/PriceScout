---
id: working_logo_visual_processing_2026_08_26
type: working
status: completed
confidence: high
source: agent
sources:
  - https://pillow.readthedocs.io/en/stable/reference/ImageStat.html
  - https://fastapi.tiangolo.com/tutorial/background-tasks/
  - https://docs.brandfetch.com/logo-api/overview
created_at: 2026-08-26
updated_at: 2026-08-26
related:
  - frontend_entity_identity_assets
---

# Processamento visual de logos

## Objetivo

Centralizar no backend a persistência e a análise de logos de marcas e lojas, e fazer o frontend consumir somente o snapshot já processado.

## Checklist

- [completed] Auditar arquitetura, contratos e renderização atual
- [completed] Pesquisar Pillow, FastAPI BackgroundTasks e Brandfetch
- [completed] Atualizar contrato frontend para snapshots visuais versionados
- [completed] Implementar backend FastAPI, migração e job de reprocessamento
- [completed] Reprocessar todas as logos existentes no backend
- [completed] Validar frontend em lint, build e navegador
- [completed] Revisar limitações e registrar trabalho futuro

## Decisões

- A versão da logo será identificada por SHA-256 do conteúdo baixado, não pela URL do Brandfetch.
- O frontend não calcula cor, luminosidade, transparência ou contraste.
- O valor canônico da logo continua sendo o asset persistido pela API; uma falha do Brandfetch não substitui silenciosamente esse valor.
- A API FastAPI foi encontrada em `C:/Users/ThyagoAz/Desktop/ScoutApi` e recebeu a implementação complementar.
- A revalidação da fonte ocorre no máximo a cada sete dias; conteúdo com o mesmo SHA-256 atualiza somente o carimbo de verificação e não repete a análise Pillow.

## Pesquisa consultada

- Pillow `ImageStat` oferece estatísticas globais e recomenda `getextrema()` para extremos por canal.
- FastAPI documenta `BackgroundTasks` para tarefas executadas após a resposta; para processamento durável e reprocessamento em massa, o job deve ser persistido no banco e executado por worker/runner da API.
- Brandfetch oferece variantes `logo`, `symbol`, `icon` e temas claro/escuro, portanto a ingestão deve preservar a URL/variante original e versionar o arquivo baixado.

## Próximo passo

O frontend aceita `visual` por variante, usa `recommended_background` e mantém fallback textual. Lint, build, detector, screenshot da tela autenticada e logs do navegador foram verificados. O detector apontou apenas o `ShinyText` gradiente já existente, fora do fluxo de logos.

No backend, a migração foi aplicada ao Supabase, a imagem Docker foi reconstruída, os testes executaram com `6 passed` e o backfill processou quatro logos. Duas entidades foram registradas como falha por indisponibilidade no Brandfetch; elas não receberam dados fictícios e permanecem identificadas para nova tentativa.
