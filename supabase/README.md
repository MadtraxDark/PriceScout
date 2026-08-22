# Supabase e PostgreSQL

O Supabase é o backend oficial do PriceScout e o PostgreSQL é o armazenamento operacional.

## Responsabilidades

### Markdown

- fonte de verdade portátil da memória;
- histórico legível e revisável com Git;
- exportação e recuperação em caso de indisponibilidade do backend.

### PostgreSQL/Supabase

- armazenamento operacional e multiusuário;
- filtros, relacionamentos, auditoria e busca estruturada;
- autenticação, autorização e APIs;
- índices derivados e, quando necessário, embeddings.

## Regras

- Não criar tabelas ou migrations sem antes definir entidade, proprietário, retenção e política de acesso.
- Ativar RLS em toda tabela exposta e escrever políticas específicas para o modelo de autorização.
- Manter migrations versionadas no repositório.
- Nunca colocar chaves secretas ou `service_role` no frontend, em Markdown público ou na imagem Docker.
- Usar o PostgreSQL como projeção operacional do Markdown; a sincronização deve preservar `id`, procedência, status e timestamps.
- Separar o registro canônico de produto das observações do scraper.
- Manter uma única fonte atual por produto e atributo; histórico não pode ser confundido com valor atual.
- Tratar `not_found`, `unavailable` e `invalid` como estados de observação, nunca como preço ou disponibilidade canônica.
- Fazer a página de venda consultar o registro canônico, não a resposta bruta do scraper.
- Aplicar constraints, validação de domínio e transações para impedir duplicidade e atualização parcial.
- Verificar migrations, políticas, índices e consultas antes de considerar uma mudança concluída.

## Estado atual

Ainda não há schema ou migration. A primeira implementação deve começar por uma decisão de modelo de dados e uma migration mínima, após validar o fluxo de sincronização Markdown para PostgreSQL.
