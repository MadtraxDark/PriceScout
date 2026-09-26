---
id: working_store_edit_modal_redesign_20260926
type: working
status: validated
confidence: 1.0
source: user
sources:
  - app/admin/page.tsx
  - components/StoreConfigurationForm.tsx
  - app/globals.css
created_at: 2026-09-26
updated_at: 2026-09-26
expires_at: null
related:
  - memory/working/2026-09-24-store-admin-edit.md
---

# Redesign do Modal de Editar Loja

## Objetivo

Melhorar o design, a organizacao visual, o alinhamento dos elementos e a hierarquia das informacoes da tela/modal "Editar loja" no PriceScout, preservando todo o comportamento funcional, as integracoes e regras de negocio.

## Checklist

- [completed] Inspecionar a implementacao atual do modal (estrutura, classes, HTML e CSS).
- [completed] Planejar a reformulacao do cabecalho, campos, textos de apoio, secao de logo e acoes.
- [completed] Implementar melhorias semanticas e estruturais em `components/StoreConfigurationForm.tsx` e `app/admin/page.tsx`.
- [completed] Atualizar e refinar o CSS correspondente em `app/globals.css`.
- [completed] Garantir responsividade para larguras mobile e desktop.
- [completed] Validar tipos com TypeScript (`npm run typecheck`), suite de testes unitarios e build de producao (`npm run build`).
- [completed] Registrar resultados finais na memoria de trabalho e reportar ao usuario.

## Modificacoes Realizadas

1. Estrutura geral do modal (`.store-editor` e `.store-editor-backdrop`):
   - Adicionada animacao suave de entrada (`fade-in` no backdrop com leve blur e `zoom-in` no modal).
   - Ajustada a largura maxima para 640px com proporcoes equilibradas e cantos arredondados de 12px condizentes com o restante do design system.
   - Suporte a fechamento ao clicar no backdrop e via tecla Escape (quando nao estiver em estado de salvamento).

2. Cabecalho (`.store-editor-heading`):
   - Kicker visual com icone da loja e texto "Loja cadastrada" em tipografia mono refinada.
   - Titulo h2 com peso 700 e kerning ajustado (-0.04em).
   - Botao de fechar (`.store-editor-close`) com alinhamento vertical exato ao bloco de titulos, estilo consistente com o shell administrativo.

3. Campos do Formulario (`.store-editor-fields`):
   - "Nome da loja" reorganizado como campo de largura total (grid-column: 1 / -1), destacando-o como o campo primario editavel com badge "Editavel".
   - "Dominio" e "Pais e moeda" organizados lado a lado em duas colunas simetricas, com badges "Bloqueado" acompanhadas de icone de cadeado, comunicando claramente que sao valores derivados da integracao/adapter.
   - Textos auxiliares integrados de forma alinhada diretamente abaixo dos inputs read-only, com micro-icone informativo.

4. Secao de Logo (`.store-logo-section`):
   - Integrada ao formulario em container com fundo suave (`#fafbfa`), borda sutil e separacao equilibrada.
   - Coluna esquerda contendo titulo da secao, especificacoes tecnicas de formato (SVG, PNG, WebP, AVIF, JPG/JPEG ate 2 MB), aviso sobre previa imediata e botao de upload estilizado com icone.
   - Inclusao de acao "Desfazer" quando um arquivo local e selecionado, permitindo restaurar a logo anterior sem precisar fechar o modal.
   - Coluna direita com moldura de preview (156x98px) em fundo branco e sombra suave; exibe a logo em modo contain ou estado vazio estruturado com icone e texto "Logo nao cadastrada".

5. Rodape e Acoes (`.store-editor-actions`):
   - Botoes "Cancelar" e "Salvar alteracoes" posicionados no rodape com linha divisoria superior sutil.
   - "Cancelar" como botao outline neutro e "Salvar alteracoes" com cor de destaque (`var(--accent)`), sombra projetada suave e icone de confirmacao (ou spinner durante salvamento).
   - Responsividade completa no breakpoint mobile (max-width: 680px), ajustando colunas para fluxo vertical fluido e botoes em grade lado a lado.

## Validacao

- `npm run test:money`, `npm run test:images`, `npm run test:match-run`, `npm run test:display`: todos os 39 testes passaram com 100% de sucesso.
- `npm run typecheck`: TypeScript compilou sem erros.
- `npm run build`: Build de producao Next.js (Turbopack) gerado com sucesso.
- Nenhuma informacao tecnica ou funcional foi alterada, nenhum emoji foi utilizado, e nao foram inseridos dados mockados.
