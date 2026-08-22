# ADR 0002: Fonte única para dados canônicos de produto

## Status

Accepted

## Contexto

O scraper pode encontrar preços diferentes entre páginas, não encontrar um preço, receber um produto indisponível ou capturar um valor inválido. Usar diretamente cada resposta na página de venda cria múltiplas fontes para o mesmo atributo e pode exibir informação incorreta.

## Decisão

O PostgreSQL terá um registro canônico por produto. Cada atributo canônico terá um único valor atual. O scraper armazenará observações separadas, contendo fonte, URL, horário, valor bruto, valor normalizado e estado da coleta.

Somente observações válidas e aprovadas pelas regras de negócio poderão atualizar o registro canônico. Estados `not_found`, `unavailable` e `invalid` não substituem o valor confirmado anteriormente.

## Modelo lógico planejado

```text
products
  └── product_current_values       # uma projeção atual por produto e atributo
  └── product_observations          # evidências do scraper, inclusive falhas
  └── product_value_history         # alterações canônicas anteriores
```

O nome final das tabelas será definido junto com a primeira migration. A proteção deverá combinar chave estável do produto, unicidade por produto e atributo, validações de domínio e transação de atualização.

## Consequências

- A aplicação e a página de venda têm uma fonte determinística.
- Falhas de scraping não destroem dados válidos.
- Divergências ficam auditáveis e podem gerar alertas.
- O sistema precisa de regras explícitas para promover observações a valores canônicos.
- O histórico não pode ser consultado como se fosse o valor atual.

## Critérios de aceitação

- Uma consulta de produto retorna um único preço atual.
- Uma observação sem preço não altera o preço atual.
- Uma observação `unavailable` não transforma o preço em zero ou nulo automaticamente.
- Uma observação inválida fica disponível para auditoria, mas não aparece como dado canônico.
- A página de venda não usa valores diretamente da resposta do scraper.
- Testes verificam duplicidade, concorrência, rollback e atualização válida.

## Referências

- https://www.postgresql.org/docs/current/ddl-constraints.html
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/deployment/database-migrations
