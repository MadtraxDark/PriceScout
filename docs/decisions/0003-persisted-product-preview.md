# Decisao de Arquitetura 0003: Previa de produto como recurso persistente temporario

## Status

Accepted

## Contexto

O fluxo de revisao vivia somente no estado local do componente `Home`, portanto era perdido em F5, troca de rota ou reinicio do frontend.

## Decisao

Guardar o `preview_id` retornado pela API junto da URL e expiracao em `localStorage`. Na montagem, consultar a API para reconstruir a previa; usar o produto local somente como fallback durante indisponibilidade temporaria. Remover o registro remoto e local em descarte, nova busca ou importacao concluida.

## Consequencias

- A previa sobrevive ao ciclo de vida do componente e da aplicacao.
- O conteudo canonico continua vindo do backend sempre que ele estiver disponivel.
- O frontend trata `409` com link para o produto existente e `410` como previa expirada.
