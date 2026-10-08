---
type: procedural
title: Acesso ao workspace sem Cursor
date: 2026-10-08
confidence: high
source: user instruction
relations: []
---

# Acesso ao workspace sem Cursor

## Procedimento

- Não usar Cursor nem automação da interface do Cursor para acessar ou editar o workspace.
- Usar ferramentas diretas de filesystem e terminal disponibilizadas ao agente.
- Se essas ferramentas estiverem indisponíveis, registrar a falha e informar o bloqueio. Não tentar contornar a indisponibilidade pelo Cursor.

## Fonte

Instrução explícita do usuário em 2026-10-08, após tentativa de iniciar o terminal e a automação de interface, ambos com `helper_unknown_error: setup refresh had errors`.
