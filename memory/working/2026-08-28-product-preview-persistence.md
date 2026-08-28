---
tipo: working
titulo: Persistencia de previa e bloqueio de duplicidade
data: 2026-08-28
status: completed
confianca: alta
---

O frontend passou a persistir `preview_id`, URL e expiracao em `localStorage` como recuperacao de sessao. Ao montar a tela, consulta `GET /api/v1/catalog/products/previews/{preview_id}` e restaura a previa sem novo scraping; se a API estiver indisponivel, usa o produto armazenado enquanto ele ainda estiver dentro do TTL.

A nova busca e o descarte chamam DELETE e removem o estado local. A importacao usa `preview_id`; sucesso remove o estado. Erros mantem a previa para nova tentativa. Duplicidade e apresentada com link para `/admin/produtos/{id}` quando a API retorna `409`.
