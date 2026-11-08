---
id: working_2026_11_08_rejeitar_oferta_em_revisao
type: working
status: draft
confidence: 1.0
source: user
sources: []
created_at: 2026-11-08
updated_at: 2026-11-08
expires_at: null
related: []
---

# Objetivo

Adicionar "Rejeitar oferta" ao card de ofertas em revisao, persistido no backend, sem criar vinculo nem descartar o produto original.

# Checklist

- completed: ScoutApi `POST /products/{id}/listings/{listing_id}/reject` (status `rejected`, match_decision `reject`, monitoramento desligado, evento `match_review_rejected`)
- completed: nova busca nao revive listing rejeitada (`upsert_listing` e loop de persistencia); view do produto oculta rejeitadas
- completed: teste de repositorio; frontend com botao, dialogo de confirmacao e servico
- pending: verificacao visual no navegador e teste do endpoint ponta a ponta (nao feitos)

# Decisoes

- Chave de identidade da rejeicao: a propria listing (URL canonica / product_id / sku da loja) dentro do produto. A mesma oferta em outro produto monitorado continua elegivel.
- Sem migracao: `status` e string livre.
