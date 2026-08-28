---
id: work_image_viewer_responsive_2026_08_27
type: working
status: draft
confidence: 0.96
source: user
sources:
  - components/ImageViewer.tsx
  - app/globals.css
  - .agents/skills/impeccable/reference/adapt.md
created_at: 2026-08-27
updated_at: 2026-08-27
expires_at: null
related: []
---

# Correção de responsividade do ImageViewer

## Objetivo

Impedir que título, controles, miniaturas ou imagem ultrapassem os limites do modal da galeria em desktop, tablet e mobile, preservando a lógica existente.

## Checklist

- [completed] Localizar o componente e os estilos atuais.
- [completed] Corrigir layout do toolbar, card e palco da imagem.
- [completed] Validar lint/build e renderizar a superfície em tamanhos representativos.
- [completed] Revisar limitações e concluir o registro.

## Decisões

- Usar `minmax(0, 1fr)` e `min-width: 0` para permitir que a área da imagem ceda espaço ao viewport.
- Estilizar `.lightbox-toolbar-actions`, classe realmente usada pelo componente.
- Aplicar `max-width`/`max-height` e `object-fit: contain` à imagem principal.
- Manter a navegação e miniaturas, tornando suas áreas roláveis ou posicionadas dentro do palco.

## Ferramentas e fontes consultadas

- Inspeção local com `rg` e PowerShell.
- Documentação local do Next.js 16 disponível no projeto.
- Skills `frontend-design`, `impeccable` e `chrome:control-chrome`.

## Validação

- `npm run lint`: concluído sem erros.
- `npm run build`: concluído com Next.js 16.3.2 e TypeScript sem erros.
- Chrome em desktop com galeria real de 10 imagens: modal e palco sem overflow calculado; imagem e fechar permaneceram dentro dos limites. Após corrigir regras tardias da cascata, a checagem final retornou `contained: true`, `overflow.modal: false`, `overflow.stage: false` e `closeInside: true`.
- Limitação: a capability de viewport do Chrome não estava disponível, portanto não foi possível capturar screenshots automatizados de 320px/768px nesta sessão.

## Resultado

O toolbar agora trata contador e fechar como bloco não comprimível, enquanto o título pode quebrar em até duas linhas. O modal e o palco têm limites fluidos, `min-width: 0`, `overflow: hidden`, e a imagem usa `max-width`, `max-height` e `object-fit: contain`. Miniaturas continuam em rolagem horizontal e os controles permanecem posicionados dentro do palco.
