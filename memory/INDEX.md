# Índice da memória

## Estado atual

- [Sessão atual](working/current-session.md)

## Conhecimento consolidado

- [Resolução de identidade de produto](semantic/product-identity-resolution.md): duplicidade de `CanonicalProduct` é decidida pela ScoutApi (`/products` e `/products/resolve`), não pelo frontend. Falha da consulta bloqueia a aprovação (ADR 0008).

## Procedimentos

- [Consolidação de memória](procedural/consolidation.md)

## Triagem

- [Inbox](inbox/)

O índice deve apontar apenas para memórias permanentes ou operacionalmente relevantes. Logs episódicos podem ser encontrados por data e busca textual.
# Memória procedural

- [Acesso ao workspace sem Cursor](procedural/workspace-access.md): preferência explícita do usuário para não usar Cursor para acessar ou editar o workspace.
