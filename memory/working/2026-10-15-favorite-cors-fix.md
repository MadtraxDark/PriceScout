---
title: Correção do salvamento de favoritos por CORS
created: 2026-10-15
updated: 2026-10-15
kind: working
status: completed
confidence: high
sources: [user-request, browser-network, local-repositories, pytest]
---

# Resultado

O botão enviava PUT, mas a API não permitia esse método no CORS. O preflight
rejeitado impedia o salvamento antes de alcançar o router. Foi incluído PUT na
allowlist existente, mantendo origens e headers restritos. A API local foi
reconstruída e recriada pelo Docker Compose.

# Verificação

- [x] Reproduzir a falha no navegador (PUT bloqueado).
- [x] Teste de regressão falhou com preflight 400 antes da correção.
- [x] Segurança e favoritos: 44 testes aprovados após a correção.
- [x] Ruff e formatação dos arquivos alterados aprovados.
- [x] Favoritar no navegador: PUT 200.
- [x] Recarregar catálogo: coração continuou marcado.
- [x] Página Favoritos exibiu o produto persistido.
- [x] Alterar alerta: PATCH 200, estado preservado após recarregar.
- [x] Desfavoritar: DELETE 204, página Favoritos vazia após recarregar.
- [x] Console sem erros; favorito criado no teste removido ao final.

Documentação canônica atualizada em ScoutApiV2: `docs/security/api-auth.md`
e `docs/notifications/price-drop-alerts.md`.
