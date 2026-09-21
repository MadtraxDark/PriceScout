# PriceScout Frontend

Interface administrativa do PriceScout construída com Next.js. Este repositório contém somente responsabilidades de frontend; autenticação, autorização, coleta, persistência, produtos, preços, imagens e integrações pertencem à API externa desenvolvida com FastAPI.

## Configuração

Copie `.env.example` para `.env.local` e informe a origem pública da API, sem barra final:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

O prefixo `NEXT_PUBLIC_` é necessário porque o valor é usado pelo navegador. Não coloque tokens, senhas, chaves de banco ou credenciais de provedores nessa variável ou em qualquer arquivo do frontend.

## Execução local

```bash
npm ci
npm run dev
```

A interface fica disponível em `http://localhost:3000`. A API precisa permitir essa origem no CORS e aceitar credenciais quando a autenticação usar cookie HTTP-only.

## Integração com ScoutApiV2

Este frontend consome exclusivamente o **ScoutApiV2** (FastAPI). Não há mocks, dados fabricados ou caminhos legados `/api/v1/`.

### Autenticação

O fluxo é OAuth via Google gerenciado pelo ScoutApiV2:

1. `GET /auth/google` → retorna `{authorization_url}` → redireciona o browser
2. Backend faz o callback e redireciona para `AUTH_FRONTEND_SUCCESS_URL#access_token=...`
3. `app/auth/callback/page.tsx` lê o token do fragment, armazena em memória via `setAccessToken`
4. `GET /auth/me` confirma a identidade (Bearer automático pelo cliente)
5. Refresh via cookie HttpOnly `scout_refresh_token` — single-flight no `apiRequest`

**O access token nunca é armazenado em `localStorage` ou `sessionStorage`.**

### Camada da API

| Arquivo | Responsabilidade |
|---|---|
| `utils/api/auth-token.ts` | `getAccessToken` / `setAccessToken` / `clearAccessToken` (memória) |
| `utils/api/client.ts` | URL base, Bearer, single-flight refresh, `ApiError` com `code`/`retryable` |
| `utils/api/contracts.ts` | Tipos ScoutApiV2 (`ProductView`, `MatchHit`, `StoreInfo`, etc.) + tipos UI |
| `utils/api/services.ts` | `authApi` + `catalogApi` — todo acesso à API passa por aqui |

Componentes e páginas não devem chamar `fetch` diretamente nem conhecer banco, storage ou provedores externos.

### Endpoints consumidos (ScoutApiV2)

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/auth/google` | Inicia OAuth |
| GET | `/auth/me` | Confirma sessão |
| POST | `/auth/refresh` | Renova token (cookie) |
| POST | `/auth/logout` | Encerra sessão |
| GET | `/products` | Listagem de produtos |
| GET | `/products/{id}` | Produto individual |
| POST | `/products` | Importar produto do crawl |
| PATCH | `/products/{id}` | Editar título/marca/modelo/categoria |
| DELETE | `/products/{id}` | Excluir produto |
| POST | `/crawl` | Preview antes de importar |
| POST | `/match` | Busca de preços (não-streaming) |
| POST | `/match/stream` | Busca de preços via SSE |
| POST | `/offers/refresh` | Atualizar ofertas persistidas |
| GET | `/stores` | Lojas disponíveis (somente leitura) |
| GET | `/health` | Health check |

### Limitações desta versão

- **Imagens**: gerenciamento de galeria não suportado — ScoutApiV2 não armazena imagens de produto.
- **Lojas**: somente leitura — gerenciadas pelo registry interno da API.
- **Thumbnails**: cartões de produto sem miniatura (sem campo `image_url` em `ProductView`).
- **Decimais**: preços retornados como strings JSON; convertidos para `number` apenas para exibição via `parseMoney`.

## Contrato legado (removido)

Os caminhos `/api/v1/catalog/**`, `/api/v1/auth/**` e métodos `login/signup/magic-link/recover/reset` foram removidos. Toda integração usa exclusivamente os endpoints acima.

## Validação

```bash
npm run lint
npm run build
```

## Docker

Como variáveis `NEXT_PUBLIC_` são incorporadas ao bundle durante a build, informe a URL ao construir a imagem:

```bash
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.seu-dominio.example -t pricescout-frontend .
docker run --rm -p 3000:3000 pricescout-frontend
```
