---
id: mem_working_persisted_product_offers_20260909
type: working
status: draft
confidence: 0.95
source: user
sources:
  - pasted-text.txt
  - app/admin/produtos/[id]/page.tsx
  - utils/api/contracts.ts
  - utils/api/services.ts
  - ScoutApi/app/services/catalog_service.py
created_at: 2026-09-09
updated_at: 2026-09-09
expires_at: null
related: []
---

# Ofertas persistidas no detalhe do produto

## Objetivo

Exibir na página de detalhe as ofertas persistidas em `catalog_offers` para a variação selecionada, mantendo a busca entre lojas como fluxo de atualização e não como fonte temporária da lista.

## Checklist

- [completed] Ler o prompt do usuário e as instruções de frontend.
- [completed] Investigar consumidores, contratos e endpoint de detalhe.
- [completed] Implementar lista de ofertas persistidas e atualização após busca.
- [pending] Adicionar ou ajustar testes de contrato e comportamento.
- [completed] Executar lint, build e detector visual.
- [completed] Registrar limitações e conclusão.

## Evidências e decisões

- `CatalogService.get_product` já carrega cada variação e suas ofertas persistidas, incluindo a loja relacionada.
- O contrato TypeScript já modela `CatalogProductVariant.offers` e `CatalogOffer`.
- A tela atual renderiza somente `otherStorePrices`, usa uma chave composta por loja, URL e moeda e não recarrega o detalhe após a busca.
- A lista nova usará `offer.id` como identidade, comparará somente ofertas dentro de cada `catalog_product_variant_id`, ordenará disponíveis e preço válido primeiro e exibirá apenas o snapshot atual.
- Como o detalhe atual não retorna uma URL de logo por oferta, a loja terá fallback textual acessível usando nome da loja e hostname; nenhum asset fictício será criado.

## Próximo passo

Implementar o componente de apresentação e integrar a busca para recarregar `getProduct` ao final.

## Validação parcial

- `npm run lint` concluiu sem mensagens de erro antes da etapa de build.
- `npm run build` foi interrompido por `EPERM` ao abrir `.next/trace`; o build precisa ser repetido com permissão adequada ou diretório de saída limpo.

## Resultado final

- A tela agora renderiza `product.variants[].offers[]`, que é o detalhe persistido retornado pela API.
- Ofertas são deduplicadas pela identidade React `offer.id` e comparadas somente dentro da variação que as contém.
- A melhor oferta considera disponibilidade e menor preço válido, com Pix, cartão, preço original, parcelamento, vendedor, entrega e disponibilidade separados.
- A busca concluída recarrega o detalhe e a lista passa a refletir o banco sem exigir recarregar o navegador.
- Foram executados `npx tsc --noEmit --incremental false`, `npm run lint` e `npm run build`, todos com sucesso.
- O detector visual foi executado uma vez. Ele apontou dois padrões preexistentes fora desta superfície e um destaque lateral criado inicialmente na oferta; o destaque lateral novo foi removido. O gradiente de texto e a faixa lateral do painel de progresso são anteriores e permanecem fora do escopo.

## Limitações

- O contrato de detalhe da API ainda não fornece URL de logo por oferta; a interface usa marca textual com iniciais como fallback acessível, sem criar asset fictício.
- Não há infraestrutura de testes de componentes no frontend; a cobertura desta alteração ficou nas checagens estáticas e no build de produção.
