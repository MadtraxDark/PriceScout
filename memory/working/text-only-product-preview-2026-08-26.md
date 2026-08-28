---
id: working_text_only_product_preview_2026_08_26
type: working
status: draft
confidence: 1.0
source: user
sources:
  - app/admin/page.tsx
  - app/globals.css
  - utils/api/contracts.ts
created_at: 2026-08-26
updated_at: 2026-08-27
expires_at: null
related:
  - working_logo_visual_processing_2026_08_26
  - frontend_store_logo_preview_2026_08_25
---

# Prévia de produto com identidade textual

## Objetivo

Remover logos da prévia do produto para que marca e loja sejam exibidas somente como texto, sem resolução, download, processamento, cache ou análise visual de logos.

## Checklist

- [completed] Localizar dependências visuais de logos na prévia
- [completed] Remover componentes, etapa de progresso e estilos associados
- [completed] Validar lint, tipos e ausência de uso visual de logos na prévia
- [completed] Registrar limitações e próximo passo

## Decisões

- Manter imagens reais da galeria do produto; a remoção se limita à identidade visual de marca, loja, vendedor e entrega.
- Preservar os campos de assets nos contratos da API enquanto compatibilidade, mas a prévia não os consumirá.

## Ferramentas e fontes consultadas

- Skill `impeccable`, referências `distill.md` e `craft-floor.md`.
- Busca textual com `rg` e inspeção do diff local.

## Estado

A implementação agora renderiza marca, loja, vendedor e entrega em texto. `EntityIdentity`, `resolveAssetUrl`, a mensagem de progresso de logos e os estilos específicos da identidade visual foram removidos do frontend; a galeria de imagens do produto permanece inalterada.

## Validação

- `npm run build`: concluído com sucesso; compilação e verificação TypeScript passaram.
- `npm run lint`: concluído com código 0; há 764 warnings preexistentes/fora do escopo, incluindo regras nos scripts locais da skill e avisos de `<img>`.
- Busca textual na prévia: nenhum uso restante de `EntityIdentity`, `resolveAssetUrl`, `entity-identity` ou mensagem de resolução de logos.

## Limitações e próximo passo

- Os tipos opcionais de assets permanecem em `utils/api/contracts.ts` para compatibilidade com respostas da API, mas não são consumidos pela prévia.
- Não foi alterado o backend nem o processamento de logos fora da prévia, conforme o escopo frontend solicitado.
