# ADR 0001: Supabase e PostgreSQL como backend

## Status

Accepted

## Contexto

O PriceScout precisa persistir memória de agentes de IA, oferecer busca e permitir evolução para múltiplos usuários e serviços.

## Decisão

Usar Supabase como backend oficial e o PostgreSQL gerenciado pelo Supabase como armazenamento operacional. Os arquivos Markdown continuam sendo a fonte portátil, auditável e versionável da memória.

## Consequências

### Positivas

- PostgreSQL fornece consultas relacionais, índices, transações e extensões adequadas para busca.
- Supabase concentra Data API, autenticação, RLS, Realtime e demais serviços de backend.
- Markdown permite exportação, revisão humana e recuperação sem dependência do provedor.

### Restrições

- Todo dado persistido no banco precisa de uma estratégia de sincronização e procedência.
- RLS deve ser definida antes de expor tabelas pela API.
- Migrations e políticas precisam ser versionadas e verificadas.
- A aplicação não deve tratar o índice do banco como substituto silencioso da fonte Markdown.

## Alternativas descartadas

- PostgreSQL autogerenciado: mais operação e menos integração pronta para Auth/API.
- Banco vetorial isolado: não cobre sozinho usuários, autorização, auditoria e dados relacionais.
- Apenas arquivos Markdown: adequado para protótipo local, mas limitado para concorrência, multiusuário e consultas operacionais.

## Referências

- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/deployment/database-migrations
