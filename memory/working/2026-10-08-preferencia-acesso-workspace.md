---
type: working
title: Registrar preferência de acesso ao workspace
date: 2026-10-08
confidence: high
source: user instruction
relations:
  - memory/procedural/workspace-access.md
---

# Registrar preferência de acesso ao workspace

## Objetivo

Registrar que Cursor não deve ser usado para acessar ou editar o workspace.

## Checklist

- [completed] Criar procedimento persistente com a instrução explícita.
- [completed] Adicionar referência em `memory/INDEX.md`.
- [completed] Anotar limitação do ambiente de execução.

## Registro de execução

- Início: 2026-10-08.
- Decisão: usar ferramentas diretas de filesystem e terminal; se indisponíveis, reportar o bloqueio sem recorrer ao Cursor.
- Ferramentas usadas: `apply_patch` para registrar a instrução. `exec_command` falhou com `helper_unknown_error: setup refresh had errors`.
- Resultado: preferência registrada em `memory/procedural/workspace-access.md` e referenciada em `memory/INDEX.md`.
- Limitação: não foi possível ler o esquema local de memória nem validar a formatação do índice, porque a ferramenta de terminal não iniciou.
