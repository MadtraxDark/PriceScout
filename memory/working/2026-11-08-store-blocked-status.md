---
id: working_2026_11_08_store_blocked_status
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

Lojas bloqueadas em destaque em /admin?view=stores; remover contador "0 produtos"; Magazine Luiza bloqueada (Akamai) via estado persistido na API.

# Checklist

- completed: backend `StoreConfig.access_blocked` + Magalu `match_enabled=False` com motivo (ScoutApi, stores.py, schemas.py, router.py)
- completed: testes de elegibilidade do Match ajustados (usam terabyteshop onde antes usavam magazineluiza)
- completed: frontend contrato, mapper, card com selo "Loja bloqueada", contador removido
- pending: reiniciar a ScoutApi e conferir visualmente no navegador (nao feito)

# Decisoes

- Fonte da verdade: registry `STORE_CONFIGS` na API (ja expunha `match_enabled`/`match_disabled_reason`); adicionado `access_blocked` para distinguir bloqueio externo de indisponibilidade temporaria.
- Adapter e config da Magalu preservados. Reativar: `match_enabled=True`, `access_blocked=False`, motivo `None`.
- O bloqueio retira a loja do Product Match automatico; nao impede coleta manual por URL.
