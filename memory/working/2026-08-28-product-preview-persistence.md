---
tipo: working
titulo: Persistencia de previa e bloqueio de duplicidade
data: 2026-08-28
status: completed
confianca: alta
---

O frontend passou a persistir `preview_id`, URL e expiracao em `localStorage` como recuperacao de sessao. Ao montar a tela, consulta `GET /api/v1/catalog/products/previews/{preview_id}` e restaura a previa sem novo scraping; se a API estiver indisponivel, usa o produto armazenado enquanto ele ainda estiver dentro do TTL.

A nova busca e o descarte chamam DELETE e removem o estado local. A importacao usa `preview_id`; sucesso remove o estado. Erros mantem a previa para nova tentativa. Duplicidade e apresentada com link para `/admin/produtos/{id}` quando a API retorna `409`.

## Ajuste de interface

- O payload `existing_product` do `409` agora e tipado e interpretado por uma funcao unica no fluxo administrativo.
- O aviso visual mostra estado explicito de produto ja cadastrado, miniatura real quando disponivel, nome, data de cadastro e link interno para o registro existente.
- Conflitos durante a importacao interrompem o processo, preservam a informacao do conflito, descartam a previa persistida e bloqueiam nova aprovacao.
- Validacao: `npm run lint` concluido com codigo 0, apenas avisos preexistentes; `npm run build` concluido com sucesso.
- Reforco apos relato de duplicacao: a tela compara URL canonica com o catalogo carregado antes de iniciar novo scraping, busca os dados completos do registro para a data de cadastro e usa lock sincrono contra duplo clique na aprovacao.
