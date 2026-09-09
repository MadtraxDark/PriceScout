---
id: mem_working_multi_store_discovery_and_display
type: working
status: validated
confidence: 1.0
source: agent
sources:
  - "app/stores/search.py"
  - "app/services/other_store_prices.py"
  - "app/core/models.py"
  - "app/admin/produtos/[id]/page.tsx"
  - "utils/api/contracts.ts"
  - "utils/api/services.ts"
  - "app/globals.css"
created_at: 2026-09-04
updated_at: 2026-09-04
expires_at: null
related:
  - "memory/working/2026-09-04-store-display-and-amazon-search.md"
---

# Registro de execucao: Descoberta e exibicao de multiplas lojas

## Objetivo

Permitir que o fluxo de comparacao em outras lojas encontre e retorne simultaneamente ofertas validas de todas as lojas suportadas (Amazon, KaBuM, Magazine Luiza, Mercado Livre, Pichau, TerabyteShop), e exiba na interface de administracao do produto todos os detalhes comerciais: nome amigavel da loja, link direto para a oferta, preco original, preco PIX com desconto %, preco no cartao, parcelamento detalhado, vendedor e status de disponibilidade.

## Checklist de execucao

- [x] Backend: declarar campos store_id e display_name no modelo OtherStorePrice e OtherStoreSearchDiagnostic (app/core/models.py).
- [x] Backend: corrigir normalizacao de URLs de candidatos em search.py para preservar dominios canonicos www e produto.mlb.
- [x] Backend: implementar extracao via Next.js (__NEXT_DATA__) em KabumSearchAdapter e MagazineLuizaSearchAdapter.
- [x] Backend: ajustar seletores de TerabyteSearchAdapter para extracao de titulo e link.
- [x] Backend: ordenar consultas progressivas priorizando termos compactos em other_store_prices.py para evitar bloqueios no Mercado Livre.
- [x] Backend: desativar supressao da loja de origem (origin_store=None) para permitir comparacao completa de todas as lojas suportadas.
- [x] Frontend: adicionar availability e seller ao contrato OtherStorePrice em utils/api/contracts.ts.
- [x] Frontend: normalizar availability e seller em utils/api/services.ts.
- [x] Frontend: reescrever o painel de ofertas de outras lojas em app/admin/produtos/[id]/page.tsx com card detalhado e botao "Ver produto".
- [x] Frontend: adicionar regras de layout e estilo em app/globals.css (.store-offer-card, .store-offer-header, .store-offer-badge, .store-offer-prices, .store-offer-discount, .store-offer-seller, .store-offer-link).
- [x] Validacao: typecheck npx tsc --noEmit sem erros.
- [x] Validacao: build de producao Next.js concluido com sucesso.
- [x] Validacao: suite pytest test_product_search_pipeline.py 7/7 aprovados.
- [x] Validacao: execucao real contra o produto Galaxy S24 Ultra retornando simultaneamente 4 ofertas aceitas (Amazon, KaBuM, Magazine Luiza, Mercado Livre).
- [x] Persistencia: imagem Docker scoutapi:kabum-image-fix atualizada via docker commit.

## Evidencias de execucao real

Execucao do endpoint POST /api/v1/catalog/products/51aa8d7c-1ab4-44d6-9b17-93b8d40bd830/other-store-prices:
- Magazine Luiza: PIX R$ 5.399,00 (-10%), Cartao R$ 5.998,89 (10x de R$ 599,89), Vendedor Magazine Luiza.
- KaBuM: PIX R$ 5.399,00 (-10%), Cartao R$ 5.998,89 (10x de R$ 599,88), Vendedor Magalu.
- Mercado Livre: PIX R$ 5.721,00, Cartao R$ 5.721,00 (12x de R$ 549,88 com juros), Vendedor MAGAZINNE FERNANDO.
- Amazon: PIX R$ 5.399,00, Cartao R$ 5.999,88 (12x de R$ 499,99), Vendedor Amazon Quase Novo.
- Pichau e TerabyteShop: diagnosticados como not_found (produtos divergentes rejeitados pelo matcher).

