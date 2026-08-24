# Arquitetura do frontend

## Limite de responsabilidade

Este projeto renderiza a interface e mantém apenas estado de apresentação. A API FastAPI é a autoridade exclusiva para autenticação, autorização, regras de produto, coleta de fontes, preços, taxonomia, persistência, arquivos e integrações.

```text
página ou componente
        |
        v
serviço de domínio em utils/api/services.ts
        |
        v
cliente HTTP em utils/api/client.ts
        |
        v
API FastAPI externa
```

Não existem Route Handlers, migrations, SDK de banco, credenciais de storage ou rotinas de coleta neste repositório.

## Requisições

`NEXT_PUBLIC_API_BASE_URL` define a origem da API. O cliente central:

- compõe caminhos e query strings;
- envia e recebe JSON;
- inclui cookies com `credentials: "include"`;
- converte respostas HTTP malsucedidas em `ApiError`;
- preserva `FormData` quando uploads diretos forem adicionados.

As páginas usam serviços de domínio e não chamam `fetch` diretamente.

## Autenticação

O login redireciona para `/auth/sign-in` na FastAPI. A sessão deve ser mantida em cookie HTTP-only, `Secure` em produção e com política `SameSite` compatível com os domínios implantados. O frontend não persiste tokens em armazenamento web.

Se frontend e API estiverem em origens diferentes, a FastAPI deve configurar CORS com a origem exata do frontend e suporte a credenciais. O curinga `*` não deve ser usado com cookies ou cabeçalhos de autorização.

## Dados e imagens

Produtos, lojas, preços, taxonomia e imagens são sempre lidos da API. URLs de imagens são contratos de resposta; componentes visuais não montam URLs de storage nem acessam provedores diretamente.

A aprovação da prévia usa uma única operação de importação. Transações, deduplicação, armazenamento de arquivos e atualização do registro canônico são responsabilidades internas da API.

## Fontes da decisão

- FastAPI, CORS: https://fastapi.tiangolo.com/tutorial/cors/
- MDN, Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- Next.js, variáveis de ambiente: documentação versionada em `node_modules/next/dist/docs/` e https://nextjs.org/docs/app/guides/environment-variables
