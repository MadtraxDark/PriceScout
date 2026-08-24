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

## Camada da API

- `utils/api/client.ts`: URL base, serialização, cookies, parsing e erros HTTP.
- `utils/api/services.ts`: operações por domínio consumidas pelas telas.
- `utils/api/contracts.ts`: contratos TypeScript das respostas e payloads.

Componentes e páginas não devem chamar `fetch` diretamente nem conhecer banco, storage ou provedores externos. Imagens devem usar URLs retornadas pela API.

## Contrato esperado da FastAPI

- `GET /auth/sign-in?next=...`
- `GET /auth/me`
- `POST /auth/sign-out`
- `GET|POST /catalog/stores`
- `GET /catalog/products`
- `POST /catalog/products/preview`
- `POST /catalog/products/import`
- `GET|PATCH /catalog/products/{id}`
- `POST|PATCH|DELETE /catalog/products/{id}/images`

O endpoint de importação recebe a prévia aprovada e executa toda a operação no servidor de forma consistente. O frontend não coordena persistência, taxonomia ou arquivos separadamente.

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
