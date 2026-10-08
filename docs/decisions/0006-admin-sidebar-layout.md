# 0006: Sidebar administrativa compartilhada

Data: 2026-10-08
Status: Aceita

## Contexto

A sidebar era renderizada por duas implementações: a versão completa em `app/admin/page.tsx` e uma versão reduzida em `components/CatalogChanges.tsx`. O detalhe de produto não tinha sidebar. Isso fazia logo, navegação, status e conta variarem entre páginas.

## Decisão

Compor uma única sidebar em `components/AdminSidebar.tsx`, dentro do layout persistente `app/admin/layout.tsx`. O componente concentra logo, lista de navegação, ícones, estado ativo e informações inferiores. As páginas entregam somente seu conteúdo.

A rota ativa usa `usePathname`; as vistas do painel usam `useSearchParams` no parâmetro `view`. O painel deriva sua vista atual da URL. O detalhe de produto mantém Produtos cadastrado ativo; o histórico ativa Alterações.

## Alternativas consideradas

- Ajustar as duas sidebars por página: descartada, pois preservaria markup e estilos duplicados.
- Decidir estado ativo apenas pelo pathname: descartada, porque overview, produtos, lojas e adicionar produto compartilham `/admin` e diferem por `view`.

## Fontes

- Documentação local do Next.js 16.3.2: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`.
- Next.js, layouts: https://nextjs.org/docs/app/api-reference/file-conventions/layout
- Next.js, query params no cliente: https://nextjs.org/docs/app/api-reference/functions/use-search-params
- Next.js, navegação e History API: https://nextjs.org/docs/app/getting-started/linking-and-navigating
