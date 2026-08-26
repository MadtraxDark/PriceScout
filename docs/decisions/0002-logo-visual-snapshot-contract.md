# Decisão 0002: snapshot visual versionado para logos

## Contexto

Logos do Brandfetch podem mudar sem que o domínio mude. Analisar a imagem a cada leitura torna a API lenta e cria comportamento inconsistente entre marca e loja. O frontend também não deve acessar o provedor nem inferir contraste.

## Contrato recomendado para a API FastAPI

Cada asset de logo retornado pela API deve expor:

```json
{
  "asset_url": "<url-do-asset-persistido>",
  "logo_id": "sha256:<hash-do-arquivo>",
  "source": "brandfetch",
  "available": true,
  "visual": {
    "analysis_status": "ready",
    "dominant_color": "<cor-hex> ou null",
    "average_luminance": "<numero-entre-0-e-1> ou null",
    "has_transparency": "<booleano> ou null",
    "recommended_background": "<light|dark|neutral>",
    "foreground_color": "<cor-hex> ou null"
  }
}
```

Os valores acima são apenas o formato do contrato, não dados de aplicação. A API deve preencher os valores reais no job.

## Fluxo de ingestão

1. Buscar a variante de logo do Brandfetch e baixar o conteúdo.
2. Calcular SHA-256 do bytes recebidos. Reutilizar o registro quando o hash já existir para o mesmo asset; não analisar novamente.
3. Persistir o arquivo em storage e criar o registro de versão com `logo_id` único.
4. Executar Pillow no worker/job persistido: normalizar para RGBA, ignorar pixels totalmente transparentes, calcular cor predominante, luminância média, presença de alpha e fundo recomendado.
5. Persistir os metadados e associar o `logo_id` à marca ou loja.
6. Se o hash mudar, criar uma nova versão, enfileirar nova análise e trocar a associação somente após o processamento válido.

O reprocessamento inicial deve percorrer todas as associações existentes, baixar as versões disponíveis, comparar hashes e enfileirar as que não possuem metadados prontos. A API deve retornar o snapshot anterior ou estado pendente sem substituir um valor canônico por `not_found` ou `unavailable`.

## Persistência mínima

- `logo_assets`: `id`, `entity_type`, `entity_id`, `source`, `source_url`, `content_sha256`, `storage_path`, `mime_type`, `width`, `height`, `file_size`, `analysis_status`, `analysis_error`, `created_at`, `processed_at`.
- `logo_visual_metadata`: `logo_asset_id` único, `dominant_color`, `average_luminance`, `has_transparency`, `recommended_background`, `foreground_color`, `analysis_version`.
- `logo_processing_jobs`: `id`, `logo_asset_id`, `status`, `attempts`, `last_error`, `available_at`, `started_at`, `finished_at`.

Índices: `logo_assets(content_sha256)`, `logo_assets(entity_type, entity_id, source)`, `logo_processing_jobs(status, available_at)`.

## Motivo da escolha

Pillow documenta `ImageStat` para estatísticas globais e `getextrema()` para extremos por canal: <https://pillow.readthedocs.io/en/stable/reference/ImageStat.html>.

FastAPI oferece `BackgroundTasks` para trabalho após a resposta, mas o job de logos precisa ser persistido para sobreviver a reinícios e permitir reprocessamento em massa: <https://fastapi.tiangolo.com/tutorial/background-tasks/>.

Brandfetch fornece variantes `logo`, `symbol`, `icon` e temas claro/escuro; a ingestão deve preservar a variante escolhida e versionar o conteúdo baixado: <https://docs.brandfetch.com/logo-api/overview>.

## Implementação

O contrato foi implementado no backend externo em `C:/Users/ThyagoAz/Desktop/ScoutApi`, com migration versionada, job persistido, análise Pillow, cache no Google Drive e backfill inicial. O frontend consulta somente o snapshot retornado pela API.
