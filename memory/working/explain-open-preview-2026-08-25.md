---
id: working_explain_open_preview_2026_08_25
type: working
status: draft
confidence: 0.98
source: agent
sources:
  - app/admin/page.tsx
  - utils/api/services.ts
created_at: 2026-08-25
updated_at: 2026-08-25
expires_at: null
related: []
---

# Objetivo

Explicar o comportamento do botão "Abrir prévia" e a falha exibida na captura de tela.

## Checklist

- [completed] Localizar o botão e o handler no frontend.
- [completed] Confirmar a chamada da API de prévia.
- [completed] Responder com o comportamento observado e a causa provável da falha.

## Evidências e decisões

- `app/admin/page.tsx` valida a URL, muda o estado para `loading`, exibe mensagens de progresso e chama `catalogApi.previewProduct(productUrl)`.
- Em sucesso, a prévia é armazenada no estado e a tela rola até os dados coletados.
- Em erro, a mensagem identifica a etapa atual e preserva a prévia anterior quando aplicável.
- A captura mostra falha na etapa "Buscando marca e vendedor..." com bloqueio anti-bot da Magazine Luiza detectado pelo Camoufox.

## Próximo passo

Explicação concluída; nenhum código funcional foi alterado.
