---
id: working_product_search_button_flow_2026_08_25
type: working
status: completed
confidence: 1.0
source: user
sources:
  - app/admin/page.tsx
  - .agents/skills/impeccable/SKILL.md
created_at: 2026-08-25
updated_at: 2026-08-25
expires_at: null
related: []
---

# Estados do botão de busca de produto

## Checklist

- [completed] Usar `Buscar produto` no estado inicial.
- [completed] Indicar `Buscando produto` durante a requisição.
- [completed] Manter a prévia retornada pela API e o scroll automático no sucesso.
- [completed] Usar `Tentar novamente` no estado de erro.
- [completed] Executar lint, TypeScript e build.

## Resultado

O botão de produto agora comunica a ação real de iniciar a busca, mantém o feedback de carregamento e permite repetir a requisição após erro. A integração permanece em `catalogApi.previewProduct`; não foram adicionados dados fictícios.

## Validação

`npx tsc --noEmit` e `npm run build` concluídos sem erros. `npm run lint` concluído sem erros, com avisos preexistentes no projeto.
