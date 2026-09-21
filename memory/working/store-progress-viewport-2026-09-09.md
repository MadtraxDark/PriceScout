---
id: mem_working_store_progress_viewport_20260909
type: working
status: completed
confidence: 0.92
source: agent
sources:
  - components/PriceSearchProgress.tsx
  - app/admin/produtos/[id]/page.tsx
  - utils/api/contracts.ts
  - app/globals.css
created_at: 2026-09-09
updated_at: 2026-09-09
expires_at: null
related:
  - memory/working/cross-store-price-progress-2026-09-08.md
---

# Objetivo

Manter cada card de progresso ancorado no fim da sequência de eventos, com o evento atual sempre visível no rodapé e sem alteração no backend.

# Checklist

- [completed] Ler as skills aplicáveis, o contexto visual e a documentação local do Next.js.
- [completed] Inspecionar o componente, o acumulador SSE e o contrato atual.
- [completed] Corrigir ordenação, identidade/deduplicação e viewport fixo do card.
- [completed] Validar TypeScript, lint, build, diff e cenários de 5, 10 e 30 eventos por revisão da janela limitada.
- [completed] Revisar limitações e concluir o registro.

# Decisões

- Preservar a ordem de chegada quando o backend não fornecer metadados de ordenação.
- Usar sequence, timestamp, event_id e attempt apenas quando presentes; não ordenar por stage, status ou texto.
- Não deduplicar eventos sem uma identidade explícita, pois mensagens iguais podem representar tentativas reais distintas.
- Remover encolhimento flexível das linhas e manter o viewport com overflow hidden e ancoragem inferior.

# Resultado

- A janela visível é sempre a cauda de cinco eventos ordenados.
- A ordem usa sequence, timestamp e event_id quando disponíveis; sem metadados, usa a ordem de chegada.
- O card e a lista têm geometria fixa, overflow hidden e itens que não encolhem.
- O shine só aparece no último evento running enquanto a loja está running.
- Eventos repetidos com identidade explícita são ignorados; mensagens iguais sem identidade continuam preservadas.

# Validação

- `npx tsc --noEmit --incremental false`: passou.
- `npm run lint`: passou.
- `npm run build`: passou.
- Revisão dos cenários de 5, 10 e 30 eventos: a função de janela sempre seleciona os cinco últimos e o item final permanece no rodapé; a mesma regra vale para warning, success, error e conclusão.

# Limitações

O ambiente não forneceu um stream real de TerabyteShop ou Mercado Livre nesta execução. A validação de integração com dados reais permanece dependente da API externa; nenhum backend ou contrato obrigatório foi alterado.
