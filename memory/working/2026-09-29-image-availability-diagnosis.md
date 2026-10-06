---
id: working_image_availability_diagnosis_20260929
type: working
status: draft
confidence: 0.95
source: agent
sources:
  - user request pasted 2026-09-29
  - http://localhost:3000/admin
  - http://localhost:3000/admin/produtos/{id}
created_at: 2026-09-29
updated_at: 2026-09-29
expires_at: null
related:
  - memory/working/2026-09-28-catalog-card-image-unavailable.md
---

# Diagnóstico de disponibilidade de imagens do Drive

## Objetivo

Rastrear falhas de imagens entre Google Drive, proxy FastAPI e PriceScout; comunicar motivos distintos com fallback acessível e retry apenas quando recuperável.

## Checklist

- [completed] Rastrear o fluxo da API e identificar o erro da instância em execução.
- [completed] Definir estados de domínio e mensagens de apresentação sem expor detalhes Google.
- [completed] Atualizar entrega de conteúdo de imagem e logo no ScoutApiV2.
- [completed] Atualizar componentes e adaptadores de imagem do PriceScout.
- [in_progress] Validar testes, telas, acessibilidade e integração com a API atualizada.
- [pending] Reautorizar o refresh token do Drive no ambiente operacional e reiniciar/deployar a API.

## Evidências

- Em `localhost:3000/admin`, imagens do catálogo falharam com respostas 500 nos endpoints `/products/{product_id}/images/{image_id}/content?variant=optimized`.
- No corpo de erro capturado pelo navegador, o backend antigo mostrou `google.auth.exceptions.RefreshError` com `invalid_grant: Token has been expired or revoked` enquanto tentava renovar OAuth em `GoogleDriveClient._credentials`.
- A exceção não era normalizada no runtime ativo; a resposta continha traceback sem cabeçalho CORS, impedindo diagnóstico estruturado pelo browser. Esta evidência confirma o motivo atual observado; outras causas continuam cobertas pelo contrato.
- A tela `/admin/produtos/{id}` mostrou placeholders dimensionados, texto acessível e retry para erro temporário; `/admin?view=stores` manteve o alinhamento das linhas e fallback de logo.
- O processo Next em `localhost:3000` já existia. Uma segunda tentativa de `npm run dev` escolheu a porta 3001 e parou ao falhar em criar/acquirir lock.
- `.env` e configuração efetiva do Compose apontam `api` e `image-optimizer` para o Postgres Docker (`postgres:5432/scoutapi`); URL não precisa ser alterada.
- Logs de inicialização mostram Alembic falhando porque o Postgres registra `0031_match_embedding_evidence`, revisão ausente no checkout. A revisão local máxima é `0030_store_logo_media`. `docker compose exec postgres` foi bloqueado neste ambiente pelo acesso negado ao pipe do Docker Engine, então o valor de `alembic_version` ainda precisa ser consultado pelo usuário.

## Decisões e mudanças

- Estados genéricos: `ready`, `missing`, `processing`, `temporarily_unavailable`, `permission_denied`, `not_found`, `storage_error`, `invalid_reference` e `load_failed`.
- O cliente backend classifica `invalid_grant`/credencial inválida como `storage_error`, não recuperável por retry imediato. Falhas transitórias de rede/quota/5xx permanecem recuperáveis.
- `/stores/{store_key}/logo` retorna erros estruturados sanitizados; erros não expõem file IDs ou stack traces.
- O frontend reutiliza `ImageWithState`, consulta proxy pela camada central da API após `img onError`, diferencia ausência e falha técnica e mostra retry manual quando `retryable` autoriza.
- A falha de AVIF mostra um indicador acessível de que a versão original permanece em uso.

## Verificações e limitações

- `npx tsc --noEmit --incremental false`: passou.
- ESLint direcionado aos componentes/helpers alterados: passou sem erros ao desativar na invocação a regra preexistente `react-hooks/set-state-in-effect`; há avisos preexistentes em `app/admin/page.tsx` e `utils/api/services.ts`.
- ESLint completo: ainda falha por `react-hooks/set-state-in-effect` preexistente em `app/admin/page.tsx:222`; também há avisos preexistentes.
- Testes de imagem e apresentação executados com `tsx --test` diretamente do cache npm: 6/6 e 17/17 passaram. Foi necessário um shim Node temporário em `%TEMP%` porque Node 26 no Windows falhava em `os.userInfo()` com `ENOMEM`; o shim foi removido após a execução.
- `pytest.exe tests/unit/test_product_images.py -q`: bloqueado pelo Windows Application Control.
- Ruff `check` e `format --check` nos arquivos backend alterados: passaram.
- Compilação sintática dos oito arquivos Python alterados: passou.
- A tela foi validada com Playwright, porém contra a API antiga em execução. Ela segue exibindo placeholder e retry temporário porque a API retorna 500/CORS. Revalidar após atualizar o processo API e reautorizar Drive OAuth.

## Próximos passos

1. Renovar/reautorizar a credencial OAuth Drive no ambiente seguro, sem registrar segredo no Git.
2. Consultar a revisão `alembic_version` no Postgres Docker e recuperar a migração correspondente. Não usar `stamp head` nem apagar o volume sem comprovar e preservar o schema/dados.
3. Reiniciar/deployar a API atualizada e conferir que entrega estados estruturados e cabeçalhos CORS para erros tratados.
4. Executar `pytest tests/unit/test_product_images.py -q` em ambiente com o runner autorizado.
5. Revalidar carregamento e clique de retry com credencial corrigida; confirmar que uma imagem válida substitui o placeholder.
