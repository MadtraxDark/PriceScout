# Decisão 0003: Produto criado por link e despacho por loja

## Status

Aceita para a camada de interface e detecção de domínio; integração operacional pendente.

## Decisão

O cadastro de produto aceita somente a URL da página do produto. O sistema extrai o hostname, normaliza o domínio e deriva uma `scraper_key`. O produto só pode seguir para coleta quando existir um scraper real registrado para esse domínio.

Links de lojas seguem a mesma detecção. Domínios sem scraper configurado são bloqueados e exibidos como pendência de integração; não podem gerar produto, observação ou preço canônico.

## Consequências

- Não há nome ou loja digitados manualmente no cadastro de produto.
- O registro de scrapers precisa ser preenchido apenas com implementações reais.
- O próximo passo de backend é uma Edge Function autenticada para despachar a coleta e persistir a observação, sem alterar o valor canônico diretamente.
- Não existem dados de demonstração ou domínios fictícios no registro atual.

## Fonte técnica

- Supabase Edge Functions Quickstart: https://supabase.com/docs/guides/functions/quickstart
- Supabase JavaScript `functions.invoke`: https://supabase.com/docs/reference/javascript/v1/functions-invoke
