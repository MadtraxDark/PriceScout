---
id: mem_20261006_gitignore_generated_artifacts
type: working
status: validated
confidence: 1.0
source: user
sources: []
created_at: 2026-10-06
updated_at: 2026-10-06
expires_at: null
related: []
---
# Ignorar artefatos gerados

## Objetivo

Adicionar ao `.gitignore` padrões para saídas temporárias de inspeção Playwright e um log de reprodução sem fonte correspondente.

## Checklist

- [completed] Inspecionar `.gitignore`, `git status` e conteúdo dos candidatos.
- [completed] Adicionar regras específicas sem ignorar capturas visuais versionadas.
- [completed] Verificar as regras com `git check-ignore` e o estado do Git.

## Decisão

O `.gitignore` agora ignora `.playwright-mcp/element-*.png`, `.playwright-mcp/console-*.log`, `.playwright-mcp/page-*.yml` e somente `memory/working/_repro_nissei_serp.out.txt`.

## Validação

- `git check-ignore -v` confirmou as quatro regras e os caminhos correspondentes.
- Capturas `product-detail-*` continuam versionadas e fora das regras.
- O arquivo de reprodução deixou de aparecer no status como não rastreado.
