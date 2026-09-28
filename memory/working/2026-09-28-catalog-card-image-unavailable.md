---
id: working_catalog_card_image_unavailable_20260928
type: working
status: completed
confidence: 1.0
source: user
sources:
  - app/admin/page.tsx
  - app/globals.css
  - components/ImageViewer.tsx
  - components/StoreConfigurationForm.tsx
  - utils/api/services.ts
created_at: 2026-09-28
updated_at: 2026-09-28
expires_at: null
related:
  - memory/working/2026-09-26-store-edit-modal-redesign.md
  - memory/working/catalog-products-source-2026-08-25.md
---

# Ajuste do Layout do Estado Imagem Indisponivel nos Cards, Miniaturas e Logos de Lojas

## Objetivo

Corrigir o alinhamento, enquadramento, hierarquia visual e composicao do placeholder "Imagem indisponivel" nos cards de catalogo, nas miniaturas de "Produtos recentes" (Visao Geral) e no fallback das logos de lojas (Lojas Cadastradas) do PriceScout, eliminando icones quebrados do navegador, truncamentos e inconsistencias.

## Checklist

- [completed] Inspecionar o componente do card e identificar a causa raiz do desalinhamento.
- [completed] Planejar o novo design do placeholder (icone de imagem semantica, badge enquadrado, tipografia, espacamento e cores).
- [completed] Unificar a renderizacao em `app/admin/page.tsx` (tanto para `image === null` quanto para erro em `MediaImage`).
- [completed] Ajustar e enriquecer os estilos em `app/globals.css` para `.catalog-card-media`, `.media-image`, `.media-error` e `.catalog-card-media-empty`.
- [completed] Corrigir miniaturas de "Produtos recentes" (`.overview-product-image`) na Visao Geral:
  - Adicionado suporte a `showFallbackLabel={false}` em `MediaImage` para contextos compactos.
  - Substituido o icone `box` por `image` no estado sem URL.
  - Ajustado `.overview-product-image` com centralizacao flexbox, raio de 8px e ocultacao forçada de textos residuais.
- [completed] Corrigir logos quebradas em "Lojas cadastradas" (`catalog-row-icon`):
  - Em `utils/api/services.ts`, usado `resolveMediaUrl(store.logo_url)` para nao corromper URLs absolutas externas com `apiUrl()`.
  - Criado o componente resiliente `StoreLogo` em `app/admin/page.tsx` com cadeia de fallback: `logo_url` -> `logo_svg` -> `<Icon name="store" />`.
  - Em `components/StoreConfigurationForm.tsx`, adicionado tratamento de `previewError` e fallback seguro.
- [completed] Executar testes do projeto (`npm run test:*`) e typecheck (`npm run typecheck`).
- [completed] Validar build de producao (`npm run build`).
- [completed] Atualizar registro na memoria e reportar resultados.

## Diagnostico da Causa Raiz

1. Inconsistencia de renderizacao nos cards de produto:
   - Quando `image === null`, o card renderizava `<span className="catalog-card-media-empty"><Icon name="box" /><span>Imagem nao disponivel</span></span>`.
   - Quando `image` existia mas falhava, o `MediaImage` renderizava `<span className="media-image catalog-media-image error"><span className="media-error"><Icon name="box" /><span>Imagem indisponivel</span></span></span>`.

2. Desalinhamento critico e truncamento na miniatura de 48x48px (Produtos recentes):
   - `.overview-product-image` renderizava `MediaImage` com o texto "Imagem indisponivel".
   - Por ser uma caixa compacta de 48px, o icone e o texto colidiam e o texto era truncado como "Ima...".
   - Quando nao havia `image_url`, era exibido o icone `box` (cubo) em vez do icone de imagem.

3. Imagens quebradas nas logos de lojas (Lojas cadastradas):
   - `utils/api/services.ts` concatenava `apiUrl(store.logo_url)` mesmo quando `store.logo_url` ja era uma URL absoluta (`https://...`), gerando URLs invalidas do tipo `http://127.0.0.1:8000/https://...`.
   - `app/admin/page.tsx:507` fazia `<img src={store.logo_url} />` direto sem manipulador de erro (`onError`). Ao falhar, o navegador exibia o icone nativo de imagem quebrada em vez de recorrer a `store.logo_svg` ou ao icone de loja (`<Icon name="store" />`).

## Solucao Implementada

1. `utils/api/services.ts`:
   - Importado `resolveMediaUrl` de `@/utils/api/product-images` para resolver `logo_url` preservando URLs absolutas (`https://`) e resolvendo apenas caminhos relativos.

2. `app/admin/page.tsx`:
   - Criado componente `StoreLogo({ store })`:
     - Tenta carregar `store.logo_url` com `onError`.
     - Se falhar, tenta `store.logo_svg` com `onError`.
     - Se nao houver SVG ou se falhar, renderiza `<Icon name="store" />`.
     - Nunca renderiza imagem quebrada no navegador.
   - Atualizada a lista de lojas em `CatalogView` para usar `<StoreLogo store={store} />`.

3. `components/StoreConfigurationForm.tsx`:
   - Integrado `resolveMediaUrl` e estado `previewError` com fallback para `store-logo-empty-state` caso uma imagem cadastrada falhe no modal de edicao.

## Validacao

- `npm run typecheck`: OK (0 erros de tipagem TypeScript).
- `npm run test:money`, `npm run test:images`, `npm run test:match-run`, `npm run test:display`: 39 testes executados, 39 aprovados.
- `npm run build`: Build Next.js gerado com sucesso sem avisos nem erros.
