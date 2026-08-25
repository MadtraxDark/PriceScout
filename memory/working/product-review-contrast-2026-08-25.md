---
type: working
status: completed
created: 2026-08-25
updated: 2026-08-25
confidence: high
---

# Revisão de contraste do quadro de produto

## Objetivo

Melhorar a hierarquia visual, contraste e legibilidade do quadro de prévia comercial, com destaque específico para o nome da loja.

## Checklist

- [completed] Ler skills e contexto visual
- [completed] Auditar o bloco e seus tokens existentes
- [completed] Reforçar contraste da loja, preços, economia e status
- [completed] Validar lint, build e diff

## Decisões

- Preservar Manrope, DM Mono, fundo claro e acento coral do PriceScout.
- Tornar “Magazine Luiza” o valor dominante dentro do chip, mantendo “Loja” como rótulo auxiliar.
- Aumentar contraste estrutural de bordas e separadores sem criar sombras pesadas.
- Destacar Pix com coral e economia com verde sem usar gradientes ou neon.
- Escurecer valores de status, vendedor e entrega para reduzir aparência apagada.

## Validação

- `npm run lint`: concluído sem erros.
- `npm run build`: concluído com sucesso.
- `git diff --check`: concluído sem erros de whitespace.
