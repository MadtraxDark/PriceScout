# ADR 0005: Taxonomia hierárquica de produtos

## Status

Accepted

## Contexto

As páginas de produto da KaBuM expõem a classificação em breadcrumbs. O scraper precisa devolver essa classificação sem incluir o prefixo “Você está em:” nem o código do produto, e o catálogo precisa manter a relação pai → filho sem duplicar categorias.

## Decisão

- O scraper lê o maior breadcrumb encontrado em `nav`, `ol`, atributos de breadcrumb e classes semanticamente nomeadas.
- Somente links do breadcrumb entram na taxonomia; o item textual `Código ...` é naturalmente ignorado.
- Cada item retorna `level`, `name` e `slug`. O slug vem do último segmento da URL da categoria quando possível, com slugificação do nome como fallback.
- `product_categories` usa `parent_scope + slug` como chave única, permitindo reutilizar também categorias-raiz, cujo `parent_id` é nulo.
- `upsert_product_taxonomy` percorre a cadeia em ordem, cria ou reutiliza cada nó e grava a associação do produto em `product_category_assignments` na mesma transação.
- A persistência acontece após a aprovação da prévia, por uma rota de servidor que exige `SUPABASE_SERVICE_ROLE_KEY`; a chave nunca é enviada ao navegador.

## Consequências

- Breadcrumbs com qualquer quantidade de níveis são suportados.
- Duas páginas podem compartilhar a mesma categoria sem criar linhas duplicadas.
- Uma mesma categoria pode existir em ramos diferentes quando o pai for diferente.
- A classificação é uma observação aprovada do scraper; os valores canônicos do produto continuam sujeitos às regras de produto definidas no ADR 0002.

## Fontes

- Página real KaBuM consultada em 2026-08-23: https://www.kabum.com.br/produto/1062398/carregador-dell-65-watt-e4-4-5mm-
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Database Migrations: https://supabase.com/docs/guides/deployment/database-migrations
