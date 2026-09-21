---
title: "Remoção de tratamento de estoque no frontend"
date: "2026-09-21"
type: working
status: completed
confidence: high
---

# Objetivo

Remover do frontend toda exibição e lógica relacionada a estoque ou disponibilidade, preservando preço, produto, loja, imagens e links.

# Checklist

- [completed] Localizar textos, campos, tipos, mapeadores, ordenação e estilos relacionados.
- [completed] Remover apresentação e lógica de estoque/disponibilidade nas telas de produto e ofertas.
- [completed] Remover propriedades derivadas exclusivas de estoque sem alterar o backend.
- [completed] Validar busca textual, lint, build, detector visual e diff.

# Escopo identificado

- `app/admin/page.tsx`: mensagem de progresso menciona estoque; o preview exibe disponibilidade e estoque.
- `app/admin/produtos/[id]/page.tsx`: ofertas exibem disponibilidade, ordenam por disponibilidade, destacam a melhor oferta condicionada ao estoque e exibem badges de estoque.
- `app/globals.css`: estilos exclusivos de disponibilidade das ofertas persistidas.
- `utils/api/contracts.ts` e `utils/api/services.ts`: `stockQuantity` é um campo derivado do frontend; `availability` também é usado pela apresentação de ofertas.

# Decisão

Manter propriedades nos contratos brutos da API quando necessárias para desserialização, mas não derivar, armazenar, ordenar, exibir ou usar esses dados nas superfícies do frontend. Remover apenas os campos derivados e mapeamentos exclusivos quando não houver consumidor.

# Resultados

- Removidos `Estoque`, `Não exibido`, disponibilidade e badges de estoque das telas de preview e ofertas.
- Removida a ordenação e o destaque de ofertas baseado em disponibilidade; ofertas agora são ordenadas somente por preço.
- Removidos campos derivados de estoque/disponibilidade dos tipos e mapeadores de UI; o backend não foi alterado.
- Removidos estilos exclusivos de disponibilidade persistida.
- Build passou e o detector visual retornou lista vazia.
- Lint encontrou um erro preexistente em `app/admin/page.tsx:179`, relacionado a `setState` dentro de effect de configuração de imagens, além de seis avisos preexistentes em `utils/api/services.ts`. Nenhum é relacionado a estoque.
