---
id: working_store_admin_edit_20260924
type: working
status: validated
confidence: 1.0
source: user
sources:
  - ../../../ScoutApiV2/src/scout_api/modules/crawler/stores.py
  - ../../../ScoutApiV2/src/scout_api/modules/matching/router.py
  - ../../../ScoutApiV2/alembic/versions/0029_store_metadata.py
created_at: 2026-09-24
updated_at: 2026-09-24
expires_at: null
related: []
---

# Edição administrativa de lojas

## Objetivo

Corrigir a edição de metadados de lojas existentes entre PriceScout e ScoutApiV2,
preservando o registry como fonte de verdade estrutural.

## Checklist

- [completed] Rastrear client, modal, endpoint e registry.
- [completed] Definir nome de exibição e logo como metadados editáveis.
- [completed] Manter domínio, chave, país, moeda, adapter e capabilities protegidos.
- [completed] Implementar persistência PostgreSQL e `PATCH /admin/stores/{store_key}`.
- [completed] Adaptar PriceScout para o PATCH, validação do SVG e campos somente leitura.
- [completed] Aplicar migration e verificar alteração, leitura e refresh contra PostgreSQL.
- [completed] Restaurar o registro de teste ao estado anterior.
- [completed] Rodar testes backend, cobertura de lojas e TypeScript.
- [completed] Abrir o modal real e verificar campos protegidos no navegador.
- [completed] Ajustar a autorização ao principal fixo de desenvolvimento.

## Evidências

- A falha original era o `catalogApi.updateStore()` lançando
  `STORES_REGISTRY_ONLY` sem enviar uma requisição.
- O registry contém lojas suportadas e dados estruturais consumidos pelos
  scrapers e Product Match.
- Teste PostgreSQL: PATCH/GET após reabrir `TestClient`, logo SVG, loja
  inexistente (404) e campo estrutural (422) passaram.
- `pytest` direcionado: 27 testes passaram; `ruff` passou nos arquivos alterados;
  `tsc --noEmit --incremental false` passou.
- No navegador, o primeiro teste atingiu a API anterior. Após reconstruir o
  container da API, o painel salvou o nome em dev, o valor sobreviveu a F5 e o
  nome original foi restaurado pelo painel.

## Limitações

- Não foi executada busca ao vivo em loja; testes de cobertura de matching
  verificaram que o registry e a resolução de lojas continuam íntegros.
- Não foi executada busca de ofertas ao vivo; os testes de cobertura de matching
  confirmaram que o registry e a resolução das lojas continuam íntegros.
