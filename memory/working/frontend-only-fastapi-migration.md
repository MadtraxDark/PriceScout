---
id: working_frontend_only_fastapi_migration
type: working
status: validated
confidence: 1.0
source: user
sources:
  - AGENTS.md
  - https://fastapi.tiangolo.com/tutorial/cors/
  - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
created_at: 2026-08-24
updated_at: 2026-08-24
expires_at: null
related: []
---

# Migração para frontend exclusivo com API FastAPI

## Objetivo

Remover Supabase e todas as responsabilidades de backend do projeto Next.js, mantendo as telas como frontend e centralizando autenticação, consultas, mutações e arquivos em uma API FastAPI configurada por variável de ambiente.

## Checklist

- [completed] Ler instruções do projeto e skills aplicáveis.
- [completed] Inventariar dependências, rotas, integrações, estruturas de backend e referências ao Supabase.
- [completed] Definir e implementar a camada HTTP centralizada e migrar os consumidores do frontend.
- [completed] Remover dependências, rotas, utilitários, scripts, migrations e configurações de backend.
- [completed] Atualizar documentação, ambiente e decisões arquiteturais.
- [completed] Instalar dependências e consultar a documentação local do Next.js 16.3.2.
- [completed] Executar typecheck, lint, build e auditorias textuais finais.

## Decisões

- Usar `NEXT_PUBLIC_API_BASE_URL` porque a URL precisa estar disponível ao código executado no navegador.
- Concentrar composição de URL, serialização, credenciais, tratamento de resposta e erros em um único cliente baseado em `fetch`.
- Usar sessão por cookie HTTP-only administrada pela API, com `credentials: "include"`; nenhuma chave de banco, storage ou provedor será exposta ao frontend.
- Manter os contratos de tela atuais e substituir somente a origem dos dados e ações.
- Proteger a árvore `/admin` com uma consulta a `/auth/me`; respostas 401 e 403 são encaminhadas para login e acesso proibido sem reintroduzir middleware server-side.

## Ferramentas e fontes

- Skills: `supabase` e `supabase-postgres-best-practices`.
- Ferramentas locais: PowerShell, `rg`, Git, npm e documentação instalada do Next.js quando as dependências forem restauradas.
- Fontes externas: documentação oficial do FastAPI sobre CORS e MDN sobre Fetch.

## Limitações e erros

- O caminho inicialmente tentado para as skills dentro do repositório não existia; as skills foram lidas no catálogo global correto.
- O MCP do Supabase não está disponível entre os conectores desta sessão. Não é necessário para a remoção local e nenhuma alteração remota será feita.
- As dependências foram instaladas e os guias versionados do Next.js 16.3.2 sobre ambiente e implantação foram lidos integralmente.
- A primeira execução de `tsc` encontrou `LayoutProps` ausente em `app/layout.tsx`; o layout foi corrigido para usar `ReactNode`, seu contrato efetivo.
- O lint identificou uma atualização síncrona de estado no efeito que lê `?view=`; a atualização foi agendada fora do corpo síncrono do efeito.
- Uma atualização do lockfile falhou ao tentar criar um diretório temporário no cache global do npm por `EPERM`; a tentativa inicial já havia atualizado dependências e a consistência do lockfile será verificada localmente.
- O lint detectou que o guard chamava uma função com atualização síncrona a partir de um efeito; o reset de estado foi movido exclusivamente para a ação de nova tentativa.

## Próximo passo

Fornecer `NEXT_PUBLIC_API_BASE_URL` na build e implementar na FastAPI os contratos documentados em `README.md`.

## Resultado final

- `utils/api/client.ts` é a única ocorrência de `fetch` em `app`, `components` e `utils`.
- Autenticação, catálogo, prévia, importação, edição e imagens usam serviços centralizados da API.
- O guard de `/admin` consulta `/auth/me` e trata 401, 403 e indisponibilidade da API.
- Não existem Route Handlers, diretórios de banco, integrações server-side, migrations, scraper local ou dependências diretas correspondentes.
- `npx tsc --noEmit`: passed.
- `npm run lint -- --quiet`: passed.
- `npm run build`: passed com Next.js 16.3.2.
- `git diff --check`: passed; apenas avisos informativos de normalização LF/CRLF.
- Auditoria textual: passed, com uma única chamada a `fetch`, localizada no cliente central.

## Remoções

Foram removidos os diretórios locais de API, autenticação server-side, migrations, armazenamento, coleta, integrações e seus arquivos gerados. Os arquivos versionados permanecem recuperáveis pelo histórico do Git.
