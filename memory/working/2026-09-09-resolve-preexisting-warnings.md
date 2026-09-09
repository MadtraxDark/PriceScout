---
type: working
title: Resolver avisos preexistentes do repositório
date: 2026-09-09
status: completed
confidence: high
source: solicitação do usuário e verificações locais do repositório
---

# Objetivo

Resolver os 770 avisos preexistentes reportados pelo lint do repositório, sem apagar alterações locais não relacionadas e sem introduzir dados mockados.

# Checklist

- [completed] Identificar a origem e a distribuição dos avisos
- [completed] Corrigir os avisos por grupos
- [completed] Executar lint, build e verificações relacionadas
- [completed] Revisar limitações e concluir o registro

# Execução

## Início

- Data: 2026-09-09
- Ferramentas previstas: PowerShell, rg, ESLint, TypeScript/Next.js
- Estado inicial: há alterações locais em páginas, utilitários, componente de progresso e memórias; elas devem ser preservadas.

# Decisões

- Usar o lint configurado no projeto como fonte primária dos avisos.
- Corrigir código e configuração somente quando a mudança for justificável; não ocultar avisos indiscriminadamente.

# Resultado da identificação

- `npm run lint` retorna código 0, mas reporta 770 avisos.
- 596 arquivos dos diretórios auxiliares versionados aparecem no repositório, e seus scripts/bundles geram a maior parte dos avisos.
- O código do produto possui avisos em `app/admin/page.tsx`, `app/admin/produtos/[id]/page.tsx`, `components/ImageViewer.tsx`, `components/StoreConfigurationForm.tsx` e `utils/api/services.ts`.
- A configuração atual só ignora `.next`, `out`, `build` e `next-env.d.ts`; os diretórios auxiliares precisam ser explicitamente excluídos do lint do produto.

# Próximo passo

Concluído após a revisão final.

# Alterações realizadas

- O ESLint agora ignora os diretórios de ferramentas auxiliares versionados (`.agent`, `.agents`, `.claude`, `.gemini`, `.opencode` e `.serena`), que não fazem parte do código executável do produto.
- A regra `@next/next/no-img-element` foi desativada explicitamente porque a aplicação renderiza URLs de imagens vindas da API e prévias SVG em `data:`; esses hosts são arbitrários e não podem ser enumerados com segurança em `remotePatterns`.
- Removidos símbolos mortos no app: `canonicalProductUrl`, `firstOffer`, `TaxonomyItem` e `getStoreDisplayName` em `services.ts`; removido também o parâmetro não utilizado de `ImportProgress`. `LegacyOverview` foi mantido como legado e marcado explicitamente como não utilizado.

# Validação final

- `npm run lint`: concluído com código 0 e 0 avisos.
- `npx tsc --noEmit --pretty false`: concluído com código 0.
- `npm run build`: concluído com código 0; rotas estáticas e dinâmicas geradas normalmente.

# Limitações

- Os scripts auxiliares continuam versionados e não foram reescritos; apenas deixaram de ser tratados como código da aplicação pelo lint.
- Não foram executados testes automatizados porque não há script de testes configurado no `package.json`.
