# Identidade visual de lojas nas ofertas

As ofertas persistidas e os resultados parciais usam o mesmo registry carregado por `GET /stores`. A página de produto mantém a lista de `CatalogStore` em estado compartilhado; as linhas resolvem uma store por chave canônica, domínio da URL e, por último, nome visível. O país desambigua nomes repetidos. A identidade visual compartilhada prefere `logo_url`, converte `logo_svg` com `storeLogoDataUrl` e mostra iniciais quando não há imagem configurada ou quando a imagem falha.

O snapshot live não inclui SVGs nem metadata de logo. Isso evita ampliar cada resposta de polling e evita uma consulta por linha. A tela atualiza o registry imediatamente e continua consultando-o enquanto alguma logo estiver `pending` ou `processing`, então uma URL preferida publicada pelo backend passa a aparecer também nos resultados parciais.

Decisão registrada em 2026-10-08. Fontes: [React: Sharing State Between Components](https://react.dev/learn/sharing-state-between-components); documentação local do Next.js 16.3.2 em `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`. Alternativas descartadas: duplicar SVG em snapshots live ou consultar `/stores` individualmente em cada linha.
