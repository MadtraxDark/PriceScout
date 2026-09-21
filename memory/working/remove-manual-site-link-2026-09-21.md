---
title: "Remoção de adição manual de sites por link"
date: "2026-09-21"
type: working
status: completed
confidence: high
---

# Objetivo

Remover da interface do PriceScout o fluxo que permitia cadastrar um site por URL, mantendo a leitura e o uso das lojas pré-cadastradas pela API.

# Checklist

- [completed] Inspecionar componentes, estados, handlers e serviços relacionados.
- [completed] Remover a navegação, CTAs, formulário e estado de criação manual.
- [completed] Validar busca textual, lint, build e detector visual.
- [completed] Revisar alterações e registrar limitações.

# Decisões e fontes

- `app/admin/page.tsx` concentra a view `store`, o item de navegação, os CTAs "Adicionar site por link", os estados `storeName`/`storeUrl` e o handler `submitStore`.
- `utils/api/services.ts` expõe `createStore`, mas o método apenas retorna erro de registry; será removido por não haver mais consumidor de frontend.
- `listStores`, `listStoreMarkets` e o editor de lojas pré-cadastradas permanecem fora do escopo.
- Contexto visual consultado em `DESIGN.md` e skill `impeccable`; documentação local do Next.js consultada em `node_modules/next/dist/docs/01-app/`.

# Próximo passo

# Resultados

- O texto e a rota de adição manual não existem mais em `app/admin/page.tsx`.
- `listStores()` e `listStoreMarkets()` continuam sendo usados para exibir lojas pré-cadastradas.
- O build de produção passou.
- O detector visual executado em `app/admin/page.tsx` retornou lista vazia.
- O lint passou sem erros; permanecem seis avisos preexistentes de parâmetros não usados em `utils/api/services.ts`.
