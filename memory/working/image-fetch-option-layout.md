---
id: work_image_fetch_option_layout
type: working
status: draft
confidence: 1.0
source: user
sources:
  - app/admin/page.tsx
  - app/globals.css
created_at: 2026-09-24
updated_at: 2026-09-24
expires_at: null
related: []
---
# Ajuste da opção de busca de imagens

Objetivo: corrigir a apresentação responsiva da caixa “Buscar imagens do produto” no formulário de cadastro.

## Checklist
- [completed] Localizar componente e estilos conflitantes.
- [completed] Aplicar estilo específico para checkbox e conteúdo.
- [completed] Conferir diff e registrar resultado e limitações.

## Registro
- Início: 2026-09-24.
- Fontes consultadas: implementação em `app/admin/page.tsx`, estilos em `app/globals.css`, `DESIGN.md`, regra `.cursor/rules/presentation-labels.mdc` e skills `gpt-taste` e `impeccable`.
- Ferramentas: PowerShell, `rg`, script `impeccable.cmd context --target app/admin/page.tsx`.
- Contexto visual: refinamento estreito da interface existente; `DESIGN.md` confirma a linguagem de superfície clara, borda estrutural, texto Manrope e acento queimado.
- Causa: `.form-card input` definia todo input com `width: 100%`, `height: 45px` e padding, incluindo o checkbox. Isso deslocava a descrição e ampliava visualmente o controle.
- Decisão: manter o conteúdo e o comportamento; limitar o checkbox a 18px, definir `flex` fixo, alinhar o texto à esquerda e acrescentar foco visível no contorno da opção.
- Resultado: alteração localizada em `app/globals.css`; diff revisado. Nenhuma dependência ou lógica de coleta alterada.
- Verificação: inspeção do diff e status do Git. Testes e build não executados, pois não foram solicitados.
- Próximo passo: nenhum.
